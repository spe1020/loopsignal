# LoopSignal analytics

This is the internal reference for how LoopSignal measures the website. The goal is not to collect as much data as possible. The goal is to answer:

1. Are the right people finding LoopSignal?
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
→ Booking view
→ Booking start
→ Booking success
→ Discovery conversation *(manual)*
→ LoopScan sold *(manual)*

The website can measure everything through `loopscan_booking_success`. Conversation and closed-won stages are recorded by hand until a CRM is in place.

The longer commercial path is:

Website visitor → Lead → Conversation → LoopScan → LoopBuild

## Custom events

All events are categorical. Never send names, emails, company names, phone numbers, process descriptions, or other free-text form content.

### `loopscan_cta_click`

Fired when a visitor clicks a LoopScan call to action. Labels in use:

- Fit check (navigation)
- Book a 30-minute fit check (homepage)
- Start a LoopScan (ready buyer, `/loopscan`)
- Talk Through a Process (`/loopscan` and other pages)
- Learn About LoopScan

Secondary demo label: "See the Demos" → `/demo`.

Allowed metadata:

- `location`: `hero`, `solutions`, `loopscan_section`, `footer`, `article`, `navigation`, `use_cases`, `final_cta`, `about`, `how_it_works`, `not_found`, `signal`, `loopknow`, `loopsource`, `loopbrief`, `demo`
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

### `loopscan_booking_view`

Fired when the Cal.com fit-check embed becomes visible. Once per page session.

Allowed metadata:

- `source`: `loopscan`
- `intent`: `discuss_loopscan` or `talk_process`
- `intake_submitted`: `true` if the LoopScan form succeeded first, otherwise `false`

Do not send name, email, company, process description, or booking notes.

### `loopscan_booking_start`

Fired when the visitor begins interacting with the booking flow (`navigatedToBooker`). Once per page session.

Allowed metadata: same as `loopscan_booking_view`.

### `loopscan_booking_success`

Fired after Cal.com confirms a booking (`bookingSuccessfulV2`). Once per page session.

Allowed metadata: same as `loopscan_booking_view`.

Do not send the raw booking payload, attendee fields, or calendar notes.

### `schedule_click`

Fired when the visitor opens the external Cal.com page from the embed fallback.

Allowed metadata:

- `source`: `loopscan_embed_fallback` or `loopscan_confirmation`
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
- `article_category` (controlled, e.g. `manufacturing_ai`)
- `referring_source` (`linkedin`, `google`, `direct`, `referral`, `email`, `other`)

### `insight_cta_click`

Fired when an Insights article CTA leads to `/loopscan`.

Allowed metadata:

- `article_slug`
- `page`
- `cta_text`
- `destination` (`loopscan`)

### `loopknow_page_view`

Fired once when `/know` is viewed.

Allowed metadata:

- `referring_page`

### `loopknow_sample_question`

Fired when a visitor clicks a prepared sample question.

Allowed metadata:

- `question_category`: `torque`, `revision`, `quality_history`, `maintenance`, `material`, `inspection`, `multiple_sources`, `no_answer`, `surface_finish`, `packaging`, `go_nogo`, `general`

Do not send the question text.

### `loopknow_search`

Fired when the document library search is used (query length of two or more characters).

Allowed metadata:

- `result_count`
- `document_filter`: `all`, `work_instructions`, `specifications`, `quality`, `maintenance`, `engineering`, `standard_work`

Do not send the search text or document content.

### `loopknow_document_view`

Fired when a visitor opens a document from the library, a citation, or an action.

Allowed metadata:

- `document_type`: `work_instruction`, `specification`, `quality`, `maintenance`, `engineering`, `standard_work`

### `loopknow_answer_generated`

Fired when LoopKnow returns a sourced or limited answer.

Allowed metadata:

- `question_category`
- `answer_state`: `answered`, `revision_change`, `quality_history`, `limited`
- `source_count`
- `document_type` of the primary source, when present

Do not send the free-text question or document excerpts.

### `loopknow_no_answer`

Fired when LoopKnow cannot verify an answer from the sample library.

Allowed metadata:

- `question_category`
- `answer_state`: `no_answer`

### `loopknow_loopscan_click`

Fired when a LoopKnow CTA leads to `/loopscan`.

Allowed metadata:

- `page`: `/know`
- `cta_text`
- `destination`: `loopscan`

### `loopsource_page_view`

Fired once when `/source` is viewed.

Allowed metadata:

- `referring_page`

### `loopsource_sample_run`

Fired when the fictional sample RFQ is loaded or reset.

Allowed metadata:

- `sample_scenario` (`machined_aluminum_bracket`)
- `optimization_mode` (`balanced`, `cost`, `lead_time`, `risk`, `startup_flexibility`)
- `demand_bucket` (`5000`, `12000`, `25000`, `50000`)
- `source_mode` (`single`, `dual`)

Do not send supplier names or cost values.

### `loopsource_supplier_select`

Fired when a visitor selects a supplier card or table row.

Allowed metadata:

- `sample_scenario`
- `optimization_mode`
- `demand_bucket`
- `source_mode`
- `selected_supplier_rank`

Do not send supplier names.

### `loopsource_priority_change`

Fired when the visitor changes the Optimize for setting.

Allowed metadata:

- `sample_scenario`
- `optimization_mode`
- `demand_bucket`
- `source_mode`

### `loopsource_volume_change`

Fired when the visitor changes annual demand.

Allowed metadata:

- `sample_scenario`
- `optimization_mode`
- `demand_bucket`
- `source_mode`

### `loopsource_dual_source_toggle`

Fired when the visitor switches between single-source and dual-source mode.

Allowed metadata:

- `sample_scenario`
- `optimization_mode`
- `demand_bucket`
- `source_mode`

