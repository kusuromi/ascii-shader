import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const harnessPath = path.join(here, ".harness.js");

type Field = { columns: number; rows: number; sample: number[] };
type Pointer = { currentX: number; currentY: number };

async function openHarness(page: Page) {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ path: harnessPath });
}

async function renderField(page: Page, settings: object, pointer?: Pointer): Promise<Field> {
  return page.evaluate(
    ([s, p]) => (window as any).renderField(s, p),
    [settings, pointer] as const,
  );
}

// Field is 60 x 40 cells (780 x 520 px, cell 13 px). Ring 0 is the outermost row/column of cells.
const ringOf = (x: number, y: number, columns: number, rows: number) =>
  Math.min(x, columns - 1 - x, y, rows - 1 - y);

const ringMean = (field: Field, ring: number) => {
  let total = 0;
  let count = 0;
  for (let y = 0; y < field.rows; y++) {
    for (let x = 0; x < field.columns; x++) {
      if (ringOf(x, y, field.columns, field.rows) !== ring) continue;
      total += field.sample[y * field.columns + x];
      count += 1;
    }
  }
  return total / count;
};

// Radius is 20% of the shorter side (104 px), so rings 8 and beyond are fully outside the band.
test("edges fade toward the glyph level while the interior stays untouched", async ({ page }) => {
  await openHarness(page);
  const off = await renderField(page, { vignette: { enabled: false } });
  const on = await renderField(page, { vignette: { enabled: true, edgeLevel: 0 } });

  let interiorChanged = 0;
  for (let y = 0; y < on.rows; y++) {
    for (let x = 0; x < on.columns; x++) {
      const index = y * on.columns + x;
      if (ringOf(x, y, on.columns, on.rows) >= 8 && on.sample[index] !== off.sample[index]) interiorChanged += 1;
    }
  }

  const ratio = (ring: number) => ringMean(on, ring) / ringMean(off, ring);
  expect(ratio(0)).toBeLessThan(0.05);
  expect(ratio(0)).toBeLessThan(ratio(4));
  expect(ratio(4)).toBeLessThan(ratio(7));
  expect(interiorChanged).toBe(0);
});

test("sides limit the vignette to the selected edges", async ({ page }) => {
  await openHarness(page);
  const off = await renderField(page, { vignette: { enabled: false } });
  const top = await renderField(page, {
    vignette: { enabled: true, edgeLevel: 0, sides: { top: true, right: false, bottom: false, left: false } },
  });

  let topCells = 0;
  let topDimmed = 0;
  let unselectedChanged = 0;
  for (let y = 0; y < top.rows; y++) {
    for (let x = 0; x < top.columns; x++) {
      const index = y * top.columns + x;
      if (y === 0) {
        topCells += 1;
        if (top.sample[index] < off.sample[index] * 0.5) topDimmed += 1;
      }
      // The top band spans the full width, so side columns are only unselected below its 8-row depth.
      const outsideTopBand = y >= 8;
      const onUnselectedSide = (x === 0 || x === top.columns - 1) && outsideTopBand;
      const onBottomRow = y === top.rows - 1;
      if ((onUnselectedSide || onBottomRow) && top.sample[index] !== off.sample[index]) {
        unselectedChanged += 1;
      }
    }
  }

  expect(topDimmed / topCells).toBeGreaterThan(0.9);
  expect(unselectedChanged).toBe(0);
});

test("edge level sets how dim the glyphs get at the very edge", async ({ page }) => {
  await openHarness(page);
  const dim = await renderField(page, { vignette: { enabled: true, edgeLevel: 0 } });
  const bright = await renderField(page, { vignette: { enabled: true, edgeLevel: 1 } });

  expect(ringMean(dim, 0)).toBeLessThan(ringMean(bright, 0));
  expect(ringMean(dim, 8)).toBeCloseTo(ringMean(bright, 8), 5);
});
