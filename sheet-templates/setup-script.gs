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
 * PHOTOS FROM DRIVE:
 * - Run "createDriveFolder" once to create chapter folders
 * - Upload JPG/PNG into the chapter folder (not HEIC)
 * - Run a chapter helper from the dropdown, e.g. "generateMalaysiaPhotos"
 * - Or call generatePhotoUrlsFromDrive('02 - Malaysia', 2) with your own params
 *
 * UNLOCK MALAYSIA (photos already in Drive):
 * - Run "unlockMalaysiaChapter" — imports photos + unlocks Chapter II in one step
 *
 * CHINA / YOUTUBE VIDEOS (no photo upload):
 * - Paste watch / youtu.be / Shorts links in Photos `url` column (optional type=youtube)
 * - Or run unlockChinaChapter() — uses CHINA_YOUTUBE_URLS below
 */

var DRIVE_ROOT_NAME = 'See The World Photos';

/** China Chapter III — YouTube embeds (no Drive photos) */
var CHINA_YOUTUBE_URLS = [
  'https://youtu.be/7nHkb7oBTOw',
  'https://youtu.be/b1r2h6w8tTc',
  'https://youtu.be/cayZ1G_-FAY',
];

/** @type {Array<{order:number, folder:string, subtitle:string}>} */
var CHAPTERS = [
  { order: 1, folder: '01 - Singapore', subtitle: 'The Garden City' },
  { order: 2, folder: '02 - Malaysia', subtitle: 'The Train Through Towers' },
  { order: 3, folder: '03 - China', subtitle: 'China 🇨🇳 (2026)' },
  { order: 4, folder: '04 - Locked', subtitle: '???' },
  { order: 5, folder: '05 - Locked', subtitle: '???' },
  { order: 6, folder: '06 - Locked', subtitle: '???' },
  { order: 7, folder: '07 - Locked', subtitle: '???' },
  { order: 8, folder: '08 - Locked', subtitle: '???' },
  { order: 9, folder: '09 - Locked', subtitle: '???' },
  { order: 10, folder: '10 - Locked', subtitle: '???' },
  { order: 11, folder: '11 - Locked', subtitle: 'Final Chapter' },
];

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

    Logger.log('=== SUCCESS ===');
    Logger.log('Sheet ID: ' + sheetId);
    Logger.log('Copy this ID into js/config.js → spreadsheetId');
    Logger.log('Also check the "Config" tab in your spreadsheet.');

    SpreadsheetApp.getUi().alert(
      'Playlist sheet is ready!\n\nSheet ID:\n' +
        sheetId +
        '\n\n1. Copy the Sheet ID into js/config.js on your website\n' +
        '2. Share this sheet: Anyone with the link → Viewer\n' +
        '3. See the "Config" tab for your Sheet ID anytime\n' +
        '4. Upload photos to Drive, then run generateMalaysiaPhotos (or unlockMalaysiaChapter)'
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
  sheet.getRange('A10').setValue('4. Drive photos: run generateMalaysiaPhotos or unlockMalaysiaChapter');
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
    [2, 'unlocked', 'Chapter II', 'The Train Through Towers', '', ''],
    [
      3,
      'locked',
      'Chapter III',
      'China 🇨🇳 (2026)',
      'Fog · Monorail · Cyberpunk',
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

  // type is optional: photo | youtube. Empty / missing → auto-detect from url.
  const headers = ['destination_order', 'sort_order', 'url', 'alt', 'caption', 'type'];
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
    return [1, i + 1, 'images/singapore/' + num + '.jpg', item[0], item[1], 'photo'];
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
  const root = DriveApp.createFolder(DRIVE_ROOT_NAME);

  CHAPTERS.forEach(function (chapter) {
    root.createFolder(chapter.folder);
  });

  root.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  SpreadsheetApp.getUi().alert(
    'Drive folder created!\n\n' +
      root.getName() +
      '\n\nOpen Google Drive and upload photos into each chapter folder.\n\n' +
      'Then run:\n' +
      '• generateSingaporePhotos\n' +
      '• generateMalaysiaPhotos\n' +
      '• unlockMalaysiaChapter (photos + unlock in one step)'
  );
}

/**
 * Look up chapter config by order (1–11) or folder name.
 */
function getChapterConfig(orderOrFolder) {
  if (orderOrFolder == null || orderOrFolder === '') return null;

  if (typeof orderOrFolder === 'number' || String(orderOrFolder).match(/^\d+$/)) {
    const order = Number(orderOrFolder);
    for (var i = 0; i < CHAPTERS.length; i++) {
      if (CHAPTERS[i].order === order) return CHAPTERS[i];
    }
    return null;
  }

  const folderName = String(orderOrFolder);
  for (var j = 0; j < CHAPTERS.length; j++) {
    if (CHAPTERS[j].folder === folderName) return CHAPTERS[j];
  }
  return null;
}

/**
 * Import Drive photos into the Photos tab for one chapter.
 *
 * @param {string} folderName - Drive subfolder, e.g. '02 - Malaysia'
 * @param {number} destinationOrder - Matches Destinations.order, e.g. 2
 * @param {Object=} options
 * @param {boolean=} options.silent - Skip success alert (for batch runs)
 * @returns {number} Number of photos added
 */
function generatePhotoUrlsFromDrive(folderName, destinationOrder, options) {
  options = options || {};

  if (!folderName || folderName === '') {
    throw new Error('folderName is required, e.g. "02 - Malaysia"');
  }
  if (destinationOrder == null || destinationOrder === '' || isNaN(Number(destinationOrder))) {
    throw new Error('destinationOrder is required, e.g. 2');
  }

  destinationOrder = Number(destinationOrder);

  const root = DriveApp.getFoldersByName(DRIVE_ROOT_NAME);
  if (!root.hasNext()) {
    SpreadsheetApp.getUi().alert('Run "createDriveFolder" first.');
    return 0;
  }

  const chapterFolder = root.next().getFoldersByName(folderName);
  if (!chapterFolder.hasNext()) {
    SpreadsheetApp.getUi().alert('Folder not found: ' + folderName);
    return 0;
  }

  const fileIterator = chapterFolder.next().getFiles();
  const imageFiles = [];
  let skippedHeic = 0;

  while (fileIterator.hasNext()) {
    const file = fileIterator.next();
    const mime = file.getMimeType();
    const name = file.getName().toLowerCase();

    if (mime.indexOf('image/') !== 0) continue;

    if (mime === 'image/heif' || mime === 'image/heic' || name.endsWith('.heic') || name.endsWith('.heif')) {
      skippedHeic++;
      continue;
    }

    imageFiles.push(file);
  }

  imageFiles.sort(function (a, b) {
    return a.getName().localeCompare(b.getName(), undefined, { numeric: true, sensitivity: 'base' });
  });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Photos');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Photos tab not found. Run setupPlaylist first.');
    return 0;
  }

  const data = sheet.getDataRange().getValues();
  const kept = data.length
    ? [data[0]]
    : [['destination_order', 'sort_order', 'url', 'alt', 'caption', 'type']];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(destinationOrder)) kept.push(data[i]);
  }

  const hasType = kept[0].map(String).some(function (h) {
    return String(h).toLowerCase().trim() === 'type';
  });

  const photos = imageFiles.map(function (file, index) {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    // Client requests WebP via -rw (JPEG fallback in js/images.js)
    const url = 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w800-rw-lo-l78-k-no';
    const row = [destinationOrder, index + 1, url, file.getName(), ''];
    if (hasType) row.push('photo');
    return row;
  });

  if (photos.length === 0) {
    var msg = 'No web-ready images found in "' + folderName + '".';
    if (skippedHeic > 0) {
      msg += '\n\nSkipped ' + skippedHeic + ' HEIC file(s). Convert to JPG first, then re-upload.';
    } else {
      msg += '\n\nUpload JPG or PNG photos first.';
    }
    SpreadsheetApp.getUi().alert(msg);
    return 0;
  }

  const allRows = kept.concat(photos);
  const width = allRows[0].length;
  const normalized = allRows.map(function (row) {
    const copy = row.slice();
    while (copy.length < width) copy.push('');
    return copy.slice(0, width);
  });

  sheet.clear();
  sheet.getRange(1, 1, normalized.length, width).setValues(normalized);
  sheet.setFrozenRows(1);

  if (!options.silent) {
    SpreadsheetApp.getUi().alert(
      'Chapter ' +
        destinationOrder +
        ' — added ' +
        photos.length +
        ' photo URL(s) from "' +
        folderName +
        '".' +
        (skippedHeic > 0
          ? '\n\nSkipped ' + skippedHeic + ' HEIC file(s) — convert those to JPG and re-upload.'
          : '')
    );
  }

  Logger.log('generatePhotoUrlsFromDrive: ' + folderName + ' → ' + photos.length + ' photos');
  return photos.length;
}

