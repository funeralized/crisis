# Vault — Premium Personal Finance & Budgeting OS

**Vault** is a personal finance operating system that combines the visual quality of Linear, the financial dashboards of modern banking applications, and the customizability of Notion.

Built with a dark-first aesthetic, local IndexedDB persistence, drag-and-drop dashboard widgets, real financial visualizations, and installable PWA capabilities optimized for iOS Safari.

---

## Key Features

### 1. Design & Experience
- **Dark-First Fintech Aesthetic**: Deep charcoal backgrounds (`#0a0a0b`, `#111113`, `#141416`), layered borders, muted secondary typography, and crisp white headings.
- **Color Discipline**: Emerald green for income, positive balances, and achievements; rose red for expenses and limit warnings; electric blue and violet for progress and analytics.
- **Spinning Circle Loaders**: Fluid animated concentric ring loaders for page transitions and data operations.
- **iOS PWA Optimized**: Apple status bar styling, safe-area insets (`env(safe-area-inset-top)` / `bottom`), no-bounce layout, and offline caching via Service Worker.

### 2. Main Dashboard & Customizable Widgets
- **Financial Pulse**: Real-time Total Balance, Monthly Income, Monthly Expenses, and Monthly Savings Rate with period-over-period trend badges.
- **Draggable & Resizable Grid**: Click **Edit Dashboard** to rearrange widgets with smooth drag handles, resize cards, remove widgets, or add new ones from the widget catalog:
  - *Income vs Expenses* (interactive grouped bar chart)
  - *Spending Breakdown* (interactive category donut chart)
  - *Monthly Savings Timeline* (smooth area growth curve)
  - *Category Budget Progress* (metered progress bars with threshold alerts)
  - *Recent Transactions* (compact categorized ledger)
  - *Savings Goals Overview* (goal completion badges)
  - *Cash Flow & Weekly Spending Trends*

### 3. Transaction Ledger
- Add, edit, and delete transactions with integer-cents accuracy (no floating-point rounding errors).
- Distinguish between **Income** and **Expenses**.
- Assign categories, dates, bank accounts, tags, notes, and recurring intervals (weekly, bi-weekly, monthly, yearly).
- Real-time instant search across names, tags, categories, and accounts.
- Filter by date range (This Month, Last 30 Days, Year-to-Date, Custom Date Range), category, and transaction type.
- Sortable columns and mobile-responsive card view.

### 4. Savings Goals Engine
- Dedicated goal workspaces with historical progress tracking and contribution logs.
- Prepopulated with editable starter funds:
  - **Car Fund** ($4,500 target)
  - **Moving Out Fund** ($12,000 target)
  - **Business Fund** ($500 target)
- Quick deposit and withdrawal modals with live balance previews.
- Automated monthly contribution requirement calculations based on target dates and average past deposit velocity.

### 5. Category Budgeting
- Monthly spending limits per category (Transportation, Personal Care, Subscriptions, Food, Entertainment, Shopping, Education, Business, Housing, etc.).
- Visual progress bars with three dynamic threshold states:
  - **Normal** (< 70%): Muted emerald
  - **Caution** (70% – 90%): Amber alert
  - **Over Budget** (> 90% / 100%+): Crimson alert badge
- Month-over-month historical comparison.

### 6. Income Management & Hourly Calculator
- Tracks diverse income streams: Hourly Employment, Freelance Marketing, Game Development, Roblox Group Revenue, and Passive/Other.
- Hourly Wage calculator ($18.00/hr × 8 hrs/week) with automatic weekly ($144), monthly ($576), and annual projections.
- Strict separation between **Projected Anticipated Income** and **Actual Received Income** to prevent counting unearned cash as available balance.

### 7. Financial Reports & Sharing
- Weekly, Monthly, Quarterly, Annual, and Custom range financial reports.
- **One-Click "Share Report"**:
  - Export professional PDF document via `jsPDF` and `jspdf-autotable`.
  - Export structured CSV file for spreadsheet analysis.
  - Copy structured markdown summary directly to clipboard.

### 8. Google Sheets Integration
- **Method A (CSV Export)**: Download formatted CSV optimized for instant import into Google Sheets (`File > Import > Upload`).
- **Method B (Google Apps Script Webhook)**: Send reports and transaction streams directly to a Google Sheet with automatic duplicate prevention using unique transaction IDs.

### 9. Local Data Sovereignty & Backup
- Complete client-side storage powered by browser **IndexedDB** (`idb`).
- Instant full database JSON export & restore.
- One-click sample data reset or cleanup.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Development Run

