/**
 * Persists the ArcGIS sign-in across page reloads.
 *
 * Without this the assistant's orchestrator fails to initialise on every refresh
 * with "Orchestrator not initialized yet", and the user has to sign in again —
 * which is painful during a live demo.
 *
 * Note: this writes ArcGIS credentials (including tokens) to localStorage. That is
 * acceptable for a local demo, but a production deployment should prefer a
 * short-lived OAuth flow with `popup: true` over persisting bearer tokens.
 */

import esriId from "@arcgis/core/identity/IdentityManager.js";

import { CREDENTIAL_STORAGE_KEY } from "./config";

const clearSession = (): void => {
  try {
    window.localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode); nothing to clear.
  }
};

const saveSession = (): void => {
  try {
    window.localStorage.setItem(
      CREDENTIAL_STORAGE_KEY,
      JSON.stringify(esriId.toJSON()),
    );
  } catch {
    // Quota or storage unavailable; the user simply signs in again.
  }
};

/**
 * Restores any stored credentials and keeps them in sync. Call once, before the
 * app renders, so the assistant sees a signed-in user on first paint.
 */
const initializeIdentityPersistence = (): void => {
  try {
    const stored = window.localStorage.getItem(CREDENTIAL_STORAGE_KEY);
    if (stored) esriId.initialize(JSON.parse(stored));
  } catch {
    // Corrupt or expired payload: drop it rather than blocking startup.
    clearSession();
  }

  esriId.on("credential-create", saveSession);

  window.addEventListener("beforeunload", saveSession);
};

export { clearSession, initializeIdentityPersistence };
