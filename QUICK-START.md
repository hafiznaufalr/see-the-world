# Quick Start — Google Sheet + Drive

Follow these steps in order. Takes about 10 minutes.

---

## Part 1 — Create the Google Sheet (automatic)

### 1. Open a new spreadsheet
Go to **[sheets.new](https://sheets.new)** (sign in with your Google account)

### 2. Open Apps Script
**Extensions → Apps Script**

### 3. Paste the setup script
- Delete everything in the editor
- Open `sheet-templates/setup-script.gs` from this project
- Copy the entire file and paste it into Apps Script
- Click **Save** (name the project "See The World Setup")

### 4. Run the setup
- In the dropdown at the top, select **`setupPlaylist`**
- Click **Run ▶**
- First time: click **Review permissions → Allow** (this only sets up YOUR sheet)
- A popup shows your **Sheet ID** — copy it

### 5. Share the sheet
- Back in Google Sheets, click **Share**
- Set to **Anyone with the link → Viewer**
- Done — your sheet is live

### 6. Connect to your website
Open `js/config.js` and paste your Sheet ID:

```js
spreadsheetId: 'paste-your-id-here',
```

Push to GitHub once. After this, all updates happen in the sheet only.

---

## Part 2 — Google Drive for photos (optional)

Use Drive if you want to upload photos from your phone/laptop without Cloudinary.

### 1. Create photo folders
In Apps Script, select **`createDriveFolder`** from the dropdown → **Run ▶**

This creates in your Google Drive:
```
See The World Photos/
  01 - Singapore/
  02 - Malaysia/
  03 - Locked/
  ...
  11 - Locked/
```

### 2. Upload your photos

> **Important: convert HEIC to JPG first.** iPhone photos (.HEIC) won't display on websites. Only upload **JPG** or **PNG**.

**Convert on iPhone (before uploading):**
- Settings → Camera → Formats → **Most Compatible** (future photos)
- For existing photos: open in Photos → Share → **Save to Files** as JPG, or use a free converter app

**Convert on Mac:**
- Select HEIC files → open with Preview → File → Export → **JPEG**

- Open [Google Drive](https://drive.google.com)
- Go to **See The World Photos → 01 - Singapore**
- Drag and drop your **JPG** photos

### 3. Auto-generate URLs for the sheet
Back in Apps Script:
- Edit `generatePhotoUrlsFromDrive` if needed (folder name + chapter number)
- Select **`generatePhotoUrlsFromDrive`** → **Run ▶**

This writes image URLs into the **Photos** tab automatically.

### Manual Drive URL (if you prefer)
For any photo in Drive:
1. Right-click → **Share → Anyone with the link → Viewer**
2. Copy the link: `https://drive.google.com/file/d/FILE_ID/view`
3. Convert to direct image URL:
   ```
   https://drive.google.com/uc?export=view&id=FILE_ID
   ```
4. Paste into the **url** column in the Photos tab

---

## Part 3 — After your Malaysia trip

1. Upload photos to **See The World Photos → 02 - Malaysia**
2. In Apps Script, update `generatePhotoUrlsFromDrive`:
   ```js
   const FOLDER_NAME = '02 - Malaysia';
   const DESTINATION_ORDER = 2;
   ```
3. Run **`generatePhotoUrlsFromDrive`**
4. In **Destinations** tab, row 2:
   - `status` → `unlocked`
   - `subtitle` → your name (e.g. `The Train Through Towers`)
5. Refresh your website

---

## Checklist

- [ ] Created sheet via Apps Script (`setupPlaylist`)
- [ ] Copied Sheet ID into `js/config.js`
- [ ] Shared sheet as **Anyone with link → Viewer**
- [ ] Pushed to GitHub once
- [ ] (Optional) Created Drive folders (`createDriveFolder`)
- [ ] (Optional) Uploaded photos and ran `generatePhotoUrlsFromDrive`

---

## Troubleshooting

**"Authorization required" when running script**
→ Click Allow. The script only accesses your own Sheet and Drive.

**Photos don't show on website**
→ Drive file must be shared as **Anyone with the link → Viewer**
→ URL must use format: `https://drive.google.com/uc?export=view&id=FILE_ID`
→ **HEIC files won't work** — convert to JPG first, re-upload to Drive, then update URLs in the Photos tab (or re-run `generatePhotoUrlsFromDrive`)

**Site still shows old data**
→ Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

**Need help?** Paste your Sheet ID here and I can verify the config line for you.
