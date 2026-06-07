/**
 * See The World Playlist — Sheet Setup Script
 *
 * HOW TO USE:
 * 1. Go to https://sheets.google.com → Blank spreadsheet
 * 2. Extensions → Apps Script
 * 3. Delete any code in the editor, paste this entire file
 * 4. Click Run ▶ on "setupPlaylist" (first run: authorize when prompted)
 * 5. Sheet ID appears in:
 *    - The "Config" tab in your spreadsheet
 *    - Apps Script → Eksekusi log (after run completes)
 *    - A popup on the SPREADSHEET tab (switch away from Apps Script to see it)
 * 6. Or copy from the URL: .../spreadsheets/d/SHEET_ID/edit
 *
 * Optional: Run "createDriveFolder" to create a Google Drive folder for photos.
 */

/**
 * Run this anytime to print your Sheet ID in the execution log.
 */
function showSheetId() {
  const id = SpreadsheetApp.getActiveSpreadsheet().getId();
  Logger.log('Sheet ID: ' + id);
  SpreadsheetApp.getUi().alert('Your Sheet ID:\n\n' + id);
}

function setupPlaylist() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetId = ss.getId();

    ss.rename('See The World Playlist');
    setupDestinationsTab(ss);
    setupPhotosTab(ss);
    setupConfigTab(ss, sheetId);
    cleanupDefaultSheet(ss);

    SpreadsheetApp.flush();

    // Shows in Apps Script → Eksekusi (Execution log)
    Logger.log('=== SUCCESS ===');
    Logger.log('Sheet ID: ' + sheetId);
    Logger.log('Copy this ID into js/config.js → spreadsheetId');
    Logger.log('Also check the "Config" tab in your spreadsheet.');

    // Popup appears on the SPREADSHEET tab (not Apps Script) — switch to your sheet window
    SpreadsheetApp.getUi().alert(
      'Playlist sheet is ready!\n\nSheet ID:\n' +
        sheetId +
        '\n\n1. Copy the Sheet ID into js/config.js on your website\n' +
        '2. Share this sheet: Anyone with the link → Viewer\n' +
        '3. See the "Config" tab for your Sheet ID anytime'
    );
  } catch (err) {
    Logger.log('=== ERROR ===');
    Logger.log(err.message);
    Logger.log(err.stack);
    throw err;
  }
}

function setupConfigTab(ss, sheetId) {
  let sheet = ss.getSheetByName('Config');
  if (!sheet) sheet = ss.insertSheet('Config');
  sheet.clear();

  sheet.getRange('A1').setValue('See The World Playlist — Setup').setFontWeight('bold').setFontSize(14);
  sheet.getRange('A3').setValue('Your Sheet ID (paste into js/config.js):').setFontWeight('bold');
  sheet.getRange('A4').setValue(sheetId).setFontSize(12).setBackground('#fff3cd');
  sheet.getRange('A6').setValue('Next steps:').setFontWeight('bold');
  sheet.getRange('A7').setValue('1. Share → Anyone with the link → Viewer');
  sheet.getRange('A8').setValue('2. Paste Sheet ID into js/config.js on your website');
  sheet.getRange('A9').setValue('3. Push to GitHub once');
  sheet.setColumnWidth(1, 420);
}

function cleanupDefaultSheet(ss) {
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && ss.getSheets().length > 2) {
    ss.deleteSheet(sheet1);
  }
}

