export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "ul"; items: string[] };

export type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  dek: string;
  excerpt?: string;
  blocks: ArticleBlock[];
  author?: string;
  kicker?: string;
  seoTitle?: string;
  seoDescription?: string;
  relatedSlugs?: string[];
};

export function formatArticleDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function articleAnalyticsCategory(article: Article) {
  return article.category
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function getRelatedArticles(article: Article, limit = 3) {
  const preferred = (article.relatedSlugs ?? [])
    .map((slug) => getArticle(slug))
    .filter((item): item is Article => Boolean(item));

  const rest = articles.filter(
    (item) =>
      item.slug !== article.slug &&
      !preferred.some((related) => related.slug === item.slug),
  );

  return [...preferred, ...rest].slice(0, limit);
}

export const articles: Article[] = [
  {
    slug: "ai-is-not-your-manufacturing-strategy",
    title: "AI Is Not Your Manufacturing Strategy",
    category: "Manufacturing AI",
    kicker: "Manufacturing AI / Operations",
    author: "Seth Sager",
    date: "2026-08-12",
    readTime: "8 min",
    dek: "Manufacturers should not start by asking where they can use AI. Start with the work, find the friction, and improve the process first.",
    excerpt:
      "Manufacturers do not need to start with an AI strategy. Start with the work, find the friction, and improve the process first.",
    seoTitle: "AI Is Not Your Manufacturing Strategy | LoopSignal",
    seoDescription:
      "Manufacturers should not start by asking where to use AI. Start with the work, find operational friction, simplify the process, and then decide where AI or automation creates value.",
    relatedSlugs: [
      "why-manufacturers-should-not-automate-waste",
      "what-ai-can-actually-do-for-procurement",
    ],
    blocks: [
      {
        type: "p",
        text: "Manufacturers are being told they need an AI strategy.",
      },
      {
        type: "p",
        text: "I think that starts in the wrong place.",
      },
      {
        type: "p",
        text: "AI is moving quickly. New tools appear every week. Vendors are promising automation, agents, copilots, digital workers, and smarter factories.",
      },
      {
        type: "p",
        text: "Some of it is useful.",
      },
      {
        type: "p",
        text: "Some of it is noise.",
      },
      {
        type: "p",
        text: "But the real question for a manufacturer is not “Where can we use AI?”",
      },
      {
        type: "quote",
        text: "Where is the work harder than it should be?",
      },
      {
        type: "p",
        text: "That is a very different starting point.",
      },
      {
        type: "h2",
        text: "Start with the work",
      },
      {
        type: "p",
        text: "Walk through almost any manufacturing organization and you will find capable people compensating for imperfect systems.",
      },
      {
        type: "p",
        text: "A buyer spends Friday afternoon chasing late purchase orders.",
      },
      {
        type: "p",
        text: "A planner pulls information from several reports and rebuilds it in Excel.",
      },
      {
        type: "p",
        text: "Quality searches through years of corrective actions trying to determine whether a problem has happened before.",
      },
      {
        type: "p",
        text: "An engineer knows a specification exists somewhere, but not where.",
      },
      {
        type: "p",
        text: "A production manager manually assembles the same operating report every morning.",
      },
      {
        type: "p",
        text: "A critical process depends on one experienced employee who knows how everything really works.",
      },
      {
        type: "p",
        text: "None of these problems begin as AI problems.",
      },
      {
        type: "p",
        text: "They are work problems.",
      },
      {
        type: "p",
        text: "They involve friction, missing connections, repetitive tasks, information that is difficult to access, and decisions that happen later than they should.",
      },
      {
        type: "p",
        text: "That is where AI becomes interesting.",
      },
      {
        type: "h2",
        text: "Don't automate waste",
      },
      {
        type: "p",
        text: "Manufacturing already has a framework for thinking about this.",
      },
      {
        type: "p",
        text: "Lean taught us to look for waste. Kaizen taught us that improvement is continuous. The gemba taught us that if we want to understand the work, we need to go see the work.",
      },
      {
        type: "p",
        text: "Those principles do not disappear because AI exists. In fact, they become more important.",
      },
      {
        type: "p",
        text: "A bad process does not become a good process because an AI agent is running it.",
      },
      {
        type: "p",
        text: "You can automate unnecessary approvals. You can automate duplicate reporting. You can automate a workflow nobody should be doing in the first place.",
      },
      {
        type: "quote",
        text: "Do not automate waste.",
      },
      {
        type: "p",
        text: "You will simply create waste faster.",
      },
      {
        type: "p",
        text: "The sequence matters.",
      },
      {
        type: "ul",
        items: [
          "Understand the process.",
          "Find the friction.",
          "Simplify the work.",
          "Then decide what should be automated.",
        ],
      },
      {
        type: "p",
        text: "Sometimes AI will be the right answer. Sometimes traditional automation will be enough. Sometimes the right solution will be changing the process and writing no software at all.",
      },
      {
        type: "p",
        text: "That is still a successful outcome.",
      },
      {
        type: "h2",
        text: "The information usually already exists",
      },
      {
        type: "p",
        text: "One of the most interesting things about manufacturing is how much useful information already exists inside the organization.",
      },
      {
        type: "p",
        text: "It lives in ERP systems, email, spreadsheets, quality records, supplier correspondence, specifications, shared drives, production reports, maintenance records, and people’s heads.",
      },
      {
        type: "p",
        text: "The challenge is often not generating more information. The challenge is connecting what already exists.",
      },
      {
        type: "p",
        text: "A buyer does not necessarily need another dashboard. They may need the system to recognize that a purchase order is late, understand the supplier’s previous communication, identify whether the material is becoming a production risk, and tell them where their attention is actually needed.",
      },
      {
        type: "p",
        text: "A quality engineer may not need another quality system. They may need to ask: Have we seen this defect before? What happened? What corrective action did we take? Did it work?",
      },
      {
        type: "p",
        text: "A plant manager may not need another report. They may need the important exceptions from five different systems surfaced before the morning meeting.",
      },
      {
        type: "p",
        text: "That is where modern AI can become powerful. Not as another destination employees have to visit. As an intelligent layer connecting information to the work.",
      },
      {
        type: "h2",
        text: "The goal is not a factory without people",
      },
      {
        type: "p",
        text: "There is a tendency to frame AI primarily around eliminating labor. That misses a much larger opportunity.",
      },
      {
        type: "p",
        text: "The most valuable manufacturing systems may be the ones that make experienced people dramatically more effective.",
      },
      {
        type: "p",
        text: "Take the buyer who spends hours chasing suppliers. The valuable part of their job is not writing “Can you provide an updated ship date?” for the twentieth time that week.",
      },
      {
        type: "p",
        text: "Their value is understanding which supplier represents a real risk, when to escalate, when to push, when to find another source, and how one late material affects the larger operation.",
      },
      {
        type: "quote",
        text: "AI can do more of the gathering. The person can do more of the judgment.",
      },
      {
        type: "p",
        text: "The same pattern exists in planning, engineering, quality, maintenance, and operations.",
      },
      {
        type: "p",
        text: "The goal should not be removing people from every loop. It should be designing better loops between people, information, decisions, and action.",
      },
      {
        type: "h2",
        text: "Keep humans where judgment matters",
      },
      {
        type: "p",
        text: "Not every decision should be automated.",
      },
      {
        type: "p",
        text: "A system may be capable of drafting supplier communication without being authorized to commit money. It may identify a potential quality issue without deciding whether production should stop. It may recommend a sourcing decision without selecting the supplier. It may identify inventory risk without changing the production schedule.",
      },
      {
        type: "p",
        text: "These boundaries matter.",
      },
      {
        type: "p",
        text: "A good AI implementation defines what the system can observe, what it can recommend, what it can execute, what requires human approval, and what it should never do.",
      },
      {
        type: "p",
        text: "That is not a limitation. It is good system design.",
      },
      {
        type: "h2",
        text: "Find the first loop",
      },
      {
        type: "p",
        text: "If I were sitting with a manufacturing leadership team exploring AI, I would not begin with a presentation about large language models.",
      },
      {
        type: "p",
        text: "I would ask:",
      },
      {
        type: "ul",
        items: [
          "Where are people repeatedly searching for information?",
          "What report does someone manually build every day?",
          "What process generates the most unnecessary email?",
          "Where are teams entering the same information more than once?",
          "What recurring problem always seems to surprise you?",
          "What decision happens later than it should?",
          "Where does critical knowledge depend on one person?",
          "What process does your team hate doing?",
        ],
      },
      {
        type: "p",
        text: "There is usually an answer. That is the place to begin.",
      },
      {
        type: "p",
        text: "Take one workflow. Understand it. Measure the current state. Improve it. Build something small. Measure the result. Learn. Then repeat.",
      },
      {
        type: "p",
        text: "That approach may not sound as exciting as an enterprise AI transformation. It is probably much more useful.",
      },
      {
        type: "h2",
        text: "Better operations are the strategy",
      },
      {
        type: "p",
        text: "AI will become increasingly embedded in manufacturing. But manufacturers do not need AI for the sake of having AI.",
      },
      {
        type: "p",
        text: "They need better flow, better visibility, better decisions, less repetitive work, less time searching, fewer surprises, more resilient supply chains, more accessible knowledge, and better systems.",
      },
      {
        type: "p",
        text: "AI can help create those outcomes.",
      },
      {
        type: "quote",
        text: "Better operations are the strategy.",
      },
      {
        type: "p",
        text: "And the best place to start may be much simpler than most companies think.",
      },
      {
        type: "quote",
        text: "Show me the process your team hates doing.",
      },
      {
        type: "p",
        text: "There is probably a better loop hiding inside it.",
      },
    ],
  },
  {
    slug: "why-manufacturers-should-not-automate-waste",
    title: "Why Manufacturers Should Not Automate Waste",
    category: "Process improvement",
    date: "2026-07-14",
    readTime: "6 min",
    dek: "If a process is slow because it has extra steps, automating it only makes the extra steps happen faster. That is not improvement.",
    blocks: [
      {
        type: "p",
        text: "Lean taught this decades ago. The principle has not changed because the tools have.",
      },
      {
        type: "p",
        text: "Before you connect a workflow to a model, a bot, or an integration, walk the process. Ask what would happen if a step disappeared. Ask who actually uses the output. Ask where the delay really is.",
      },
      {
        type: "p",
        text: "Often the delay is not computation. It is a handoff. A missing owner. A decision that no one is authorized to make. A spreadsheet that exists because two systems do not agree.",
      },
      {
        type: "quote",
        text: "Those are process problems. They should be solved as process problems.",
      },
      {
        type: "h2",
        text: "Speed is not the same as flow",
      },
      {
        type: "p",
        text: "A buyer who sends follow-up emails faster is still doing follow-up email. A planner who refreshes six reports in two minutes instead of twenty still starts the day by assembling a picture the systems already have.",
      },
      {
        type: "p",
        text: "The better question is whether that work should exist in its current form. If the answer is no, automation will lock the waste in place and make it harder to see.",
      },
      {
        type: "ul",
        items: [
          "Remove steps that exist only because information is hard to find.",
          "Clarify who decides, and with what inputs.",
          "Define what “done” looks like before you build anything.",
          "Then connect the remaining work into a system that is faster, clearer, and easier to measure.",
        ],
      },
      {
        type: "p",
        text: "Automate the value. Do not scale the waste.",
      },
    ],
  },
  {
    slug: "start-with-the-process-your-team-hates",
    title: "Start With the Process Your Team Hates",
    category: "Operations",
    date: "2026-05-19",
    readTime: "5 min",
    dek: "The work people complain about is usually the work that is slow, unclear, and expensive. It is also the best place to begin.",
    blocks: [
      {
        type: "p",
        text: "Ask a plant manager, a buyer, or a quality engineer what they would stop doing tomorrow if they could. You will get a better roadmap than most strategy decks.",
      },
      {
        type: "p",
        text: "The processes teams hate tend to share a pattern. They are repetitive. They require hunting for information. They depend on one person who “knows how.” They produce a result that still needs checking.",
      },
      {
        type: "ul",
        items: [
          "Buyers chasing overdue purchase orders.",
          "Planners combining reports every morning.",
          "Quality teams searching years of corrective actions.",
          "Engineers looking for the current specification.",
          "Managers building the weekly operating review by hand.",
        ],
      },
      {
        type: "quote",
        text: "These are not side tasks. They are the connective tissue of the operation.",
      },
      {
        type: "p",
        text: "Start there. Go to the work. Simplify it. Build a system around the remaining steps. Measure whether the hated work got shorter, clearer, or disappeared.",
      },
      {
        type: "p",
        text: "If it did, you found your first loop.",
      },
    ],
  },
  {
    slug: "the-hidden-cost-of-tribal-knowledge",
    title: "The Hidden Cost of Tribal Knowledge",
    category: "Tribal knowledge",
    date: "2026-04-28",
    readTime: "7 min",
    dek: "When one person knows where everything is, the company is slower than it looks — and more fragile than it admits.",
    blocks: [
      {
        type: "p",
        text: "Every plant has someone who can find the old spec, remember the supplier exception, or explain why a job is run a certain way. That person is valuable. The system that requires them is not.",
      },
      {
        type: "p",
        text: "Tribal knowledge is not a culture problem. It is an information-flow problem. The knowledge exists. It is just trapped in inboxes, shared drives, side conversations, and memory.",
      },
      {
        type: "h2",
        text: "What it costs",
      },
      {
        type: "ul",
        items: [
          "Time spent searching instead of deciding.",
          "Work that waits until the right person is available.",
          "Inconsistent answers to the same question.",
          "Training that takes months because the real process is undocumented.",
          "Risk when that person is out, overloaded, or leaves.",
        ],
      },
      {
        type: "quote",
        text: "The goal is not to replace experienced people. It is to stop making the operation depend on their memory.",
      },
      {
        type: "p",
        text: "A knowledge system should retrieve the specification, the quality history, the SOP, and the last time this supplier missed a date — and put that in front of the person doing the work. Human judgment stays. The scavenger hunt does not.",
      },
    ],
  },
  {
    slug: "what-ai-can-actually-do-for-procurement",
    title: "What AI Can Actually Do for Procurement",
    category: "Procurement",
    date: "2026-03-11",
    readTime: "6 min",
    dek: "Buyers do not need a new philosophy. They need fewer hours spent on follow-up, comparison, and search.",
    blocks: [
      {
        type: "p",
        text: "Procurement teams already know what good looks like: the right part, at the right time, at a defensible cost, from a supplier who will actually deliver. The gap is the administrative work required to get there.",
      },
      {
        type: "p",
        text: "That work is follow-up. RFQ preparation. Quote comparison. Digging through pricing history. Checking whether a supplier’s lead time has slipped. Writing the same email with a different PO number.",
      },
      {
        type: "h2",
        text: "Where a system helps",
      },
      {
        type: "ul",
        items: [
          "Drafting and tracking supplier follow-up so overdue orders surface before they become shortages.",
          "Preparing RFQ packages from existing specs, history, and approved suppliers.",
          "Comparing quotes on the dimensions that matter — price, lead time, terms, risk — not just the number in the bottom right.",
          "Putting supplier performance and pricing history next to the decision, not in a separate report.",
        ],
      },
      {
        type: "quote",
        text: "The buyer should still decide. The system should make the decision possible sooner.",
      },
      {
        type: "p",
        text: "That is not a replacement for sourcing judgment. It is a way to return hours to the people who have it.",
      },
    ],
  },
  {
    slug: "erp-system-of-record-system-of-action",
    title: "ERP Is the System of Record. AI Can Become the System of Action.",
    category: "AI + ERP",
    date: "2026-02-17",
    readTime: "7 min",
    dek: "Your ERP already holds the transaction. The work is getting from that record to a decision, and from that decision to an action.",
    blocks: [
      {
        type: "p",
        text: "ERP systems are good at storing what happened: the order, the receipt, the inventory move, the invoice. They are less good at noticing what needs to happen next, explaining it in context, and helping someone act.",
      },
      {
        type: "p",
        text: "That gap is why so much operational work still lives in spreadsheets and email. The record is in the ERP. The action is everywhere else.",
      },
      {
        type: "quote",
        text: "A system of action watches for exceptions, assembles the relevant context, and puts a next step in front of the right person.",
      },
      {
        type: "h2",
        text: "Keep the system of record. Close the loop.",
      },
      {
        type: "p",
        text: "This is not an argument for replacing ERP. It is an argument for connecting it. Purchase orders, inventory, production, and quality data become useful when they are joined to documents, supplier correspondence, and the people who decide.",
      },
      {
        type: "p",
        text: "The loop is simple: information, decision, action, feedback, improvement. ERP covers part of the first step. Most manufacturers still do the rest by hand.",
      },
    ],
  },
  {
    slug: "kaizen-in-the-age-of-ai",
    title: "Kaizen in the Age of AI",
    category: "Lean and Kaizen",
    date: "2026-01-20",
    readTime: "6 min",
    dek: "Continuous improvement does not become obsolete when the tools get stronger. It becomes more important.",
    blocks: [
      {
        type: "p",
        text: "Kaizen is not a workshop format. It is a habit: see the work, remove friction, standardize what works, look again.",
      },
      {
        type: "p",
        text: "New tools do not replace that habit. They raise the cost of skipping it. A poorly designed process connected to a capable system will produce waste at a higher rate, with more confidence, and with less visibility.",
      },
      {
        type: "h2",
        text: "The loop is the same",
      },
      {
        type: "ul",
        items: [
          "See: go to the gemba. Watch how the work actually happens.",
          "Simplify: remove steps, clarify ownership, define the outcome.",
          "Build: connect data, documents, software, and people into a working system.",
          "Learn: measure the result, find the next constraint, repeat.",
        ],
      },
      {
        type: "quote",
        text: "Improvement never stops. The tools change. The discipline does not.",
      },
      {
        type: "p",
        text: "Used this way, models and automation become part of the standard work — not a side project, and not a substitute for understanding the floor.",
      },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export const insightTopics = [
  "Manufacturing AI",
  "Supply chain",
  "Procurement",
  "Lean and Kaizen",
  "Operations",
  "Human-in-the-loop AI",
  "AI + ERP",
  "Tribal knowledge",
  "Manufacturing automation",
  "Process improvement",
];