### `loopsource_loopscan_click`

Fired when a LoopSource CTA leads to `/loopscan`.

Allowed metadata:

- `page`: `/source`
- `cta_text`
- `destination`: `loopscan`

### `loopbrief_page_view`

Fired once when `/brief` is viewed.

Allowed metadata:

- `referring_page`

### `loopbrief_run`

Fired when the fictional daily brief is generated from sample data.

Allowed metadata:

- `sample_scenario` (`northfield_day_shift`)

Do not send plant, supplier, product, or issue text.

### `loopbrief_category_filter`

Fired when a visitor filters the brief by executive-strip category.

Allowed metadata:

- `sample_scenario`
- `category` (`all`, `production`, `quality`, `supply`, `maintenance`, `schedule`)

### `loopbrief_owner_filter`

Fired when a visitor filters by functional owner.

Allowed metadata:

- `sample_scenario`
- `owner` (`all`, `Operations`, `Supply Chain`, `Buyer`, `Quality`, `Maintenance`, `Planning`, `Engineering`)

### `loopbrief_issue_select`

Fired when a visitor selects a work center, issue, or priority.

Allowed metadata:

- `sample_scenario`
- `category`
- `severity` (`red`, `amber`, `green`, `blue`)

Do not send issue titles, product families, or supplier names.

### `loopbrief_meeting_mode`

Fired when Meeting Mode is toggled.

Allowed metadata:

- `sample_scenario`
- `meeting_mode` (boolean)

### `loopbrief_action_status_change`

Fired when an action-board status is changed locally.

Allowed metadata:

- `sample_scenario`
- `action_timing` (`now`, `before_next_shift`, `today`, `this_week`, `longer_term`)
- `owner` (controlled owner values only)

Do not send the action text.

### `loopbrief_copy`

Fired when the visitor copies the daily brief.

Allowed metadata:

- `sample_scenario`

Do not send the copied brief text.

### `loopbrief_loopscan_click`

Fired when a LoopBrief CTA leads to `/loopscan`.

Allowed metadata:

- `page`: `/brief`
- `cta_text`
- `destination`: `loopscan`

### `loopbrief_report_view`

Fired when a LoopBrief report is opened.

Allowed metadata:

- `sample_scenario`
- `report_kind` (`executive`, `operations`, `supply_chain`, `procurement`, `quality`, `maintenance`, `planning`, `engineering`, `open_actions`)

### `loopbrief_report_copy`

Fired when a report is copied.

Allowed metadata:

- `sample_scenario`
- `report_kind`

Do not send report text.

### `loopbrief_email_preview`

Fired when the executive email preview is opened or copied.

Allowed metadata:

- `sample_scenario`

Do not send subject, body, or recipient addresses.

### `loopbrief_persona_view`

Fired when My Actions persona is changed.

Allowed metadata:

- `sample_scenario`
- `persona` (`plant_manager`, `buyer`, `planner`, `quality_engineer`, `maintenance_lead`, `operations_supervisor`)

### `loopbrief_assign`

Fired when an action is assigned to a human or Demo Bot.

Allowed metadata:

- `sample_scenario`
- `owner_type` (`human`, `bot`)
- `bot_type` (`supplier_follow_up`, `reporting`, `knowledge`, `sourcing`, `monitoring`)

Do not send role names from free text.

### `loopbrief_bot_run`

Fired when a Demo Bot simulation is run.

Allowed metadata:

- `sample_scenario`
- `bot_type`

### `loopbrief_action_select`

Fired when an action is opened.

Allowed metadata:

- `sample_scenario`
- `category`

### `loopbrief_outcome`

Fired when a completed action outcome is selected.

Allowed metadata:

- `sample_scenario`
- `outcome` (`resolved`, `monitoring`, `escalated`, `permanent_action_required`, `no_issue_found`)

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
https://www.loopsignal.co/insights/ai-is-not-your-manufacturing-strategy?utm_source=linkedin&utm_medium=social&utm_campaign=ai_strategy

https://www.loopsignal.co/loopscan?utm_source=email&utm_medium=email&utm_campaign=procurement_follow_up

https://www.loopsignal.co/?utm_source=linkedin&utm_medium=social&utm_campaign=procurement_ai
```

## Lead attribution

Analytics events and lead records are separate. When the LoopScan form succeeds, the server stores:

- `landingPage` (first-touch pathname)
- `referringSource` (normalized category)
- `referrer` (origin + path, no query string)
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `firstVisitAt`

This is how LoopSignal answers: **Where did this lead come from?**

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
| Booking view rate | Booking views / LoopScan page views |
| Booking start rate | Booking starts / booking views |
| Booking success rate | Confirmed bookings / booking starts |

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
- Booking views
- Booking starts
- Confirmed bookings

## Manual business outcomes

Record these by hand for now, in a spreadsheet or CRM:

| Date | Company | Source / campaign | Discovery conversation held | Qualified opportunity | LoopScan proposal sent | LoopScan sold | LoopBuild sold | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |

Do not automate this until the volume of conversations makes it worth the complexity.

## Search Console

When the production domain is live:

1. Set `NEXT_PUBLIC_SITE_URL` to the canonical URL (see `.env.example`)
2. Add the site in Google Search Console
3. Paste the verification token into `NEXT_PUBLIC_GSC_VERIFICATION`
4. Submit `{NEXT_PUBLIC_SITE_URL}/sitemap.xml`

The sitemap includes `/`, `/solutions`, `/how-it-works`, `/about`, `/insights`, `/loopscan`, `/supply`, `/know`, `/source`, `/brief`, `/demo`, and individual insight pages. `/signal` permanently redirects to `/supply`. API routes are disallowed in `robots.txt`.

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
