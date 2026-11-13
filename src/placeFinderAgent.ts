/**
 * Place Finder Agent — the worked example.
 *
 * It does something deliberately simple (find a place and zoom to it) so the
 * patterns stay visible. Copy this file, rename it, and replace `findPlace` with
 * whatever your demo actually does.
 *
 * It demonstrates every piece you need for a real custom agent:
 *
 *   1. State          — `Annotation.Root`, with the `outputMessage` reducer the
 *                       assistant renders as the answer.
 *   2. Structured LLM — `invokeStructuredPrompt` pulls typed fields out of free text.
 *   3. Trace messages — `sendTraceMessage` drives the "thinking" line in the UI.
 *   4. HIL interrupt  — `NodeInterrupt` stops and asks rather than guessing.
 *   5. Map access     — the host app passes `mapView` through `context`.
 *   6. Registration   — `AgentRegistration` is what `<arcgis-assistant-agent>` takes.
 */

import {
  StateGraph,
  START,
  END,
  Annotation,
  messagesStateReducer,
  NodeInterrupt,
} from "@langchain/langgraph/web";
import {
  invokeStructuredPrompt,
  sendTraceMessage,
} from "@arcgis/ai-components/utils/index.js";
import type {
  AgentRegistration,
  ChatHistory,
  CustomConfigurableType,
  UiInterrupt,
} from "@arcgis/ai-components/utils/index.js";
import type { RunnableConfig } from "@langchain/core/runnables";
import z from "zod";
import MapView from "@arcgis/core/views/MapView.js";
import Point from "@arcgis/core/geometry/Point.js";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import * as locator from "@arcgis/core/rest/locator.js";

import { GEOCODE_URL } from "./config";

/**
 * What the host app hands the agent. Anything the agent needs from the page goes
 * here — the view, callbacks to update React state, getters for live values.
 *
 * Pass live getters rather than values for anything that changes, so the agent
 * sees the current state instead of whatever React last rendered.
 */
type PlaceFinderContext = {
  mapView: MapView;
  onPlaceFound?: (place: { label: string; point: Point }) => void;
};

/** Declared up front so the HIL interrupt can address this agent by id. */
const PlaceFinderAgentId = "placeFinder";

/** HIL interrupt id for the "which one did you mean?" prompt. */
const PLACE_CHOICE_ID = "choosePlace";

const MARKER_LAYER_ID = "demo-starter-markers";

const PlaceFinderState = Annotation.Root({
  messages: Annotation<ChatHistory>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  /**
   * What the assistant shows as the answer. The reducer appends rather than
   * replaces, so several nodes can each contribute a paragraph.
   */
  outputMessage: Annotation<string>({
    reducer: (current = "", update) =>
      typeof update === "string" && update.trim()
        ? current
          ? `${current}\n\n${update}`
          : update
        : current,
    default: () => "",
  }),
  /** The place name pulled out of the user's message. */
  placeName: Annotation<string>({
    reducer: (_current, update) => update ?? "",
    default: () => "",
  }),
});

type PlaceFinderStateType = typeof PlaceFinderState.State;

const extractionPrompt = String.raw`
You are helping a user find a place on a map.

From the user's message, extract:
- "placeName": the city, landmark, address, or region the user is asking about.
  - Return it exactly as the user expressed it, cleaned up into something geocodable.
  - If the user names no place at all, return an empty string "".
`;

/** Node 1: work out which place the user means. */
const extractPlace = async (
  state: PlaceFinderStateType,
  config?: RunnableConfig,
): Promise<Partial<PlaceFinderStateType>> => {
  await sendTraceMessage(
    { text: "Place Finder: reading the place name from your message" },
    config,
  );

  const schema = z.object({ placeName: z.string() });

  const response = await invokeStructuredPrompt({
    promptText: extractionPrompt,
    modelTier: "default",
    messages: state.messages,
    schema,
  });

  return { placeName: (response.placeName ?? "").trim() };
};

type PlaceCandidate = { label: string; point: Point };

/** Geocodes to several candidates so ambiguity is visible rather than hidden. */
const findCandidates = async (placeName: string): Promise<PlaceCandidate[]> => {
  const results = await locator.addressToLocations(GEOCODE_URL, {
    address: { SingleLine: placeName },
    maxLocations: 5,
    outFields: ["Match_addr"],
  });

  const seen = new Set<string>();
  const candidates: PlaceCandidate[] = [];

  for (const result of results ?? []) {
    const attributes = (result.attributes ?? {}) as Record<string, unknown>;
    const label = String(
      attributes["Match_addr"] ?? result.address ?? placeName,
    );
    // The geocoder can return the same place twice at different scores; a
    // duplicate in the picker looks like a bug to the user.
    if (seen.has(label)) continue;
    seen.add(label);
    candidates.push({ label, point: result.location as Point });
  }

  return candidates;
};

