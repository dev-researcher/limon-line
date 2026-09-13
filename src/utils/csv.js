/** Excel (ES/LATAM) abre bien CSV con ; y BOM UTF-8. */
const BOM = "\uFEFF";
const SEP = ";";

function escapeCell(value) {
  const s = value == null ? "" : String(value);
  if (/[;"\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildExcelCsv(headers, rows) {
  const lines = [
    headers.map(escapeCell).join(SEP),
    ...rows.map((row) => row.map(escapeCell).join(SEP)),
  ];
  return BOM + lines.join("\r\n") + "\r\n";
}

export function downloadExcelCsv(filename, headers, rows) {
  const csv = buildExcelCsv(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
