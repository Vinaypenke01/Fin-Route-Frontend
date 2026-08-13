import { guestWorkspaceService, Customer, WorkspaceData, CollectionLine } from "@/lib/services/guest-workspace-service";

export async function exportCustomersToExcelWorkbook({
  customers,
  selectedLine,
  selectedDay,
  lines,
  workspace,
}: {
  customers: Customer[];
  selectedLine: string;
  selectedDay: string;
  lines: CollectionLine[];
  workspace: WorkspaceData | null;
}) {
  if (customers.length === 0) {
    alert("No customer records found to export for the selected line/filter.");
    return;
  }

  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Fetch collections & expenses list in parallel
    const [colRes, expRes] = await Promise.all([
      guestWorkspaceService.getCollections({ page_size: 1000 }),
      guestWorkspaceService.getExpenses ? guestWorkspaceService.getExpenses({ page_size: 1000 }) : Promise.resolve({ data: [] }),
    ]);

    const collections = colRes.data || [];
    const expenses = Array.isArray(expRes.data) ? expRes.data : Array.isArray(expRes) ? expRes : [];

    // Map collections by customer_public_id and customer_code
    const customerCollectionsMap: Record<string, any[]> = {};
    collections.forEach((entry: any) => {
      const isOpening = entry.payment_mode === "opening_balance";
      const isSkipped = entry.status === "skipped" || entry.collected_amount === 0;
      if (isOpening || isSkipped) return;

      const keys = [
        entry.customer_public_id ? String(entry.customer_public_id).toLowerCase() : "",
        entry.customer_code ? String(entry.customer_code).toLowerCase() : "",
      ].filter(Boolean);

      keys.forEach((key) => {
        if (!customerCollectionsMap[key]) {
          customerCollectionsMap[key] = [];
        }
        if (!customerCollectionsMap[key].some((e) => e.public_id === entry.public_id)) {
          customerCollectionsMap[key].push(entry);
        }
      });
    });

    // 2. Determine active line / filter name for Title Banner & Filename
    let activeLineName = "All Lines";
    if (selectedLine !== "all") {
      const lineObj = lines.find((l) => String(l.public_id) === String(selectedLine) || String((l as any).id) === String(selectedLine));
      if (lineObj) {
        activeLineName = lineObj.name;
      }
    } else if (selectedDay !== "all") {
      activeLineName = `${selectedDay.toUpperCase()} Line`;
    }

    // 3. Build Date Column Headers (Up to current date ONLY, NO future dates)
    const dateSet = new Set<string>();

    customers.forEach((c) => {
      const pId = String(c.public_id).toLowerCase();
      const cCode = String(c.customer_code).toLowerCase();
      const cList = customerCollectionsMap[pId] || customerCollectionsMap[cCode] || [];

      cList.forEach((e) => {
        const d = e.collection_date || (e.created_at ? String(e.created_at).slice(0, 10) : "");
        if (d && d <= todayStr) {
          dateSet.add(d);
        }
      });

      if (c.start_date && c.start_date <= todayStr) {
        const start = new Date(c.start_date);
        const today = new Date(todayStr);

        let current = new Date(start);
        while (current <= today) {
          const dStr = current.toISOString().slice(0, 10);
          dateSet.add(dStr);
          current.setDate(current.getDate() + 7);
        }
      }
    });

    const dateHeaders = Array.from(dateSet).filter((d) => d <= todayStr).sort();

    // Base Headers matching FinRoute Excel Template
    const baseHeaders = [
      "Seq #",
      "Customer Code",
      "Borrower Full Name",
      "Mobile Number",
      "Route Day",
      "Principal Amount (Rs)",
      "Interest Rate (%)",
      "Total Due (Rs)",
      "Amount Paid (Rs)",
      "Outstanding Balance (Rs)",
      "Per Installment Amount (Rs)",
      "Collection Frequency",
      "Total Installments",
      "Paid Installments Count",
      "Remaining Installments Count",
      "Status",
      "Start Date",
      "End Date",
      "Address",
    ];

    const sheet1Headers = [...baseHeaders, ...dateHeaders];
    const sheet1Title = `FinRoute Borrowers — Line: ${activeLineName} — Date-wise Installment Payment Ledger`;

    const sheet1Rows: string[][] = [];
    const dateTotalsMap: Record<string, number> = {};
    dateHeaders.forEach((d) => {
      dateTotalsMap[d] = 0;
    });

    customers.forEach((c, idx) => {
      const pId = String(c.public_id).toLowerCase();
      const cCode = String(c.customer_code).toLowerCase();
      const cList = customerCollectionsMap[pId] || customerCollectionsMap[cCode] || [];

      const collectionByDate: Record<string, number> = {};
      cList.forEach((e) => {
        const d = e.collection_date || (e.created_at ? String(e.created_at).slice(0, 10) : "");
        if (d) {
          collectionByDate[d] = (collectionByDate[d] || 0) + Number(e.collected_amount || 0);
        }
      });

      const collectionSum = cList.reduce((sum, entry) => sum + Number(entry.collected_amount || 0), 0);
      const actualPaidAmount = Math.max(Number(c.amount_already_collected || 0), collectionSum);
      const totalDue = Number(c.total_due || c.loan_amount || 0);
      const actualOutstanding = Math.max(0, totalDue - actualPaidAmount);

      const totalInst = c.total_installments || 0;
      const paidInstCount = cList.length > 0 ? cList.length : (c.installments_paid_count || 0);
      const remInstCount = Math.max(0, totalInst - paidInstCount);

      const cleanMobile = c.mobile_number ? c.mobile_number.replace(/^\+91/, "").replace(/\D/g, "") : "";
      const mobileCell = cleanMobile ? `="${cleanMobile}"` : '""';

      let interestRate = c.interest_rate;
      if (!interestRate && c.loan_amount && totalDue > c.loan_amount) {
        interestRate = Number((((totalDue - c.loan_amount) / c.loan_amount) * 100).toFixed(1));
      }

      const baseRow = [
        String(c.sequence_number || (idx + 1)),
        String(c.customer_code || ""),
        String(c.full_name || ""),
        mobileCell,
        String((c.collection_day || "").toUpperCase()),
        Number(c.loan_amount || 0).toFixed(2),
        interestRate ? `${interestRate}%` : "0%",
        totalDue.toFixed(2),
        actualPaidAmount.toFixed(2),
        actualOutstanding.toFixed(2),
        Number(c.installment_amount || 0).toFixed(2),
        String(c.collection_frequency_name || c.collection_frequency || "Weekly"),
        String(totalInst),
        String(paidInstCount),
        String(remInstCount),
        String((c.status || "active").toUpperCase()),
        String(c.start_date || ""),
        String(c.end_date || ""),
        String(c.address || ""),
      ];

      const dateCells = dateHeaders.map((d) => {
        if (c.start_date && d < c.start_date) {
          return "-";
        }
        const amt = collectionByDate[d];
        if (amt !== undefined && amt > 0) {
          dateTotalsMap[d] = (dateTotalsMap[d] || 0) + amt;
          return amt.toFixed(2);
        }
        return "0.00";
      });

      sheet1Rows.push([...baseRow, ...dateCells]);
    });

    // Sheet 1 TOTAL ROW at bottom of date columns
    const sheet1TotalRow = [
      "", // Seq
      "", // Code
      "TOTAL DAILY COLLECTIONS", // Name
      "", // Mobile
      "", // Route Day
      "", // Principal
      "", // Interest
      "", // Total Due
      "", // Amount Paid
      "", // Outstanding
      "", // Per Inst
      "", // Frequency
      "", // Total Inst
      "", // Paid Inst
      "", // Rem Inst
      "", // Status
      "", // Start Date
      "", // End Date
      "", // Address
      ...dateHeaders.map((d) => (dateTotalsMap[d] || 0).toFixed(2)),
    ];

    // 4. Build SHEET 2: Daily Cash Flow Summary
    const colByDate: Record<string, number> = {};
    collections.forEach((e: any) => {
      const isOpening = e.payment_mode === "opening_balance";
      const isSkipped = e.status === "skipped" || e.collected_amount === 0;
      if (isOpening || isSkipped) return;

      const d = e.collection_date || (e.created_at ? String(e.created_at).slice(0, 10) : "");
      if (d && d <= todayStr) {
        colByDate[d] = (colByDate[d] || 0) + Number(e.collected_amount || 0);
      }
    });

    const newLoansByDate: Record<string, number> = {};
    customers.forEach((c) => {
      if (c.start_date && c.start_date <= todayStr) {
        newLoansByDate[c.start_date] = (newLoansByDate[c.start_date] || 0) + Number(c.loan_amount || 0);
      }
    });

    const expensesByDate: Record<string, number> = {};
    expenses.forEach((e: any) => {
      const d = e.expense_date || (e.created_at ? String(e.created_at).slice(0, 10) : "");
      if (d && d <= todayStr) {
        expensesByDate[d] = (expensesByDate[d] || 0) + Number(e.amount || 0);
      }
    });

    const initialStartingCash = Number((workspace as any)?.starting_cash || 0);
    let runningBalance = initialStartingCash;

    let totalCollectedSumAll = 0;
    let totalNewLoansSumAll = 0;
    let totalExpensesSumAll = 0;

    const sheet2Title = `FinRoute Workspace — Daily Cash Flow Summary (Line: ${activeLineName})`;
    const sheet2Headers = [
      "Date",
      "Starting / Opening Amount (Rs)",
      "Collected Amount (Rs)",
      "Newly Given Loan Amount (Rs)",
      "Expenses (Rs)",
      "Final Value / Closing Cash (Rs)",
    ];

    const sheet2Rows: string[][] = [];

    dateHeaders.forEach((d) => {
      const openingAmt = runningBalance;
      const collectedAmt = colByDate[d] || 0;
      const newLoansAmt = newLoansByDate[d] || 0;
      const expAmt = expensesByDate[d] || 0;

      const closingAmt = openingAmt + collectedAmt - newLoansAmt - expAmt;
      runningBalance = closingAmt;

      totalCollectedSumAll += collectedAmt;
      totalNewLoansSumAll += newLoansAmt;
      totalExpensesSumAll += expAmt;

      sheet2Rows.push([
        d,
        openingAmt.toFixed(2),
        collectedAmt.toFixed(2),
        newLoansAmt.toFixed(2),
        expAmt.toFixed(2),
        closingAmt.toFixed(2),
      ]);
    });

    const sheet2TotalRow = [
      "TOTAL SUM",
      initialStartingCash.toFixed(2),
      totalCollectedSumAll.toFixed(2),
      totalNewLoansSumAll.toFixed(2),
      totalExpensesSumAll.toFixed(2),
      runningBalance.toFixed(2),
    ];

    // 5. Generate Multi-Sheet Excel XML Content (.xls format)
    const escapeXml = (str: any) =>
      String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const buildXmlRow = (cells: any[], styleId?: string) => {
      const cellXmls = cells.map((cell) => {
        const val = String(cell ?? "");
        const isNum = !isNaN(Number(val)) && val.trim() !== "" && !val.startsWith("0") && val !== "-";
        const type = isNum ? "Number" : "String";
        const styleAttr = styleId ? ` ss:StyleID="${styleId}"` : isNum ? ` ss:StyleID="Number"` : "";
        return `<Cell${styleAttr}><Data ss:Type="${type}">${escapeXml(val)}</Data></Cell>`;
      });
      return `<Row>${cellXmls.join("")}</Row>`;
    };

    const excelXmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-org:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-org:office:office"
 xmlns:x="urn:schemas-microsoft-org:office:excel"
 xmlns:ss="urn:schemas-microsoft-org:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Total">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Number">
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="Borrower Payment Ledger">
  <Table>
   <Row><Cell ss:StyleID="Title"><Data ss:Type="String">${escapeXml(sheet1Title)}</Data></Cell></Row>
   <Row/>
   ${buildXmlRow(sheet1Headers, "Header")}
   ${sheet1Rows.map((r) => buildXmlRow(r)).join("\n   ")}
   ${buildXmlRow(sheet1TotalRow, "Total")}
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Daily Cash Flow Summary">
  <Table>
   <Row><Cell ss:StyleID="Title"><Data ss:Type="String">${escapeXml(sheet2Title)}</Data></Cell></Row>
   <Row/>
   ${buildXmlRow(sheet2Headers, "Header")}
   ${sheet2Rows.map((r) => buildXmlRow(r)).join("\n   ")}
   ${buildXmlRow(sheet2TotalRow, "Total")}
  </Table>
 </Worksheet>
</Workbook>`;

    // 6. Build Filename Format: line name (location)_first installment date_lastly collected date
    let lineNameWithLocation = "All Lines";
    if (selectedLine !== "all") {
      const lineObj = lines.find(
        (l) => String(l.public_id) === String(selectedLine) || String((l as any).id) === String(selectedLine)
      );
      if (lineObj) {
        lineNameWithLocation = lineObj.area ? `${lineObj.name} (${lineObj.area})` : lineObj.name;
      }
    } else if (selectedDay !== "all") {
      lineNameWithLocation = `${selectedDay.toUpperCase()} Line`;
    }

    const firstInstallmentDate = dateHeaders.length > 0 ? dateHeaders[0] : todayStr;
    const lastCollectedInstallmentDate = dateHeaders.length > 0 ? dateHeaders[dateHeaders.length - 1] : todayStr;

    const rawFileName = `${lineNameWithLocation}_${firstInstallmentDate}_to_${lastCollectedInstallmentDate}`;
    const sanitizedFileName = rawFileName.replace(/[/\\?%*:|"<>]/g, "_").trim();

    const blob = new Blob([excelXmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${sanitizedFileName}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Export Excel error:", err);
    alert("Failed to export Excel. Please try again.");
  }
}
