import "@testing-library/jest-dom";
import React from "react";
import { render, screen, act } from "../../test/test-utils";
import ServiceWorkerErrorHandler from "@/components/sw-error-handler";

jest.mock("@/components/ui/use-toast", () => {
  const mockToast = jest.fn();
  return {
    useToast: () => ({ toast: mockToast }),
    __esModule: true,
  };
});

// Polyfill for PromiseRejectionEvent for jsdom
global.PromiseRejectionEvent = class extends Event {
  promise: Promise<any>;
  reason: any;
  constructor(type: string, props: any) {
    super(type);
    this.promise = props.promise;
    this.reason = props.reason;
  }
};

describe("ServiceWorkerErrorHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows toast and reload button on service worker error", () => {
    render(<ServiceWorkerErrorHandler />);
    const errorEvent = new ErrorEvent("error", {
      filename: "service-worker.js",
      message: "SW error",
    });
    act(() => {
      window.dispatchEvent(errorEvent);
    });
    expect(
      require("@/components/ui/use-toast").useToast().toast
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/service worker issue/i),
      })
    );
    // Simulate error state
    expect(screen.getByText(/reload page/i)).toBeInTheDocument();
  });

  test("shows toast on chunk load error", () => {
    render(<ServiceWorkerErrorHandler />);
    const errorEvent = new ErrorEvent("error", { message: "ChunkLoadError" });
    act(() => {
      window.dispatchEvent(errorEvent);
    });
    expect(
      require("@/components/ui/use-toast").useToast().toast
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/resource loading issue/i),
      })
    );
  });

  test("shows toast on unhandledrejection for service worker", () => {
    render(<ServiceWorkerErrorHandler />);
    const rejectionEvent = new PromiseRejectionEvent("unhandledrejection", {
      promise: Promise.resolve(),
      reason: {
        message: "service worker error",
        filename: "service-worker.js",
      },
    });
    act(() => {
      window.dispatchEvent(rejectionEvent);
    });
    expect(
      require("@/components/ui/use-toast").useToast().toast
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/service worker issue/i),
      })
    );
  });
});
