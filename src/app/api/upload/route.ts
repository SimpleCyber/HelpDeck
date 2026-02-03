import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const url = formData.get("url") as string;
    const folder = (formData.get("folder") as string) || "helpdeck";

    if (!file && !url) {
      return NextResponse.json(
        { error: "No file or URL provided" },
        { status: 400 },
      );
    }

    let result;
    if (url) {
      // Upload from URL
      result = await cloudinary.uploader.upload(url, {
        folder,
        resource_type: "auto",
      });
    } else {
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Cloudinary via stream
      result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder,
              resource_type: "auto",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          )
          .end(buffer);
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
