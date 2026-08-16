"use client";

import Cal, { getCalApi, type EmbedEvent } from "@calcom/embed-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  trackLoopScanBookingStart,
  trackLoopScanBookingSuccess,
  trackLoopScanBookingView,
  trackScheduleClick,
} from "@/lib/analytics";
import {
  CAL_BOOKED_EVENT,
  CAL_PREFILL_EVENT,
  calUiConfig,
  formatBookingTime,
  parseCalBookingUrl,
  toBookingIntent,
  type CalBookedDetail,
  type CalBookingPrefill,
} from "@/lib/cal";
import { company } from "@/lib/company";
import { cta, loopScanFitCheck, type LoopScanIntent } from "@/lib/content";

type LoadState = "loading" | "ready" | "failed";

type CalBookingProps = {
  bookingUrl: string;
  namespace: string;
  name?: string;
  email?: string;
  intent?: LoopScanIntent;
  intakeSubmitted?: boolean;
  heading?: string;
};

function emptySubscribe() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function parsePrefillEvent(event: Event): CalBookingPrefill | null {
  const detail = (event as CustomEvent<CalBookingPrefill>).detail;
  if (!detail || (detail.intent !== "book" && detail.intent !== "talk")) {
    return null;
  }
  return detail;
}

export function CalBooking({
  bookingUrl,
  namespace,
  name,
  email,
  intent = "talk",
  intakeSubmitted = false,
  heading,
}: CalBookingProps) {
  const isClient = useIsClient();
  const target = useMemo(() => parseCalBookingUrl(bookingUrl), [bookingUrl]);
  const [inView, setInView] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>(target ? "loading" : "failed");
  const [slowLoad, setSlowLoad] = useState(false);
  const [overlay, setOverlay] = useState<Partial<CalBookingPrefill>>({});
  const [bookedAt, setBookedAt] = useState<string | undefined>();
  const rootRef = useRef<HTMLDivElement>(null);
  const viewTracked = useRef(false);
  const startTracked = useRef(false);
  const loadStateRef = useRef<LoadState>(target ? "loading" : "failed");

  const prefill: CalBookingPrefill = {
    name: overlay.name ?? name,
    email: overlay.email ?? email,
    intent: overlay.intent ?? intent,
    intakeSubmitted: overlay.intakeSubmitted ?? intakeSubmitted,
  };
  const bookingIntent = toBookingIntent(prefill.intent);
  const guestName = prefill.name?.trim() ?? "";
  const guestEmail = prefill.email?.trim() ?? "";
  const analyticsMeta = useMemo(
    () => ({
      source: "loopscan" as const,
      intent: bookingIntent,
      intake_submitted: prefill.intakeSubmitted,
    }),
    [bookingIntent, prefill.intakeSubmitted],
  );
  const config = useMemo(
    () => ({
      layout: "month_view" as const,
      theme: "light" as const,
      ...(guestName ? { name: guestName } : {}),
      ...(guestEmail ? { email: guestEmail } : {}),
      "metadata[source]": "loopscan",
      "metadata[intent]": bookingIntent,
      iframeAttrs: {
        title: "Schedule a 30-minute LoopScan fit check",
      },
    }),
    [guestName, guestEmail, bookingIntent],
  );

  useEffect(() => {
    function onPrefill(event: Event) {
      const next = parsePrefillEvent(event);
      if (!next) return;
      setOverlay((current) => ({
        ...current,
        ...next,
        name: next.name?.trim() || current.name,
        email: next.email?.trim() || current.email,
      }));
    }

    function onBooked(event: Event) {
      const detail = (event as CustomEvent<CalBookedDetail>).detail;
      setBookedAt(formatBookingTime(detail?.startTime) ?? "");
    }

    window.addEventListener(CAL_PREFILL_EVENT, onPrefill);
    window.addEventListener(CAL_BOOKED_EVENT, onBooked);
    return () => {
      window.removeEventListener(CAL_PREFILL_EVENT, onPrefill);
      window.removeEventListener(CAL_BOOKED_EVENT, onBooked);
    };
  }, []);

  useEffect(() => {
    if (!isClient || bookedAt !== undefined) return;
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        if (viewTracked.current || !target) return;
        viewTracked.current = true;
        trackLoopScanBookingView(analyticsMeta);
      },
      { threshold: 0.2, rootMargin: "240px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isClient, bookedAt, target, analyticsMeta]);

  useEffect(() => {
    if (!isClient || !inView || !target || bookedAt !== undefined) return;
    let cancelled = false;

    const onReady = () => {
      if (cancelled) return;
      loadStateRef.current = "ready";
      setLoadState("ready");
      setSlowLoad(false);
    };
    const onFailed = () => {
      if (cancelled) return;
      loadStateRef.current = "failed";
      setLoadState("failed");
    };
    const onStart = () => {
      if (cancelled || startTracked.current) return;
      startTracked.current = true;
      trackLoopScanBookingStart(analyticsMeta);
    };
    const onSuccess = (event: EmbedEvent<"bookingSuccessfulV2">) => {
      if (cancelled) return;
      const startTime = event.detail.data.startTime;
      setBookedAt(formatBookingTime(startTime) ?? "");
      trackLoopScanBookingSuccess(analyticsMeta);
      window.dispatchEvent(
        new CustomEvent<CalBookedDetail>(CAL_BOOKED_EVENT, {
          detail: { startTime },
        }),
      );
    };

    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      if (loadStateRef.current === "loading") setSlowLoad(true);
    }, 20000);

    void (async () => {
      const cal = await getCalApi({ namespace });
      if (cancelled) return;
      cal("ui", calUiConfig);
      cal("on", { action: "linkReady", callback: onReady });
      cal("on", { action: "linkFailed", callback: onFailed });
      cal("on", { action: "navigatedToBooker", callback: onStart });
      cal("on", { action: "bookingSuccessfulV2", callback: onSuccess });
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      void getCalApi({ namespace }).then((cal) => {
        cal("off", { action: "linkReady", callback: onReady });
        cal("off", { action: "linkFailed", callback: onFailed });
        cal("off", { action: "navigatedToBooker", callback: onStart });
        cal("off", { action: "bookingSuccessfulV2", callback: onSuccess });
      });
    };
  }, [isClient, inView, namespace, target, bookedAt, analyticsMeta]);

  if (bookedAt !== undefined) {
    return (
      <div className="border border-line bg-paper px-6 py-10 md:px-8 md:py-12" aria-live="polite">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">
          Fit check
        </p>
        <h3 className="mt-4 text-3xl font-medium tracking-tight text-ink">
          {loopScanFitCheck.bookedHeadline}
        </h3>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-graphite">
          {loopScanFitCheck.bookedBody}
        </p>
        {bookedAt ? (
          <p className="mt-6 text-[16px] font-medium leading-7 text-ink">{bookedAt}</p>
        ) : null}
        <p className="mt-3 text-[15px] leading-7 text-graphite">
          {loopScanFitCheck.calendarInvite}
        </p>
        <a
          href={cta.seeDemos.href}
          className="mt-8 inline-flex text-[14px] font-medium tracking-[0.02em] text-copper hover:text-copper-dark"
        >
          {cta.seeDemos.label} →
        </a>
      </div>
    );
  }

  const fallback = (
    <div className="border border-line bg-paper px-5 py-5">
      <p className="text-[15px] font-medium text-ink">
        {loopScanFitCheck.fallbackHeadline}
      </p>
      {target ? (
        <a
          href={target.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackScheduleClick({ source: "loopscan_embed_fallback" })}
          className="mt-3 inline-flex text-[14px] font-medium text-copper hover:text-copper-dark"
        >
          {loopScanFitCheck.fallbackCta}
        </a>
      ) : (
        <p className="mt-3 text-sm leading-6 text-graphite">
          Email {company.contactEmail} and we will set up a time.
        </p>
      )}
    </div>
  );

  return (
    <div ref={rootRef} className="min-w-0">
      {heading ? (
        <h3 className="mb-5 text-lg font-medium tracking-tight text-ink">{heading}</h3>
      ) : null}
      {!target ? (
        fallback
      ) : !isClient || !inView ? (
        <div
          className="min-h-[720px] w-full border border-line bg-paper md:min-h-[640px]"
          aria-hidden
        />
      ) : loadState === "failed" ? (
        fallback
      ) : (
        <div className="w-full min-w-0 overflow-x-hidden">
          <Cal
            key={`${namespace}-${guestName}-${guestEmail}-${bookingIntent}`}
            namespace={namespace}
            calLink={target.calLink}
            calOrigin={target.origin}
            config={config}
            className="w-full min-h-[720px] md:min-h-[640px]"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
          />
          {slowLoad ? <div className="mt-4">{fallback}</div> : null}
        </div>
      )}
    </div>
  );
}
