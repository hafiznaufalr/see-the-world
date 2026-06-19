# Google Sheets Setup

Your site reads content from a Google Sheet at runtime. **Edit the sheet → refresh the site.** No redeploy needed.

---

## Step 1 — Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it something like **See The World Playlist**
3. Create two tabs at the bottom:
   - `Destinations`
   - `Photos`

---

## Step 2 — Import the template data

1. Open the `Destinations` tab
2. **File → Import → Upload** → select `sheet-templates/destinations.csv`
3. Choose **Replace current sheet**
4. Repeat for the `Photos` tab with `sheet-templates/photos.csv`

> Column headers must stay exactly as they are — the site reads them by name.

---

## Step 3 — Make the sheet public (read-only)

1. Click **Share** (top right)
2. Under **General access**, set to **Anyone with the link → Viewer**
3. Click **Done**

The site only reads data. Nobody can edit unless you invite them.

---

## Step 4 — Connect the sheet to your site

1. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_ID/edit
   ```
2. Open `js/config.js` in your project
3. Paste the ID:
   ```js
   spreadsheetId: 'YOUR_SHEET_ID_HERE',
   ```
4. **Deploy once** (push to GitHub). After that, all content updates happen in the sheet only.

---

## Sheet reference

### Destinations tab

| Column   | Example              | Notes                                      |
|----------|----------------------|--------------------------------------------|
| order    | 1                    | Chapter number (1–11)                      |
| status   | unlocked / locked    | Controls whether gallery is visible        |
| title    | Chapter I            | Shown in gallery header                    |
| subtitle | The Garden City      | Shown when unlocked; use `???` if locked   |
| teaser   | Train · Coffee · Caves | Short tags shown on locked cards         |
| hint     | Where trains pierce… | Full hint shown when clicking a locked card |

### Photos tab

| Column            | Example                        | Notes                                |
|-------------------|--------------------------------|--------------------------------------|
| destination_order | 1                              | Matches `order` in Destinations      |
| sort_order        | 1                              | Display order within the gallery     |
| url               | https://res.cloudinary.com/…   | Full image URL (see below)           |
| alt               | Marina Bay at dusk             | Accessibility text                   |
| caption           | Where the bay meets the sky    | Shown in lightbox                    |

---

## Adding photos (Cloudinary — free)

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier is enough)
2. Go to **Media Library → Upload**
3. Upload your photos
4. Click a photo → copy the **URL**
5. Paste into the `url` column in the **Photos** tab

You can also use:
- **Relative paths** for images in your repo: `images/singapore/01.jpg`
- Any public image URL (Imgur, etc.)

Cloudinary is recommended — no git push needed when adding photos.

---

## After your Malaysia trip

**Using Drive (Apps Script):**
1. Upload photos to **See The World Photos → 02 - Malaysia**
2. Run **`unlockMalaysiaChapter`** in Apps Script
3. Refresh the site

**Using Cloudinary or manual URLs:**
1. Upload photos to Cloudinary (or Drive, copy URLs)
2. In **Photos** tab — add rows with `destination_order = 2`
3. In **Destinations** tab — update row 2:
   - `status` → `unlocked`
   - `subtitle` → e.g. `The Train Through Towers`
4. Refresh the site

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Site shows fallback data | Check `spreadsheetId` in `js/config.js` |
| "Could not load from Google Sheets" | Sheet must be **Anyone with link → Viewer** |
| Tab names don't match | Tabs must be named exactly `Destinations` and `Photos` |
| Changes not showing | Hard refresh (Cmd+Shift+R). Google may cache for ~1 min |
| Photos broken | URL must be public and start with `https://` |

---

## Local testing without a sheet

Leave `spreadsheetId: ''` empty in `js/config.js`. The site uses built-in fallback data from `js/data.js`.
