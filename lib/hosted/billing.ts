import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import { absoluteUrl } from "@/lib/site";
import { database, transaction, type Tx } from "./db";
import { access, audit } from "./service";
import { ensure, type Actor, type Org } from "./types";
export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  ensure(
    key && key.startsWith("sk_test_"),
    "Stripe test billing is unavailable. Live keys are never accepted.",
    503,
  );
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 8000 });
}
export const TEAM = {
  amount: 29900,
  currency: "usd",
  seats: 10,
  sites: 1,
  teams: 1,
  graceDays: 30,
} as const;
export async function teamPrice(stripe: Stripe) {
  const id = process.env.STRIPE_TEAM_PRICE_ID;
  ensure(id, "Team test price is not configured", 503);
  const price = await stripe.prices.retrieve(id);
  ensure(
    !price.livemode &&
      price.active &&
      price.unit_amount === TEAM.amount &&
      price.currency === TEAM.currency &&
      price.recurring?.interval === "month" &&
      price.recurring.interval_count === 1,
    "Team price must be an active $299 USD monthly test price",
    503,
  );
  return price;
}
async function billingAccess(sql: Tx, actor: Actor, orgId: string) {
  const result = await access(sql, actor, orgId);
  ensure(
    ["owner", "billing_admin"].includes(result.member.role),
    "Billing administrator access required",
    403,
  );
  return result;
}
async function register(
  actor: Actor,
  org: string,
  id: string,
  kind: "checkout" | "portal",
) {
  await transaction(actor, async (sql) => {
    await billingAccess(sql, actor, org);
    const [old] =
      await sql`select * from company.billing_operations where org_id=${org} and id=${id}`;
    if (old) {
      ensure(
        old.actor === actor.id && old.kind === kind,
        "Billing idempotency key already used",
        409,
      );
      return;
    }
    const [unfinished] =
      await sql`select id from company.billing_operations where org_id=${org} and kind=${kind} and result is null and created_at<now()-interval '23 hours' limit 1`;
    ensure(
      !unfinished,
      "An unfinished billing operation needs operator reconciliation before a new request",
      409,
    );
    await sql`insert into company.billing_operations(org_id,id,actor,kind) values(${org},${id},${actor.id},${kind})`;
  });
}
function checkOperation(op: { created_at: string | Date; result: unknown }) {
  if (!op.result)
    ensure(
      Date.now() - new Date(op.created_at).getTime() < 23 * 3600000,
      "An old unfinished billing request needs reconciliation before retry; a new charge will not be created automatically.",
      409,
    );
}
export async function checkout(
  actor: Actor,
  orgId: string,
  commandId: string,
  stripe: Stripe = stripeClient(),
) {
  await register(actor, orgId, commandId, "checkout");
  return transaction(actor, async (sql) => {
    const { org } = await billingAccess(sql, actor, orgId);
    const [op] =
      await sql`select * from company.billing_operations where org_id=${orgId} and id=${commandId}`;
    if (op.result) return op.result as { url: string };
    checkOperation(op as { created_at: Date; result: unknown });
    const price = await teamPrice(stripe);
    const [billing] =
      await sql`select * from company.billing where org_id=${orgId} for update`;
    if (billing.subscription_id) {
      const sub = await stripe.subscriptions.retrieve(billing.subscription_id);
      ensure(
        ["canceled", "incomplete_expired"].includes(sub.status),
        "A subscription already exists; use billing management",
        409,
      );
    }
    let customer = billing.customer_id as string | null;
    if (!customer) {
      const created = await stripe.customers.create(
        {
          name: org.name,
          email: actor.email,
          metadata: {
            organization_id: orgId,
            purpose: "loopsignal_synthetic_team",
          },
        },
        { idempotencyKey: `loopsignal:customer:${orgId}` },
      );
      ensure(!created.livemode, "Live customers are not allowed");
      customer = created.id;
      await sql`update company.billing set customer_id=${customer} where org_id=${orgId}`;
    }
    // Reuse any open checkout across concurrent requests and browser tabs.
    if (billing.checkout_id) {
      const existing = await stripe.checkout.sessions.retrieve(
        billing.checkout_id,
      );
      if (existing.status === "open" && existing.url) {
        const result = { url: existing.url };
        await sql`update company.billing_operations set result=${JSON.stringify(result)}::text::jsonb where org_id=${orgId} and id=${commandId}`;
        return result;
      }
      if (existing.status === "complete" && !billing.subscription_id)
        ensure(
          false,
          "Checkout completed. Refresh subscription status before trying again.",
          409,
        );
    }
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer,
        line_items: [{ price: price.id, quantity: 1 }],
        client_reference_id: orgId,
        metadata: { organization_id: orgId },
        subscription_data: {
          metadata: {
            organization_id: orgId,
            purpose: "loopsignal_synthetic_team",
          },
        },
        success_url: absoluteUrl("/company?checkout=returned"),
        cancel_url: absoluteUrl("/company?checkout=cancelled"),
        allow_promotion_codes: false,
      },
      { idempotencyKey: `loopsignal:checkout:${orgId}:${commandId}` },
    );
    ensure(!session.livemode && session.url, "Test checkout unavailable", 503);
    await sql`update company.billing set checkout_id=${session.id},generation=generation+1,updated_at=clock_timestamp() where org_id=${orgId}`;
    // Pending is not paid authority; the original evaluation deadline still applies.
    await sql`update company.organizations set billing_state='pending' where id=${orgId} and billing_state in ('evaluation','unentitled','cancelled','pending')`;
    const result = { url: session.url };
    await sql`update company.billing_operations set result=${JSON.stringify(result)}::text::jsonb where org_id=${orgId} and id=${commandId}`;
    await audit(
      sql,
      actor,
      orgId,
      commandId,
      "test_checkout_created",
      null,
      null,
      null,
    );
    return result;
  });
}
export async function portal(
  actor: Actor,
  orgId: string,
  commandId: string,
  stripe: Stripe = stripeClient(),
) {
  await register(actor, orgId, commandId, "portal");
  return transaction(actor, async (sql) => {
    await billingAccess(sql, actor, orgId);
    const [op] =
      await sql`select * from company.billing_operations where org_id=${orgId} and id=${commandId}`;
    if (op.result) return op.result as { url: string };
    checkOperation(op as { created_at: Date; result: unknown });
    const [billing] =
      await sql`select * from company.billing where org_id=${orgId}`;
    ensure(
      billing.customer_id,
      "Complete test checkout before opening billing management",
    );
    const result = await stripe.billingPortal.sessions.create(
      { customer: billing.customer_id, return_url: absoluteUrl("/company") },
      { idempotencyKey: `loopsignal:portal:${orgId}:${commandId}` },
    );
    await sql`update company.billing_operations set result=${JSON.stringify({ url: result.url })}::text::jsonb where org_id=${orgId} and id=${commandId}`;
    await audit(
      sql,
      actor,
      orgId,
      commandId,
      "test_billing_portal",
      null,
      null,
      null,
    );
    return { url: result.url };
  });
}
export function subscriptionState(
  sub: Stripe.Subscription,
): Org["billing_state"] {
  if (sub.pause_collection) return "past_due";
  if (sub.status === "active") return "active";
  if (["past_due", "unpaid", "paused"].includes(sub.status)) return "past_due";
  if (["canceled", "incomplete_expired"].includes(sub.status))
    return "cancelled";
  return "pending";
}
async function reconcileLocked(
  sql: Tx,
  actor: Actor,
  org: Org,
  stripe: Stripe,
  event?: { id: string; type: string },
) {
  if (event) {
    const [seen] =
      await sql`select id from company.billing_events where id=${event.id}`;
    if (seen) return { state: org.billing_state, replayed: true };
  }
  const [billing] =
    await sql`select * from company.billing where org_id=${org.id} for update`;
  ensure(billing.customer_id, "No test customer to reconcile");
  // Always fetch CURRENT state while holding the organization lock. Delivery order
  // and event.created timestamps cannot roll entitlements backward.
  const customer = await stripe.customers.retrieve(billing.customer_id);
  ensure(
    !customer.deleted &&
      !customer.livemode &&
      customer.metadata.organization_id === org.id,
    "Customer ownership mismatch",
    403,
  );
  const subscriptions = await stripe.subscriptions.list({
    customer: billing.customer_id,
    status: "all",
    limit: 100,
  });
  ensure(
    !subscriptions.has_more,
    "Subscription reconciliation requires operator review",
    409,
  );
  const owned = subscriptions.data.filter(
    (s) =>
      s.metadata.organization_id === org.id &&
      s.metadata.purpose === "loopsignal_synthetic_team",
  );
  const live = owned.filter(
    (s) => !["canceled", "incomplete_expired"].includes(s.status),
  );
  ensure(
    live.length <= 1,
    "Multiple subscriptions require operator reconciliation; access will not be guessed",
    409,
  );
  const sub = live[0] ?? owned.sort((a, b) => b.created - a.created)[0];
  let state: Org["billing_state"] = org.billing_state;
  if (sub) {
    ensure(!sub.livemode, "Live subscriptions are not accepted");
    const expected = await teamPrice(stripe);
    ensure(
      sub.items.data.length === 1 &&
        sub.items.data[0].price.id === expected.id &&
        sub.items.data[0].quantity === 1,
      "Unexpected plan or quantity; reconciliation blocked",
      409,
    );
    state = subscriptionState(sub);
    await sql`update company.billing set subscription_id=${sub.id},updated_at=clock_timestamp() where org_id=${org.id}`;
  } else if (billing.checkout_id) {
    const session = await stripe.checkout.sessions.retrieve(
      billing.checkout_id,
    );
    ensure(
      session.customer === billing.customer_id && !session.livemode,
      "Checkout ownership mismatch",
      403,
    );
    if (session.status === "expired")
      state =
        Date.now() < Date.parse(org.evaluation_ends_at)
          ? "evaluation"
          : "unentitled";
    else state = "pending";
  }
  const grace =
    state === "active"
      ? null
      : ["past_due", "cancelled", "unentitled"].includes(state)
        ? (org.grace_ends_at ??
          new Date(Date.now() + TEAM.graceDays * 86400000).toISOString())
        : org.grace_ends_at;
  await sql`update company.organizations set billing_state=${state},grace_ends_at=${grace},seats=${TEAM.seats},evaluation_ends_at=case when ${["past_due", "cancelled"].includes(state)} then least(evaluation_ends_at,clock_timestamp()) else evaluation_ends_at end where id=${org.id}`;
  if (state === "cancelled")
    await sql`update company.billing set checkout_id=null where org_id=${org.id}`;
  if (event)
    await sql`insert into company.billing_events(id,org_id,event_type) values(${event.id},${org.id},${event.type})`;
  await audit(
    sql,
    actor,
    org.id,
    randomUUID(),
    event ? "stripe_subscription_reconciled" : "subscription_reconciled",
    null,
    null,
    null,
    randomUUID(),
    [
      {
        state,
        eventId: event?.id ?? null,
        authority: event ? "signed_stripe_event" : "server_reconciliation",
      },
    ],
  );
  return { state, replayed: false };
}
export async function reconcile(
  actor: Actor,
  orgId: string,
  stripe: Stripe = stripeClient(),
) {
  return transaction(actor, async (sql) => {
    const { org } = await billingAccess(sql, actor, orgId);
    return reconcileLocked(sql, actor, org, stripe);
  });
}
export function verifyWebhook(
  raw: Buffer,
  signature: string | null,
  stripe: Stripe = stripeClient(),
) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  ensure(secret && signature, "Webhook signature missing", 400);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret, 300);
  } catch {
    throw new Error("Invalid Stripe signature");
  }
  ensure(!event.livemode, "Live events are rejected", 400);
  return event;
}
export async function webhook(
  event: Stripe.Event,
  stripe: Stripe = stripeClient(),
) {
  ensure(!event.livemode, "Live events are rejected", 400);
  if (
    !event.type.startsWith("customer.subscription.") &&
    ![
      "invoice.paid",
      "invoice.payment_failed",
      "checkout.session.completed",
      "checkout.session.expired",
    ].includes(event.type)
  )
    return { ignored: true };
  const object = event.data.object as unknown as {
    customer?: string | { id: string };
  };
  const customer =
    typeof object.customer === "string" ? object.customer : object.customer?.id;
  ensure(customer, "Stripe customer is missing", 400);
  // A verified event may only find an already-associated customer. Event metadata
  // and client-supplied organization/subscription IDs never choose the tenant.
  const mapping = await database().begin(async (sql) => {
    await sql`set local role loop_app`;
    return sql`select * from company.billing_owner(${customer})`;
  });
  if (!mapping[0]) return { ignored: true };
  const actor = { id: String(mapping[0].owner_id), email: "" };
  return transaction(actor, async (sql) => {
    const { org } = await billingAccess(sql, actor, String(mapping[0].org_id));
    return reconcileLocked(sql, actor, org, stripe, event);
  });
}
