import { inr } from "@/lib/utils";

export interface DailyReportSummaryRow {
  dateKey: string;
  displayDate: string;
  dayName: string;
  grossCollected: number;
  totalExpenses: number;
  netCollection: number;
  collectionCount: number;
  expenseCount: number;
}

export interface ReportFilterMetadata {
  dateFrom?: string;
  dateTo?: string;
  dayFilter?: string;
  workspaceName?: string;
}

/**
 * Generates and downloads a clean A4 PNG financial summary report image card (1240 x 1754 px).
 */
export async function downloadFinancialReportImage(
  dailySummaries: DailyReportSummaryRow[],
  meta: ReportFilterMetadata = {}
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    alert("Canvas context unavailable in this browser.");
    return;
  }

  // Standard A4 Dimensions (1240px x 1754px)
  const width = 1240;
  const height = 1754;
  canvas.width = width;
  canvas.height = height;

  // 1. Clean A4 Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Outer Page Border
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  const marginX = 50;

  // 2. Report Header Frame
  const headerY = 45;
  const headerWidth = width - marginX * 2; // 1140px

  ctx.fillStyle = "#f8fafc";
  roundRect(ctx, marginX, headerY, headerWidth, 100, 16, true, false);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("📊 Financial Summary & Net Cash Flow Report", marginX + 25, headerY + 44);

  const dateFilterStr =
    meta.dateFrom || meta.dateTo
      ? `Date Range: ${meta.dateFrom || "Start"} to ${meta.dateTo || "Today"}`
      : "Full Historical Summary";

  ctx.fillStyle = "#64748b";
  ctx.font = "14px sans-serif";
  ctx.fillText(`${dateFilterStr} · Route Day: ${(meta.dayFilter || "all").toUpperCase()}`, marginX + 25, headerY + 74);

  ctx.fillStyle = "#047857";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText(`Lender: ${meta.workspaceName || "FinRoute Finance Workspace"}`, width - marginX - 380, headerY + 44);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  ctx.fillStyle = "#94a3b8";
  ctx.font = "13px monospace";
  ctx.fillText(`Generated: ${dateStr}`, width - marginX - 260, headerY + 74);

  // 3. KPI Summary Grid (4 Cards)
  const statsY = headerY + 120;
  const cardGap = 20;
  const cardW = Math.floor((headerWidth - cardGap * 3) / 4); // ~270px
  const cardH = 95;

  const totalGross = dailySummaries.reduce((sum, r) => sum + r.grossCollected, 0);
  const totalExp = dailySummaries.reduce((sum, r) => sum + r.totalExpenses, 0);
  const totalNet = totalGross - totalExp;
  const totalReceipts = dailySummaries.reduce((sum, r) => sum + r.collectionCount, 0);

  // Card 1: Gross Collections (Emerald)
  ctx.fillStyle = "#ecfdf5";
  roundRect(ctx, marginX, statsY, cardW, cardH, 12, true, false);
  ctx.strokeStyle = "#a7f3d0";
  ctx.stroke();

  ctx.fillStyle = "#047857";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("Gross Collections", marginX + 18, statsY + 30);
  ctx.fillStyle = "#047857";
  ctx.font = "bold 22px monospace";
  ctx.fillText(inr(totalGross), marginX + 18, statsY + 68);

  // Card 2: Total Expenses (Amber)
  const c2X = marginX + cardW + cardGap;
  ctx.fillStyle = "#fffbeb";
  roundRect(ctx, c2X, statsY, cardW, cardH, 12, true, false);
  ctx.strokeStyle = "#fde68a";
  ctx.stroke();

  ctx.fillStyle = "#b45309";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("Operational Expenses", c2X + 18, statsY + 30);
  ctx.fillStyle = "#b45309";
  ctx.font = "bold 22px monospace";
  ctx.fillText(inr(totalExp), c2X + 18, statsY + 68);

  // Card 3: Net Cash Flow (Blue Accent)
  const c3X = c2X + cardW + cardGap;
  ctx.fillStyle = "#eff6ff";
  roundRect(ctx, c3X, statsY, cardW, cardH, 12, true, false);
  ctx.strokeStyle = "#bfdbfe";
  ctx.stroke();

  ctx.fillStyle = "#1d4ed8";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("Net Revenue / Cash Flow", c3X + 18, statsY + 30);
  ctx.fillStyle = "#1e40af";
  ctx.font = "bold 22px monospace";
  ctx.fillText(inr(totalNet), c3X + 18, statsY + 68);

  // Card 4: Total Receipts
  const c4X = c3X + cardW + cardGap;
  ctx.fillStyle = "#f8fafc";
  roundRect(ctx, c4X, statsY, cardW, cardH, 12, true, false);
  ctx.strokeStyle = "#cbd5e1";
  ctx.stroke();

  ctx.fillStyle = "#475569";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("Collection Receipts", c4X + 18, statsY + 30);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 22px monospace";
  ctx.fillText(`${totalReceipts} Receipts`, c4X + 18, statsY + 68);

  // 4. Daily Breakdown Table Section
  const tableSectionY = statsY + 115;
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("Daily Net Summary Ledger", marginX, tableSectionY + 20);

  ctx.fillStyle = "#64748b";
  ctx.font = "14px sans-serif";
  ctx.fillText(`Showing ${dailySummaries.length} daily summary entries`, width - marginX - 250, tableSectionY + 20);

  const tableY = tableSectionY + 35;
  const maxRows = Math.min(dailySummaries.length, 25);
  const rowHeight = 36;
  const tableHeight = 40 + maxRows * rowHeight;

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, marginX, tableY, headerWidth, tableHeight, 12, true, false);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Table Header
  ctx.fillStyle = "#f8fafc";
  roundRect(ctx, marginX, tableY, headerWidth, 40, 12, true, false);

  ctx.fillStyle = "#475569";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("Date", marginX + 25, tableY + 25);
  ctx.fillText("Day Name", marginX + 200, tableY + 25);
  ctx.fillText("Gross Collections", marginX + 400, tableY + 25);
  ctx.fillText("Expenses", marginX + 630, tableY + 25);
  ctx.fillText("Net Revenue", marginX + 820, tableY + 25);
  ctx.fillText("Receipts", marginX + 1020, tableY + 25);

  for (let i = 0; i < maxRows; i++) {
    const row = dailySummaries[i];
    const ry = tableY + 40 + i * rowHeight;

    // Row Line Separator
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginX, ry);
    ctx.lineTo(marginX + headerWidth, ry);
    ctx.stroke();

    // Date
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px monospace";
    ctx.fillText(row.dateKey, marginX + 25, ry + 23);

    // Day Name
    ctx.fillStyle = "#64748b";
    ctx.font = "13px sans-serif";
    ctx.fillText(row.dayName || "-", marginX + 200, ry + 23);

    // Gross Collections
    ctx.fillStyle = "#059669";
    ctx.font = "bold 13px monospace";
    ctx.fillText(inr(row.grossCollected), marginX + 400, ry + 23);

    // Expenses
    ctx.fillStyle = row.totalExpenses > 0 ? "#d97706" : "#94a3b8";
    ctx.font = "13px monospace";
    ctx.fillText(row.totalExpenses > 0 ? inr(row.totalExpenses) : "-", marginX + 630, ry + 23);

    // Net Revenue
    ctx.fillStyle = row.netCollection >= 0 ? "#1e40af" : "#dc2626";
    ctx.font = "bold 13px monospace";
    ctx.fillText(inr(row.netCollection), marginX + 820, ry + 23);

    // Receipts
    ctx.fillStyle = "#334155";
    ctx.font = "13px monospace";
    ctx.fillText(`${row.collectionCount} receipts`, marginX + 1020, ry + 23);
  }

  // 5. Official Verification Seal Footer (Bottom of A4 Document)
  const footerY = height - 60;
  ctx.fillStyle = "#ecfdf5";
  roundRect(ctx, marginX, footerY, headerWidth, 40, 10, true, false);
  ctx.strokeStyle = "#a7f3d0";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#047857";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("✔ OFFICIAL VERIFIED FINANCIAL STATEMENT · FINROUTE ERP PLATFORM", marginX + 25, footerY + 25);

  ctx.fillStyle = "#64748b";
  ctx.font = "12px monospace";
  ctx.fillText("FinRoute — Financial Summary Report", width - marginX - 300, footerY + 25);

  // Download PNG Image
  const link = document.createElement("a");
  link.download = `Financial_Report_${meta.dateFrom || "Summary"}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Utility function to draw rounded rectangles on HTML5 canvas
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: boolean = true,
  stroke: boolean = false
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