function setupDestinationsTab(ss) {
  let sheet = ss.getSheetByName('Destinations');
  if (!sheet) {
    sheet = ss.getSheetByName('Sheet1') || ss.insertSheet('Destinations');
    sheet.setName('Destinations');
  }
  sheet.clear();

  const headers = ['order', 'status', 'title', 'subtitle', 'teaser', 'hint'];
  const rows = [
    [1, 'unlocked', 'Chapter I', 'The Garden City', '', ''],
    [
      2,
      'locked',
      'Chapter II',
      '???',
      'Train · Coffee · Caves',
      'Where trains pierce through towers, white coffee steams at dawn, and limestone cliffs hide temples older than memory.',
    ],
    [
      3,
      'locked',
      'Chapter III',
      '???',
      'Fog · Monorail · Fire',
      "A vertical city wrapped in fog, where the railway disappears into someone's living room and the spice burns twice.",
    ],
    [
      4,
      'locked',
      'Chapter IV',
      '???',
      'Powder · Onsen · Silence',
      'Powder dreams beneath sacred peaks. After the descent, steam rises from cedar baths while snow falls without sound.',
    ],
    [
      5,
      'locked',
      'Chapter V',
      '???',
      'Road · Fjord · Middle-earth',
      'Roads that feel borrowed from a fantasy map. Emerald hills, sheep outnumber people, and the ocean carved fjords into the land.',
    ],
    [
      6,
      'locked',
      'Chapter VI',
      '???',
      'Aurora · Fjord · Midnight',
      "When green fire dances across a black sky and the sun refuses to set, you'll understand why Vikings looked up and believed.",
    ],
    [
      7,
      'locked',
      'Chapter VII',
      '???',
      'Skates · Tree · Taxi',
      'Ice skates carve circles beneath a tower of lights. Yellow cabs honk through winter magic on avenues that never sleep.',
    ],
    [
      8,
      'locked',
      'Chapter VIII',
      '???',
      'Pilgrimage · Cube · Dawn',
      'Millions walk the same circle around an ancient cube. The call echoes at dawn across a desert that holds the holiest square on earth.',
    ],
    [
      9,
      'locked',
      'Chapter IX',
      '???',
      'Mirror · Salt · Altitude',
      'When the rains come, heaven falls to earth. The sky mirrors itself across endless white salt at 3,600 meters above the sea.',
    ],
    [
      10,
      'locked',
      'Chapter X',
      '???',
      'Dunes · Caravan · Stars',
      'Golden waves swallow the horizon. Caravans cross dunes that shift every night, and stars feel close enough to touch.',
    ],
    [
      11,
      'locked',
      'Final Chapter',
      '???',
      'Penguin · Ice · End of Map',
      'At the end of all maps, penguins march in formation and icebergs calve with a sound like thunder. No flag claims this place.',
    ],
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function setupPhotosTab(ss) {
  let sheet = ss.getSheetByName('Photos');
  if (!sheet) sheet = ss.insertSheet('Photos');
  sheet.clear();

  const headers = ['destination_order', 'sort_order', 'url', 'alt', 'caption'];
  const captions = [
    ['Marina Bay skyline at dusk', 'Where the bay meets the sky'],
    ['Gardens by the Bay Supertrees', 'Trees that glow at night'],
    ['Hawker centre food spread', 'A table worth the queue'],
    ['Chinatown shophouses', 'Colors on every corner'],
    ['Merlion fountain', 'The icon everyone finds first'],
    ['Little India street', 'Spices in the air'],
    ['Sentosa beach sunset', 'Golden hour by the shore'],
    ['Haji Lane murals', 'Walls that tell stories'],
    ['Night market lights', 'The city that never sleeps early'],
    ['Botanic Gardens path', 'Green in the middle of glass'],
    ['Kampong Glam mosque', 'Gold dome, quiet heart'],
    ['MRT station architecture', 'Underground, always on time'],
    ['Satay by the river', 'Smoke and peanut sauce'],
    ['Jewel Changi waterfall', 'Rain indoors, on purpose'],
    ['East Coast Park cycling', 'Wind in your hair'],
    ['Clarke Quay at night', 'Neon reflected on water'],
    ['MacRitchie treetop walk', 'Above the canopy'],
    ['Kaya toast breakfast', 'Soft eggs, strong kopi'],
  ];

  const rows = captions.map(function (item, i) {
    const num = String(i + 1).padStart(2, '0');
    return [1, i + 1, 'images/singapore/' + num + '.jpg', item[0], item[1]];
  });

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Creates a Drive folder structure for your travel photos.
 * Run once, then upload photos into the chapter subfolders.
 */
function createDriveFolder() {
  const root = DriveApp.createFolder('See The World Photos');

  const chapters = [
    '01 - Singapore',
    '02 - Malaysia',
    '03 - Locked',
    '04 - Locked',
    '05 - Locked',
    '06 - Locked',
    '07 - Locked',
    '08 - Locked',
    '09 - Locked',
    '10 - Locked',
    '11 - Locked',
  ];

  chapters.forEach(function (name) {
    root.createFolder(name);
  });

  root.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  SpreadsheetApp.getUi().alert(
    'Drive folder created!\n\n' +
      root.getName() +
      '\n\nOpen Google Drive and upload photos into each chapter folder.\n\n' +
      'Then run "generatePhotoUrls" to build URLs for the Photos tab.'
  );
}

/**
 * Reads images from "01 - Singapore" folder and writes Drive URLs into Photos tab.
 * Update FOLDER_NAME when you add photos for other chapters.
 */
function generatePhotoUrlsFromDrive() {
  const FOLDER_NAME = '01 - Singapore';
  const DESTINATION_ORDER = 1;

  const root = DriveApp.getFoldersByName('See The World Photos');
  if (!root.hasNext()) {
    SpreadsheetApp.getUi().alert('Run "createDriveFolder" first.');
    return;
  }

  const chapterFolder = root
    .next()
    .getFoldersByName(FOLDER_NAME);
  if (!chapterFolder.hasNext()) {
    SpreadsheetApp.getUi().alert('Folder not found: ' + FOLDER_NAME);
    return;
  }

  const fileIterator = chapterFolder.next().getFiles();
  const imageFiles = [];
  let skippedHeic = 0;

  while (fileIterator.hasNext()) {
    const file = fileIterator.next();
    const mime = file.getMimeType();
    const name = file.getName().toLowerCase();

    if (mime.indexOf('image/') !== 0) continue;

    // HEIC/HEIF won't display in web browsers — convert to JPG first
    if (mime === 'image/heif' || mime === 'image/heic' || name.endsWith('.heic') || name.endsWith('.heif')) {
      skippedHeic++;
      continue;
    }

    imageFiles.push(file);
  }

  // Drive API returns files in arbitrary order — sort by filename (matches Drive "Name" sort)
  imageFiles.sort(function (a, b) {
    return a.getName().localeCompare(b.getName(), undefined, { numeric: true, sensitivity: 'base' });
  });

  const photos = imageFiles.map(function (file, index) {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const url = 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w1200';
    return [DESTINATION_ORDER, index + 1, url, file.getName(), ''];
  });

  if (photos.length === 0) {
    var msg = 'No web-ready images found in "' + FOLDER_NAME + '".';
    if (skippedHeic > 0) {
      msg += '\n\nSkipped ' + skippedHeic + ' HEIC file(s). Convert to JPG first, then re-upload.';
    } else {
      msg += ' Upload JPG or PNG photos first.';
    }
    SpreadsheetApp.getUi().alert(msg);
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Photos');

  // Remove existing rows for this destination
  const data = sheet.getDataRange().getValues();
  const kept = [data[0]];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(DESTINATION_ORDER)) kept.push(data[i]);
  }

  sheet.clear();
  sheet.getRange(1, 1, kept.length, kept[0].length).setValues(kept);
  sheet
    .getRange(kept.length + 1, 1, photos.length, photos[0].length)
    .setValues(photos);

  SpreadsheetApp.getUi().alert(
    'Added ' + photos.length + ' photo URLs from Drive to the Photos tab.' +
      (skippedHeic > 0
        ? '\n\nSkipped ' + skippedHeic + ' HEIC file(s) — convert those to JPG and re-upload.'
        : '')
  );
}
