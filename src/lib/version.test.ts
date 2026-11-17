import { describe, expect, it } from "vitest";
import { compareVersions, parseVersion } from "./version";

describe("version helpers", () => {
  it("reads APP_VERSION from the generated file", () => {
    expect(parseVersion('self.APP_VERSION = "2.0.2";')).toBe("2.0.2");
    expect(parseVersion("nothing here")).toBeNull();
  });

  it("compares numeric version parts", () => {
    expect(compareVersions("2.0.2", "2.0.1")).toBe(1);
    expect(compareVersions("2.0.2", "2.0.2")).toBe(0);
    expect(compareVersions("2.0.9", "2.0.10")).toBe(-1);
    expect(compareVersions("2.1.0", "2.0.99")).toBe(1);
  });
});
