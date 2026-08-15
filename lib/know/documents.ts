import type {
  DocumentFilter,
  DocumentType,
  KnowDocument,
  VisualAid,
} from "@/lib/know/types";

export const shaftThreadGaugeAid: VisualAid = {
  id: "wi-102-thread-gauge",
  documentNumber: "WI-102",
  title: "Thread gauge check — Cell 4 shaft coupling",
  section: "First-Piece Inspection",
  instruction:
    "After fixture torque and before lot release, check the coupling thread with the GO and NO-GO plug gauges. Do not use a wrench on either gauge.",
  acceptRule:
    "Accept only when the GO gauge enters fully by hand and the NO-GO gauge does not enter more than 1.5 turns.",
  go: {
    image: "/images/go-gauge.jpg",
    alt: "GO thread plug gauge threading fully into the shaft coupling",
    label: "GO",
    result: "Must pass",
    criteria: [
      "GO plug gauge threads in by hand for the full gauge length.",
      "No binding, no tools, no forcing.",
      "If the GO gauge does not enter fully, reject the piece.",
    ],
  },
  nogo: {
    image: "/images/nogo-gauge.jpg",
    alt: "NO-GO thread plug gauge stopped at the mouth of the shaft coupling",
    label: "NO-GO",
    result: "Must not pass",
    criteria: [
      "NO-GO plug gauge must not enter more than 1.5 turns.",
      "If the NO-GO threads in freely, the thread is oversized.",
      "Hold the piece and notify Quality.",
    ],
  },
};

