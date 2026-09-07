import { describe, expect, it } from "vitest";
import { filterAnalyticsEvent } from "../analytics-url";
import { siteUrl } from "../site";

const pageUrl = new URL("/workspace", siteUrl).href;

describe("analytics privacy boundary", () => {
  it.each([
    new URL("/pilot?email=synthetic#form", siteUrl).href,
    "/pilot?email=synthetic#form",
    "pilot?email=synthetic#form",
  ])(
    "accepts public absolute and relative URLs without query data: %s",
    (url) => {
      const event = { type: "pageview", url };
      expect(filterAnalyticsEvent(event, pageUrl)).toEqual({
        type: "pageview",
        url: new URL("/pilot", siteUrl).href,
      });
      expect(event.url).toBe(url);
    },
  );

  it.each([
    new URL("/company?organizationId=private", siteUrl).href,
    "/company?recordId=private",
    "company?recordId=private",
    "/company/investigation#private",
  ])(
    "drops a private event even after navigation to a public page: %s",
    (url) => {
      expect(filterAnalyticsEvent({ type: "vital", url }, pageUrl)).toBeNull();
    },
  );

  it("drops queued public events while the current page is private", () => {
    expect(
      filterAnalyticsEvent(
        { type: "event", url: "/workspace" },
        new URL("/company?organizationId=private", siteUrl).href,
      ),
    ).toBeNull();
  });

  it.each([
    "http://[",
    "//[",
    "javascript:alert(1)",
    "data:text/plain,private",
  ])("drops malformed or non-web URLs without throwing: %s", (url) => {
    expect(filterAnalyticsEvent({ type: "pageview", url }, pageUrl)).toBeNull();
  });

  it("drops events when their page context cannot be parsed", () => {
    expect(filterAnalyticsEvent({ url: "/workspace" }, "http://[")).toBeNull();
  });
});
