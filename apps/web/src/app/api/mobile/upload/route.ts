import { NextRequest, NextResponse } from "next/server";
import { getMobileAuthUser } from "@/lib/mobile-auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

function getUploadsDir(): string {
  const cwd = process.cwd();
  let dir = path.join(cwd, "public", "uploads");
  if (
    !fs.existsSync(path.join(cwd, "public")) &&
    fs.existsSync(path.join(cwd, "apps", "web", "public"))
  ) {
    dir = path.join(cwd, "apps", "web", "public", "uploads");
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getMobileAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customName = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: "File exceeds 15MB limit" },
        { status: 400 }
      );
    }

    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "image/heic",
      "image/heif",
      "application/pdf",
    ];

    if (file.type && !allowedMimes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid file format. Only JPG, PNG, WEBP, HEIC, and PDF are supported.",
        },
        { status: 400 }
      );
    }

    // Determine extension
    let ext = ".jpg";
    if (file.name && file.name.includes(".")) {
      ext = path.extname(file.name).toLowerCase();
    } else if (file.type === "image/png") {
      ext = ".png";
    } else if (file.type === "image/webp") {
      ext = ".webp";
    } else if (file.type === "application/pdf") {
      ext = ".pdf";
    }

    const uniqueId = crypto.randomBytes(6).toString("hex");
    const sanitizedName = customName
      ? customName
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "_")
          .substring(0, 30)
      : "scan";
    const filename = `${sanitizedName}_${Date.now()}_${uniqueId}${ext}`;

    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        filename,
        originalName: customName || file.name || "scanned_doc",
        size: file.size,
        type: file.type || "image/jpeg",
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[mobile upload POST]", error);
    return NextResponse.json(
      { success: false, message: error?.message || "File upload failed" },
      { status: 500 }
    );
  }
}
