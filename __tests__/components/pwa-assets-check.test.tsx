import React from "react";
import { render } from "../../test/test-utils";
import PWAAssetsCheck from "@/components/pwa-assets-check";
import { waitFor } from "@testing-library/react";

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
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({ ok: true })
    );
    render(<PWAAssetsCheck />);
    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith("[PWA] All required assets exist");
    });
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  test("warns if any asset is missing", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true }) // manifest.json
      .mockResolvedValueOnce({ ok: false }) // mp3 (missing)
      .mockResolvedValue({ ok: true }); // rest
    render(<PWAAssetsCheck />);
    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        "[PWA] Asset not found or error: https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_uz4IPigRBv8XTydickOuMOFjyuqo/zBJu5-JPmFmAcN0trz4slO/public/success-83493.mp3"
      );
      expect(warnSpy).toHaveBeenCalledWith(
        "[PWA] Some required assets are missing"
      );
    });
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });
});
