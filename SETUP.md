# Trustana Assistant — Setup Guide

## What's included
- `trustana-assistant.html` — the complete portal (preview + deploy)
- `pages/index.js` — Vercel-ready Next.js version
- `pages/api/chat.js` — server-side API route (keeps API key safe)
- `package.json` — dependencies

---

## Step 1 — Preview it locally

Double-click `trustana-assistant.html` — it opens in Chrome/Safari.
The chat UI and all navigation works. The AI chat will be live once you add your API key (Step 3).

---

## Step 2 — Set up Google Sheets logging (free, 10 min)

This logs every question candidates ask, with a timestamp. No backend required.

### 2a — Create the Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it "Trustana Assistant Logs"
3. In Row 1, add headers: `Timestamp` | `Question`

### 2b — Create the Apps Script
1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete everything in the editor and paste this code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      new Date(data.timestamp),
      data.question
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click **Save** (floppy disk icon), name the project "Trustana Logger"
4. Click **Deploy → New deployment**
5. Click the gear icon next to "Type" → select **Web app**
6. Set:
   - Description: `Trustana question logger`
   - Execute as: `Me`
   - Who has access: `Anyone`
7. Click **Deploy** → click **Authorize access** → sign in with Google → Allow
8. Copy the **Web app URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

### 2c — Paste the URL into the HTML file
Open `trustana-assistant.html` in a text editor (Notepad, TextEdit, VS Code).
Find this line near the top of the `<script>` section:

```javascript
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
```

Replace `YOUR_APPS_SCRIPT_URL_HERE` with your copied URL. Save the file.

---

## Step 3 — Deploy to Vercel (get a shareable URL)

### 3a — GitHub
1. Create a free account at [github.com](https://github.com)
2. Create a new **private** repository called `trustana-assistant`
3. Upload the `pages/` folder and `package.json` from this zip

### 3b — Vercel
1. Create a free account at [vercel.com](https://vercel.com) (sign in with GitHub)
2. Click **Add New Project** → import your `trustana-assistant` repo
3. Leave all settings as default → click **Deploy**
4. You'll get a URL like `trustana-assistant.vercel.app`

### 3c — Add your API key
1. In Vercel: **Project → Settings → Environment Variables**
2. Add: Name = `ANTHROPIC_API_KEY`, Value = your key from [console.anthropic.com](https://console.anthropic.com)
3. Click **Save** → go to **Deployments** → **Redeploy**

### 3d — Add your Apps Script URL to Vercel
In the same Environment Variables section, add:
- Name = `APPS_SCRIPT_URL`
- Value = your Apps Script URL from Step 2c

Done — share `trustana-assistant.vercel.app` with candidates.

---

## Updating content

All the text the AI knows lives in the `SYSTEM_PROMPT` inside `pages/api/chat.js`.
To update it: edit the file on GitHub → Vercel auto-redeploys in ~30 seconds.

What you can add to the system prompt:
- Salary bands per role
- Specific team structures
- Company values or mission statement
- Any FAQs you want it to answer consistently

---

## Optional — Password protection
If you want to limit access to candidates with the link only (not publicly searchable):
Vercel → Project → Settings → Password Protection → enable and set a password.
