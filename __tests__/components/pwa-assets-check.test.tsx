import React from "react";
import { render } from "../../test/test-utils";
import PWAAssetsCheck from "@/components/pwa-assets-check";

describe("PWAAssetsCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    Object.defineProperty(process, "env", {
      value: { ...process.env, NODE_ENV: "development" },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("logs all assets exist if all fetches succeed", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    render(<PWAAssetsCheck />);
    await Promise.resolve();
    await Promise.resolve();
    expect(logSpy).toHaveBeenCalledWith("[PWA] Asset exists: /manifest.json");
    expect(logSpy).toHaveBeenCalledWith(
      "[PWA] Asset exists: /success-83493.mp3"
    );
    expect(logSpy).toHaveBeenCalledWith(
      "[PWA] Asset exists: /icons/icon-192x192.png"
    );
    expect(logSpy).toHaveBeenCalledWith(
      "[PWA] Asset exists: /icons/icon-512x512.png"
    );
    expect(logSpy).toHaveBeenCalledWith("[PWA] Asset exists: /favicon.ico");
    expect(logSpy).toHaveBeenCalledWith("[PWA] All required assets exist");
    logSpy.mockRestore();
  });

  test("warns if any asset is missing", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    // There are 5 assets, so mock 1 missing and 4 present
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true }) // manifest.json
      .mockResolvedValueOnce({ ok: false }) // success-83493.mp3 (missing)
      .mockResolvedValueOnce({ ok: true }) // icon-192x192.png
      .mockResolvedValueOnce({ ok: true }) // icon-512x512.png
      .mockResolvedValueOnce({ ok: true }); // favicon.ico
    render(<PWAAssetsCheck />);
    await Promise.resolve();
    await Promise.resolve();
    expect(warnSpy).toHaveBeenCalledWith(
      "[PWA] Asset not found or error: /success-83493.mp3"
    );
    expect(warnSpy).toHaveBeenCalledWith(
      "[PWA] Some required assets are missing"
    );
    warnSpy.mockRestore();
  });
});
