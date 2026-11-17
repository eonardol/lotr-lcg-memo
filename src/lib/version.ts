export const parseVersion = (source: string): string | null => {
  const match = source.match(/APP_VERSION\s*=\s*"([^"]+)"/);
  return match?.[1] ?? null;
};

const numericParts = (version: string): number[] =>
  version
    .split("-")[0]
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

export const compareVersions = (left: string, right: string): number => {
  const a = numericParts(left);
  const b = numericParts(right);
  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const delta = (a[index] ?? 0) - (b[index] ?? 0);
    if (delta !== 0) return Math.sign(delta);
  }
  return 0;
};

export const fetchLatestVersion = async (signal?: AbortSignal): Promise<string> => {
  const url = new URL("version.js", document.baseURI);
  url.searchParams.set("ts", String(Date.now()));

  const response = await fetch(url, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`Version request failed: ${response.status}`);

  const version = parseVersion(await response.text());
  if (!version) throw new Error("Version not found");
  return version;
};