/** Drops a marker and zooms, reusing one graphics layer so markers don't pile up. */
const markOnMap = async (
  mapView: MapView,
  candidate: PlaceCandidate,
): Promise<void> => {
  const map = mapView.map;
  if (!map) throw new Error("The map view has no map yet");

  let layer = map.findLayerById(MARKER_LAYER_ID) as GraphicsLayer | null;

  if (!layer) {
    layer = new GraphicsLayer({ id: MARKER_LAYER_ID, listMode: "hide" });
    map.add(layer);
  }

  layer.removeAll();
  layer.add(
    new Graphic({
      geometry: candidate.point,
      symbol: new SimpleMarkerSymbol({
        style: "circle",
        size: 12,
        color: [0, 92, 76, 1],
        outline: { color: [255, 255, 255, 1], width: 1.5 },
      }),
    }),
  );

  await mapView.goTo({ target: candidate.point, zoom: 12 });
};

/**
 * Node 2: find the place, or stop and ask which one was meant.
 *
 * The interrupt is the point of this example. "Springfield" matches dozens of
 * places in the US and picking the first silently decides for the user. Stopping
 * to ask costs one click and removes a whole class of confidently wrong answers.
 */
const findPlace = async (
  state: PlaceFinderStateType,
  config?: RunnableConfig,
): Promise<Partial<PlaceFinderStateType>> => {
  const context = config?.configurable?.context as PlaceFinderContext;

  if (!context?.mapView) {
    throw new Error("Place Finder requires a mapView in configurable context");
  }

  if (!state.placeName) {
    return {
      outputMessage:
        "Tell me a place to find — a city, a landmark, or a street address.",
    };
  }

  await sendTraceMessage(
    { text: `Place Finder: looking up "${state.placeName}"` },
    config,
  );

  let candidates: PlaceCandidate[];
  try {
    candidates = await findCandidates(state.placeName);
  } catch (error) {
    return {
      outputMessage: `I couldn't reach the geocoding service: ${(error as Error).message}`,
    };
  }

  if (candidates.length === 0) {
    return {
      outputMessage: `I couldn't find anywhere called **${state.placeName}**. Try adding a city or state.`,
    };
  }

  const { hitlResponse } = (config?.configurable ??
    {}) as CustomConfigurableType;

  let chosen = candidates[0];

  if (candidates.length > 1) {
    const answered =
      hitlResponse?.agentId === PlaceFinderAgentId &&
      hitlResponse.id === PLACE_CHOICE_ID
        ? candidates.find((candidate) => candidate.label === hitlResponse.payload)
        : undefined;

    if (!answered) {
      // Also covers a stale answer from an earlier question: if the payload names
      // no current candidate, ask again rather than guessing.
      const interrupt: UiInterrupt = {
        agentId: PlaceFinderAgentId,
        id: PLACE_CHOICE_ID,
        kind: "singleSelection",
        // Plain text: the interrupt renders this verbatim, so markdown emphasis
        // would show up as literal asterisks.
        message: `I found ${candidates.length} places matching ${state.placeName}. Which one do you mean?`,
        metadata: candidates.map((candidate) => candidate.label),
      };
      throw new NodeInterrupt(interrupt);
    }

    chosen = answered;
  }

  await sendTraceMessage({ text: "Place Finder: marking the map" }, config);

  await markOnMap(context.mapView, chosen);
  context.onPlaceFound?.(chosen);

  return {
    outputMessage: [
      `**${chosen.label}**`,
      "",
      "I've zoomed the map and marked the location.",
    ].join("\n"),
  };
};

const createPlaceFinderGraph = (): StateGraph<PlaceFinderStateType> => {
  const graph = new StateGraph(PlaceFinderState)
    .addNode("extractPlace", extractPlace)
    .addNode("findPlace", findPlace)
    .addEdge(START, "extractPlace")
    .addEdge("extractPlace", "findPlace")
    .addEdge("findPlace", END);

  return graph as StateGraph<PlaceFinderStateType>;
};

/**
 * How the orchestrator decides to route here.
 *
 * Write it for a reader who knows nothing about your app. Say what the agent is
 * for, say what it is *not* for, and give examples — routing quality depends on
 * this text far more than on the graph below it.
 */
const PlaceFinderAgentDescription = String.raw`- **Place Finder** — User wants to locate a place on the map.
  Use this when the user names a city, landmark, region, or street address and wants to see where it is.
  Do **not** use it for questions about the data behind the map, or for styling and layer visibility.
  _Examples:_
  - "Where is Redlands, California?"
  - "Find Springfield"
  - "Take me to the Grand Canyon"`;

const PlaceFinderAgent: AgentRegistration = {
  id: PlaceFinderAgentId,
  name: "Place Finder Agent",
  description: PlaceFinderAgentDescription,
  createGraph: createPlaceFinderGraph,
  workspace: PlaceFinderState,
};

export { PlaceFinderAgent, type PlaceFinderContext };
