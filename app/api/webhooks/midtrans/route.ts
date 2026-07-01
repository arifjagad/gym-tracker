import { NextResponse } from 'next/server'

/**
 * Midtrans webhook — update profiles.plan_tier & subscriptions.
 * Implementasi di Fase 9.
 */
export async function POST() {
  // TODO: Fase 9 — verify Midtrans signature, update subscription
  return NextResponse.json({ message: 'Not implemented yet' }, { status: 501 })
}
