import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Puerto fijo: si 5173 está ocupado, Vite avisa y no arranca (no elige otro en silencio).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, host: "127.0.0.1", proxy: { "/api": "http://127.0.0.1:5174" } },
  test: { environment: "node", include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"] },
});