export const documents: KnowDocument[] = [
  {
    id: "wi-102-c",
    title: "CNC Shaft Setup",
    number: "WI-102",
    type: "work_instruction",
    typeLabel: "Work Instruction",
    revision: "C",
    effectiveDate: "July 2026",
    owner: "Manufacturing Engineering",
    status: "current",
    summary:
      "Current setup sequence for the Cell 4 shaft family, including fixture torque and first-piece release.",
    sections: [
      {
        heading: "Machine Setup Sequence",
        body: "Load the current Cell 4 program for the shaft family. Confirm the work offset, tool list, and coolant before seating the fixture.",
      },
      {
        heading: "Fixture Setup",
        body: "Verify fixture seating and tighten the four fixture bolts to 42 ft-lb before beginning first-piece inspection.",
      },
      {
        heading: "Spindle Speed",
        body: "Run the roughing pass at 1,800 RPM and the finish pass at 2,400 RPM. Do not change spindle speed without Manufacturing Engineering approval.",
      },
      {
        heading: "First-Piece Inspection",
        body: "Complete first-piece inspection per QIP-118 before releasing the lot to production.",
      },
      {
        heading: "Thread Gauge Check",
        body: "Check the coupling thread with the GO and NO-GO plug gauges. Accept only when the GO gauge enters fully by hand and the NO-GO gauge does not enter more than 1.5 turns. See the visual aid in this work instruction.",
      },
    ],
    tags: [
      "cnc",
      "shaft",
      "setup",
      "torque",
      "fixture",
      "first-piece",
      "go",
      "no-go",
      "thread",
      "gauge",
    ],
    relatedIds: ["qip-118", "wi-102-b"],
    visualAid: shaftThreadGaugeAid,
    supersedesId: "wi-102-b",
  },
  {
    id: "wi-102-b",
    title: "CNC Shaft Setup",
    number: "WI-102",
    type: "work_instruction",
    typeLabel: "Work Instruction",
    revision: "B",
    effectiveDate: "March 2025",
    owner: "Manufacturing Engineering",
    status: "superseded",
    summary:
      "Previous shaft setup instruction. Superseded when fixture hardware was upgraded.",
    sections: [
      {
        heading: "Fixture Setup",
        body: "Verify fixture seating and tighten the four fixture bolts to 38 ft-lb before beginning first-piece inspection.",
      },
      {
        heading: "Spindle Speed",
        body: "Run both roughing and finish passes at 1,800 RPM.",
      },
    ],
    tags: ["cnc", "shaft", "setup", "torque", "fixture", "obsolete"],
    relatedIds: ["wi-102-c"],
    supersededById: "wi-102-c",
  },
  {
    id: "pkg-214",
    title: "Corrugated Carton Packaging",
    number: "PKG-214",
    type: "specification",
    typeLabel: "Packaging Specification",
    revision: "D",
    effectiveDate: "June 2026",
    owner: "Packaging Engineering",
    status: "current",
    summary:
      "Carton size, pack quantity, closure, and label placement for finished-goods cartons.",
    sections: [
      {
        heading: "Carton Dimensions",
        body: "Use a 16 × 12 × 10 inch regular slotted carton, 32 ECT, kraft exterior.",
      },
      {
        heading: "Pack Quantity",
        body: "Pack 24 finished units per carton unless a customer pack deviation is released.",
      },
      {
        heading: "Closure Method",
        body: "Close the carton with 2-inch water-activated tape using an H-seal on the top and bottom flaps.",
      },
      {
        heading: "Label Placement",
        body: "Apply the current carton label per ECN-072. Do not use Revision A label placement after the implementation date.",
      },
      {
        heading: "Inspection Requirements",
        body: "Verify pack count, closure, and label placement on the first carton of each lot.",
      },
    ],
    tags: ["packaging", "carton", "label", "pack quantity", "closure"],
    relatedIds: ["ecn-072", "sw-141"],
  },
  {
    id: "scar-018",
    title: "Thread Defect Investigation",
    number: "SCAR-018",
    type: "quality",
    typeLabel: "Supplier Corrective Action",
    revision: "A",
    effectiveDate: "April 2026",
    owner: "Supplier Quality",
    status: "current",
    summary:
      "Investigation of an oversized thread condition, including containment, root cause, and verification.",
    sections: [
      {
        heading: "Condition",
        body: "An oversized internal thread was found on coupling family NB-440. The go gauge passed and the no-go gauge also passed, indicating an oversized thread condition.",
      },
      {
        heading: "Containment",
        body: "Hold remaining supplier lots and in-house stock. Perform 100% thread gauge inspection before any further use.",
      },
      {
        heading: "Root Cause",
        body: "Worn thread-forming tooling at the supplier allowed the minor diameter to grow beyond the no-go limit.",
      },
      {
        heading: "Corrective Action",
        body: "The tool replacement interval was reduced from 12,000 cycles to 6,000 cycles, and a mid-interval gauge check was added.",
      },
      {
        heading: "Verification",
        body: "Three consecutive accepted production lots were required before the corrective action was closed.",
      },
    ],
    tags: ["thread", "defect", "scar", "containment", "corrective action"],
    relatedIds: ["qa-039", "qip-331"],
  },
  {
    id: "sop-mnt-044",
    title: "Conveyor Bearing Replacement",
    number: "SOP-MNT-044",
    type: "maintenance",
    typeLabel: "Maintenance SOP",
    revision: "B",
    effectiveDate: "May 2026",
    owner: "Maintenance",
    status: "current",
    summary:
      "Lockout, removal, lubrication, alignment, and restart steps for Line 3 conveyor bearings.",
    sections: [
      {
        heading: "Before Work",
        body: "Complete lockout/tagout on the Line 3 conveyor drive. Verify zero energy at the local disconnect before removing guards.",
      },
      {
        heading: "Bearing Removal",
        body: "Support the shaft, remove the retaining ring, and extract the worn bearing without scoring the shaft journal.",
      },
      {
        heading: "Lubrication",
        body: "Pack the replacement bearing with NLGI 2 lithium grease. Do not overfill the housing.",
      },
      {
        heading: "Alignment",
        body: "Set shaft alignment within 0.005 inch TIR before tightening the housing caps.",
      },
      {
        heading: "Restart Inspection",
        body: "Jog the conveyor and inspect for noise, heat, and belt tracking before returning the line to production.",
      },
    ],
    tags: ["conveyor", "bearing", "lockout", "lubrication", "alignment"],
    relatedIds: ["pm-207"],
  },
  {
    id: "qip-331",
    title: "Machined Aluminum Bracket",
    number: "QIP-331",
    type: "quality",
    typeLabel: "Inspection Plan",
    revision: "B",
    effectiveDate: "June 2026",
    owner: "Quality",
    status: "current",
    summary:
      "Critical dimensions, sampling frequency, and acceptance criteria for the aluminum bracket family.",
    sections: [
      {
        heading: "Critical Dimensions",
        body: "Hole spacing 2.000 ± 0.005 inch. Thickness 0.375 ± 0.003 inch. Cosmetic faces must be free of gouges.",
      },
      {
        heading: "Sampling Frequency",
        body: "Inspect 5 pieces per lot of 50, or 10% of the lot, whichever is greater.",
      },
      {
        heading: "Inspection Method",
        body: "Use a caliper for thickness and a pin gauge for hole spacing. Record results on the lot inspection sheet.",
      },
      {
        heading: "Acceptance Criteria",
        body: "Any out-of-tolerance piece fails the lot pending a 100% sort and Quality disposition.",
      },
    ],
    tags: ["inspection", "bracket", "aluminum", "sampling", "dimensions"],
    relatedIds: ["qa-039", "qip-118"],
  },
  {
    id: "mat-118",
    title: "Injection Molded Housing Resin",
    number: "MAT-118",
    type: "specification",
    typeLabel: "Material Specification",
    revision: "C",
    effectiveDate: "May 2026",
    owner: "Materials Engineering",
    status: "current",
    summary:
      "Approved resin, color, moisture, processing window, and alternate material for the molded housing.",
    sections: [
      {
        heading: "Resin Type",
        body: "Use natural ABS with a melt flow of 8–12 g/10 min as the approved housing resin.",
      },
      {
        heading: "Color",
        body: "Color to Machine Gray using concentrate MG-14 at 2% by weight.",
      },
      {
        heading: "Moisture Requirement",
        body: "Dry the resin to 0.05% maximum moisture before processing, typically 3 hours at 180°F.",
      },
      {
        heading: "Processing Conditions",
        body: "Melt temperature 430–470°F. Mold temperature 120–160°F.",
      },
      {
        heading: "Approved Alternate",
        body: "Recycled-content ABS RC-ABS-20 is approved when it meets the same color and moisture requirements.",
      },
    ],
    tags: ["resin", "abs", "housing", "moisture", "alternate"],
    relatedIds: ["ecn-072"],
  },
  {
    id: "ecn-072",
    title: "Carton Label Revision B",
    number: "ECN-072",
    type: "engineering",
    typeLabel: "Engineering Change Notice",
    revision: "B",
    effectiveDate: "August 2026",
    owner: "Engineering",
    status: "current",
    summary:
      "Moves the carton label from the upper-left side panel to the upper-right side panel and sets edge distance.",
    sections: [
      {
        heading: "Revision History",
        body: "Revision A placed the finished-goods label on the upper-left side panel. Revision B relocates the label and updates the edge-distance rule.",
      },
      {
        heading: "Changed Label Location",
        body: "Label moved to the upper-right side panel and minimum distance from the carton edge changed to 1.5 inches.",
      },
      {
        heading: "Implementation Date",
        body: "Revision B is effective August 1, 2026 for all new carton labeling.",
      },
      {
        heading: "Disposition of Old Inventory",
        body: "Existing Revision A carton inventory may be consumed through August 31, 2026. After that date, unused Revision A printed cartons are to be scrapped or over-labeled per Packaging Engineering.",
      },
    ],
    tags: ["ecn", "label", "carton", "revision", "disposition"],
    relatedIds: ["pkg-214"],
  },
  {
    id: "pm-207",
    title: "Packaging Line Drive",
    number: "PM-207",
    type: "maintenance",
    typeLabel: "Preventive Maintenance Checklist",
    revision: "A",
    effectiveDate: "March 2026",
    owner: "Maintenance",
    status: "current",
    summary:
      "Weekly inspection points for the packaging-line drive, including belt, lubrication, and escalation.",
    sections: [
      {
        heading: "Inspection Frequency",
        body: "Inspect the packaging-line drive weekly on first-shift Monday before production start.",
      },
      {
        heading: "Belt Condition",
        body: "Check the drive belt for fray, glaze, cracks, and tracking. Correct tracking before releasing the line.",
      },
      {
        heading: "Lubrication",
        body: "Grease drive bearings on the published interval. Use the same NLGI 2 lithium grease specified in SOP-MNT-044.",
      },
      {
        heading: "Motor Check",
        body: "Check motor housing temperature and listen for unusual noise or vibration.",
      },
      {
        heading: "Escalation Criteria",
        body: "Stop the line and notify Maintenance Supervision if belt tracking cannot be corrected or motor temperature exceeds 180°F.",
      },
    ],
    tags: ["preventive maintenance", "packaging", "belt", "bearing", "motor"],
    relatedIds: ["sop-mnt-044", "pkg-214"],
  },
  {
    id: "sw-141",
    title: "Fastener Kit Assembly",
    number: "SW-141",
    type: "standard_work",
    typeLabel: "Standard Work",
    revision: "B",
    effectiveDate: "April 2026",
    owner: "Production",
    status: "current",
    summary:
      "Assembly sequence, hardware, torque, inspection, and packaging for the fastener kit.",
    sections: [
      {
        heading: "Assembly Sequence",
        body: "Place the housing, install four flange bolts with lock washers, torque in a cross pattern, inspect, then pack.",
      },
      {
        heading: "Required Hardware",
        body: "Four M8 × 25 flange bolts, four lock washers, and one identification tag.",
      },
      {
        heading: "Torque",
        body: "Tighten flange bolts to 18 ft-lb in a cross pattern.",
      },
      {
        heading: "Visual Inspection",
        body: "Confirm washer orientation, tag presence, and that no bolt head is proud of the housing pocket.",
      },
      {
        heading: "Packaging",
        body: "Place each completed kit in the inner tray. Pack 12 kits per carton per PKG-214.",
      },
    ],
    tags: ["assembly", "fastener", "torque", "hardware", "packaging"],
    relatedIds: ["pkg-214", "wi-102-c"],
  },
  {
    id: "qa-039",
    title: "Surface Finish Nonconformance",
    number: "QA-039",
    type: "quality",
    typeLabel: "Quality Alert",
    revision: "A",
    effectiveDate: "July 2026",
    owner: "Quality",
    status: "current",
    summary:
      "Active quality alert for cosmetic swirl marks on the bracket family, including containment and expiration.",
    sections: [
      {
        heading: "Defect Description",
        body: "Visible swirl marks on the cosmetic face after secondary finishing. The marks are not allowed on customer-facing surfaces.",
      },
      {
        heading: "Affected Part Family",
        body: "Bracket family NB-300 through NB-320 from finishing lots 26-0712 through 26-0718.",
      },
      {
        heading: "Containment",
        body: "Quarantine finished goods from the affected lots. Do not ship without Quality release.",
      },
      {
        heading: "Inspection Requirement",
        body: "Perform 100% visual inspection under white light at the pack station until the alert expires.",
      },
      {
        heading: "Expiration Criteria",
        body: "The alert expires after two consecutive accepted production weeks or written close-out by the Quality Manager.",
      },
    ],
    tags: ["quality alert", "surface finish", "containment", "inspection"],
    relatedIds: ["qip-331", "scar-018"],
  },
  {
    id: "qip-118",
    title: "First Piece Inspection — Shaft Family",
    number: "QIP-118",
    type: "quality",
    typeLabel: "Inspection Plan",
    revision: "B",
    effectiveDate: "July 2026",
    owner: "Quality",
    status: "current",
    summary:
      "First-piece release requirements after a Cell 4 shaft setup, including recorded fixture torque.",
    sections: [
      {
        heading: "When Required",
        body: "Complete this plan after any setup change, tool change, or fixture reseat on the Cell 4 shaft family.",
      },
      {
        heading: "Setup Confirmation",
        body: "Confirm fixture torque of 42 ft-lb is recorded on the setup sheet before measuring the first piece.",
      },
      {
        heading: "Critical Checks",
        body: "Measure the two critical diameters and the bearing journal before releasing the lot.",
      },
      {
        heading: "Thread Gauge Check",
        body: "Apply the GO / NO-GO visual aid in WI-102. Accept only when the GO gauge enters fully by hand and the NO-GO gauge does not enter more than 1.5 turns.",
      },
    ],
    tags: [
      "first-piece",
      "shaft",
      "torque",
      "inspection",
      "setup",
      "go",
      "no-go",
      "thread",
      "gauge",
    ],
    relatedIds: ["wi-102-c", "qip-331"],
    visualAid: shaftThreadGaugeAid,
  },
  {
    id: "qip-410",
    title: "Incoming Visual Inspection",
    number: "QIP-410",
    type: "quality",
    typeLabel: "Inspection Plan",
    revision: "A",
    effectiveDate: "August 2026",
    owner: "Quality",
    status: "draft",
    summary:
      "Draft incoming visual checks for purchased hardware. Not released for production use.",
    sections: [
      {
        heading: "Scope",
        body: "Draft visual inspection for purchased fasteners and tags. Dimensional and plating requirements are not included in this draft.",
      },
      {
        heading: "Status",
        body: "This document is in draft review with Quality and Receiving. Do not use it in place of a current inspection plan.",
      },
    ],
    tags: ["incoming", "draft", "inspection", "fastener"],
    relatedIds: ["sw-141"],
  },
];

