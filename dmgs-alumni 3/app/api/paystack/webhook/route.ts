import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Paystack webhook. Paystack POSTs payment events here; we verify the
 * signature with the secret key, then confirm the matching donation.
 * Runs with the service-role client (bypasses RLS) - never trust the body
 * without verifying the signature first.
 */
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    // Not configured yet - accept nothing.
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const expected = crypto
    .createHmac("sha512", secret)
    .update(raw)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);

  if (event?.event === "charge.success") {
    const data = event.data ?? {};
    const reference: string | undefined = data.reference;
    const amount = typeof data.amount === "number" ? data.amount / 100 : null; // kobo -> NGN

    if (reference) {
      const admin = createAdminClient();
      await admin
        .from("donations")
        .update({
          status: "success",
          ...(amount ? { amount } : {}),
          currency: data.currency ?? "NGN",
        })
        .eq("paystack_reference", reference);
    }
  }

  return NextResponse.json({ received: true });
}