/**
 * Import photos using chapter order (looks up folder from CHAPTERS).
 * @param {number} chapterOrder - 1–11
 */
function generatePhotoUrlsForChapter(chapterOrder) {
  const chapter = getChapterConfig(chapterOrder);
  if (!chapter) {
    SpreadsheetApp.getUi().alert('Unknown chapter order: ' + chapterOrder);
    return 0;
  }
  return generatePhotoUrlsFromDrive(chapter.folder, chapter.order);
}

/** Run from dropdown — Singapore (Chapter I) */
function generateSingaporePhotos() {
  return generatePhotoUrlsForChapter(1);
}

/** Run from dropdown — Malaysia (Chapter II) */
function generateMalaysiaPhotos() {
  return generatePhotoUrlsForChapter(2);
}

/**
 * Unlock a destination row in the Destinations tab.
 * @param {number} order - Chapter order (1–11)
 * @param {string=} subtitle - Shown when unlocked; defaults to CHAPTERS config
 */
function unlockDestination(order, subtitle) {
  const chapter = getChapterConfig(order);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Destinations');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Destinations tab not found.');
    return false;
  }

  const data = sheet.getDataRange().getValues();
  const resolvedSubtitle = subtitle || (chapter ? chapter.subtitle : '');

  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(order)) {
      sheet.getRange(i + 1, 2).setValue('unlocked');
      if (resolvedSubtitle) sheet.getRange(i + 1, 4).setValue(resolvedSubtitle);
      sheet.getRange(i + 1, 5).setValue('');
      sheet.getRange(i + 1, 6).setValue('');
      SpreadsheetApp.flush();
      Logger.log('Unlocked destination order ' + order + ' → ' + resolvedSubtitle);
      return true;
    }
  }

  SpreadsheetApp.getUi().alert('Destination order ' + order + ' not found in Destinations tab.');
  return false;
}

