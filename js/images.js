(function () {
  const cache = new Map();
  const WEBP_QUALITY = 78;

  const PROFILES = {
    map: { width: 160, height: 160, mobileWidth: 128, crop: true },
    gallery: { width: 520, mobileWidth: 360 },
    lightbox: { width: 1280, mobileWidth: 960 },
  };

  function isMobileViewport() {
    return window.matchMedia('(max-width: 480px)').matches;
  }

  function extractDriveFileId(src) {
    if (!src) return null;
    const driveIdMatch = src.match(/[?&]id=([\w-]+)/) || src.match(/\/d\/([\w-]+)/);
    return driveIdMatch ? driveIdMatch[1] : null;
  }

  /**
   * Googleusercontent URL suffix (Blogger / Drive CDN params):
   * - w# / h# = max dimensions, -c = center crop
   * - rw = WebP output, rj = JPEG output
   * - lo = lossy, l# = quality (1–100), k-no = never upscale
   */
  function buildDriveImageSuffix(width, height, crop, format) {
    let suffix = '=w' + width;
    if (crop && height) suffix += '-h' + height + '-c';
    suffix += format === 'jpeg' ? '-rj-lo-l' + WEBP_QUALITY : '-rw-lo-l' + WEBP_QUALITY;
    suffix += '-k-no';
    return suffix;
  }

  function getProfileDimensions(profile) {
    let width = profile.width;
    if (profile.mobileWidth && isMobileViewport()) width = profile.mobileWidth;

    let height = profile.height;
    if (profile.crop && profile.height && profile.mobileWidth && isMobileViewport()) {
      height = profile.mobileWidth;
    }

    return { width: width, height: height, crop: !!profile.crop };
  }

  function buildDriveImageUrl(fileId, profileName, format) {
    format = format || 'webp';
    const profile = PROFILES[profileName];

    if (!profile) {
      return (
        'https://lh3.googleusercontent.com/d/' +
        fileId +
        buildDriveImageSuffix(800, null, false, format)
      );
    }

    const dims = getProfileDimensions(profile);
    return (
      'https://lh3.googleusercontent.com/d/' +
      fileId +
      buildDriveImageSuffix(dims.width, dims.height, dims.crop, format)
    );
  }

  function resolveImageUrl(src, sizeOrProfile, format) {
    if (!src) return src;

    const fileId = extractDriveFileId(src);
    if (!fileId) return src;

    format = format || 'webp';

    if (typeof sizeOrProfile === 'string' && PROFILES[sizeOrProfile]) {
      return buildDriveImageUrl(fileId, sizeOrProfile, format);
    }

    const width = typeof sizeOrProfile === 'number' ? sizeOrProfile : 800;
    return (
      'https://lh3.googleusercontent.com/d/' +
      fileId +
      buildDriveImageSuffix(width, null, false, format)
    );
  }

  function driveThumbnailUrl(src, sizeOrProfile) {
    const fileId = extractDriveFileId(src);
    if (!fileId) return null;

    let width = 800;
    if (typeof sizeOrProfile === 'string' && PROFILES[sizeOrProfile]) {
      const profile = PROFILES[sizeOrProfile];
      width = profile.mobileWidth && isMobileViewport() ? profile.mobileWidth : profile.width;
    } else if (typeof sizeOrProfile === 'number') {
      width = sizeOrProfile;
    }

    return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w' + width;
  }

  function isCached(url) {
    return cache.get(url) === 'loaded';
  }

  function isProfileCached(src, profile) {
    return (
      isCached(resolveImageUrl(src, profile, 'webp')) ||
      isCached(resolveImageUrl(src, profile, 'jpeg'))
    );
  }

  function loadImageUrl(url) {
    if (!url) return Promise.resolve(null);

    const existing = cache.get(url);
    if (existing === 'loaded') return Promise.resolve(url);
    if (existing) return existing;

    const promise = new Promise(function (resolve, reject) {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.decoding = 'async';

      img.onload = function () {
        const done = function () {
          cache.set(url, 'loaded');
          resolve(url);
        };
        if (img.decode) {
          img.decode().then(done).catch(done);
        } else {
          done();
        }
      };

      img.onerror = function () {
        cache.delete(url);
        reject(new Error('Image load failed'));
      };

      img.src = url;
    });

    cache.set(url, promise);
    return promise;
  }

  function preloadImage(src, sizeOrProfile) {
    const webpUrl = resolveImageUrl(src, sizeOrProfile, 'webp');
    const jpegUrl = resolveImageUrl(src, sizeOrProfile, 'jpeg');

    if (isCached(webpUrl)) return Promise.resolve(webpUrl);
    if (isCached(jpegUrl)) return Promise.resolve(jpegUrl);

    const inflight = cache.get('inflight:' + webpUrl);
    if (inflight) return inflight;

    const promise = loadImageUrl(webpUrl)
      .catch(function () {
        if (jpegUrl !== webpUrl) return loadImageUrl(jpegUrl);
        throw new Error('WebP and JPEG URLs identical');
      })
      .catch(function () {
        const thumb = driveThumbnailUrl(src, sizeOrProfile);
        if (thumb) return loadImageUrl(thumb);
        return null;
      });

    cache.set('inflight:' + webpUrl, promise);
    promise.finally(function () {
      cache.delete('inflight:' + webpUrl);
    });

    return promise;
  }

  function preloadGalleryImages(photos) {
    return Promise.allSettled(
      photos.map(function (photo) {
        return preloadImage(photo.src, 'gallery');
      })
    );
  }

  function preloadLightboxImages(photos) {
    return Promise.allSettled(
      photos.map(function (photo) {
        return preloadImage(photo.src, 'lightbox');
      })
    );
  }

  function preloadLightboxNeighbors(photos, index, radius) {
    radius = radius == null ? 2 : radius;
    const tasks = [];
    for (let i = index - radius; i <= index + radius; i += 1) {
      if (i < 0 || i >= photos.length || i === index) continue;
      tasks.push(preloadImage(photos[i].src, 'lightbox'));
    }
    return Promise.allSettled(tasks);
  }

  function preloadDestinationThumbnails(destinations) {
    const tasks = destinations
      .filter(function (dest) {
        return dest.status === 'unlocked' && dest.gallery && dest.gallery.length > 0;
      })
      .map(function (dest) {
        return preloadImage(dest.gallery[0].src, 'map');
      });

    return Promise.allSettled(tasks);
  }

  function mapThumbnailSize() {
    return isMobileViewport() ? PROFILES.map.mobileWidth || 128 : PROFILES.map.width;
  }

  function galleryThumbnailSize() {
    return isMobileViewport() ? PROFILES.gallery.mobileWidth : PROFILES.gallery.width;
  }

  function lightboxSize() {
    return isMobileViewport() ? PROFILES.lightbox.mobileWidth : PROFILES.lightbox.width;
  }

  window.imageLoader = {
    resolveImageUrl: resolveImageUrl,
    driveThumbnailUrl: driveThumbnailUrl,
    isCached: isCached,
    isProfileCached: isProfileCached,
    preloadImage: preloadImage,
    preloadGalleryImages: preloadGalleryImages,
    preloadLightboxImages: preloadLightboxImages,
    preloadLightboxNeighbors: preloadLightboxNeighbors,
    preloadDestinationThumbnails: preloadDestinationThumbnails,
    mapThumbnailSize: mapThumbnailSize,
    galleryThumbnailSize: galleryThumbnailSize,
    lightboxSize: lightboxSize,
  };
})();
