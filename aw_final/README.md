# American Wholesalers CMS

## File Structure

```
index.html          ← Main entry point (open this in browser)
css/
  styles.css        ← All CSS styles — edit here to change appearance
html/
  login.html        ← Login screen HTML (reference copy for editing)
  app-shell.html    ← Sidebar + main layout HTML (reference copy)
js/
  00-core.js        ← App initialization
  01-config.js      ← USERS, ROLES, NAV configuration
  02-database.js    ← Default data / DB structure
  03-utils.js       ← Shared helper functions
  05-nav.js         ← Navigation, login, routing, notifications
  01-dashboard.js   ← Dashboard page
  02-employees.js   ← Employees page
  03-attendance.js  ← Attendance page
  04-inventory.js   ← Inventory page
  05-firesale.js    ← Fire Sale page
  06-archived.js    ← Archived page
  07-replenishment.js ← Replenishment page
  08-warehouse.js   ← Warehouse page
  09-amazon.js      ← Amazon Purchases page
  10-walmart.js     ← Walmart page
  11-emergency.js   ← Emergency Shipments page
  12-pnl.js         ← P&L page
  13-liquidations.js ← Liquidations page
  14-shipping.js    ← Shipping Labels page
  15-research.js    ← Product Research + ASIN Checker
  16-clients.js     ← Client Sheets page
  17-scan.js        ← Scan page
  18-notifications.js ← Notifications page
  19-chat.js        ← Chat page
  20-faq.js         ← FAQ page
  21-calendar.js    ← Calendar page
  22-gmail.js       ← Gmail integration
  23-brands.js      ← Brands page (all 5 tabs)
  24-reports.js     ← Reports page
  25-settings.js    ← Settings + Access Control
```

## How to Run

**Option 1 — VS Code Live Server** (recommended)
1. Open the folder in VS Code
2. Right-click `index.html` → Open with Live Server

**Option 2 — Python**
```bash
cd path/to/this/folder
python -m http.server 8080
# Then open http://localhost:8080
```

**Option 3 — Any web server**
Upload all files maintaining the folder structure.

> ⚠️ Do NOT open `index.html` directly via `file://` — external JS files
> won't load due to browser security restrictions. Use a local server.

## Adding a New Page

1. Create `js/26-mypage.js` with your `pageMyPage()` function
2. Add `<script src="js/26-mypage.js"></script>` to `index.html`
3. Add your page to the NAV array in `js/01-config.js`
4. Add your page to the pages router in `js/05-nav.js`

## Editing Styles

All styles are in `css/styles.css`. CSS variables (colors, spacing) are at the top in `:root{}`.
