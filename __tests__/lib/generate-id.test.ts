import { generateId } from "@/lib/generate-id";

const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");

const setCrypto = (value: Crypto | undefined) => {
  Object.defineProperty(globalThis, "crypto", {
    value,
    configurable: true,
    writable: true,
  });
};

describe("generateId", () => {
  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, "crypto", originalDescriptor);
    } else {
      delete (globalThis as any).crypto;
    }
    jest.restoreAllMocks();
  });

  it("uses crypto.randomUUID when available", () => {
    const randomUUID = jest.fn().mockReturnValue("mocked-id");
    setCrypto({
      randomUUID,
    } as unknown as Crypto);

    expect(generateId()).toBe("mocked-id");
    expect(randomUUID).toHaveBeenCalled();
  });

  it("falls back to getRandomValues when randomUUID is missing", () => {
    const getRandomValues = jest
      .fn()
      .mockImplementation((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i;
        }
        return array;
      });

    setCrypto({
      randomUUID: undefined,
      getRandomValues,
    } as unknown as Crypto);

    const id = generateId();
    expect(getRandomValues).toHaveBeenCalled();
    expect(id).toHaveLength(36);
    expect(id).toMatch(/^[0-9a-f-]+$/);
  });
});
