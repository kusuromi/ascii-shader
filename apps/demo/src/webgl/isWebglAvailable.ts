let cachedAvailability: boolean | null = null;

export function isWebglAvailable() {
  if (cachedAvailability === null) {
    try {
      const canvas = document.createElement("canvas");
      cachedAvailability = canvas.getContext("webgl") !== null;
    } catch {
      cachedAvailability = false;
    }
  }
  return cachedAvailability;
}
