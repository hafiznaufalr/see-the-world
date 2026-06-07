# See The World Playlist

Hafiz's travel playlist — unlock memories one destination at a time.

## Content management

**Content lives in Google Sheets** — edit the sheet, refresh the site. No redeploy for photos or new chapters.

→ Full setup guide: **[QUICK-START.md](./QUICK-START.md)** (recommended) or **[SETUP-SHEETS.md](./SETUP-SHEETS.md)**

## Quick start

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080)

## Deploy to GitHub Pages

1. Create a repo named `see-the-world` on GitHub
2. Push this project
3. **Settings → Pages →** branch `main`, folder `/ (root)`
4. Add your Google Sheet ID to `js/config.js` and push **once**
5. Live at `https://<username>.github.io/see-the-world/`

## Project structure

```
see-the-world/
├── index.html
├── css/style.css
├── js/
│   ├── config.js       ← paste your Google Sheet ID here
│   ├── sheets.js       ← fetches data from Google Sheets
│   ├── data.js         ← fallback if sheet is not configured
│   └── app.js
├── sheet-templates/    ← import these into your Google Sheet
│   ├── destinations.csv
│   └── photos.csv
└── images/singapore/   ← optional local photos
```

## Updating content (no redeploy)

| Task | Where |
|------|-------|
| Unlock a chapter | Destinations tab → change `status` to `unlocked` |
| Add photos | Upload to Cloudinary → paste URLs in Photos tab |
| Edit hints / teasers | Destinations tab |
| Edit captions | Photos tab |
