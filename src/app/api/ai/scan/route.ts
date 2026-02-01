import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 500 },
      );
    }

    const html = await response.text();

    // Simple extraction logic (can be refined)
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "";

    const descMatch = html.match(/<meta name="description" content="(.*?)"/i);
    const description = descMatch ? descMatch[1] : "";

    // Extract text from common tags (basic version)
    const bodyContent = html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Summarize for context (limit size)
    const summary = `
Website: ${url}
Title: ${title}
Description: ${description}

Content:
${bodyContent.substring(0, 3000)}...
    `.trim();

    return NextResponse.json({ text: summary });
  } catch (error: any) {
    console.error("Scan Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
