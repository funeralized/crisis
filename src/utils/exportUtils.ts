import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction, Cents } from '../types';
import { formatCurrency } from './index';

export interface ReportExportData {
  title: string;
  reportType: string;
  dateRange: string;
  currencySymbol?: string;
  totalIncome: Cents;
  totalExpenses: Cents;
  netCashFlow: Cents;
  savingsContributions: Cents;
  savingsRate?: number;
  categoryBreakdown: { category: string; amount: Cents; percentage: number }[];
  transactions?: Transaction[];
  comparison?: {
    incomeChange: number | null;
    expenseChange: number | null;
    netChange: number | null;
  };
}

/**
 * Generates a standard CSV string from transactions.
 * Headers: Date, Description, Category, Type, Amount
 */
export function generateCSV(transactions: Transaction[]): string {
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount (CAD)'];
  const rows = transactions.map((tx) => {
    const formattedAmount = (tx.amount / 100).toFixed(2);
    // Escape quotes in description and name
    const desc = (tx.description ? `${tx.name} - ${tx.description}` : tx.name).replace(/"/g, '""');
    const category = (tx.category || 'Uncategorized').replace(/"/g, '""');
    return `"${tx.date}","${desc}","${category}","${tx.type}","${formattedAmount}"`;
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Downloads a CSV file with the given filename.
 */
export function downloadCSV(transactions: Transaction[], filename: string = 'transactions.csv'): void {
  const csvContent = generateCSV(transactions);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a clean, professional PDF financial report using jsPDF and jspdf-autotable.
 */
export function generateReportPDF(data: ReportExportData, filename?: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = data.currencySymbol || '$';
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // Header banner / title
  doc.setFillColor(17, 17, 19); // Dark background
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent bar
  doc.setFillColor(16, 185, 129); // Accent emerald
  doc.rect(0, 36, pageWidth, 2, 'F');

  doc.setTextColor(250, 250, 250);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title.toUpperCase(), 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);
  doc.text(`Period: ${data.dateRange}   |   Generated: ${new Date().toLocaleDateString('en-CA')}`, 14, 28);

  currentY = 48;

  // Section 1: Executive Financial Summary Cards
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('FINANCIAL SUMMARY', 14, currentY);
  currentY += 6;

  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cardHeight = 22;

  const summaryCards = [
    {
      title: 'TOTAL INCOME',
      value: formatCurrency(data.totalIncome, currency),
      color: [16, 185, 129] as [number, number, number],
    },
    {
      title: 'TOTAL EXPENSES',
      value: formatCurrency(data.totalExpenses, currency),
      color: [239, 68, 68] as [number, number, number],
    },
    {
      title: 'NET CASH FLOW',
      value: formatCurrency(data.netCashFlow, currency),
      color: data.netCashFlow >= 0 ? ([16, 185, 129] as [number, number, number]) : ([239, 68, 68] as [number, number, number]),
    },
    {
      title: 'SAVINGS SAVED',
      value: formatCurrency(data.savingsContributions, currency),
      color: [59, 130, 246] as [number, number, number],
    },
  ];

  summaryCards.forEach((card, idx) => {
    const cardX = 14 + idx * (cardWidth + 3);
    doc.setFillColor(245, 245, 247);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(113, 113, 122);
    doc.text(card.title, cardX + 3, currentY + 6);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, cardX + 3, currentY + 16);
  });

  currentY += cardHeight + 10;

  // If comparison data exists, render brief comparison banner
  if (data.comparison) {
    const incComp = data.comparison.incomeChange !== null ? `${data.comparison.incomeChange > 0 ? '+' : ''}${data.comparison.incomeChange}%` : 'N/A';
    const expComp = data.comparison.expenseChange !== null ? `${data.comparison.expenseChange > 0 ? '+' : ''}${data.comparison.expenseChange}%` : 'N/A';
    const netComp = data.comparison.netChange !== null ? `${data.comparison.netChange > 0 ? '+' : ''}${data.comparison.netChange}%` : 'N/A';

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Comparison vs Previous Period: Income: ${incComp}  |  Expenses: ${expComp}  |  Net: ${netComp}`, 14, currentY);
    currentY += 8;
  }

  // Section 2: Category Breakdown Table
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('SPENDING BY CATEGORY', 14, currentY);
  currentY += 3;

  const categoryRows = data.categoryBreakdown.map((item) => [
    item.category,
    formatCurrency(item.amount, currency),
    `${item.percentage}%`,
  ]);

  if (categoryRows.length === 0) {
    categoryRows.push(['No expenses recorded for this period', '$0.00', '0%']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Category', 'Amount', '% of Total Expenses']],
    body: categoryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [250, 250, 250],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [39, 39, 42],
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    styles: {
      cellPadding: 3,
      lineColor: [228, 228, 231],
      lineWidth: 0.2,
    },
    margin: { left: 14, right: 14 },
  });

  // Calculate final Y after table
  const finalCategoryY = (doc as any).lastAutoTable?.finalY || currentY + 30;
  currentY = finalCategoryY + 12;

  // Section 3: Recent Transactions (if available)
  if (data.transactions && data.transactions.length > 0) {
    // Check if new page needed
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text('TRANSACTION LOG', 14, currentY);
    currentY += 3;

    const txRows = data.transactions.slice(0, 25).map((tx) => [
      tx.date,
      tx.name,
      tx.category,
      tx.type === 'income' ? 'Income' : 'Expense',
      `${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount, currency)}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: txRows,
      theme: 'grid',
      headStyles: {
        fillColor: [24, 24, 27],
        textColor: [250, 250, 250],
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [39, 39, 42],
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      styles: {
        cellPadding: 2.5,
        lineColor: [228, 228, 231],
        lineWidth: 0.2,
      },
      columnStyles: {
        4: { fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer on all pages
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(161, 161, 170);
    doc.text(
      `Financial Report  |  Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const exportName =
    filename || `${data.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(exportName);
}

/**
 * Copies a structured financial summary report to clipboard.
 */
export async function copyReportToClipboard(data: ReportExportData): Promise<void> {
  const currency = data.currencySymbol || '$';
  const lines: string[] = [
    `=== ${data.title.toUpperCase()} ===`,
    `Period: ${data.dateRange}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    '--- SUMMARY ---',
    `Total Income:     ${formatCurrency(data.totalIncome, currency)}`,
    `Total Expenses:   ${formatCurrency(data.totalExpenses, currency)}`,
    `Net Cash Flow:    ${formatCurrency(data.netCashFlow, currency)}`,
    `Savings Contribs: ${formatCurrency(data.savingsContributions, currency)}`,
  ];

  if (data.savingsRate !== undefined) {
    lines.push(`Savings Rate:     ${data.savingsRate}%`);
  }

  if (data.comparison) {
    lines.push('');
    lines.push('--- VS PREVIOUS PERIOD ---');
    if (data.comparison.incomeChange !== null) {
      lines.push(`Income Change:    ${data.comparison.incomeChange > 0 ? '+' : ''}${data.comparison.incomeChange}%`);
    }
    if (data.comparison.expenseChange !== null) {
      lines.push(`Expense Change:   ${data.comparison.expenseChange > 0 ? '+' : ''}${data.comparison.expenseChange}%`);
    }
    if (data.comparison.netChange !== null) {
      lines.push(`Net Change:       ${data.comparison.netChange > 0 ? '+' : ''}${data.comparison.netChange}%`);
    }
  }

  if (data.categoryBreakdown.length > 0) {
    lines.push('');
    lines.push('--- SPENDING BY CATEGORY ---');
    data.categoryBreakdown.forEach((cat) => {
      lines.push(`${cat.category.padEnd(20)} ${formatCurrency(cat.amount, currency).padStart(10)} (${cat.percentage}%)`);
    });
  }

  const text = lines.join('\n');
  await navigator.clipboard.writeText(text);
}

/**
 * Posts financial report data to a Google Sheets webhook (Google Apps Script web app).
 */
export async function sendToGoogleSheets(
  url: string,
  data: any
): Promise<{ success: boolean; error?: string }> {
  if (!url || !url.startsWith('https://script.google.com/')) {
    return {
      success: false,
      error: 'Invalid Google Apps Script URL. It must begin with https://script.google.com/',
    };
  }

  try {
    // Google Apps Script Web Apps often redirect and require no-cors mode in browser fetch
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        payload: data,
      }),
    });

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to send data to Google Sheets webhook',
    };
  }
}
