import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const harnessPath = path.join(here, ".harness.js");

test("serialized settings restore the same settings", async ({ page }) => {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ path: harnessPath });

  const result = await page.evaluate(() =>
    (window as any).serializeRoundTrip({
      glyphs: " .:-=+*#%@\"\\",
      contrast: 1.5,
      cursor: { enabled: false, strength: 0.18 },
      vignette: { enabled: true, edgeLevel: 0.36, sides: { left: false } },
    }),
  );

  expect(result.restored).toEqual(result.expected);
  expect(result.changes).toEqual({
    glyphs: " .:-=+*#%@\"\\",
    contrast: 1.5,
    cursor: { enabled: false, strength: 0.18 },
    vignette: { enabled: true, edgeLevel: 0.36, sides: { left: false } },
  });
});

test("default settings serialize to an empty object", async ({ page }) => {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ path: harnessPath });

  const result = await page.evaluate(() => (window as any).serializeRoundTrip({}));
  expect(result.changes).toEqual({});
});
