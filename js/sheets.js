async function fetchSheetTab(spreadsheetId, sheetName) {
  const url =
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load "${sheetName}" (HTTP ${response.status})`);
  }

  const text = await response.text();
  return parseGvizResponse(text);
}

function parseGvizResponse(text) {
  const json = JSON.parse(text.substring(47, text.length - 2));
  const columns = json.table.cols.map((col) => (col.label || '').toLowerCase().trim());

  return json.table.rows
    .map((row) => {
      const entry = {};
      row.c.forEach((cell, index) => {
        const key = columns[index];
        if (!key) return;
        entry[key] = cell == null || cell.v == null ? '' : String(cell.v).trim();
      });
      return entry;
    })
    .filter((row) => Object.keys(row).length > 0);
}

function groupPhotos(photoRows) {
  const grouped = {};

  photoRows.forEach((row) => {
    const destinationOrder = parseInt(row.destination_order, 10);
    if (Number.isNaN(destinationOrder)) return;

    if (!grouped[destinationOrder]) grouped[destinationOrder] = [];

    grouped[destinationOrder].push({
      src: row.url,
      alt: row.alt || '',
      caption: row.caption || '',
      sort: parseInt(row.sort_order, 10) || 0,
    });
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => a.sort - b.sort);
  });

  return grouped;
}

function buildDestinations(destinationRows, photoRows) {
  const photosByDestination = groupPhotos(photoRows);

  return destinationRows
    .sort((a, b) => parseInt(a.order, 10) - parseInt(b.order, 10))
    .map((row) => {
      const order = parseInt(row.order, 10);
      const status = (row.status || 'locked').toLowerCase();
      const isUnlocked = status === 'unlocked';
      const gallery = (photosByDestination[order] || []).map(({ src, alt, caption }) => ({
        src,
        alt,
        caption,
      }));

      return {
        id: `chapter-${order}`,
        status: isUnlocked ? 'unlocked' : 'locked',
        title: row.title || `Chapter ${order}`,
        subtitle: row.subtitle || '???',
        teaser: row.teaser || '',
        hint: row.hint || '',
        gallery: isUnlocked ? gallery : null,
      };
    });
}

async function loadDestinationsFromSheets(config) {
  const [destinationRows, photoRows] = await Promise.all([
    fetchSheetTab(config.spreadsheetId, config.destinationsTab),
    fetchSheetTab(config.spreadsheetId, config.photosTab),
  ]);

  const destinations = destinationRows.filter(
    (row) => row.order && !Number.isNaN(parseInt(row.order, 10))
  );
  const photos = photoRows.filter(
    (row) => row.destination_order && row.url
  );

  return buildDestinations(destinations, photos);
}
