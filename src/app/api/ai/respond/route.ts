import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, ownerId, message, history, userName, websiteName } =
      await req.json();

    if (!workspaceId || !ownerId || !message) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );
    }

    // 1. Fetch Workspace AI Settings
    const wsRef = doc(db, "users", ownerId, "workspaces", workspaceId);
    const wsSnap = await getDoc(wsRef);

    if (!wsSnap.exists()) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    const wsData = wsSnap.data();
    const aiSettings = wsData.aiSettings || {};

    const websiteInfo = aiSettings.aiWebsiteInfo || "";
    const geminiKey = aiSettings.aiGeminiKey || "";

    // Usage tracking logic
    let usage = aiSettings.modelUsage || { version: 1, count: 0 };
    let currentModelName =
      usage.version === 1 ? "gemini-2.0-flash-lite" : "gemini-2.5-flash";

    // 2. Handle missing key
    if (!geminiKey) {
      return NextResponse.json({
        text: "Error: Gemini API Key not found. Please add your key in the AI Automation settings.",
      });
    }

    // 3. Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: currentModelName });

    // 4. Create System Prompt
    const systemPrompt = `
      You are a friendly and helpful AI assistant for the website: ${websiteName || wsData.name || "this website"}.
      The user you are chatting with is named: ${userName || "Guest"}.
      
      Your goal is to assist users based on the following website information:
      ---
      ${websiteInfo || "No specific website details provided yet."}
      ---
      
      Guidelines:
      - Always be polite and professional.
      - Start the first message with a warm greeting, addressing the user by their name (${userName || "Guest"}) if appropriate.
      - If the user says "Hi", "Hello", or similar, respond warmly and ask how you can help them today.
      - Use the provided website information to answer specific questions accurately.
      - If the information is not present in the provided context, but it's a general question (like a greeting or "how are you"), respond naturally and helpfully.
      - If they ask something specific that YOU DON'T KNOW from the context (e.g., specific pricing not listed, technical support steps not provided), politely inform them and suggest they turn off AI mode to chat with a human admin.
      - Never make up facts about the company that aren't in the context.
    `;

    // 5. Generate Response with Automatic Fallback
    let result;
    let fallbackUsed = false;

    try {
      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemPrompt }] },
          ...history,
        ],
      });
      result = await chat.sendMessage(message);
    } catch (err: any) {
      // If quota exceeded (429), try the other model immediately
      if (err.message?.includes("429") || err.status === 429) {
        console.log(
          "Quota exceeded for",
          currentModelName,
          "trying fallback...",
        );
        fallbackUsed = true;
        const fallbackModelName =
          usage.version === 1 ? "gemini-2.5-flash" : "gemini-2.0-flash-lite";
        const fallbackModel = genAI.getGenerativeModel({
          model: fallbackModelName,
        });

        const fallbackChat = fallbackModel.startChat({
          history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...history,
          ],
        });
        result = await fallbackChat.sendMessage(message);
      } else {
        // Return other errors as text response
        return NextResponse.json({
          text: `Error: ${err.message || "Failed to generate AI response"}`,
        });
      }
    }

    const responseText = result.response.text();

    // 6. Update usage stats
    let newCount = usage.count + 1;
    let newVersion = usage.version;

    // If we used the fallback due to 429, we force switch the version for next time
    if (fallbackUsed) {
      newVersion = usage.version === 1 ? 2 : 1;
      newCount = 1; // Start count at 1 for the new version
    } else if (newCount >= 20) {
      newVersion = usage.version === 1 ? 2 : 1;
      newCount = 0;
    }

    await updateDoc(wsRef, {
      "aiSettings.modelUsage": {
        version: newVersion,
        count: newCount,
        lastUsed: new Date().toISOString(),
        hadQuotaError: fallbackUsed,
      },
    });

    return NextResponse.json({ text: responseText });
  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json({
      text: `Error: ${error.message || "Internal Server Error"}`,
    });
  }
}
