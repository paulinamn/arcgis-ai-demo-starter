/**
 * Everything you are expected to change when starting a new demo.
 *
 * Keeping it in one file means a new project is a handful of string edits rather
 * than a search through the components.
 */

/** Shown in the header and the browser tab. */
const APP_TITLE = "ArcGIS AI Demo Starter";
const APP_SUBTITLE = "Replace this with your team or project name";

/**
 * The web map the app opens, as a portal item id.
 *
 * **This must be a web map that has AI vector embeddings generated for it.**
 * `<arcgis-assistant>` initialises its orchestrator from the portal item and
 * fails with "Embeddings resource 'embeddings-v01.json' not found" otherwise — a
 * plain basemap or an ordinary public web map will not work.
 *
 * Generate them in ArcGIS Online: open the web map item → Settings →
 * "Manage AI vector embeddings" → Generate Embeddings. You need write access to
 * the item. See:
 * https://developers.arcgis.com/javascript/latest/agentic-apps/ai-webmap-setup/#embeddings
 *
 * The default below is "Demo Starter Base Map (do not delete)" — a public,
 * embeddings-enabled map that exists purely to give this template a working start.
 * It carries no project layers on purpose. Replace it with your own demo's web map.
 */
const WEBMAP_ITEM_ID = "48a4e4dc099b479298cebd524083c5b9";

/** Assistant panel copy. */
const ASSISTANT_HEADING = "Demo Assistant";
const ASSISTANT_DESCRIPTION =
  "Ask about a place and I'll find it on the map.";
const ASSISTANT_ENTRY_MESSAGE =
  "Name a place — a city, a landmark, an address — and I'll zoom the map to it.";

/**
 * Shown as clickable chips until the user asks their first question. Keep these
 * in the order you want to demo them.
 */
const SUGGESTED_PROMPTS = [
  "Where is Redlands, California?",
  "Find Springfield",
  "Take me to the Grand Canyon",
];

/** ArcGIS World Geocoder. Public, no key needed for one-off address lookups. */
const GEOCODE_URL =
  "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

/**
 * localStorage key for the persisted ArcGIS sign-in. Must be unique per demo,
 * or two apps on localhost will overwrite each other's credentials.
 */
const CREDENTIAL_STORAGE_KEY = "arcgis-demo-starter.credentials";

export {
  APP_TITLE,
  APP_SUBTITLE,
  ASSISTANT_DESCRIPTION,
  ASSISTANT_ENTRY_MESSAGE,
  ASSISTANT_HEADING,
  CREDENTIAL_STORAGE_KEY,
  GEOCODE_URL,
  SUGGESTED_PROMPTS,
  WEBMAP_ITEM_ID,
};
