import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test",
  testMatch: "**/*.spec.ts",
  globalSetup: "./test/global-setup.ts",
  reporter: "list",
  use: {
    // Uses the installed Google Chrome; SwiftShader keeps WebGL2 working without a GPU.
    channel: "chrome",
    headless: true,
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
    },
  },
});
