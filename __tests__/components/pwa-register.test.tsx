import React from "react";
import { render, screen } from "../../test/test-utils";
import PWARegister from "@/components/pwa-register";

jest.resetModules();
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock("@/lib/register-sw", () => ({
  registerServiceWorker: jest.fn(),
}));

describe("PWARegister", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("registers service worker and sets up event listeners", async () => {
    render(<PWARegister />);
    expect(
      require("@/lib/register-sw").registerServiceWorker
    ).toHaveBeenCalled();
    // Simulate online event
    window.dispatchEvent(new Event("online"));
    await Promise.resolve();
    expect(
      require("@/components/ui/use-toast").useToast().toast
    ).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringMatching(/back online/i) })
    );
    // Simulate offline event
    window.dispatchEvent(new Event("offline"));
    await Promise.resolve();
    expect(
      require("@/components/ui/use-toast").useToast().toast
    ).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringMatching(/offline/i) })
    );
  });

  test("does not double-initialize if already initialized", () => {
    const { rerender } = render(<PWARegister />);
    rerender(<PWARegister />);
    expect(
      require("@/lib/register-sw").registerServiceWorker
    ).toHaveBeenCalledTimes(1);
  });
});
