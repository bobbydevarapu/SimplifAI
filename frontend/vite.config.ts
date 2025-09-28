import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false, // Disable HMR overlay to avoid clutter (optional)
    },
  },
  plugins: [react()], // Removed componentTagger due to potential issues
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer", // Alias for buffer to resolve Cognito issue
    },
  },
  define: {
    global: "window", // Polyfill for global object
  },
}));