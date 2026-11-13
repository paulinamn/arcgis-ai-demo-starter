import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    /**
     * The orchestrator pulls in its embeddings worker through a dynamic import,
     * so Vite only discovers it once the assistant initialises — part way through
     * the first page load. Discovering a new dependency then forces a re-optimize,
     * which invalidates the hashed files already in flight and fails the load with
     * 504 "Outdated Optimize Dep" responses.
     *
     * Naming it here gets it bundled at server start, before the browser asks.
     * It must be `include` rather than `exclude`: left unbundled, its CommonJS
     * dependencies break instead ("p-queue does not provide an export named
     * default").
     */
    include: ["@arcgis/ai-orchestrator"],
  },
  server: {
    open: true,
    /*
     * Pinned off Vite's default 5173. That port is shared by every Vite project
     * on the machine, so the browser keeps per-origin state — service workers,
     * module caches — belonging to whichever app held it last, which then
     * intercepts this one's requests. strictPort surfaces a clash instead of
     * silently wandering to another port and stranding open tabs.
     *
     * Give each demo its own port so two can run side by side.
     */
    port: 5180,
    strictPort: true,
  },
  build: {
    outDir: "dist",
  },
});
