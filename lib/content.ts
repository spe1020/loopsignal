export const nav = [
  { href: "/", label: "Home" },
  { href: "/solutions", label: "Solutions" },
  { href: "/demo", label: "Demo" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/insights", label: "Insights" },
] as const;

export const cta = {
  nav: { href: "/loopscan", label: "Talk to Us" },
  talkAboutProcess: {
    href: "/loopscan#intake",
    label: "Talk About a Process",
  },
  seeDemos: { href: "/demo", label: "See the Demos" },
  startLoopScan: { href: "/loopscan", label: "Start a LoopScan" },
  learnLoopScan: { href: "/loopscan", label: "Learn About LoopScan" },
  talkThroughProcess: {
    href: "/loopscan#intake",
    label: "Talk Through a Process",
  },
} as const;

export const painPoints = [
  "Buyers chasing overdue POs by hand.",
  "Managers rebuilding the same reports every morning.",
  "Critical knowledge living with the one person who knows where everything is.",
  "Teams moving information between systems by hand.",
] as const;

export const loopScanOffer = {
  whatItIs:
    "A two-day on-site review of how a process actually runs — the work, the information, the handoffs, and the friction.",
  whatHappens:
    "We walk the work with your team, map the current state, and return findings within 10 business days.",
  reviewed: [
    "Workflows",
    "Systems",
    "Reports",
    "Spreadsheets",
    "Handoffs",
    "Manual tasks",
  ],
  price: "$7,500",
  duration: "Two days on site",
  findingsIn: "Findings within 10 business days",
  priceLine: "$7,500 · Two days on site · Findings within 10 business days",
  samplePdf: {
    href: "/LoopScan-sample-Northfield.pdf",
    filename: "LoopScan-sample-Northfield.pdf",
    eyebrow: "Sample LoopScan",
    body: "A complete sample LoopScan, start to finish — six pages, built on the same fictional Northfield dataset behind the demos. Current-state map, friction, information gaps, system connections, repetitive work, what to automate and what not to, and one prioritized next step with the arithmetic shown. Nothing gated.",
    cta: "Download the sample (PDF, 6 pages)",
  },
  guarantee:
    "Unconditional. If the findings aren't worth what you paid, tell us within seven days and we refund it.",
  // TODO: name the origin city for the 2.5-hour radius.
  radius:
    "Within 2.5 hours' drive. Beyond that, quoted separately.",
  whyFixed:
    "A defined engagement. LoopScan is scoped as a fixed starting point rather than open-ended consulting. You know the cost, the time commitment, and the deliverable before the work begins.",
  firstClient:
    "LoopSignal is new. You would be among the first LoopScan clients, which is why the price is fixed, the deliverable is defined in advance, and the guarantee is unconditional.",
  dataHandling:
    "We’re hired to look at your process — the data is yours. If sizing the problem needs a pull, it is read-only, we ask before anything is exported, we take the smallest set that answers the question, and you can decline and still get the scan. One person does this work. We delete our copy when the analysis is done, and no later than 30 days after your readout.",
  // TODO: confirm these seven items against Dr. Sats' pricing work.
  deliverables: [
    "Current-state workflow map",
    "Friction points",
    "Information gaps",
    "System connections",
    "Repetitive work",
    "What to automate, and what not to",
    "Prioritized next step with business impact",
  ],
} as const;

export const loopScanTeamHoursByRole = [
  { role: "Sponsor", hours: "~3 hrs" },
  { role: "Buyer or planner", hours: "~5 hrs" },
  { role: "One operator", hours: "~2 hrs" },
  { role: "IT", hours: "~1 hr" },
] as const;

export const loopScanEngagementSteps = [
  "Fit check (30-min call)",
  "Intake and data request",
  "Remote pre-work",
  "Two days on site",
  "Analysis",
  "Findings and readout within 10 business days",
] as const;

export const loopScanIntents = [
  {
    value: "book",
    label: "Ready to book a LoopScan",
  },
  {
    value: "talk",
    label: "Want to talk through a process",
  },
] as const;

export type LoopScanIntent = (typeof loopScanIntents)[number]["value"];

export const loopScanFit = {
  good: {
    title: "A good fit if",
    items: [
      "Your buyers work out of spreadsheet exports from an ERP older than they are.",
      "The same report gets rebuilt every morning.",
      "One person is the only one who knows how something works.",
      "Information moves between systems by hand.",
    ],
  },
  not: {
    title: "Not a fit if",
    items: [
      "You need an ERP replacement or upgrade.",
      "You already run a mature continuous improvement program with dedicated CI staff.",
      "You want staff augmentation rather than a defined engagement.",
    ],
  },
} as const;

export const informationSources = [
  "ERP systems",
  "Email",
  "Spreadsheets",
  "Quality records",
  "Supplier updates",
  "Production reports",
  "Specifications",
  "Shared drives",
  "Institutional knowledge",
];

export const capabilities = [
  {
    name: "Process Improvement",
    summary:
      "Understand the work, remove unnecessary complexity, reduce waste, improve flow, clarify ownership.",
  },
  {
    name: "Systems Integration",
    summary:
      "Connect the systems and information your team already relies on so work moves across the organization.",
  },
  {
    name: "Automation + Practical AI",
    summary:
      "Automate repetitive and information-heavy work where technology earns its place.",
  },
] as const;

export const solutions = [
  {
    slug: "supply-chain-intelligence",
    interest: "supply_chain",
    outcome: "See supply problems earlier",
    title: "Supply Chain Intelligence",
    summary:
      "Identify shortages, supplier issues, inventory constraints, and exceptions before they become larger operational problems.",
    examples: [
      "Open PO exceptions",
      "Material risk",
      "Inventory coverage",
      "Supplier follow-up",
      "Replenishment priorities",
      "Lead-time issues",
      "Supplier communication",
      "Supply constraints",
    ],
    demoHref: "/supply",
    demoName: "LoopSupply",
  },
  {
    slug: "procurement-automation",
    interest: "procurement",
    outcome: "Give buyers their time back",
    title: "Procurement Automation",
    summary:
      "Reduce repetitive purchasing work and improve sourcing decisions using better information and structured workflows.",
    examples: [
      "RFQ comparison",
      "Landed cost",
      "Tooling",
      "MOQ",
      "Lead time",
      "Capacity",
      "Qualification",
      "Dual-source scenarios",
    ],
    demoHref: "/source",
    demoName: "LoopSource",
  },
  {
    slug: "manufacturing-intelligence",
    interest: "manufacturing",
    outcome: "Turn plant data into action",
    title: "Manufacturing Intelligence",
    summary: "Turn plant information into clear priorities, ownership, and action.",
    examples: [
      "Production",
      "Quality",
      "Supply",
      "Maintenance",
      "Planning",
      "Executive summaries",
      "Department briefs",
      "Actions and accountability",
    ],
    demoHref: "/brief",
    demoName: "LoopBrief",
  },
  {
    slug: "knowledge-systems",
    interest: "knowledge",
    outcome: "Make tribal knowledge searchable",
    title: "Knowledge Systems",
    summary:
      "Make SOPs, specifications, quality history, engineering information, and institutional knowledge easier to access and trust.",
    examples: [
      "SOPs",
      "Specifications",
      "Engineering documents",
      "Quality history",
      "Revision control",
      "Maintenance knowledge",
      "Institutional knowledge",
    ],
    demoHref: "/know",
    demoName: "LoopKnow",
  },
] as const;

export const demos = [
  {
    href: "/supply",
    name: "LoopSupply",
    headline: "Find the supply exception.",
    category: "Supply exceptions",
    promise:
      "Turn purchasing, supplier, inventory, and open-order information into clear priorities and action.",
    flow: ["Open PO data", "supply risk", "priority", "action"],
    description:
      "Turn purchasing, supplier, inventory, and open-order information into clear priorities and action.",
    cta: "Try LoopSupply",
  },
  {
    href: "/know",
    name: "LoopKnow",
    headline: "Find the trusted answer.",
    category: "Manufacturing knowledge",
    promise: "Turn scattered manufacturing knowledge into trusted, usable answers.",
    flow: ["Documents", "trusted knowledge", "source", "next step"],
    description:
      "Turn scattered manufacturing knowledge into trusted, usable answers.",
    cta: "Try LoopKnow",
  },
  {
    href: "/source",
    name: "LoopSource",
    headline: "Structure the sourcing decision.",
    category: "Sourcing decisions",
    promise:
      "Structure sourcing decisions by connecting supplier quotes, commercial terms, requirements, and tradeoffs.",
    flow: [
      "Supplier quotes",
      "normalized comparison",
      "tradeoffs",
      "recommendation",
    ],
    description:
      "Structure sourcing decisions by connecting supplier quotes, commercial terms, requirements, and tradeoffs.",
    cta: "Try LoopSource",
  },
  {
    href: "/brief",
    name: "LoopBrief",
    headline: "Coordinate the operation.",
    category: "Daily operations",
    promise:
      "Turn daily operational information into priorities, ownership, reporting, and action.",
    flow: ["Operational signals", "priorities", "owners", "action"],
    description:
      "Turn daily operational information into priorities, ownership, reporting, and action.",
    cta: "Try LoopBrief",
  },
] as const;

export const demoNote =
  "Examples of capability, not fixed packages every manufacturer is expected to adopt.";

export const demoPhilosophy = [
  {
    name: "LoopSupply",
    line: "Find the supply exception.",
  },
  {
    name: "LoopKnow",
    line: "Find the trusted answer.",
  },
  {
    name: "LoopSource",
    line: "Structure the sourcing decision.",
  },
  {
    name: "LoopBrief",
    line: "Coordinate the operation.",
  },
] as const;

export const services = [
  {
    slug: "loopscan",
    name: "LoopScan",
    headline: "Understand the process.",
    summary: "Understand the process.",
    detail:
      "LoopScan is a two-day on-site operational review. We map how the work happens today, name the friction, and hand you a seven-item findings pack within 10 business days.",
    deliverables: [
      "Current-state workflow map",
      "Friction points",
      "Information gaps",
      "System connections",
      "Repetitive work",
      "What to automate, and what not to",
      "Prioritized next step with business impact",
    ],
    cta: "Start a LoopScan",
  },
  {
    slug: "loopbuild",
    name: "LoopBuild",
    headline: "Improve the process. Build the right system around it.",
    summary: "Improve and implement it.",
    detail:
      "LoopBuild turns a prioritized opportunity into a working solution: process redesign, systems integration, workflow automation, AI, custom software, or a combination.",
    deliverables: [
      "Purchasing exception workflow",
      "Supplier follow-up process",
      "Reporting automation",
      "Knowledge system",
      "Sourcing workflow",
      "Operations management process",
      "System-to-system integration",
    ],
    cta: "Start a LoopScan",
  },
] as const;

export const howItWorks = [
  {
    step: "01",
    name: "See",
    summary: "Understand how the work actually happens.",
    points: [
      "Delays",
      "Repetitive work",
      "Disconnected information",
      "Bottlenecks",
      "Manual workarounds",
      "Tribal knowledge",
    ],
  },
  {
    step: "02",
    name: "Simplify",
    summary: "Remove unnecessary steps, clarify ownership, and improve the process.",
    points: [
      "Remove extra steps",
      "Clarify ownership",
      "Define outcomes",
      "Reduce handoffs",
      "Make work visible",
      "Improve flow",
    ],
  },
  {
    step: "03",
    name: "Connect",
    summary:
      "Connect the systems, people, and information required to make the workflow work.",
    points: [
      "ERP data",
      "Email and spreadsheets",
      "Documents",
      "Existing software",
      "People closest to the work",
      "Process rules",
    ],
  },
  {
    step: "04",
    name: "Automate",
    summary:
      "Automate repetitive or information-heavy work where it makes sense.",
    points: [
      "Repetitive tasks",
      "Information gathering",
      "Exception routing",
      "Workflow automation",
      "AI where it belongs",
      "Human approval where it matters",
    ],
  },
  {
    step: "05",
    name: "Measure",
    summary: "Establish whether the change actually improved the operation.",
    points: [
      "Time",
      "Cost",
      "Risk",
      "Quality",
      "Response time",
      "Baseline versus result",
    ],
  },
  {
    step: "06",
    name: "Improve",
    summary: "Use the result to strengthen the next loop.",
    points: [
      "Find the next constraint",
      "Adjust the workflow",
      "Train the team",
      "Expand what works",
      "Strengthen the process",
      "Repeat",
    ],
  },
] as const;

export const useCases = [
  "Buyers manually chasing overdue purchase orders",
  "Planners combining reports every morning",
  "Quality teams searching through years of corrective actions",
  "Engineers trying to find old specifications",
  "Supply chain teams discovering shortages too late",
  "Managers manually preparing operating reviews",
  "Employees relying on one experienced person who knows where everything is",
];

export const featuredArticleSlugs = [
  "ai-is-not-your-manufacturing-strategy",
  "why-manufacturers-should-not-automate-waste",
  "what-ai-can-actually-do-for-procurement",
] as const;

export const existingSystems = [
  "ERP",
  "Email",
  "Excel",
  "Quality Systems",
  "Shared Drives",
  "Supplier Data",
  "Production Data",
  "Maintenance Records",
];

export const loopSignalOutcomes = [
  "Better decisions",
  "Less manual work",
  "Faster response",
];

export const trustPrinciples = [
  {
    title: "Practical first",
    text: "Start with the work.",
  },
  {
    title: "Human in the loop",
    text: "Keep judgment and decision authority where it matters.",
  },
  {
    title: "Work with what you have",
    text: "Use existing systems whenever possible.",
  },
  {
    title: "Measure the result",
    text: "Every implementation improves a business outcome.",
  },
] as const;

export const loopScanSteps = [
  {
    step: "01",
    name: "Observe",
    summary: "Understand how the work actually happens.",
    points: [
      "Workflows",
      "Systems",
      "Reports",
      "Spreadsheets",
      "Handoffs",
      "Manual tasks",
      "Recurring problems",
    ],
  },
  {
    step: "02",
    name: "Identify",
    summary: "Find the friction that slows the operation.",
    points: [
      "Repetitive work",
      "Information gaps",
      "Bottlenecks",
      "Delays",
      "Manual reporting",
      "Decision friction",
      "Tribal knowledge",
      "Recurring exceptions",
    ],
  },
  {
    step: "03",
    name: "Prioritize",
    summary: "Score opportunities before recommending technology.",
    points: [
      "Business impact",
      "Feasibility",
      "Risk",
      "Data availability",
      "Implementation effort",
    ],
  },
  {
    step: "04",
    name: "Recommend",
    summary: "Create a practical roadmap for where to begin.",
    points: [
      "What to improve",
      "What to automate",
      "Where AI belongs",
      "What not to automate",
      "Where to begin",
    ],
  },
] as const;

export const loopScanFindings = [
  {
    area: "Procurement",
    text: "Buyers spending hours each week following up on overdue purchase orders.",
  },
  {
    area: "Supply Chain",
    text: "Material shortages being discovered after production is already at risk.",
  },
  {
    area: "Operations",
    text: "Managers manually assembling daily or weekly production reports.",
  },
  {
    area: "Quality",
    text: "Teams searching old corrective actions every time a recurring problem appears.",
  },
  {
    area: "Engineering",
    text: "Employees spending significant time locating specifications and historical documents.",
  },
  {
    area: "Knowledge",
    text: "Critical processes depending on one experienced person knowing where information lives.",
  },
] as const;

export const commercialJourney = [
  {
    step: "01",
    name: "LoopScan",
    headline: "Understand the process.",
    text: "Map how the work happens today and name the friction.",
  },
  {
    step: "02",
    name: "LoopBuild",
    headline: "Improve and implement it.",
    text: "Turn a prioritized opportunity into a working solution — process redesign, systems integration, automation, software, AI, or a combination.",
  },
  {
    step: "03",
    name: "LoopOps",
    headline: "Keep it working.",
    text: "Improvements decay when nobody owns them. LoopOps is the daily management and standard work that keeps the process running after we're done — run by your team, not by us.",
  },
] as const;

export const operatingLoop = [
  {
    name: "See",
    summary: "Understand how the work actually happens.",
  },
  {
    name: "Simplify",
    summary: "Remove unnecessary steps, clarify ownership, and improve the process.",
  },
  {
    name: "Connect",
    summary: "Connect the systems, people, and information the workflow requires.",
  },
  {
    name: "Automate",
    summary: "Automate repetitive or information-heavy work where it makes sense.",
  },
  {
    name: "Measure",
    summary: "Establish whether the change actually improved the operation.",
  },
  {
    name: "Improve",
    summary: "Use the result to strengthen the next loop.",
  },
] as const;

export const implementationSequence = [
  {
    name: "Discover the workflow",
    summary: "Understand how the work happens today.",
  },
  {
    name: "Establish the baseline",
    summary: "Define the current time, cost, risk, or performance.",
  },
  {
    name: "Improve the process",
    summary: "Remove unnecessary complexity before connecting systems or automating work.",
  },
  {
    name: "Build what is needed",
    summary: "Connect the right information and implement the solution around the work.",
  },
  {
    name: "Define ownership",
    summary: "Clarify what people, workflows, software, or agents own.",
  },
  {
    name: "Measure the result",
    summary: "Determine whether the operation actually improved.",
  },
] as const;

export const founder = {
  name: "Seth Sager",
  role: "Founder",
  linkedin: "https://www.linkedin.com/in/seth-sager-a381781a",
  background:
    "Seth has worked from the shop floor through manufacturing engineering, production planning, purchasing, and supply chain — with a focus on lean methods, supplier development, and practical process improvement.",
};

export const loopScanAreas = [
  "Procurement",
  "Supply Chain",
  "Operations",
  "Quality",
  "Engineering",
  "Planning",
  "Knowledge / Documentation",
  "Other",
] as const;

export const loopScanIntakeExamples = [
  {
    area: "Procurement",
    text: "Buyers manually chasing overdue purchase orders.",
  },
  {
    area: "Supply Chain",
    text: "Shortages being discovered after production is already at risk.",
  },
  {
    area: "Operations",
    text: "Managers manually assembling production reports.",
  },
  {
    area: "Quality",
    text: "Teams searching through previous corrective actions every time a problem returns.",
  },
  {
    area: "Engineering",
    text: "Employees spending too much time locating specifications and historical documents.",
  },
  {
    area: "Knowledge",
    text: "Critical work depending on one experienced employee who knows where everything is.",
  },
] as const;
