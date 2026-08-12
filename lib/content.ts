export const nav = [
  { href: "/", label: "Home" },
  { href: "/solutions", label: "Solutions" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/insights", label: "Insights" },
] as const;

export const informationSources = [
  "ERP systems",
  "Spreadsheets",
  "Email",
  "Supplier correspondence",
  "Specifications",
  "Quality records",
  "Production reports",
  "Shared drives",
  "Employee knowledge",
];

export const solutions = [
  {
    slug: "supply-chain-intelligence",
    title: "Supply Chain Intelligence",
    summary:
      "Help teams identify shortages, supplier risk, inventory issues, and exceptions earlier — while there is still time to act.",
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
    title: "Procurement Automation",
    summary:
      "Reduce repetitive administrative work for buyers and sourcing teams so they can spend time on suppliers, cost, and risk.",
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
    title: "Manufacturing Intelligence",
    summary:
      "Turn plant information into useful operational insight — for the people who run the floor, not a dashboard that nobody opens.",
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
    title: "Knowledge Systems",
    summary:
      "Make company knowledge easier to access and use, so work does not depend on whoever happens to remember where the file is.",
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
      "A focused operational assessment to identify where better systems would actually change the work.",
    deliverables: [
      "Workflow review",
      "Friction points",
      "Opportunity map",
      "Business impact",
      "Technical feasibility",
      "Risk assessment",
      "Prioritized roadmap",
    ],
    cta: "Start with a LoopScan",
  },
  {
    slug: "loopbuild",
    name: "LoopBuild",
    summary:
      "Turn one high-value opportunity into a practical working system — not a slide deck.",
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
      "Ongoing support and continuous improvement of deployed systems, so the work keeps getting better.",
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

export const howItWorks = [
  {
    step: "01",
    name: "See",
    summary:
      "Go to the work and understand how the process actually operates — not how it is drawn on a slide.",
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
    summary:
      "Improve the process before automating it. Remove unnecessary steps. Define decisions, ownership, and expected outcomes.",
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
      "Connect the right combination of tools and people into a working system — not just a recommendation.",
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
    summary:
      "Measure the impact. Identify the next constraint. Improve again.",
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

export const operationalLoop = [
  "Information",
  "Decision",
  "Action",
  "Feedback",
  "Improvement",
] as const;

export const useCases = [
  "Buyers manually chasing overdue purchase orders",
  "Planners combining reports every morning",
  "Quality teams searching through years of corrective actions",
  "Engineers trying to locate old specifications",
  "Managers manually preparing weekly operating reviews",
  "Supply chain teams discovering shortages too late",
  "Employees relying on one experienced person who knows where everything is",
];

export const philosophy = [
  "AI is not the strategy. Better operations are the strategy.",
  "Problems should be made visible.",
  "Complexity should be removed before it is automated.",
  "The people closest to the work often understand the problem best.",
  "Human judgment should remain where it adds value.",
  "Improvement never stops.",
];
