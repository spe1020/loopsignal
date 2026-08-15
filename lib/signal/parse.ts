import { parseCsv } from "@/lib/signal/csv";
import { parseDateValue } from "@/lib/signal/dates";
import {
  SIGNAL_LIMITS,
  SignalClientError,
  type RawPoRow,
} from "@/lib/signal/types";

export const REQUIRED_FIELDS = [
  "po_number",
  "supplier",
  "due_date",
  "quantity_ordered",
  "quantity_received",
] as const;

export type SignalField =
  | (typeof REQUIRED_FIELDS)[number]
  | "item"
  | "description"
  | "order_date"
  | "promised_date"
  | "buyer"
  | "inventory_on_hand"
  | "daily_usage"
  | "lead_time_days"
  | "unit_cost";

const HEADER_ALIASES: Record<string, SignalField> = {
  po: "po_number",
  "po number": "po_number",
  "po no": "po_number",
  "po num": "po_number",
  ponumber: "po_number",
  "purchase order": "po_number",
  "purchase order number": "po_number",
  "purchase order no": "po_number",
  supplier: "supplier",
  "supplier name": "supplier",
  vendor: "supplier",
  "vendor name": "supplier",
  item: "item",
  "item number": "item",
  "item no": "item",
  "item num": "item",
  part: "item",
  "part number": "item",
  "part no": "item",
  sku: "item",
  material: "item",
  "material number": "item",
  description: "description",
  "item description": "description",
  "material description": "description",
  "part description": "description",
  "order date": "order_date",
  "po date": "order_date",
  "ordered date": "order_date",
  "due date": "due_date",
  "required date": "due_date",
  "need date": "due_date",
  "request date": "due_date",
  "promised date": "promised_date",
  "promise date": "promised_date",
  "confirmed date": "promised_date",
  "commit date": "promised_date",
  "committed date": "promised_date",
  "expected date": "promised_date",
  "quantity ordered": "quantity_ordered",
  "qty ordered": "quantity_ordered",
  "order qty": "quantity_ordered",
  "ordered qty": "quantity_ordered",
  "order quantity": "quantity_ordered",
  quantity: "quantity_ordered",
  qty: "quantity_ordered",
  "quantity received": "quantity_received",
  "qty received": "quantity_received",
  "received qty": "quantity_received",
  "received quantity": "quantity_received",
  received: "quantity_received",
  buyer: "buyer",
  "buyer name": "buyer",
  purchaser: "buyer",
  "inventory on hand": "inventory_on_hand",
  "on hand": "inventory_on_hand",
  "qty on hand": "inventory_on_hand",
  "quantity on hand": "inventory_on_hand",
  inventory: "inventory_on_hand",
  qoh: "inventory_on_hand",
  "daily usage": "daily_usage",
  usage: "daily_usage",
  "avg daily usage": "daily_usage",
  "average daily usage": "daily_usage",
  "lead time days": "lead_time_days",
  "lead time": "lead_time_days",
  "lt days": "lead_time_days",
  "unit cost": "unit_cost",
  unitcost: "unit_cost",
  "unit price": "unit_cost",
  "std cost": "unit_cost",
  "standard cost": "unit_cost",
  cost: "unit_cost",
  price: "unit_cost",
};

const MISSING_COLUMNS_MESSAGE =
  "We couldn't read this report yet. Make sure your file includes PO number, supplier, due date, quantity ordered, and quantity received.";

export type ParsedReport = {
  rows: RawPoRow[];
  skippedRowCount: number;
  sourceRowCount: number;
  hasInventoryFields: boolean;
  hasBuyer: boolean;
  hasCostFields: boolean;
};

export function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[#_]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapHeader(value: string): SignalField | null {
  const normalized = normalizeHeader(value);
  return HEADER_ALIASES[normalized] ?? null;
}

function sanitizeText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, SIGNAL_LIMITS.maxFieldChars);
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function parsePoCsv(text: string): ParsedReport {
  const table = parseCsv(text);
  if (table.length < 2) {
    throw new SignalClientError(
      "This file did not contain any purchase-order rows. Download the sample CSV to see the expected format.",
    );
  }

  const header = table[0];
  const columnIndex = new Map<SignalField, number>();

  header.forEach((label, index) => {
    const field = mapHeader(label);
    if (field && !columnIndex.has(field)) {
      columnIndex.set(field, index);
    }
  });

  const missing = REQUIRED_FIELDS.filter((field) => !columnIndex.has(field));
  if (missing.length > 0) {
    throw new SignalClientError(MISSING_COLUMNS_MESSAGE);
  }

  const dataRows = table.slice(1);
  if (dataRows.length > SIGNAL_LIMITS.maxRows) {
    throw new SignalClientError(
      `This report has too many rows for the demo. Please use a file with ${SIGNAL_LIMITS.maxRows.toLocaleString()} rows or fewer.`,
    );
  }

  const rows: RawPoRow[] = [];
  let skippedRowCount = 0;

  for (const cells of dataRows) {
    const read = (field: SignalField) => {
      const index = columnIndex.get(field);
      if (index === undefined) return "";
      return cells[index] ?? "";
    };

    const poNumber = sanitizeText(read("po_number"));
    const supplier = sanitizeText(read("supplier"));
    const dueDate = parseDateValue(read("due_date"));
    const quantityOrdered = parseNumber(read("quantity_ordered"));
    const quantityReceived = parseNumber(read("quantity_received")) ?? 0;

    if (
      !poNumber ||
      !supplier ||
      !dueDate ||
      quantityOrdered === null ||
      quantityOrdered < 0 ||
      quantityReceived < 0
    ) {
      skippedRowCount += 1;
      continue;
    }

    const promisedRaw = read("promised_date").trim();
    const promisedDate = promisedRaw ? parseDateValue(promisedRaw) : null;
    if (promisedRaw && !promisedDate) {
      skippedRowCount += 1;
      continue;
    }

    const orderRaw = read("order_date").trim();
    const orderDate = orderRaw ? parseDateValue(orderRaw) : null;

    const item = sanitizeText(read("item")) || "Unspecified item";
    const description = sanitizeText(read("description"));
    const buyerRaw = sanitizeText(read("buyer"));

    rows.push({
      poNumber,
      supplier,
      item,
      description,
      orderDate,
      dueDate,
      promisedDate,
      quantityOrdered,
      quantityReceived,
      buyer: buyerRaw || null,
      inventoryOnHand: parseNumber(read("inventory_on_hand")),
      dailyUsage: parseNumber(read("daily_usage")),
      leadTimeDays: parseNumber(read("lead_time_days")),
      unitCost: parseNumber(read("unit_cost")),
    });
  }

  if (rows.length === 0) {
    throw new SignalClientError(
      "We couldn't read the rows in this report. Check that dates and quantities are valid, or try the sample file.",
    );
  }

  return {
    rows,
    skippedRowCount,
    sourceRowCount: dataRows.length,
    hasInventoryFields:
      columnIndex.has("inventory_on_hand") && columnIndex.has("daily_usage"),
    hasBuyer: columnIndex.has("buyer"),
    hasCostFields: columnIndex.has("unit_cost"),
  };
}

export function rowCountBucket(count: number): string {
  if (count <= 25) return "1-25";
  if (count <= 50) return "26-50";
  if (count <= 100) return "51-100";
  if (count <= 250) return "101-250";
  if (count <= 500) return "251-500";
  return "500+";
}
