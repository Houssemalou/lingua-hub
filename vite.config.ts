import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["host.docker.internal"],
    proxy: {
      // Proxy API calls to backend during development
      // This ensures cookies are sent on the same origin (avoiding CORS cookie issues)
      '/api': {
        target: 'https://learnup.tn',
        changeOrigin: true,
        secure: true, // ou false si certificat auto-signé
        cookieDomainRewrite: "learnup.tn"
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
