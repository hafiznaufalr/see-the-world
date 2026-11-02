// ponytail: assert YouTube URL parse + gallery labels without a browser
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'media.js'), 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const {
  extractYouTubeVideoId,
  youtubeThumbnailUrl,
  youtubeEmbedUrl,
  buildGalleryItem,
  galleryCountLabel,
  isYouTubeMedia,
  mediaThumbSrc,
  destinationCoverSrc,
  destinationHasVideos,
} = sandbox;

assert(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ') === 'dQw4w9WgXcQ', 'watch');
assert(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ') === 'dQw4w9WgXcQ', 'short');
assert(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ') === 'dQw4w9WgXcQ', 'shorts');
assert(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ') === 'dQw4w9WgXcQ', 'embed');
assert(extractYouTubeVideoId('https://lh3.googleusercontent.com/d/abc') === null, 'drive not yt');

const video = buildGalleryItem({
  url: 'https://youtu.be/dQw4w9WgXcQ',
  alt: 'China reel',
  caption: 'Fog city',
  sort_order: '1',
});
assert(video && video.type === 'youtube', 'auto youtube type');
assert(video.videoId === 'dQw4w9WgXcQ', 'video id');
assert(mediaThumbSrc(video) === youtubeThumbnailUrl('dQw4w9WgXcQ'), 'thumb');
assert(youtubeEmbedUrl('dQw4w9WgXcQ').indexOf('youtube.com/embed/dQw4w9WgXcQ') !== -1, 'embed url');
assert(isYouTubeMedia(video), 'isYouTubeMedia');

const photo = buildGalleryItem({
  url: 'https://lh3.googleusercontent.com/d/abc=w800',
  alt: 'Photo',
  caption: '',
  sort_order: '2',
  type: 'photo',
});
assert(photo.type === 'photo', 'explicit photo');

assert(galleryCountLabel([video, video, video]) === '3 videos', 'videos label');
assert(galleryCountLabel([photo, photo]) === '2 photos', 'photos label');
assert(galleryCountLabel([photo, video]) === '2 moments', 'mixed label');

const forcedBad = buildGalleryItem({
  url: 'https://example.com/not-a-video',
  type: 'youtube',
});
assert(forcedBad === null, 'bad youtube skipped');

assert(
  destinationCoverSrc({ thumbnail: 'https://example.com/cover.jpg', gallery: [video] }) ===
    'https://example.com/cover.jpg',
  'custom thumbnail wins'
);
assert(
  destinationCoverSrc({ gallery: [video] }) === youtubeThumbnailUrl('dQw4w9WgXcQ'),
  'fallback youtube thumb'
);
assert(destinationHasVideos({ gallery: [video, photo] }), 'has videos');
assert(!destinationHasVideos({ gallery: [photo] }), 'photos only');

console.log('youtube media check ok');