```bash
# Navigate to the project directory
cd finance-app

# Install dependencies (if not already installed)
npm install

# Start Vite local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build & Preview

```bash
# Typecheck and compile production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## iOS Native App & `.ipa` Build

The project is now fully configured as a native iOS application using **Capacitor 8** with an Xcode project located in `ios/App`.

### Method 1: Automated 1-Click `.ipa` Build (No Mac Required)
This repository includes a ready-to-run GitHub Actions workflow in `.github/workflows/build-ipa.yml`.

1. Push this project to your GitHub repository.
2. Go to the **Actions** tab on your GitHub repo.
3. Select **Build iOS IPA** and click **Run workflow** (or simply push to `main`).
4. Once the build finishes (takes ~2 minutes on macOS runners), download the **Vault-iOS-IPA** artifact containing `Vault.ipa`.
5. Install `Vault.ipa` onto your iPhone using:
   - **AltStore** (Wirelessly or USB)
   - **Sideloadly** (Windows or Mac)
   - **TrollStore** (if compatible with your iOS version)
   - **Scarlet** or **MapleSign**

### Method 2: Building Locally on a Mac
If you have a Mac:

```bash
# 1. Build web app and sync native iOS project
npm run build:ios

# 2. Open Xcode
npm run open:ios
```

In Xcode:
1. Select your target device (or Generic iOS Device).
2. Go to **Product > Archive**.
3. Once archived, click **Distribute App** > **Custom** > **Ad Hoc** or **Development** / **Direct Export** to generate your signed `Vault.ipa`.

---

## iOS PWA Installation (Alternative Without Sideloading)

1. Host the application on an HTTPS URL (e.g. Vercel, Netlify, Cloudflare Pages, or a local HTTPS proxy).
2. Open Safari on your iPhone and navigate to your hosted URL.
3. Tap the **Share** button (box with an arrow pointing up) in Safari's bottom toolbar.
4. Scroll down and tap **Add to Home Screen**.
5. Confirm the name (**Vault**) and tap **Add** in the top right.
6. Launch **Vault** directly from your home screen. It will open in full-screen standalone mode without URL bars or browser controls, equipped with iOS safe-area adaptation and offline storage.

---

## Google Sheets Integration (Google Apps Script)

### Step 1: Create a Google Sheet
1. Open Google Sheets and create a new blank spreadsheet.
2. In the top menu, go to **Extensions > Apps Script**.

### Step 2: Paste the Webhook Script
Replace any code in `Code.gs` with the following:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Transactions') || ss.insertSheet('Transactions');
    
    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['ID', 'Date', 'Name', 'Category', 'Type', 'Amount ($)', 'Account', 'Notes', 'Recurring']);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#18181b').setFontColor('#fafafa');
    }
    
    // Read existing transaction IDs to avoid duplicates
    var existingIds = {};
    if (sheet.getLastRow() > 1) {
      var idValues = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < idValues.length; i++) {
        existingIds[idValues[i][0]] = true;
      }
    }
    
    var appendedCount = 0;
    var transactions = data.transactions || [];
    
    for (var j = 0; j < transactions.length; j++) {
      var tx = transactions[j];
      if (!existingIds[tx.id]) {
        sheet.appendRow([
          tx.id,
          tx.date,
          tx.name,
          tx.category,
          tx.type,
          (tx.amount / 100).toFixed(2),
          tx.account || 'Default',
          tx.description || '',
          tx.isRecurring ? 'Yes' : 'No'
        ]);
        existingIds[tx.id] = true;
        appendedCount++;
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Processed transactions',
      appended: appendedCount
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    service: 'Vault Google Sheets Webhook'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### Step 3: Deploy as Web App
1. Click **Deploy > New deployment**.
2. Select type: **Web app**.
3. Set **Execute as**: *Me*.
4. Set **Who has access**: *Anyone*.
5. Click **Deploy**, authorize permissions, and copy the **Web app URL**.

### Step 4: Connect in Vault
1. In Vault, navigate to **Settings > Google Sheets Integration**.
2. Paste the Web App URL into the **Webhook URL** input.
3. Click **Test Connection** to verify communication, then click **Sync Transactions to Google Sheets**.

---

## Data Structure & Decimal Safety

To avoid IEEE 754 floating-point inaccuracies common in JavaScript monetary math (`0.1 + 0.2 === 0.30000000000000004`), Vault represents all financial balances, budgets, limits, and transactions as **integer cents** (`Cents = number`). Conversion to formatted currency or decimal floats occurs exclusively at display boundaries using `formatCurrency(cents)` and `centsToDollars(cents)`.
