(function () {
  const cache = new Map();

  function resolveImageUrl(src, size) {
    if (!src) return src;

    const driveIdMatch = src.match(/[?&]id=([\w-]+)/) || src.match(/\/d\/([\w-]+)/);
    if (driveIdMatch && src.indexOf('drive.google.com') !== -1) {
      return 'https://lh3.googleusercontent.com/d/' + driveIdMatch[1] + '=w' + (size || 1200);
    }

    if (src.indexOf('googleusercontent.com/d/') !== -1 && size) {
      return src.replace(/=w\d+/, '=w' + size);
    }

    return src;
  }

  function driveThumbnailUrl(src, size) {
    const driveIdMatch = src.match(/[?&]id=([\w-]+)/) || src.match(/\/d\/([\w-]+)/);
    if (!driveIdMatch) return null;
    return 'https://drive.google.com/thumbnail?id=' + driveIdMatch[1] + '&sz=w' + (size || 1000);
  }

  function isCached(url) {
    return cache.get(url) === 'loaded';
  }

  function preloadImage(src, size) {
    const url = resolveImageUrl(src, size);
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
        const fallback = driveThumbnailUrl(src, size);
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

  function preloadDestinationThumbnails(destinations, size) {
    const tasks = destinations
      .filter(function (dest) {
        return dest.status === 'unlocked' && dest.gallery && dest.gallery.length > 0;
      })
      .map(function (dest) {
        return preloadImage(dest.gallery[0].src, size);
      });

    return Promise.allSettled(tasks);
  }

  function mapThumbnailSize() {
    return window.matchMedia('(max-width: 480px)').matches ? 120 : 200;
  }

  function galleryThumbnailSize() {
    return window.matchMedia('(max-width: 480px)').matches ? 480 : 600;
  }

  window.imageLoader = {
    resolveImageUrl: resolveImageUrl,
    driveThumbnailUrl: driveThumbnailUrl,
    isCached: isCached,
    preloadImage: preloadImage,
    preloadDestinationThumbnails: preloadDestinationThumbnails,
    mapThumbnailSize: mapThumbnailSize,
    galleryThumbnailSize: galleryThumbnailSize,
  };
})();
