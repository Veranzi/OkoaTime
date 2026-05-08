import { NextRequest, NextResponse } from "next/server";
import { formatPhone } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json() as { phone: string; message: string };

    if (!phone || !message) {
      return NextResponse.json({ success: false, message: "Missing phone or message" }, { status: 400 });
    }

    const apiKey = process.env.AFRICAS_TALKING_API_KEY!;
    const username = process.env.AFRICAS_TALKING_USERNAME!;
    const normalizedPhone = formatPhone(phone).startsWith("07") || formatPhone(phone).startsWith("01")
      ? `+254${formatPhone(phone).slice(1)}`
      : formatPhone(phone);

    const res = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        apiKey,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username,
        to: normalizedPhone,
        message,
        from: "OkoaTime",
      }).toString(),
    });

    const data = await res.json() as { SMSMessageData: { Recipients: { status: string }[] } };
    const recipient = data?.SMSMessageData?.Recipients?.[0];

    if (recipient?.status === "Success") {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: "SMS delivery failed" }, { status: 500 });
  } catch (error) {
    console.error("SMS error:", error);
    return NextResponse.json({ success: false, message: "Failed to send SMS" }, { status: 500 });
  }
}
