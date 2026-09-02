function trigger(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(filename: string, text: string, type = "application/json") {
  trigger(new Blob([text], { type }), filename);
}

export function downloadSvg(filename: string, svg: string) {
  trigger(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), filename);
}

export function downloadCsv(filename: string, csv: string) {
  trigger(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
}
