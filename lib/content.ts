export const nav = [
  { href: "/", label: "Home" },
  { href: "/solutions", label: "Solutions" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/insights", label: "Insights" },
] as const;

export const informationSources = [
  "ERP",
  "Email",
  "Spreadsheets",
  "Specifications",
  "Quality Records",
  "Supplier Information",
  "Production Data",
  "Shared Drives",
  "Tribal Knowledge",
];

export const solutions = [
  {
    slug: "supply-chain-intelligence",
    outcome: "See supply problems earlier",
    title: "Supply Chain Intelligence",
    summary:
      "Help teams identify inventory risk, shortages, supplier issues, and exceptions before they become emergencies.",
    examples: [
      "Inventory risk",
      "PO exceptions",
      "Supplier lead-time monitoring",
      "Shortage alerts",
      "Supply reporting",
    ],
  },
  {
    slug: "procurement-automation",
    outcome: "Give buyers their time back",
    title: "Procurement Automation",
    summary:
      "Reduce repetitive supplier follow-up, RFQ work, quote comparison, and administrative purchasing tasks.",
    examples: [
      "Supplier follow-up",
      "RFQ preparation",
      "Quote comparison",
      "Supplier intelligence",
      "Pricing history",
      "Supplier performance",
    ],
  },
  {
    slug: "manufacturing-intelligence",
    outcome: "Turn plant data into action",
    title: "Manufacturing Intelligence",
    summary:
      "Transform production, downtime, scrap, quality, and operational information into useful decisions.",
    examples: [
      "Production summaries",
      "Downtime analysis",
      "Scrap analysis",
      "Meeting preparation",
      "Exception monitoring",
      "Shift handoffs",
    ],
  },
  {
    slug: "knowledge-systems",
    outcome: "Make tribal knowledge searchable",
    title: "Knowledge Systems",
    summary:
      "Make SOPs, specifications, engineering documents, quality history, supplier knowledge, and maintenance information easier to access and use.",
    examples: [
      "SOP search",
      "Specification retrieval",
      "Engineering documents",
      "Quality history",
      "Supplier knowledge",
      "Maintenance information",
      "Training support",
    ],
  },
] as const;

export const services = [
  {
    slug: "loopscan",
    name: "LoopScan",
    summary:
      "A focused review of your operation designed to identify where process improvement, AI, and automation can create the most value.",
    deliverables: [
      "Current-state workflow",
      "Friction points",
      "Opportunity map",
      "Business impact",
      "Technical feasibility",
      "Risk considerations",
      "Prioritized roadmap",
    ],
    cta: "Start a LoopScan",
  },
  {
    slug: "loopbuild",
    name: "LoopBuild",
    summary:
      "Turn one high-value opportunity into a practical working system.",
    deliverables: [
      "Supplier follow-up automation",
      "RFQ workflow",
      "Production reporting",
      "Supply risk monitoring",
      "Quality investigations",
      "Knowledge search",
    ],
    cta: "Build Your First Loop",
  },
  {
    slug: "loopops",
    name: "LoopOps",
    summary:
      "Ongoing support and continuous improvement after the first system is live.",
    deliverables: [
      "System monitoring",
      "Workflow improvement",
      "Integrations",
      "Training",
      "Governance",
      "New use cases",
      "Monthly improvement reviews",
    ],
    cta: "Keep Improving",
  },
] as const;

export const loopScanReviews = [
  "Repetitive work",
  "Information gaps",
  "Delays",
  "Manual reporting",
  "Disconnected systems",
  "Decision bottlenecks",
  "Tribal knowledge",
  "Recurring operational problems",
];

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
    summary: "Improve the process before automating it.",
    points: [
      "Remove extra steps",
      "Clarify decisions",
      "Assign ownership",
      "Define outcomes",
      "Reduce handoffs",
      "Make work visible",
    ],
  },
  {
    step: "03",
    name: "Build",
    summary:
      "Connect the right combination of people, information, software, automation, and AI.",
    points: [
      "AI where it helps",
      "Automation",
      "ERP data",
      "Documents",
      "APIs and databases",
      "Existing software",
      "Human decision-makers",
    ],
  },
  {
    step: "04",
    name: "Learn",
    summary: "Measure the result and improve again.",
    points: [
      "Measure results",
      "Find the next constraint",
      "Adjust the workflow",
      "Train the team",
      "Expand what works",
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
  "why-manufacturers-should-not-automate-waste",
  "ai-is-not-your-manufacturing-strategy",
  "what-ai-can-actually-do-for-procurement",
] as const;
