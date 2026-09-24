import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Resolve uploads directory safely in both dev and standalone/production
function getUploadsDir(): string {
  const cwd = process.cwd();
  let dir = path.join(cwd, "public", "uploads");
  if (!fs.existsSync(path.join(cwd, "public")) && fs.existsSync(path.join(cwd, "apps", "web", "public"))) {
    dir = path.join(cwd, "apps", "web", "public", "uploads");
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "You must be signed in to upload files" } },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customName = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "No file provided" } },
        { status: 400 }
      );
    }

    // Limit size to 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: "FILE_TOO_LARGE", message: "File exceeds maximum size limit of 15MB" } },
        { status: 400 }
      );
    }

    // Allowed mime types
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "image/heic",
      "image/heif",
      "application/pdf",
    ];

    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_FILE_TYPE", message: "Only images (JPEG, PNG, WebP) and PDF documents are allowed" } },
        { status: 400 }
      );
    }

    const uploadsDir = getUploadsDir();

    // Determine extension
    let ext = ".webp";
    if (file.type === "application/pdf") ext = ".pdf";
    else if (file.type === "image/png") ext = ".png";
    else if (file.type === "image/jpeg" || file.type === "image/jpg") ext = ".jpg";

    const uniqueId = crypto.randomUUID();
    const safeFilename = `doc_${Date.now()}_${uniqueId.slice(0, 8)}${ext}`;
    const targetPath = path.join(uploadsDir, safeFilename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(targetPath, buffer);

    const publicUrl = `/uploads/${safeFilename}`;

    return NextResponse.json({
      success: true,
      data: {
        id: uniqueId,
        url: publicUrl,
        filename: safeFilename,
        name: customName || file.name || safeFilename,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[upload error]", error);
    return NextResponse.json(
      { success: false, error: { code: "UPLOAD_FAILED", message: error?.message || "File upload failed" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const { filename } = await req.json();
    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST" } }, { status: 400 });
    }

    // Path traversal security check
    const basename = path.basename(filename);
    if (basename !== filename || !/^doc_[\w-]+\.(webp|png|jpg|pdf)$/.test(basename)) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Invalid filename" } }, { status: 400 });
    }

    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, basename);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    return NextResponse.json({ success: true, message: "File removed" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error?.message } }, { status: 500 });
  }
}
