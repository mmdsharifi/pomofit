import React from "react";
import { render, screen, fireEvent, act } from "../../test/test-utils";
import PWAInstallPrompt from "@/components/pwa-install-prompt";

jest.mock("@/lib/register-sw", () => ({
  isPWAInstalled: jest.fn(),
}));

describe("PWAInstallPrompt", () => {
  let originalLocalStorage: Storage;
  let setItemMock: jest.Mock;
  let getItemMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (require("@/lib/register-sw").isPWAInstalled as jest.Mock).mockReturnValue(
      false
    );
    setItemMock = jest.fn();
    getItemMock = jest.fn();
    originalLocalStorage = global.localStorage;
    Object.defineProperty(window, "localStorage", {
      value: { getItem: getItemMock, setItem: setItemMock },
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      configurable: true,
    });
  });

  test("shows install prompt when beforeinstallprompt is fired", () => {
    render(<PWAInstallPrompt />);
    act(() => {
      const event = new Event("beforeinstallprompt");
      window.dispatchEvent(event);
    });
    expect(screen.getAllByText(/Install Pomofit/i).length).toBeGreaterThan(0);
  });

  test("dismisses prompt and sets localStorage on dismiss", () => {
    render(<PWAInstallPrompt />);
    act(() => {
      const event = new Event("beforeinstallprompt");
      window.dispatchEvent(event);
    });
    act(() => {
      fireEvent.click(screen.getByLabelText(/close prompt/i));
    });
    expect(setItemMock).toHaveBeenCalledWith(
      "pwa-prompt-dismissed",
      expect.any(String)
    );
  });
});
