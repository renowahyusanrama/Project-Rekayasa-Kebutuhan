import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [resolve(__dirname, "..")]
    }
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: [".up.railway.app"]
  }
});
