import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // Bind to all interfaces so the dev server is reachable from outside the
    // VM (e.g. via the public IP). Without this Vite only listens on
    // 127.0.0.1 and `http://<server-ip>:5174` won't connect.
    host: true,
    // `open: true` tries to launch the system browser via xdg-open (Linux/WSL)
    // or `start`/`open` (Windows/macOS). On a headless server xdg-open isn't
    // installed — keep this off and just navigate manually.
    open: false,
  },
});
