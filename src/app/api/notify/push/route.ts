import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

interface FCMPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, data } = await req.json() as FCMPayload;

    // Get user's FCM token
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken as string | undefined;

    if (!fcmToken) {
      return NextResponse.json({ success: false, message: "No FCM token found for user" });
    }

    const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: { title, body },
        data: data ?? {},
      }),
    });

    const fcmData = await fcmRes.json() as { success: number };

    if (fcmData.success === 1) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: "FCM delivery failed" }, { status: 500 });
  } catch (error) {
    console.error("Push notification error:", error);
    return NextResponse.json({ success: false, message: "Failed to send notification" }, { status: 500 });
  }
}
