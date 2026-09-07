import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
import {
  checkout,
  portal,
  reconcile,
  webhook,
  verifyWebhook,
  stripeClient,
  subscriptionState,
} from "../billing";
import { createCompany, execute, getRecord } from "../service";
import { closeDatabase } from "../db";
import type { Actor } from "../types";
const db = Boolean(process.env.COMPANY_TEST_ADMIN_URL);
const owner: Actor = { id: randomUUID(), email: "billing-owner@company.test" },
  other: Actor = { id: randomUUID(), email: "other-owner@company.test" };
let admin: ReturnType<typeof postgres>,
  org: string,
  otherOrg: string,
  client: Stripe;
let status: Stripe.Subscription.Status = "active",
  subscriptions: Stripe.Subscription[] = [],
  customerOrg = "",
  subscriptionPrice = "price_team";
const createCustomer = vi.fn(),
  createCheckout = vi.fn(),
  createPortal = vi.fn();
function subscription(): Stripe.Subscription {
  return {
    id: "sub_" + org,
    object: "subscription",
    customer: "cus_" + org,
    status,
    livemode: false,
    created: 100,
    metadata: { organization_id: org, purpose: "loopsignal_synthetic_team" },
    items: { data: [{ price: { id: subscriptionPrice }, quantity: 1 }] },
    pause_collection: null,
  } as unknown as Stripe.Subscription;
}
function event(
  id: string,
  type = "customer.subscription.updated",
  customer = "",
): Stripe.Event {
  return {
    id,
    type,
    livemode: false,
    created: 100,
    data: { object: { customer: customer || "cus_" + org } },
  } as Stripe.Event;
}
describe("Stripe signature and fail-closed configuration", () => {
  it("rejects live keys, forged signatures, and live events using actual Stripe verification", () => {
    const previous = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "sk_live_not-a-real-key";
    expect(() => stripeClient()).toThrow("Live keys");
    process.env.STRIPE_SECRET_KEY = previous;
    const stripe = new Stripe("sk_test_synthetic_only");
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_synthetic_fixture";
    const payload = JSON.stringify({
      id: "evt_fixture",
      livemode: false,
      type: "customer.subscription.updated",
      data: { object: { customer: "cus_fixture" } },
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });
    expect(verifyWebhook(Buffer.from(payload), signature, stripe).id).toBe(
      "evt_fixture",
    );
    expect(() =>
      verifyWebhook(Buffer.from(payload + " "), signature, stripe),
    ).toThrow("signature");
    const live = JSON.stringify({ id: "evt_live", livemode: true });
    const validLive = stripe.webhooks.generateTestHeaderString({
      payload: live,
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });
    expect(() => verifyWebhook(Buffer.from(live), validLive, stripe)).toThrow(
      "Live events",
    );
  });
  it("maps lifecycle states conservatively", () => {
    for (const [status, expected] of [
      ["active", "active"],
      ["trialing", "pending"],
      ["incomplete", "pending"],
      ["past_due", "past_due"],
      ["unpaid", "past_due"],
      ["canceled", "cancelled"],
      ["incomplete_expired", "cancelled"],
    ] as const)
      expect(
        subscriptionState({
          status,
          pause_collection: null,
        } as Stripe.Subscription),
      ).toBe(expected);
  });
});
(db ? describe : describe.skip)(
  "test subscription transactions in PostgreSQL",
  () => {
    beforeAll(async () => {
      admin = postgres(process.env.COMPANY_TEST_ADMIN_URL!, { max: 2 });
      for (const a of [owner, other])
        await admin`insert into auth.users(id,email) values(${a.id},${a.email})`;
      org = (
        await createCompany(owner, {
          name: "Synthetic billing team",
          site: "S1",
          team: "T1",
          commandId: randomUUID(),
        })
      ).id;
      otherOrg = (
        await createCompany(other, {
          name: "Other billing team",
          site: "S2",
          team: "T2",
          commandId: randomUUID(),
        })
      ).id;
      customerOrg = org;
      process.env.STRIPE_TEAM_PRICE_ID = "price_team";
      createCustomer.mockImplementation(async () => ({
        id: "cus_" + org,
        livemode: false,
      }));
      createCheckout.mockImplementation(async () => ({
        id: "cs_" + org,
        url: "https://checkout.stripe.com/synthetic-test",
        livemode: false,
      }));
      createPortal.mockImplementation(async () => ({
        url: "https://billing.stripe.com/synthetic-test",
      }));
      client = {
        prices: {
          retrieve: async () => ({
            id: "price_team",
            livemode: false,
            active: true,
            unit_amount: 29900,
            currency: "usd",
            recurring: { interval: "month", interval_count: 1 },
          }),
        },
        customers: {
          create: createCustomer,
          retrieve: async () => ({
            id: "cus_" + org,
            livemode: false,
            metadata: { organization_id: customerOrg },
          }),
        },
        checkout: {
          sessions: {
            create: createCheckout,
            retrieve: async () => ({
              id: "cs_" + org,
              status: "open",
              url: "https://checkout.stripe.com/synthetic-test",
              livemode: false,
              customer: "cus_" + org,
            }),
          },
        },
        subscriptions: {
          list: async () => ({ data: subscriptions, has_more: false }),
          retrieve: async () => subscription(),
        },
        billingPortal: { sessions: { create: createPortal } },
      } as unknown as Stripe;
    }, 20000);
    afterAll(async () => {
      await admin?.end();
      await closeDatabase();
    });
    it("authorizes billing ownership, coalesces checkout races and replays without duplicate operations", async () => {
      await expect(
        checkout(other, org, randomUUID(), client),
      ).rejects.toThrow();
      const key = randomUUID();
      await Promise.all([
        checkout(owner, org, key, client),
        checkout(owner, org, randomUUID(), client),
      ]);
      expect(createCustomer).toHaveBeenCalledTimes(1);
      expect(createCheckout).toHaveBeenCalledTimes(1);
      await checkout(owner, org, key, client);
      expect(createCheckout).toHaveBeenCalledTimes(1);
      const [o] =
        await admin`select billing_state from company.organizations where id=${org}`;
      expect(o.billing_state).toBe("pending");
      const [untouched] =
        await admin`select billing_state from company.organizations where id=${otherOrg}`;
      expect(untouched.billing_state).toBe("evaluation");
    });
    it("never trusts checkout redirects and reconciles active state from owned current provider records", async () => {
      subscriptions = [subscription()];
      const result = await reconcile(owner, org, client);
      expect(result.state).toBe("active");
      await expect(checkout(owner, org, randomUUID(), client)).rejects.toThrow(
        "subscription already",
      );
      const id = randomUUID();
      await portal(owner, org, id, client);
      await portal(owner, org, id, client);
      expect(createPortal).toHaveBeenCalledTimes(1);
      expect(createPortal.mock.calls[0][0].customer).toBe("cus_" + org);
    });
    it("deduplicates events, resists out-of-order state, fails payment and preserves work in grace", async () => {
      const id = randomUUID();
      const row = await execute(owner, {
        version: 1,
        organizationId: org,
        commandId: id,
        correlationId: id,
        recordId: null,
        expectedRevision: 0,
        command: {
          type: "create_problem",
          data: {
            title: "Preserved work",
            whatHappened: "Synthetic billing lifecycle check",
            where: "S1",
            whatShouldHaveHappened: "",
            impact: "",
          },
        },
      });
      status = "past_due";
      subscriptions = [subscription()];
      expect(
        (
          (await webhook(
            event("evt_failed_" + org, "invoice.payment_failed"),
            client,
          )) as { state: string }
        ).state,
      ).toBe("past_due");
      const first =
        await admin`select grace_ends_at from company.organizations where id=${org}`;
      expect(
        (
          (await webhook(
            event("evt_failed_" + org, "invoice.payment_failed"),
            client,
          )) as { replayed: boolean }
        ).replayed,
      ).toBe(true);
      // Deliver an older paid event while the CURRENT subscription remains past due.
      expect(
        (
          (await webhook(
            event("evt_old_paid_" + org, "invoice.paid"),
            client,
          )) as { state: string }
        ).state,
      ).toBe("past_due");
      expect(
        (
          await admin`select grace_ends_at from company.organizations where id=${org}`
        )[0].grace_ends_at,
      ).toEqual(first[0].grace_ends_at);
      expect((await getRecord(owner, org, row.id)).id).toBe(row.id);
      await expect(
        execute(owner, {
          version: 1,
          organizationId: org,
          commandId: randomUUID(),
          correlationId: randomUUID(),
          recordId: row.id,
          expectedRevision: row.revision,
          command: {
            type: "add_lesson",
            lesson: "cannot write",
            relatedProcess: "",
          },
        }),
      ).rejects.toThrow("read-only");
      status = "canceled";
      subscriptions = [subscription()];
      expect((await reconcile(owner, org, client)).state).toBe("cancelled");
      await admin`update company.organizations set grace_ends_at=now()-interval '1 day' where id=${org}`;
      await expect(getRecord(owner, org, row.id)).rejects.toThrow();
      status = "active";
      subscriptions = [subscription()];
      expect((await reconcile(owner, org, client)).state).toBe("active");
      expect((await getRecord(owner, org, row.id)).id).toBe(row.id);
    });
    it("rejects customer ownership and plan mismatches without changing entitlements", async () => {
      customerOrg = otherOrg;
      await expect(reconcile(owner, org, client)).rejects.toThrow("ownership");
      customerOrg = org;
      subscriptionPrice = "price_attacker";
      subscriptions = [subscription()];
      await expect(reconcile(owner, org, client)).rejects.toThrow(
        "Unexpected plan",
      );
      subscriptionPrice = "price_team";
      subscriptions = [subscription()];
      expect(
        await webhook(
          event(
            "evt_unknown_" + org,
            "customer.subscription.updated",
            "cus_unmapped",
          ),
          client,
        ),
      ).toEqual({ ignored: true });
      await expect(
        admin.begin(async (sql) => {
          await sql`set local role authenticated`;
          await sql`select company.billing_owner(${"cus_" + org})`;
        }),
      ).rejects.toThrow();
    });
  },
);
