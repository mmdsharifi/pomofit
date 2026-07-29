import { type NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

export async function POST(request: NextRequest) {
  try {
    const { title, note, sessionNumber } = await request.json();

    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "AI features are not available - API key not configured",
          tags: ["untagged"],
        },
        { status: 503 }
      );
    }

    const prompt = `Given the following session information, generate 3-5 relevant, short tags (single words or short phrases, no #) as a JSON array. Only return the array, nothing else.\nTitle: ${title}\nNote: ${note}\nSession Number: ${sessionNumber}`;
    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      system:
        "You are a helpful assistant that only returns a JSON array of tags.",
      prompt,
      maxTokens: 60,
    });
    // Try to parse the tags from the response
    let tags: string[] = [];
    try {
      tags = JSON.parse(text.trim());
      if (!Array.isArray(tags)) tags = ["untagged"];
    } catch {
      tags = ["untagged"];
    }
    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error("Error in ai-tags API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate AI tags",
        tags: ["untagged"],
      },
      { status: 500 }
    );
  }
}
