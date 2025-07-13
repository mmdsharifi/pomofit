import { type NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

export async function POST(request: NextRequest) {
  try {
    const { message, journalContext } = await request.json();

    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "AI features are not available - API key not configured",
        fallbackResponse:
          "I'd love to help analyze your journals, but AI features require an API key to be configured. For now, I can suggest some general productivity tips: try reviewing your journal entries weekly to identify patterns, set specific goals based on your reflections, and use your journal insights to prioritize your most important tasks.",
      });
    }

    const systemPrompt = `You are a helpful, friendly, and human-like journal AI assistant. You have access to the user's journal entries and can:
1. Analyze patterns and themes in their writing
2. Provide insights and reflections
3. Suggest actionable tasks based on their thoughts and goals
4. Help with personal growth and productivity

**Always** use a warm, conversational tone. Use markdown formatting (bold, italic) and appropriate emojis to make your responses engaging and human-like.

When suggesting tasks, format them as a JSON array at the end of your response like this:
TASKS: ["task 1", "task 2", "task 3"]

Journal entries:
${journalContext}

Be empathetic, insightful, and helpful. Keep responses concise but meaningful.`;

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"), // Updated to use a supported model
      system: systemPrompt,
      prompt: message,
      maxTokens: 500,
    });

    // Extract suggested tasks if any
    const taskMatch = text.match(/TASKS:\s*(\[.*?\])/s);
    let suggestedTasks: string[] = [];
    let cleanedText = text;

    if (taskMatch) {
      try {
        suggestedTasks = JSON.parse(taskMatch[1]);
        cleanedText = text.replace(/TASKS:\s*\[.*?\]/s, "").trim();
      } catch (e) {
        console.error("Error parsing suggested tasks:", e);
      }
    }

    return NextResponse.json({
      success: true,
      response: cleanedText,
      suggestedTasks: suggestedTasks.length > 0 ? suggestedTasks : undefined,
    });
  } catch (error) {
    console.error("Error in journal chat API:", error);

    // Check if it's a model-related error and provide a helpful fallback
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("decommissioned") ||
      errorMessage.includes("not supported")
    ) {
      return NextResponse.json({
        success: false,
        error: "AI model temporarily unavailable",
        fallbackResponse:
          "I'm currently updating to use the latest AI models. In the meantime, here are some general insights: Regular journaling helps identify patterns in your thoughts and behaviors. Try reviewing your entries weekly to spot recurring themes, and consider setting specific goals based on what you discover about yourself.",
      });
    }

    return NextResponse.json({
      success: false,
      error: "Failed to generate AI response",
      fallbackResponse:
        "I'm having trouble connecting to the AI service right now. Please try again later, or feel free to continue journaling - I'll be here when the connection is restored!",
    });
  }
}
