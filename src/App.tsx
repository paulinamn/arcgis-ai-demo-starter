import "./index.css";

import { useCallback, useRef, useState } from "react";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-home";
import "@arcgis/map-components/components/arcgis-legend";
import "@arcgis/map-components/components/arcgis-search";
import "@arcgis/map-components/components/arcgis-expand";

import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-icon";

import "@arcgis/ai-components/components/arcgis-assistant";
import "@arcgis/ai-components/components/arcgis-assistant-agent";
import "@arcgis/ai-components/components/arcgis-assistant-help-agent";
import "@arcgis/ai-components/components/arcgis-assistant-navigation-agent";

import type { ArcgisMap } from "@arcgis/map-components/components/arcgis-map";
import type { ArcgisAssistant } from "@arcgis/ai-components/components/arcgis-assistant";

import WebMap from "@arcgis/core/WebMap.js";
import MapView from "@arcgis/core/views/MapView.js";
import Point from "@arcgis/core/geometry/Point.js";

import {
  APP_SUBTITLE,
  APP_TITLE,
  ASSISTANT_DESCRIPTION,
  ASSISTANT_ENTRY_MESSAGE,
  ASSISTANT_HEADING,
  SUGGESTED_PROMPTS,
  WEBMAP_ITEM_ID,
} from "./config";
import { PlaceFinderAgent } from "./placeFinderAgent";

export default function App() {
  const assistantRef = useRef<ArcgisAssistant>(null);

  // Held in a ref so React re-renders never rebuild the map.
  const mapRef = useRef(new WebMap({ portalItem: { id: WEBMAP_ITEM_ID } }));

  // The agents need a live MapView, which only exists once the component is ready,
  // so the assistant is not rendered until this is set.
  const [mapView, setMapView] = useState<MapView | null>(null);
  const [hasAsked, setHasAsked] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [foundPlace, setFoundPlace] = useState<{
    label: string;
    point: Point;
  } | null>(null);

  const handleViewReady = useCallback((event: CustomEvent): void => {
    const viewElement = event.target as ArcgisMap;
    setMapView(viewElement.view);
  }, []);

  // Suggested prompts are hidden after the first question so the chips don't sit
  // under a real conversation.
  const handleSubmit = useCallback((): void => {
    setHasAsked(true);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header-brand">
          <div>
            <h1>{APP_TITLE}</h1>
            <p>{APP_SUBTITLE}</p>
          </div>
        </div>
      </header>

      <div className="app-body">
        <div className="app-main">
          {/*
            Side panel. The pattern worth keeping: an agent updates React state
            through its context callbacks, so the panel and the chat always agree.
          */}
          <aside className="side-panel">
            <div className="side-panel-title">Details</div>
            <div className="side-panel-body">
              <h2>Last place found</h2>
              {foundPlace ? (
                <>
                  <p className="side-panel-value">{foundPlace.label}</p>
                  <p className="side-panel-meta">
                    {foundPlace.point.latitude?.toFixed(4)},{" "}
                    {foundPlace.point.longitude?.toFixed(4)}
                  </p>
                </>
              ) : (
                <p className="side-panel-empty">
                  Nothing yet — ask the assistant to find a place.
                </p>
              )}
            </div>
          </aside>

          <div className="map-canvas">
            <arcgis-map
              id="main-map"
              map={mapRef.current}
              onarcgisViewReadyChange={handleViewReady}
            >
              <arcgis-zoom slot="top-left"></arcgis-zoom>
              <arcgis-home slot="top-left"></arcgis-home>
              <arcgis-expand
                slot="top-left"
                mode="floating"
                expandIcon="search"
                collapseIcon="x"
                label="Search"
              >
                <arcgis-search popupDisabled></arcgis-search>
              </arcgis-expand>
              <arcgis-expand
                slot="top-left"
                mode="floating"
                expandIcon="legend"
                collapseIcon="x"
                label="Legend"
              >
                <arcgis-legend></arcgis-legend>
              </arcgis-expand>
            </arcgis-map>
          </div>
        </div>

        <div className={`assistant-dock ${chatOpen ? "" : "is-collapsed"}`}>
          <button
            type="button"
            className="assistant-toggle"
            aria-expanded={chatOpen}
            aria-label={chatOpen ? "Collapse assistant" : "Expand assistant"}
            onClick={() => setChatOpen((open) => !open)}
          >
            <calcite-icon
              icon={chatOpen ? "chevron-right" : "chevron-left"}
              scale="s"
            ></calcite-icon>
          </button>

          {mapView && (
            <arcgis-assistant
              ref={assistantRef}
              reference-element="#main-map"
              heading={ASSISTANT_HEADING}
              description={ASSISTANT_DESCRIPTION}
              entryMessage={ASSISTANT_ENTRY_MESSAGE}
              suggestedPrompts={hasAsked ? [] : SUGGESTED_PROMPTS}
              onarcgisSubmit={handleSubmit}
            >
              {/* Built-in agents: "what can you do?" and map navigation. */}
              <arcgis-assistant-help-agent></arcgis-assistant-help-agent>
              <arcgis-assistant-navigation-agent></arcgis-assistant-navigation-agent>

              {/* Your custom agent. Add more by repeating this element. */}
              <arcgis-assistant-agent
                agent={PlaceFinderAgent}
                context={{
                  mapView,
                  onPlaceFound: (place: { label: string; point: Point }) =>
                    setFoundPlace(place),
                }}
              ></arcgis-assistant-agent>
            </arcgis-assistant>
          )}
        </div>
      </div>
    </div>
  );
}
