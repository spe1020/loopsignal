import {
  SIGNAL_LIMITS,
  SignalClientError,
  analyzeCsvText,
  analyzeSample,
} from "@/lib/signal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_ERROR =
  "We couldn't analyze this report just now. Please try again.";

function jsonError(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function jsonOk(body: unknown) {
  return Response.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}

function isClientError(error: unknown): error is SignalClientError {
  return (
    error instanceof SignalClientError ||
    (error instanceof Error && error.name === "SignalClientError")
  );
}

function isCsvUpload(file: File, bytes: Uint8Array): boolean {
  if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return false;
  }
  if (bytes.length >= 2 && bytes[0] === 0xd0 && bytes[1] === 0xcf) {
    return false;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return false;
  if (name.endsWith(".csv")) return true;
  const type = file.type.toLowerCase();
  return (
    type === "" ||
    type === "text/csv" ||
    type === "application/csv" ||
    type === "text/plain" ||
    type === "application/vnd.ms-excel"
  );
}

async function analyzeUploadedFile(file: File) {
  if (file.size > SIGNAL_LIMITS.maxFileBytes) {
    throw new SignalClientError(
      "This file is too large for the demo. Please upload a CSV under 1 MB.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > SIGNAL_LIMITS.maxFileBytes) {
    throw new SignalClientError(
      "This file is too large for the demo. Please upload a CSV under 1 MB.",
    );
  }

  if (!isCsvUpload(file, buffer)) {
    throw new SignalClientError(
      "Please upload a CSV file. Excel workbooks are not supported in this demo.",
    );
  }

  const text = buffer.toString("utf8");
  buffer.fill(0);
  return analyzeCsvText(text);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        throw new SignalClientError("Use sample data or upload a CSV file.");
      }
      if (
        body &&
        typeof body === "object" &&
        "source" in body &&
        (body as { source?: unknown }).source === "sample"
      ) {
        return jsonOk(analyzeSample());
      }
      throw new SignalClientError("Use sample data or upload a CSV file.");
    }

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) {
        throw new SignalClientError("Choose a CSV file to analyze.");
      }
      return jsonOk(await analyzeUploadedFile(file));
    }

    throw new SignalClientError("Use sample data or upload a CSV file.");
  } catch (error) {
    if (isClientError(error)) {
      return jsonError(error.message, error.status ?? 400);
    }
    console.error("[signal] analysis failed");
    return jsonError(GENERIC_ERROR, 500);
  }
}
