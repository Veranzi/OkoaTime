import { NextRequest, NextResponse } from "next/server";
import { toMpesaPhone } from "@/lib/utils";

async function getMpesaToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const res = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );

  const data = await res.json() as { access_token?: string; error?: string };
  if (!data.access_token) {
    console.error("Token fetch failed:", JSON.stringify(data));
    throw new Error("Failed to get M-Pesa token");
  }
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, orderId } = await req.json();

    if (!phone || !amount || !orderId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    const callbackUrl = process.env.MPESA_CALLBACK_URL!;

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);

    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const normalizedPhone = toMpesaPhone(phone);

    const token = await getMpesaToken();

    const res = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.ceil(amount),
          PartyA: normalizedPhone,
          PartyB: shortcode,
          PhoneNumber: normalizedPhone,
          CallBackURL: callbackUrl,
          AccountReference: orderId,
          TransactionDesc: `OkoaTime Order ${orderId}`,
        }),
      }
    );

    const data = await res.json() as { ResponseCode?: string; CheckoutRequestID?: string; errorMessage?: string; errorCode?: string };
    console.log("Daraja STK response:", JSON.stringify(data));

    if (data.ResponseCode === "0") {
      return NextResponse.json({
        success: true,
        checkoutRequestId: data.CheckoutRequestID,
        message: "STK Push sent. Check your phone.",
      });
    } else {
      const errMsg = data.errorMessage ?? "STK Push failed";
      console.error("Daraja error:", errMsg, "code:", data.errorCode);
      return NextResponse.json({ success: false, message: errMsg }, { status: 400 });
    }
  } catch (error) {
    console.error("M-Pesa STK Push error:", error);
    return NextResponse.json({ success: false, message: "Payment request failed" }, { status: 500 });
  }
}