/**
 * One-step Malaysia unlock: imports Drive photos + unlocks Chapter II.
 * Upload photos to "02 - Malaysia" first, then run this.
 */
function unlockMalaysiaChapter() {
  const count = generatePhotoUrlsFromDrive('02 - Malaysia', 2, { silent: true });
  if (count === 0) return;

  unlockDestination(2, 'The Train Through Towers');

  SpreadsheetApp.getUi().alert(
    'Malaysia chapter is live!\n\n' +
      '• ' +
      count +
      ' photo(s) added to Photos tab\n' +
      '• Chapter II unlocked in Destinations tab\n\n' +
      'Refresh your website to see the update.'
  );
}

/**
 * Import photos for every chapter folder that has images.
 * Skips empty folders silently.
 */
function generateAllChapterPhotos() {
  let total = 0;
  let chapters = 0;

  CHAPTERS.forEach(function (chapter) {
    const count = generatePhotoUrlsFromDrive(chapter.folder, chapter.order, { silent: true });
    if (count > 0) {
      total += count;
      chapters++;
      Logger.log(chapter.folder + ': ' + count + ' photos');
    }
  });

  SpreadsheetApp.getUi().alert(
    chapters > 0
      ? 'Imported ' + total + ' photo(s) across ' + chapters + ' chapter(s).'
      : 'No photos found in any chapter folder.'
  );
}

/**
 * Replace Photos rows for one chapter with YouTube links (no Drive upload).
 * Site auto-detects youtube.com / youtu.be / Shorts URLs in the url column.
 *
 * @param {number} destinationOrder - Matches Destinations.order
 * @param {string[]|string} youtubeUrls - Array of links, or newline/comma-separated string
 * @param {Object=} options
 * @param {boolean=} options.silent - Skip success alert
 * @param {string[]=} options.alts - Optional alt text per video
 * @param {string[]=} options.captions - Optional caption per video
 * @returns {number} Number of videos written
 *
 * Example:
 *   setChapterYouTubeVideos(3, CHINA_YOUTUBE_URLS);
 */
