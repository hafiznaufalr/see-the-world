/**
 * Gallery media helpers — photo URLs and YouTube embeds.
 * Paste either an image URL or a YouTube link in the Photos sheet `url` column.
 */

function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;

  const raw = url.trim();
  // ponytail: regex keeps this working without URL global (sheet helpers / tests)
  const patterns = [
    /(?:youtube(?:-nocookie)?\.com|music\.youtube\.com)\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/|vi\/|e\/)([\w-]{11})/i,
    /(?:youtube(?:-nocookie)?\.com|music\.youtube\.com)\/watch\?[^#]*?[?&]v=([\w-]{11})/i,
    /youtu\.be\/([\w-]{11})/i,
  ];

  for (let i = 0; i < patterns.length; i += 1) {
    const match = raw.match(patterns[i]);
    if (match && isValidYouTubeVideoId(match[1])) return match[1];
  }

  return null;
}

function isValidYouTubeVideoId(id) {
  return typeof id === 'string' && /^[\w-]{11}$/.test(id);
}

function youtubeThumbnailUrl(videoId) {
  return 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';
}

function youtubeEmbedUrl(videoId) {
  // www.youtube.com + referrerpolicy on iframe avoids Error 153
  return (
    'https://www.youtube.com/embed/' +
    videoId +
    '?rel=0&modestbranding=1&playsinline=1'
  );
}

function buildGalleryItem(row) {
  const url = row.url;
  if (!url) return null;

  const videoId = extractYouTubeVideoId(url);
  const explicit = String(row.type || '')
    .toLowerCase()
    .trim();
  const wantsYouTube = explicit === 'youtube' || explicit === 'video' || (!explicit && !!videoId);

  if (wantsYouTube) {
    if (!videoId) return null;
    return {
      src: url,
      alt: row.alt || 'YouTube video',
      caption: row.caption || '',
      sort: parseInt(row.sort_order, 10) || 0,
      type: 'youtube',
      videoId: videoId,
      thumb: youtubeThumbnailUrl(videoId),
    };
  }

  return {
    src: url,
    alt: row.alt || '',
    caption: row.caption || '',
    sort: parseInt(row.sort_order, 10) || 0,
    type: 'photo',
  };
}

function isYouTubeMedia(item) {
  return !!(item && item.type === 'youtube' && item.videoId);
}

function mediaThumbSrc(item) {
  if (!item) return '';
  if (isYouTubeMedia(item)) return item.thumb || youtubeThumbnailUrl(item.videoId);
  return item.src;
}

function galleryCountLabel(gallery) {
  if (!gallery || !gallery.length) return '0 photos';

  let videos = 0;
  for (let i = 0; i < gallery.length; i += 1) {
    if (isYouTubeMedia(gallery[i])) videos += 1;
  }
  const photos = gallery.length - videos;

  if (videos && !photos) return videos === 1 ? '1 video' : videos + ' videos';
  if (photos && !videos) return photos === 1 ? '1 photo' : photos + ' photos';
  return gallery.length + ' moments';
}

/** Map-node cover: Destinations.thumbnail if set, else first gallery thumb. */
function destinationCoverSrc(dest) {
  if (!dest) return '';
  if (dest.thumbnail) return dest.thumbnail;
  if (dest.gallery && dest.gallery.length) return mediaThumbSrc(dest.gallery[0]);
  return '';
}

function destinationHasVideos(dest) {
  if (!dest || !dest.gallery || !dest.gallery.length) return false;
  for (let i = 0; i < dest.gallery.length; i += 1) {
    if (isYouTubeMedia(dest.gallery[i])) return true;
  }
  return false;
}
