import "whatwg-fetch";
// To run these tests, install jest-fetch-mock: npm install --save-dev jest-fetch-mock
import { POST } from "../../app/api/ai-tags/route";
import { NextRequest } from "next/server";

describe("/api/ai-tags", () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  function makeRequest(body: any) {
    const req = new Request("http://localhost/api/ai-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // Wrap in NextRequest for compatibility
    return new NextRequest(req);
  }

  it("returns tags array from AI", async () => {
    process.env.GROQ_API_KEY = "test-key";
    jest.resetModules();
    jest.doMock("ai", () => ({
      generateText: jest.fn().mockResolvedValue({ text: '["focus","work"]' }),
    }));
    const req = makeRequest({
      title: "Test",
      note: "Worked on project",
      sessionNumber: 1,
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.tags)).toBe(true);
    expect(data.tags.length).toBeGreaterThan(0);
  });

  it("returns fallback if GROQ_API_KEY is missing", async () => {
    delete process.env.GROQ_API_KEY;
    const req = makeRequest({
      title: "Test",
      note: "Worked on project",
      sessionNumber: 1,
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.tags).toEqual(["untagged"]);
  });

  it("returns fallback if AI response is not array", async () => {
    process.env.GROQ_API_KEY = "test-key";
    jest.resetModules();
    jest.doMock("ai", () => ({
      generateText: jest.fn().mockResolvedValue({ text: "not an array" }),
    }));
    const req = makeRequest({
      title: "Test",
      note: "Worked on project",
      sessionNumber: 1,
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.tags).toEqual(["untagged"]);
  });
});