export const documentById = new Map(
  documents.map((document) => [document.id, document]),
);

export const filterLabels: Record<DocumentFilter, string> = {
  all: "All",
  work_instructions: "Work Instructions",
  specifications: "Specifications",
  quality: "Quality",
  maintenance: "Maintenance",
  engineering: "Engineering",
  standard_work: "Standard Work",
};

const filterTypes: Record<DocumentFilter, DocumentType | null> = {
  all: null,
  work_instructions: "work_instruction",
  specifications: "specification",
  quality: "quality",
  maintenance: "maintenance",
  engineering: "engineering",
  standard_work: "standard_work",
};

const statusRank: Record<KnowDocument["status"], number> = {
  current: 0,
  draft: 1,
  superseded: 2,
};

export function getDocument(id: string): KnowDocument | undefined {
  return documentById.get(id);
}

export function relatedDocuments(document: KnowDocument): KnowDocument[] {
  return document.relatedIds
    .map((id) => documentById.get(id))
    .filter((item): item is KnowDocument => item != null);
}

export function matchesFilter(
  document: KnowDocument,
  filter: DocumentFilter,
): boolean {
  const type = filterTypes[filter];
  return type === null || document.type === type;
}

export function sortLibrary(items: KnowDocument[]): KnowDocument[] {
  return [...items].sort((a, b) => {
    const status = statusRank[a.status] - statusRank[b.status];
    if (status !== 0) return status;
    return a.number.localeCompare(b.number) || a.revision.localeCompare(b.revision);
  });
}

export function documentSearchText(document: KnowDocument): string {
  return [
    document.title,
    document.number,
    document.typeLabel,
    document.owner,
    document.summary,
    document.tags.join(" "),
    ...document.sections.flatMap((section) => [section.heading, section.body]),
  ]
    .join(" ")
    .toLowerCase();
}
