import { Customer, Collection, guestWorkspaceService } from "@/lib/services/guest-workspace-service";
import { inr } from "@/lib/utils";

/**
 * Helper to fetch collection history if missing.
 */
async function getHistoryForCustomer(cust: Customer, providedHistory?: Collection[]): Promise<Collection[]> {
  if (providedHistory && providedHistory.length > 0) return providedHistory;
  if (!cust.public_id) return [];
  try {
    const res = await guestWorkspaceService.getCollections({ customer: cust.public_id });
    return res?.data || [];
  } catch {
    return [];
  }
}

/**
 * Modular function to draw a single Passbook Card inside a specified Y range on canvas.
 * Designed to fit cleanly within ~820px height so 2 cards fit on 1 A4 Page.
 */
function drawSinglePassbookCard(
  ctx: CanvasRenderingContext2D,
  customer: Customer,
  history: Collection[],
  workspaceName: string,
  startY: number,
  cardWidth: number = 1160,
  marginX: number = 40
) {
  const cardFrameHeight = 820;

  // Outer Card Frame Background & Border
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, marginX, startY, cardWidth, cardFrameHeight, 14, true, false);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 1. Header Bar inside Card
  const headerY = startY;
  ctx.fillStyle = "#f8fafc";
  roundRect(ctx, marginX, headerY, cardWidth, 68, 14, true, false);
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("👁 Borrower Profile & Payment Details", marginX + 20, headerY + 34);

  ctx.fillStyle = "#64748b";
  ctx.font = "12px sans-serif";
  ctx.fillText(`Account summary for ${customer.full_name || "Borrower"}.`, marginX + 20, headerY + 54);

  ctx.fillStyle = "#059669";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(`Lender: ${workspaceName || "FinRoute Workspace"}`, widthOffset(cardWidth, marginX, 340), headerY + 34);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px monospace";
  ctx.fillText(`Date: ${dateStr}`, widthOffset(cardWidth, marginX, 220), headerY + 54);

  // 2. Info Card Section
  const infoY = headerY + 78;
  ctx.fillStyle = "#f8fafc";
  roundRect(ctx, marginX + 16, infoY, cardWidth - 32, 115, 10, true, false);
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Sequence Badge + Name
  let nameX = marginX + 32;
  if (customer.sequence_number) {
    ctx.fillStyle = "#ecfdf5";
    roundRect(ctx, marginX + 32, infoY + 12, 44, 24, 6, true, false);
    ctx.strokeStyle = "#a7f3d0";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#047857";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`#${customer.sequence_number}`, marginX + 38, infoY + 28);
    nameX = marginX + 88;
  }

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(customer.full_name || "Borrower Name", nameX, infoY + 30);

  // Day Badge
  const dayText = `Day: ${(customer.collection_day || "monday").toUpperCase()}`;
  ctx.fillStyle = "#ecfdf5";
  roundRect(ctx, widthOffset(cardWidth, marginX, 185), infoY + 12, 155, 26, 6, true, false);
  ctx.strokeStyle = "#a7f3d0";
  ctx.stroke();
  ctx.fillStyle = "#047857";
  ctx.font = "bold 11px monospace";
  ctx.fillText(dayText, widthOffset(cardWidth, marginX, 172), infoY + 29);

  // Inner Card Divider
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(marginX + 32, infoY + 48);
  ctx.lineTo(marginX + cardWidth - 32, infoY + 48);
  ctx.stroke();

  // 2x2 Grid inside Info Card
  ctx.fillStyle = "#64748b";
  ctx.font = "12px sans-serif";
  ctx.fillText("Code:", marginX + 32, infoY + 74);
  ctx.fillText("Mobile:", marginX + 32, infoY + 98);

  ctx.fillText("Disbursed:", marginX + 500, infoY + 74);
  ctx.fillText("Status:", marginX + 500, infoY + 98);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px monospace";
  ctx.fillText(customer.customer_code || "CUST-0000", marginX + 90, infoY + 74);
  ctx.fillText(customer.mobile_number || "-", marginX + 90, infoY + 98);

  ctx.fillText(customer.start_date ? customer.start_date.split("T")[0] : "-", marginX + 580, infoY + 74);

  const statusIsCompleted = (customer.remaining_amount || customer.outstanding_balance || 0) <= 0;
  ctx.fillStyle = statusIsCompleted ? "#2563eb" : "#047857";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText((customer.status || "active").toUpperCase(), marginX + 580, infoY + 98);

  // 3. Financial Stat Cards (3 Cards)
  const statsY = infoY + 125;
  const statWidth = Math.floor((cardWidth - 80) / 3);
  const statHeight = 70;

  const principal = Number(customer.loan_amount || 0);
  const totalDue = Number(customer.total_due || 0);
  const outstanding = Number(customer.outstanding_balance ?? customer.remaining_amount ?? 0);

  // Principal Card
  ctx.fillStyle = "#f8fafc";
  roundRect(ctx, marginX + 16, statsY, statWidth, statHeight, 8, true, false);
  ctx.strokeStyle = "#e2e8f0";
  ctx.stroke();
  ctx.fillStyle = "#64748b";
  ctx.font = "11px sans-serif";
  ctx.fillText("Principal", marginX + 30, statsY + 22);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 18px monospace";
  ctx.fillText(inr(principal), marginX + 30, statsY + 50);

  // Total Due Card
  const c2X = marginX + 16 + statWidth + 24;
  ctx.fillStyle = "#f8fafc";
  roundRect(ctx, c2X, statsY, statWidth, statHeight, 8, true, false);
  ctx.strokeStyle = "#e2e8f0";
  ctx.stroke();
  ctx.fillStyle = "#64748b";
  ctx.font = "11px sans-serif";
  ctx.fillText("Total Due", c2X + 16, statsY + 22);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 18px monospace";
  ctx.fillText(inr(totalDue), c2X + 16, statsY + 50);

  // Outstanding Card
  const c3X = c2X + statWidth + 24;
  ctx.fillStyle = "#ecfdf5";
  roundRect(ctx, c3X, statsY, statWidth, statHeight, 8, true, false);
  ctx.strokeStyle = "#a7f3d0";
  ctx.stroke();
  ctx.fillStyle = "#047857";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("Outstanding", c3X + 16, statsY + 22);
  ctx.fillStyle = "#047857";
  ctx.font = "bold 18px monospace";
  ctx.fillText(inr(outstanding), c3X + 16, statsY + 50);

  // 4. Installment Passbook Struck Grid Section
  const passbookY = statsY + 80;
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("Installment Passbook", marginX + 16, passbookY + 16);

  const totalInstallments = Math.min(Math.max(customer.total_installments || 20, 1), 100);

  const validPaidHistory = (history || []).filter(
    (h) => h.status_code !== "skipped" && Number(h.collected_amount || 0) > 0
  );
  const paidCount = Math.min(
    customer.installments_paid_count ??
    customer.paid_installments_count ??
    (validPaidHistory.length > 0 ? validPaidHistory.length : 0) ??
    (customer.installment_amount && Number(customer.installment_amount) > 0
      ? Math.floor(Number(customer.total_collected_amount || 0) / Number(customer.installment_amount))
      : 0),
    totalInstallments
  );
  const remainingCount = totalInstallments - paidCount;

  ctx.fillStyle = "#64748b";
  ctx.font = "12px sans-serif";
  ctx.fillText(`Progress: ${paidCount} / ${totalInstallments} Paid (${remainingCount} left)`, widthOffset(cardWidth, marginX, 260), passbookY + 16);

  // Passbook Matrix Container
  const matrixY = passbookY + 26;
  const matrixRows = Math.ceil(totalInstallments / 10);
  const matrixHeight = Math.max(68, matrixRows * 32 + 10);

  ctx.fillStyle = "#f8fafc";
  roundRect(ctx, marginX + 16, matrixY, cardWidth - 32, matrixHeight, 10, true, false);
  ctx.strokeStyle = "#e2e8f0";
  ctx.stroke();

  // Draw 10 per row boxes
  const cols = 10;
  const boxW = Math.floor((cardWidth - 64 - 108) / 10);
  const boxH = 26;
  const gapX = 10;
  const gapY = 6;
  const startX = marginX + 30;
  const boxesStartY = matrixY + 8;

  for (let i = 0; i < totalInstallments; i++) {
    const num = i + 1;
    const col = i % cols;
    const row = Math.floor(i / cols);

    const bx = startX + col * (boxW + gapX);
    const by = boxesStartY + row * (boxH + gapY);
    const isPaid = num <= paidCount;

    if (isPaid) {
      // Struck Paid Box
      ctx.fillStyle = "#059669";
      roundRect(ctx, bx, by, boxW, boxH, 5, true, false);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`✓ #${num}`, bx + 12, by + 17);

      // Struck-through line
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx + 6, by + 13);
      ctx.lineTo(bx + boxW - 6, by + 13);
      ctx.stroke();
    } else {
      // Unpaid Box
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, bx, by, boxW, boxH, 5, true, false);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "12px monospace";
      ctx.fillText(`#${num}`, bx + 18, by + 17);
    }
  }

  // 5. Dual-Column Passbook Table Format (ALL Installments)
  const historyY = matrixY + matrixHeight + 16;
  const totalCollected = history.reduce((s, h) => s + Number(h.collected_amount || 0), 0);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText(`Passbook Installment Ledger (All ${totalInstallments} Installments)`, marginX + 16, historyY + 16);

  ctx.fillStyle = "#047857";
  ctx.font = "bold 13px monospace";
  ctx.fillText(`Total Paid: ${inr(totalCollected)}`, widthOffset(cardWidth, marginX, 220), historyY + 16);

  const tableY = historyY + 24;
  const halfCount = Math.ceil(totalInstallments / 2);
  const rowHeight = 24;
  const tableHeight = 28 + halfCount * rowHeight;

  const subTableWidth = Math.floor((cardWidth - 64) / 2);
  const leftX = marginX + 16;
  const rightX = marginX + 16 + subTableWidth + 32;

  const sortedHistory = [...history].sort((a, b) => (a.collection_date || "").localeCompare(b.collection_date || ""));

  const renderSubTable = (tableStartX: number, startInstIdx: number, endInstIdx: number) => {
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, tableStartX, tableY, subTableWidth, tableHeight, 8, true, false);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Table Header
    ctx.fillStyle = "#f8fafc";
    roundRect(ctx, tableStartX, tableY, subTableWidth, 28, 8, true, false);

    ctx.fillStyle = "#475569";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("Inst #", tableStartX + 10, tableY + 18);
    ctx.fillText("Receipt #", tableStartX + 75, tableY + 18);
    ctx.fillText("Date", tableStartX + 250, tableY + 18);
    ctx.fillText("Amount", tableStartX + 360, tableY + 18);

    let rowIdx = 0;
    for (let i = startInstIdx; i < endInstIdx; i++) {
      const instNum = i + 1;
      const ry = tableY + 28 + rowIdx * rowHeight;
      const record = sortedHistory[i];

      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tableStartX, ry);
      ctx.lineTo(tableStartX + subTableWidth, ry);
      ctx.stroke();

      // Column 1: Installment #
      ctx.fillStyle = instNum <= paidCount ? "#047857" : "#64748b";
      ctx.font = "bold 11px monospace";
      ctx.fillText(`Inst #${instNum}`, tableStartX + 10, ry + 16);

      if (record && instNum <= paidCount) {
        const isSkipped = record.status_code === "skipped" || record.status_name?.toLowerCase().includes("skipped");

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 10px monospace";
        ctx.fillText(record.receipt_number || "-", tableStartX + 75, ry + 16);

        ctx.fillStyle = "#334155";
        ctx.font = "11px sans-serif";
        ctx.fillText(record.collection_date || "-", tableStartX + 250, ry + 16);

        ctx.fillStyle = isSkipped ? "#d97706" : "#059669";
        ctx.font = "bold 11px monospace";
        ctx.fillText(isSkipped ? "Skipped" : inr(record.collected_amount), tableStartX + 360, ry + 16);
      } else {
        // UNPAID INSTALLMENT: LEAVE ALL PAYMENT CELLS COMPLETELY EMPTY!
      }

      rowIdx++;
    }
  };

  renderSubTable(leftX, 0, halfCount);
  renderSubTable(rightX, halfCount, totalInstallments);

  // Watermark Seal (Bottom of Single Card)
  const sealY = startY + cardFrameHeight - 34;
  ctx.fillStyle = "#ecfdf5";
  roundRect(ctx, marginX + 16, sealY, cardWidth - 32, 26, 6, true, false);
  ctx.strokeStyle = "#a7f3d0";
  ctx.stroke();

  ctx.fillStyle = "#047857";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("✔ OFFICIAL VERIFIED DIGITAL PASSBOOK · FINROUTE ERP PLATFORM", marginX + 28, sealY + 17);
}

