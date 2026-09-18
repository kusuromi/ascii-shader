import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isPagesDeploy = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  base: isPagesDeploy ? "/ascii-shader/" : "/",
  plugins: [react()],
});