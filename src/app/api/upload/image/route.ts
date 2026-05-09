import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Image upload not configured" }, { status: 500 });
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const entry = form.get("file");
    if (!entry || typeof entry === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    file = entry as File;
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "okoatime/products";
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;

  const msgBuffer = new TextEncoder().encode(toSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const upload = new FormData();
  upload.append("file", file);
  upload.append("api_key", apiKey);
  upload.append("timestamp", timestamp);
  upload.append("folder", folder);
  upload.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: upload,
  });

  const data = await res.json() as { secure_url?: string; error?: { message: string } };
  if (!res.ok || !data.secure_url) {
    return NextResponse.json({ error: data.error?.message ?? "Upload failed" }, { status: 500 });
  }

  return NextResponse.json({ url: data.secure_url });
}
