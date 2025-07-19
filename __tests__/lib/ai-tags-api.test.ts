import "whatwg-fetch";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data) => ({
      json: jest.fn().mockResolvedValue(data),
      status: 200,
    })),
  },
}));

// Mock the AI module
jest.mock("ai", () => ({
  generateText: jest.fn(),
}));

// Mock the groq module
jest.mock("@ai-sdk/groq", () => ({
  groq: jest.fn(() => "mocked-model"),
}));

describe("/api/ai-tags", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("returns tags array from AI", async () => {
    process.env.GROQ_API_KEY = "test-key";

    // Mock the generateText function
    const { generateText } = require("ai");
    generateText.mockResolvedValue({ text: '["focus","work"]' });

    // Import the route after mocking
    const { POST } = await import("../../app/api/ai-tags/route");

    const req = new Request("http://localhost/api/ai-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test",
        note: "Worked on project",
        sessionNumber: 1,
      }),
    });

    const res = await POST(req as any);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.tags)).toBe(true);
    expect(data.tags.length).toBeGreaterThan(0);
  });

  it("returns fallback if GROQ_API_KEY is missing", async () => {
    delete process.env.GROQ_API_KEY;

    // Import the route after mocking
    const { POST } = await import("../../app/api/ai-tags/route");

    const req = new Request("http://localhost/api/ai-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test",
        note: "Worked on project",
        sessionNumber: 1,
      }),
    });

    const res = await POST(req as any);
    const data = await res.json();

    expect(data.success).toBe(false);
    expect(data.tags).toEqual(["untagged"]);
  });

  it("returns fallback if AI response is not array", async () => {
    process.env.GROQ_API_KEY = "test-key";

    // Mock the generateText function to return invalid response
    const { generateText } = require("ai");
    generateText.mockResolvedValue({ text: "not an array" });

    // Import the route after mocking
    const { POST } = await import("../../app/api/ai-tags/route");

    const req = new Request("http://localhost/api/ai-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test",
        note: "Worked on project",
        sessionNumber: 1,
      }),
    });

    const res = await POST(req as any);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.tags).toEqual(["untagged"]);
  });
});
