# LoopWorks analytics

This is the internal reference for how LoopWorks measures the website. The goal is not to collect as much data as possible. The goal is to answer:

1. Are the right people finding LoopWorks?
2. What are they interested in?
3. Are they moving toward a conversation?
4. Which channels and content produce qualified leads?
5. Where are visitors dropping out of the LoopScan funnel?

The business metric that matters most is not page views. It is:

**How many qualified manufacturing conversations did the website create?**

## Tools

| Tool | Purpose |
| --- | --- |
| [Vercel Web Analytics](https://vercel.com/docs/analytics) | Traffic, page views, and custom events |
| [Vercel Speed Insights](https://vercel.com/docs/speed-insights) | Core Web Vitals and performance |
| [Google Search Console](https://search.google.com/search-console) | Organic impressions, clicks, and queries |
| First-touch attribution in `lib/attribution.ts` | Stored with the lead, separate from analytics events |

Google Analytics is not installed. Add it later only if Vercel plus Search Console cannot answer an attribution question.

Vercel Analytics and Speed Insights are mounted once in `app/layout.tsx` via `components/SiteAnalytics.tsx`. They follow client-side navigation. Production traffic is tracked; local development logs to the console and does not pollute production data.

Enable **Web Analytics** and **Speed Insights** on the Vercel project after deploy. Page-view URLs are stripped of query strings before they are sent, so form data cannot leak through the address bar.

Custom events go through `lib/analytics.ts`. Do not call the Vercel `track()` helper from components.

## Primary funnel

Website visit
→ LoopScan CTA click
→ LoopScan page visit
→ Form start
→ Form submit
→ Schedule click
→ Discovery conversation *(manual)*
→ LoopScan sold *(manual)*

The website can measure everything through `schedule_click`. Conversation and closed-won stages are recorded by hand until a CRM is in place.

The longer commercial path is:

Website visitor → Lead → Conversation → LoopScan → LoopBuild → LoopOps

## Custom events

All events are categorical. Never send names, emails, company names, phone numbers, process descriptions, or other free-text form content.

### `loopscan_cta_click`

Fired when a visitor clicks a LoopScan call to action, including:

- Find Your First Loop
- Start a LoopScan
- Find My First Loop
- Tell Us About the Process
- Talk to Us / LoopScan nav and footer links

Allowed metadata:

- `location`: `hero`, `solutions`, `loopscan_section`, `footer`, `article`, `navigation`, `use_cases`, `final_cta`, `about`, `how_it_works`, `not_found`
- `page`: current pathname
- `cta_text`: button label only

### `loopscan_page_view`

Fired once when `/loopscan` is viewed. Vercel already records ordinary page views; this event exists for funnel segmentation.

Allowed metadata:

- `referring_page`: same-origin pathname, or a referrer category
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` from first-touch attribution

### `loopscan_form_start`

Fired on the first meaningful interaction with the LoopScan form. Once per page session.

No metadata.

### `loopscan_area_selected`

Fired when the visitor selects an operational area.

Allowed metadata:

- `area`: `procurement`, `supply_chain`, `operations`, `quality`, `engineering`, `planning`, `knowledge`, `other`

### `loopscan_form_submit`

Fired only after a successful submission.

Allowed metadata:

- `area` (same controlled values as above)
- first-touch UTM fields

### `loopscan_form_error`

Fired when submit fails because of an application or server error. Validation errors are not tracked.

Allowed metadata:

- `error_category`: `server` or `network`
- `page`: `/loopscan`
- `area` if already selected

Do not send raw error messages.

### `schedule_click`

Fired when the visitor clicks the post-submit scheduling link.

Allowed metadata:

- `source`: `loopscan_confirmation`
- `utm_source`
- `utm_campaign`

### `solution_interest`

Fired when a visitor clicks into a main solution area.

Allowed metadata:

- `solution`: `supply_chain`, `procurement`, `manufacturing`, `knowledge`
- `page`
- `interaction_type`: `card_click`, `learn_more`, `cta_click`

### `insight_view`

Fired when an Insights article is viewed.

Allowed metadata:

- `article_slug`
- `article_category`
- `referring_source` (`linkedin`, `google`, `direct`, `referral`, `email`, `other`)

### `insight_cta_click`

Fired when an Insights article CTA leads to `/loopscan`.

Allowed metadata:

- `article_slug`
- `page`
- `cta_text`

## Privacy

Never send to analytics:

- name
- email
- company name
- phone number
- free-text form content
- confidential manufacturing information
- process descriptions
- raw error messages
- full URLs with query strings that may contain personal data

UTM values are limited to short `a-zA-Z0-9._-` tokens. Referrers are stored as origin + pathname, with the query string removed. Landing pages are pathnames only.

## UTM conventions

Capture on first arrival and keep for 30 days. Do not overwrite first-touch attribution during the same journey.

| Parameter | Role |
| --- | --- |
| `utm_source` | Where the visitor came from |
| `utm_medium` | The channel type |
| `utm_campaign` | The specific effort |
| `utm_content` | Optional creative or placement |
| `utm_term` | Optional paid or search term |

### Sources

`linkedin` · `email` · `referral` · `partner` · `event` · `association` · `organic` · `direct` · `x` · `nostr`

### Mediums

`social` · `email` · `referral` · `organic` · `event` · `direct`

### Examples

```
https://loopworks.xyz/insights/ai-is-not-your-manufacturing-strategy?utm_source=linkedin&utm_medium=social&utm_campaign=ai_strategy

https://loopworks.xyz/loopscan?utm_source=email&utm_medium=email&utm_campaign=procurement_follow_up

https://loopworks.xyz/?utm_source=linkedin&utm_medium=social&utm_campaign=procurement_ai
```

## Lead attribution

Analytics events and lead records are separate. When the LoopScan form succeeds, the server stores:

- `landingPage` (first-touch pathname)
- `referringSource` (normalized category)
- `referrer` (origin + path, no query string)
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `firstVisitAt`

This is how LoopWorks answers: **Where did this lead come from?**

## Weekly review

Do not build a custom dashboard until traffic is large enough to need one. Use Vercel Analytics, Search Console, and the lead list.

### Traffic

How many relevant visitors came?

### Source

Where did they come from?

### Interest

Which solutions and articles did they engage with?

### Intent

How many clicked LoopScan?

### Conversion

How many submitted?

### Conversation

How many became real conversations?

Avoid optimizing vanity metrics until there is enough traffic to learn from.

## Funnel rates

| Rate | Formula |
| --- | --- |
| CTA click rate | LoopScan CTA clicks / relevant website visits |
| Form start rate | Form starts / LoopScan page views |
| Form completion rate | Successful submissions / form starts |
| Schedule rate | Schedule clicks / successful submissions |

Drop-off between these steps is the LoopScan funnel diagnosis.

## KPI framework

### Awareness

- Unique visitors
- Traffic source
- Landing pages
- Organic search impressions *(Search Console)*
- Organic clicks *(Search Console)*

### Engagement

- Solution interactions
- Insight article views
- Average engaged visit
- LoopScan CTA clicks

### Conversion

- LoopScan page views
- Form starts
- Form submissions
- Schedule clicks

## Manual business outcomes

Record these by hand for now, in a spreadsheet or CRM:

| Date | Company | Source / campaign | Discovery conversation held | Qualified opportunity | LoopScan proposal sent | LoopScan sold | LoopBuild sold | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |

Do not automate this until the volume of conversations makes it worth the complexity.

## Search Console

When `loopworks.xyz` is live:

1. Set `NEXT_PUBLIC_SITE_URL=https://loopworks.xyz`
2. Add the site in Google Search Console
3. Paste the verification token into `NEXT_PUBLIC_GSC_VERIFICATION`
4. Submit `https://loopworks.xyz/sitemap.xml`

The sitemap includes `/`, `/solutions`, `/how-it-works`, `/about`, `/insights`, `/loopscan`, and individual insight pages. API routes are disallowed in `robots.txt`.

Once Search Console has data, watch impressions and clicks around:

- AI for manufacturing
- manufacturing automation
- AI procurement
- supply chain AI
- manufacturing process improvement
- AI manufacturing consulting
- manufacturing knowledge management
- manufacturing ERP automation
- procurement automation
- manufacturing AI implementation

Use that data to choose future Insights topics. Do not keyword-stuff the website.

## Implementation map

| Concern | Location |
| --- | --- |
| Event helpers | `lib/analytics.ts` |
| First-touch UTMs and referrers | `lib/attribution.ts` |
| Lead payload sanitization | `lib/leads.ts` |
| Analytics + Speed Insights | `app/layout.tsx` |
| Public URL / canonicals | `lib/site.ts`, page metadata, `app/sitemap.ts`, `app/robots.ts` |
