(function () {
  const cache = new Map();

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
   * Build a size-limited Googleusercontent URL.
   * -rw = resize width, -k-no = never upscale, -c = center crop (map thumbs)
   */
  function buildDriveImageUrl(fileId, profileName) {
    const profile = PROFILES[profileName];
    if (!profile) {
      return 'https://lh3.googleusercontent.com/d/' + fileId + '=w800-rw-k-no';
    }

    let width = profile.width;
    if (profile.mobileWidth && isMobileViewport()) {
      width = profile.mobileWidth;
    }

    let height = profile.height;
    if (profile.crop && profile.height && profile.mobileWidth && isMobileViewport()) {
      height = profile.mobileWidth;
    }

    let suffix = '=w' + width;
    if (profile.crop && height) {
      suffix += '-h' + height + '-c';
    }
    suffix += '-rw-k-no';

    return 'https://lh3.googleusercontent.com/d/' + fileId + suffix;
  }

  function resolveImageUrl(src, sizeOrProfile) {
    if (!src) return src;

    const fileId = extractDriveFileId(src);
    if (!fileId) return src;

    if (typeof sizeOrProfile === 'string' && PROFILES[sizeOrProfile]) {
      return buildDriveImageUrl(fileId, sizeOrProfile);
    }

    const width = typeof sizeOrProfile === 'number' ? sizeOrProfile : 800;
    return 'https://lh3.googleusercontent.com/d/' + fileId + '=w' + width + '-rw-k-no';
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

  function preloadImage(src, sizeOrProfile) {
    const url = resolveImageUrl(src, sizeOrProfile);
    if (!url) return Promise.resolve(null);

    const existing = cache.get(url);
    if (existing === 'loaded') return Promise.resolve(url);
    if (existing) return existing;

    const promise = new Promise(function (resolve) {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.decoding = 'async';

      function finish(resolvedUrl) {
        cache.set(url, 'loaded');
        resolve(resolvedUrl);
      }

      img.onload = function () {
        if (img.decode) {
          img.decode().then(function () { finish(url); }).catch(function () { finish(url); });
        } else {
          finish(url);
        }
      };

      img.onerror = function () {
        const fallback = driveThumbnailUrl(src, sizeOrProfile);
        if (fallback && fallback !== url) {
          cache.delete(url);
          preloadImage(fallback, null).then(resolve);
          return;
        }
        cache.delete(url);
        resolve(null);
      };

      img.src = url;
    });

    cache.set(url, promise);
    return promise;
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
    preloadImage: preloadImage,
    preloadDestinationThumbnails: preloadDestinationThumbnails,
    mapThumbnailSize: mapThumbnailSize,
    galleryThumbnailSize: galleryThumbnailSize,
    lightboxSize: lightboxSize,
  };
})();
