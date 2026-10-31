import React, { useState, useRef } from 'react';
import { useFinance } from '../store/FinanceContext';
import { useToast } from '../components/ui/Toast';
import {
  parseCurrencyInput,
  centsToDollars,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
} from '../utils';
import { downloadCSV, sendToGoogleSheets } from '../utils/exportUtils';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Settings,
  DollarSign,
  Database,
  Download,
  Upload,
  Trash2,
  FileSpreadsheet,
  Send,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Copy,
  Check,
  HardDrive,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const CURRENCY_OPTIONS = [
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar (CAD)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar (AUD)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)' },
];

const SAMPLE_APPS_SCRIPT = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Check if headers exist
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Type", "Category", "Amount", "Description"]);
    }
    
    if (data.payload && data.payload.transactions) {
      data.payload.transactions.forEach(function(tx) {
        sheet.appendRow([
          tx.date,
          tx.type,
          tx.category,
          (tx.amount / 100).toFixed(2),
          tx.name
        ]);
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    transactions,
    savingsGoals,
    budgetCategories,
    incomeSources,
    exportData,
    importData,
    clearSampleData,
    clearAllData,
  } = useFinance();

  const { success, error: toastError, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General settings state
  const [startingBalanceStr, setStartingBalanceStr] = useState(
    (centsToDollars(settings.startingBalance)).toFixed(2)
  );
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState(settings.googleSheetsWebhookUrl || '');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [isScriptGuideOpen, setIsScriptGuideOpen] = useState(false);
  const [hasCopiedScript, setHasCopiedScript] = useState(false);

  // Dialogs state
  const [isClearSampleOpen, setIsClearSampleOpen] = useState(false);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [isProcessingClear, setIsProcessingClear] = useState(false);

  // Handle Currency change
  const handleCurrencyChange = async (currencyCode: string) => {
    const selected = CURRENCY_OPTIONS.find((c) => c.code === currencyCode);
    if (!selected) return;

    await updateSettings({
      currency: selected.code,
      currencySymbol: selected.symbol,
    });
    success(`Default currency changed to ${selected.name}`);
  };

  // Handle Starting Balance save
  const handleSaveStartingBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingBalance(true);
      const cents = parseCurrencyInput(startingBalanceStr);
      await updateSettings({ startingBalance: cents });
      success('Starting balance saved successfully.');
    } catch (err: any) {
      toastError(err?.message || 'Failed to update starting balance');
    } finally {
      setIsSavingBalance(false);
    }
  };

  // Handle JSON export
  const handleExportBackup = async () => {
    try {
      const jsonString = await exportData();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `vault_finance_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success('JSON backup exported successfully.');
    } catch (err: any) {
      toastError(err?.message || 'Failed to export backup');
    }
  };

  // Handle JSON file input import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await importData(content);
        success('Data backup imported successfully!');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        toastError('Invalid backup file. Import failed.');
      }
    };
    reader.readAsText(file);
  };

  // Handle Clear Sample Data
  const handleClearSampleConfirm = async () => {
    try {
      setIsProcessingClear(true);
      await clearSampleData();
      setIsClearSampleOpen(false);
      success('Sample transactions and goals removed.');
    } catch (err: any) {
      toastError(err?.message || 'Failed to clear sample data');
    } finally {
      setIsProcessingClear(false);
    }
  };

  // Handle Clear ALL Data
  const handleClearAllConfirm = async () => {
    try {
      setIsProcessingClear(true);
      await clearAllData();
      setIsClearAllOpen(false);
      success('All financial records have been reset.');
    } catch (err: any) {
      toastError(err?.message || 'Failed to reset all data');
    } finally {
      setIsProcessingClear(false);
    }
  };

  // Webhook save & test
  const handleSaveWebhook = async () => {
    await updateSettings({ googleSheetsWebhookUrl: webhookUrl.trim() });
    success('Webhook URL saved.');
  };

  const handleTestConnection = async () => {
    if (!webhookUrl.trim()) {
      toastError('Please enter a valid Google Apps Script webhook URL.');
      return;
    }

    try {
      setIsTestingWebhook(true);
      const res = await sendToGoogleSheets(webhookUrl.trim(), {
        action: 'test_connection',
        timestamp: new Date().toISOString(),
      });

      if (res.success) {
        await updateSettings({
          googleSheetsWebhookUrl: webhookUrl.trim(),
          googleSheetsLastSync: new Date().toISOString(),
        });
        success('Connection verified! Google Sheets webhook is responding.');
      } else {
        toastError(res.error || 'Connection failed.');
      }
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSendReport = async () => {
    if (!webhookUrl.trim()) {
      toastError('Please enter a Google Apps Script webhook URL first.');
      return;
    }

    try {
      setIsSendingReport(true);
      const income = calculateMonthlyIncome(transactions);
      const expenses = calculateMonthlyExpenses(transactions);

      const reportPayload = {
        action: 'monthly_sync',
        month: new Date().toISOString().slice(0, 7),
        totalIncome: income,
        totalExpenses: expenses,
        netCashFlow: income - expenses,
        transactions: transactions.slice(0, 50),
      };

      const res = await sendToGoogleSheets(webhookUrl.trim(), reportPayload);
      if (res.success) {
        const nowIso = new Date().toISOString();
        await updateSettings({ googleSheetsLastSync: nowIso });
        success('Live report pushed to Google Sheets successfully!');
      } else {
        toastError(res.error || 'Failed to push report to Google Sheets.');
      }
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleCopyScript = async () => {
    await navigator.clipboard.writeText(SAMPLE_APPS_SCRIPT);
    setHasCopiedScript(true);
    info('Apps Script code copied to clipboard!');
    setTimeout(() => setHasCopiedScript(false), 3000);
  };

  const handleDownloadGoogleSheetsCSV = () => {
    downloadCSV(transactions, `google_sheets_export_${new Date().toISOString().split('T')[0]}.csv`);
    success('Google Sheets compatible CSV generated.');
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <PageHeader
        title="Settings & Integrations"
        description="Configure preferences, manage data backups, and synchronize with external tools"
        icon={<Settings className="w-6 h-6" />}
      />

      {/* Section A: General Settings */}
      <section className="card p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#27272a]">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-[#fafafa]">General Preferences</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Currency Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] mb-2">
              Default Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg py-2.5 px-3 text-sm text-[#fafafa] focus:border-emerald-500"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <p className="text-xs text-[#71717a] mt-1.5">
              All dashboard amounts, charts, and export calculations will format with this currency.
            </p>
          </div>

          {/* Starting Balance Input */}
          <form onSubmit={handleSaveStartingBalance}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] mb-2">
              Starting Account Balance ({settings.currencySymbol})
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.01"
                  value={startingBalanceStr}
                  onChange={(e) => setStartingBalanceStr(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg py-2 pl-8 pr-3 text-sm text-[#fafafa] font-semibold"
                />
                <span className="absolute left-3 top-2 text-[#71717a] font-medium text-sm">
                  {settings.currencySymbol}
                </span>
              </div>
              <Button type="submit" variant="secondary" size="md" isLoading={isSavingBalance}>
                Update
              </Button>
            </div>
            <p className="text-xs text-[#71717a] mt-1.5">
              Initial funds on hand before tracked deposits and expenses.
            </p>
          </form>
        </div>
      </section>

      {/* Section B: Data Management */}
      <section className="card p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#27272a]">
          <Database className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-[#fafafa]">Data Management & Backups</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* JSON Export */}
          <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#fafafa]">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export JSON Backup</span>
              </div>
              <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
                Download a complete, offline snapshot of your transactions, goals, income sources, and custom budgets.
              </p>
            </div>
            <div className="mt-4">
              <Button onClick={handleExportBackup} variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                Export Backup File
              </Button>
            </div>
          </div>

          {/* JSON Import */}
          <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#fafafa]">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Import JSON Backup</span>
              </div>
              <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
                Restore your financial database from a previously exported backup file.
              </p>
            </div>
            <div className="mt-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
                id="json-file-input"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                size="sm"
                icon={<Upload className="w-3.5 h-3.5" />}
              >
                Choose Backup File
              </Button>
            </div>
          </div>
        </div>

        {/* Destructive Actions */}
        <div className="pt-4 border-t border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Danger Zone</span>
            </div>
            <p className="text-xs text-[#71717a] mt-0.5">
              Reset default template items or wipe local browser storage completely.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearSampleOpen(true)}
              className="text-[#a1a1aa] hover:text-red-400 hover:border-red-500/40"
            >
              Clear Sample Data
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsClearAllOpen(true)}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear ALL Data
            </Button>
          </div>
        </div>
      </section>

      {/* Section C: Google Sheets Integration */}
      <section className="card p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-[#fafafa]">Google Sheets Integration</h2>
              <p className="text-xs text-[#a1a1aa] mt-0.5">Sync records to Google Drive spreadsheets</p>
            </div>
          </div>
          {settings.googleSheetsLastSync && (
            <div className="text-right">
              <div className="text-[10px] text-[#71717a] uppercase font-semibold">Last Synced</div>
              <div className="text-xs font-medium text-emerald-400">
                {new Date(settings.googleSheetsLastSync).toLocaleString('en-CA')}
              </div>
            </div>
          )}
        </div>

        {/* Method A: Google Sheets Compatible CSV */}
        <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[#fafafa] flex items-center gap-1.5">
              <span className="px-2 py-0.5 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-mono">
                Method A
              </span>
              <span>Direct CSV File Import</span>
            </div>
            <p className="text-xs text-[#a1a1aa] mt-1">
              Download formatted CSV that can be opened immediately via Google Sheets File &rarr; Import.
            </p>
          </div>
          <Button
            onClick={handleDownloadGoogleSheetsCSV}
            variant="secondary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download CSV
          </Button>
        </div>

        {/* Method B: Live Webhook */}
        <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm font-semibold text-[#fafafa] flex items-center gap-1.5">
              <span className="px-2 py-0.5 text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-mono">
                Method B
              </span>
              <span>Automated Webhook (Google Apps Script)</span>
            </div>
            {settings.googleSheetsLastSync && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] mb-1.5">
              Apps Script Web App URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                onBlur={handleSaveWebhook}
                className="flex-1 bg-[#141416] border border-[#27272a] rounded-lg py-2 px-3 text-xs text-[#fafafa] font-mono placeholder-[#52525b]"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestConnection}
                isLoading={isTestingWebhook}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Test Connection
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendReport}
                isLoading={isSendingReport}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Send Report
              </Button>
            </div>
          </div>

          {/* Expandable Setup Guide */}
          <div className="border border-[#27272a] rounded-lg overflow-hidden bg-[#141416]">
            <button
              type="button"
              onClick={() => setIsScriptGuideOpen(!isScriptGuideOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                Setup Guide: How to deploy your free Google Sheets Webhook in 2 minutes
              </span>
              {isScriptGuideOpen ? (
                <ChevronUp className="w-4 h-4 text-[#71717a]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#71717a]" />
              )}
            </button>

            {isScriptGuideOpen && (
              <div className="p-4 border-t border-[#27272a] text-xs text-[#a1a1aa] space-y-3 bg-[#111113]">
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>
                    Open a new spreadsheet in <a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-0.5">Google Sheets <ExternalLink className="w-3 h-3" /></a>
                  </li>
                  <li>In the top menu, navigate to <strong>Extensions &rarr; Apps Script</strong>.</li>
                  <li>Delete any existing template code and paste the script snippet below:</li>
                </ol>

                <div className="relative mt-2">
                  <pre className="p-3 bg-[#0a0a0b] border border-[#27272a] rounded-lg font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-48">
                    {SAMPLE_APPS_SCRIPT}
                  </pre>
                  <button
                    onClick={handleCopyScript}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-[#27272a] text-xs text-[#fafafa] hover:bg-[#3f3f46] flex items-center gap-1"
                  >
                    {hasCopiedScript ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{hasCopiedScript ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>

                <ol start={4} className="list-decimal list-inside space-y-1.5 pt-1">
                  <li>Click <strong>Deploy &rarr; New Deployment</strong>.</li>
                  <li>Click gear icon &rarr; Select <strong>Web App</strong>.</li>
                  <li>Set <strong>Execute as:</strong> Me, and <strong>Who has access:</strong> Anyone.</li>
                  <li>Click Deploy, copy the Web App URL, and paste it into the URL field above!</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section D: About & System Info */}
      <section className="card p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#27272a]">
          <HardDrive className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-[#fafafa]">About & System Info</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
            <div className="text-[10px] uppercase font-semibold text-[#71717a]">Application</div>
            <div className="text-sm font-bold text-[#fafafa] mt-1">Vault Finance PWA</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">v1.0.0 (Production)</div>
          </div>

          <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
            <div className="text-[10px] uppercase font-semibold text-[#71717a]">Stored Transactions</div>
            <div className="text-sm font-bold text-[#fafafa] mt-1">{transactions.length}</div>
            <div className="text-[11px] text-[#71717a] mt-0.5">IndexedDB local</div>
          </div>

          <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
            <div className="text-[10px] uppercase font-semibold text-[#71717a]">Savings Goals</div>
            <div className="text-sm font-bold text-[#fafafa] mt-1">{savingsGoals.length}</div>
            <div className="text-[11px] text-[#71717a] mt-0.5">Active targets</div>
          </div>

          <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
            <div className="text-[10px] uppercase font-semibold text-[#71717a]">Income Sources</div>
            <div className="text-sm font-bold text-[#fafafa] mt-1">{incomeSources.length}</div>
            <div className="text-[11px] text-[#71717a] mt-0.5">{budgetCategories.length} categories</div>
          </div>
        </div>
      </section>

      {/* Confirmation Dialog: Clear Sample Data */}
      <ConfirmDialog
        isOpen={isClearSampleOpen}
        onCancel={() => setIsClearSampleOpen(false)}
        onConfirm={handleClearSampleConfirm}
        title="Clear Sample Records"
        message="This will remove the demonstration transactions and starter sample goals, leaving only your personal data intact."
        confirmText="Clear Sample Data"
        isLoading={isProcessingClear}
      />

      {/* Confirmation Dialog: Clear ALL Data */}
      <ConfirmDialog
        isOpen={isClearAllOpen}
        onCancel={() => setIsClearAllOpen(false)}
        onConfirm={handleClearAllConfirm}
        title="Reset All Financial Data"
        message="DANGER: This will permanently wipe all transactions, custom categories, income sources, and savings records from this browser. This cannot be undone. Make sure you export a JSON backup first!"
        confirmText="Erase All Records"
        isDestructive={true}
        isLoading={isProcessingClear}
      />
    </div>
  );
}