function widthOffset(cardWidth: number, marginX: number, offset: number): number {
  return marginX + cardWidth - offset;
}

/**
 * Downloads a single customer passbook card image (in modal / detail view).
 */
export async function downloadCustomerCardImage(
  customer: Customer,
  workspaceName: string = "FinRoute Finance Workspace",
  providedHistory?: Collection[]
) {
  const history = await getHistoryForCustomer(customer, providedHistory);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // A4 Document Dimensions (1240 x 1754)
  const width = 1240;
  const height = 1754;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Draw 1 Card on Top Half (Y = 35)
  drawSinglePassbookCard(ctx, customer, history, workspaceName, 35, 1160, 40);

  // Fine Print Footer at A4 bottom
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px monospace";
  ctx.fillText("FinRoute SaaS Platform · Official A4 Loan Passbook Document · Confidential", width / 2 - 260, height - 30);

  const link = document.createElement("a");
  const sanitizedName = (customer.full_name || "Customer").replace(/[^a-z0-9]/gi, "_");
  link.download = `${sanitizedName}_A4_Passbook_Document.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads A4 pages containing EXACTLY 2 Customer Passbook Cards per page.
 * (e.g. 3 customers selected = Page 1 with 2 customers, Page 2 with 1 customer).
 */
export async function generateBatchPassbookPages(
  customers: Customer[],
  workspaceName: string = "FinRoute Finance Workspace"
) {
  if (!customers || customers.length === 0) {
    alert("Please select at least one customer for batch passbook generation.");
    return;
  }

  // Process in pairs of 2 customers per A4 page
  for (let p = 0; p < customers.length; p += 2) {
    const pageNumber = Math.floor(p / 2) + 1;
    const topCust = customers[p];
    const bottomCust = customers[p + 1];

    const topHistory = await getHistoryForCustomer(topCust);
    const bottomHistory = bottomCust ? await getHistoryForCustomer(bottomCust) : [];

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    // A4 Document Dimensions (1240 x 1754)
    const width = 1240;
    const height = 1754;
    canvas.width = width;
    canvas.height = height;

    // Clean A4 White Page Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Draw Top Card (Y = 35)
    drawSinglePassbookCard(ctx, topCust, topHistory, workspaceName, 35, 1160, 40);

    // Draw Bottom Card (Y = 880) if bottomCust exists
    if (bottomCust) {
      drawSinglePassbookCard(ctx, bottomCust, bottomHistory, workspaceName, 880, 1160, 40);
    }

    // A4 Footer Watermark
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px monospace";
    ctx.fillText(`FinRoute ERP Platform · A4 Batch Passbook Page ${pageNumber} of ${Math.ceil(customers.length / 2)}`, width / 2 - 240, height - 30);

    // Download A4 Page Image
    const link = document.createElement("a");
    link.download = `Batch_Passbooks_Page_${pageNumber}.png`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Slight delay between multi-page downloads so browser processes all downloads smoothly
    await new Promise((res) => setTimeout(res, 400));
  }
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
