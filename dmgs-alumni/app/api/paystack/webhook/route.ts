import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Paystack webhook. Paystack POSTs payment events here.
 *
 * Trust model:
 *  1. Verify the HMAC-SHA512 signature against the raw body (constant-time).
 *  2. Never trust the event body's amount/status — independently re-verify the
 *     transaction with Paystack's API.
 *  3. Match a PENDING donation by reference, reconcile the amount, and only
 *     then promote it to 'success'. Guarded by `.eq('status','pending')` so a
 *     replayed event is idempotent.
 *
 * Runs with the service-role client (bypasses RLS).
 */
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    // Not configured yet — accept nothing.
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");

  // Constant-time comparison (equal-length buffers only).
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  // We only act on successful charges; acknowledge everything else.
  if (event?.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const reference: string | undefined = event?.data?.reference;
  if (!reference) return NextResponse.json({ received: true });

  // Independently verify with Paystack — do NOT trust the body's amount/status.
  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" },
  );
  if (!verifyRes.ok) {
    // Transient — let Paystack retry.
    return NextResponse.json({ error: "verify_failed" }, { status: 502 });
  }
  const verify = await verifyRes.json();
  const tx = verify?.data;
  if (verify?.status !== true || tx?.status !== "success") {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  // Find the matching donation.
  const { data: donation } = await admin
    .from("donations")
    .select("id, amount, status")
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (!donation) return NextResponse.json({ received: true });
  if (donation.status === "success") {
    // Already processed — idempotent no-op.
    return NextResponse.json({ received: true });
  }

  const paidNgn = typeof tx.amount === "number" ? tx.amount / 100 : null;
  const expected2 = Math.round(Number(donation.amount) * 100);
  const paid2 = paidNgn === null ? null : Math.round(paidNgn * 100);

  if (paid2 === null || paid2 !== expected2) {
    // Amount doesn't match what we recorded — mark failed rather than credit it.
    await admin
      .from("donations")
      .update({ status: "failed" })
      .eq("paystack_reference", reference)
      .eq("status", "pending");
    return NextResponse.json({ received: true });
  }

  await admin
    .from("donations")
    .update({ status: "success", currency: tx.currency ?? "NGN" })
    .eq("paystack_reference", reference)
    .eq("status", "pending");

  return NextResponse.json({ received: true });
}