function setChapterYouTubeVideos(destinationOrder, youtubeUrls, options) {
  options = options || {};

  if (destinationOrder == null || destinationOrder === '' || isNaN(Number(destinationOrder))) {
    throw new Error('destinationOrder is required, e.g. 3');
  }
  destinationOrder = Number(destinationOrder);

  var urls = normalizeYouTubeUrlList(youtubeUrls);
  if (!urls.length) {
    SpreadsheetApp.getUi().alert(
      'No YouTube URLs provided.\n\nExample:\nsetChapterYouTubeVideos(3, ["https://youtu.be/...", "https://youtu.be/..."])'
    );
    return 0;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Photos');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Photos tab not found. Run setupPlaylist first.');
    return 0;
  }

  const data = sheet.getDataRange().getValues();
  const header = data.length ? data[0] : ['destination_order', 'sort_order', 'url', 'alt', 'caption', 'type'];
  const hasType = header.map(String).some(function (h) {
    return String(h).toLowerCase().trim() === 'type';
  });

  const kept = [header];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(destinationOrder)) kept.push(data[i]);
  }

  const alts = options.alts || [];
  const captions = options.captions || [];
  const videos = urls.map(function (url, index) {
    const row = [
      destinationOrder,
      index + 1,
      url,
      alts[index] || 'YouTube video ' + (index + 1),
      captions[index] || '',
    ];
    if (hasType) row.push('youtube');
    return row;
  });

  // Ensure type column exists when writing youtube rows on older sheets
  if (!hasType) {
    kept[0] = header.concat(['type']);
    for (var k = 1; k < kept.length; k++) {
      while (kept[k].length < kept[0].length - 1) kept[k].push('');
      kept[k].push('photo');
    }
    videos.forEach(function (row) {
      row.push('youtube');
    });
  }

  const allRows = kept.concat(videos);
  const width = allRows[0].length;
  const normalized = allRows.map(function (row) {
    const copy = row.slice();
    while (copy.length < width) copy.push('');
    return copy.slice(0, width);
  });

  sheet.clear();
  sheet.getRange(1, 1, normalized.length, width).setValues(normalized);
  sheet.setFrozenRows(1);

  if (!options.silent) {
    SpreadsheetApp.getUi().alert(
      'Chapter ' + destinationOrder + ' — wrote ' + videos.length + ' YouTube video link(s).'
    );
  }

  Logger.log('setChapterYouTubeVideos: order ' + destinationOrder + ' → ' + videos.length + ' videos');
  return videos.length;
}

function normalizeYouTubeUrlList(youtubeUrls) {
  if (!youtubeUrls) return [];
  if (Object.prototype.toString.call(youtubeUrls) === '[object Array]') {
    return youtubeUrls
      .map(function (u) {
        return String(u || '').trim();
      })
      .filter(Boolean);
  }

  return String(youtubeUrls)
    .split(/[\n,]+/)
    .map(function (u) {
      return u.trim();
    })
    .filter(Boolean);
}

/**
 * One-step China unlock with YouTube embeds (no photos).
 * Run unlockChinaChapter from the Apps Script dropdown (uses CHINA_YOUTUBE_URLS),
 * or pass custom links: unlockChinaChapter(['https://youtu.be/...']).
 *
 * @param {string[]|string=} youtubeUrls - Defaults to CHINA_YOUTUBE_URLS
 */
function unlockChinaChapter(youtubeUrls) {
  const urls = youtubeUrls == null || youtubeUrls === '' ? CHINA_YOUTUBE_URLS : youtubeUrls;
  const count = setChapterYouTubeVideos(3, urls, { silent: true });
  if (count === 0) return;

  unlockDestination(3, 'China 🇨🇳 (2026)');

  SpreadsheetApp.getUi().alert(
    'China chapter is live!\n\n' +
      '• ' +
      count +
      ' YouTube video(s) added to Photos tab\n' +
      '• Chapter III unlocked in Destinations tab\n\n' +
      'Refresh your website to see the embeds.'
  );
}
