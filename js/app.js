(function () {
  const grid = document.getElementById('playlist-grid');
  const errorEl = document.getElementById('error');
  const progressCount = document.getElementById('progress-count');
  const progressFill = document.getElementById('progress-fill');
  const progressBar = document.getElementById('progress-bar');

  const galleryModal = document.getElementById('gallery-modal');
  const galleryChapter = document.getElementById('gallery-chapter');
  const galleryTitle = document.getElementById('gallery-title');
  const galleryGrid = document.getElementById('gallery-grid');
  const galleryClose = document.getElementById('gallery-close');

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxLoader = document.getElementById('lightbox-loader');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  const lockedModal = document.getElementById('locked-modal');
  const lockedChapter = document.getElementById('locked-chapter');
  const lockedTitle = document.getElementById('locked-title');
  const lockedTeaser = document.getElementById('locked-teaser');
  const lockedHint = document.getElementById('locked-hint');
  const lockedClose = document.getElementById('locked-close');

  let destinations = [];
  let currentGallery = [];
  let lightboxIndex = 0;
  let lightboxLoadId = 0;
  let unlockSequenceRunning = false;
  let nodePathLengths = [];

  const UNLOCK_SEEN_KEY = 'stw-last-animated-dest-index';
  const UNLOCK_INITIAL_DELAY_MS = 450;
  const UNLOCK_STAGGER_MS = 550;
  const UNLOCK_STAGGER_MOBILE_MS = 400;
  const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  if (isTouchDevice) {
    document.documentElement.classList.add('touch-device');
  }

  function resolveImageUrl(src, sizeOrProfile, format) {
    if (window.imageLoader) return window.imageLoader.resolveImageUrl(src, sizeOrProfile, format);
    return src;
  }

  function getUnlockStaggerMs() {
    return window.matchMedia('(max-width: 480px)').matches ? UNLOCK_STAGGER_MOBILE_MS : UNLOCK_STAGGER_MS;
  }

  function getLastAnimatedIndex() {
    const stored = localStorage.getItem(UNLOCK_SEEN_KEY);
    if (stored == null || stored === '') return -1;
    const value = parseInt(stored, 10);
    return Number.isNaN(value) ? -1 : value;
  }

  function setLastAnimatedIndex(index) {
    localStorage.setItem(UNLOCK_SEEN_KEY, String(index));
  }

  function fallbackSrc(index) {
    return `https://picsum.photos/seed/singapore-${index + 1}/800/600`;
  }

  function updateProgress(overrideCount) {
    const unlocked = overrideCount !== undefined ? overrideCount : getUnlockedCount();
    const total = destinations.length;

    progressCount.innerHTML = '';
    progressCount.appendChild(icon('compass'));
    const countText = document.createElement('span');
    countText.textContent = `${unlocked} / ${total}`;
    progressCount.appendChild(countText);

    progressFill.style.width = `${total ? (unlocked / total) * 100 : 0}%`;
    progressBar.setAttribute('aria-valuemax', total);
    progressBar.setAttribute('aria-valuenow', unlocked);
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function getUnlockedCount() {
    return destinations.filter((d) => d.status === 'unlocked').length;
  }

  function initStaticIcons() {
    setIcon(document.getElementById('hero-icon'), 'globe');
    setIcon(galleryClose, 'x');
    setIcon(lightboxClose, 'x');
    setIcon(lightboxPrev, 'chevronLeft');
    setIcon(lightboxNext, 'chevronRight');
    setIcon(document.getElementById('locked-icon'), 'lock');
  }

  function createImageWithFallback(src, alt, fallbackIndex, size, options) {
    options = options || {};
    const img = document.createElement('img');
    const url = resolveImageUrl(src, size);
    img.alt = alt;
    img.referrerPolicy = 'no-referrer';
    img.decoding = 'async';

    if (options.priority) {
      img.loading = 'eager';
      if ('fetchPriority' in img) img.fetchPriority = 'high';
    } else {
      img.loading = 'lazy';
    }

    if (window.imageLoader && window.imageLoader.isCached(url)) {
      img.classList.add('img--ready');
    } else {
      img.classList.add('img--loading');
      img.addEventListener(
        'load',
        () => {
          img.classList.remove('img--loading');
          img.classList.add('img--ready');
        },
        { once: true }
      );
    }

    img.src = url;
    img.addEventListener('error', () => {
      if (!img.dataset.fallbackStage) {
        img.dataset.fallbackStage = 'jpeg';
        img.src = resolveImageUrl(src, size, 'jpeg');
        return;
      }
      if (img.dataset.fallbackStage === 'jpeg') {
        img.dataset.fallbackStage = 'thumb';
        const thumb =
          window.imageLoader && window.imageLoader.driveThumbnailUrl
            ? window.imageLoader.driveThumbnailUrl(src, size || 1000)
            : null;
        if (thumb) {
          img.src = thumb;
          return;
        }
      }
      img.src = fallbackSrc(fallbackIndex);
    });
    return img;
  }

  function createMapSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'world-map__svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    glow.setAttribute('id', 'path-glow');
    glow.innerHTML =
      '<feGaussianBlur stdDeviation="0.6" result="blur"/>' +
      '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>';
    defs.appendChild(glow);
    svg.appendChild(defs);

    const track = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    track.setAttribute('class', 'world-map__path world-map__path--track');
    track.setAttribute('d', MAP_PATH_D);
    svg.appendChild(track);

    const lit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    lit.setAttribute('class', 'world-map__path world-map__path--lit');
    lit.setAttribute('d', MAP_PATH_D);
    lit.setAttribute('id', 'map-path-lit');
    if (!isTouchDevice) lit.setAttribute('filter', 'url(#path-glow)');
    svg.appendChild(lit);

    return svg;
  }

  function updateMapPath(unlockedNodeIndex, animate) {
    const litPath = document.getElementById('map-path-lit');
    if (!litPath || !nodePathLengths.length) return;

    const total = litPath.getTotalLength();
    const visible =
      unlockedNodeIndex >= 0 && unlockedNodeIndex < nodePathLengths.length
        ? nodePathLengths[unlockedNodeIndex]
        : 0;

    litPath.style.strokeDasharray = `${total}`;
    const duration = isTouchDevice ? '0.45s' : '0.65s';
    litPath.style.transition = animate
      ? `stroke-dashoffset ${duration} cubic-bezier(0.22, 1, 0.36, 1)`
      : 'none';
    litPath.style.strokeDashoffset = `${Math.max(total - visible, 0)}`;
  }

  function cacheNodePathLengths() {
    const litPath = document.getElementById('map-path-lit');
    if (!litPath) return;
    nodePathLengths = measureAllNodePathLengths(litPath);
  }

  function bindNodeClick(node, dest) {
    const prefetch = () => {
      if (dest.status !== 'unlocked' || !dest.gallery || !dest.gallery.length) return;
      prefetchGalleryPhotos(dest.gallery, false);
    };

    node.addEventListener('pointerenter', prefetch, { passive: true });
    node.addEventListener('touchstart', prefetch, { passive: true });

    node.addEventListener('click', () => {
      if (unlockSequenceRunning) return;
      if (node.classList.contains('map-node--unlocked')) openGallery(dest);
      else openLocked(dest);
    });
  }

  function createLockedMapNode(dest, index) {
    const pos = MAP_NODE_POSITIONS[index] || MAP_NODE_POSITIONS[MAP_NODE_POSITIONS.length - 1];
    const node = document.createElement('button');
    node.className = 'map-node map-node--locked';
    node.type = 'button';
    node.dataset.destIndex = String(index);
    node.style.left = `${pos.x}%`;
    node.style.top = `${pos.y}%`;
    node.style.zIndex = String(20 + index);
    if (pos.x < 50) node.classList.add('map-node--left');
    else node.classList.add('map-node--right');
    node.setAttribute('aria-label', `Locked destination ${dest.title}`);

    const ring = document.createElement('span');
    ring.className = 'map-node__ring';

    const inner = document.createElement('span');
    inner.className = 'map-node__inner map-node__inner--locked';
    inner.appendChild(icon('lock'));
    ring.appendChild(inner);
    node.appendChild(ring);

    const label = document.createElement('span');
    label.className = 'map-node__label';

    const badge = document.createElement('span');
    badge.className = 'map-node__badge';
    badge.textContent = String(index + 1).padStart(2, '0');
    label.appendChild(badge);

    const name = document.createElement('span');
    name.className = 'map-node__name';
    name.textContent = '???';
    label.appendChild(name);

    const teaser = document.createElement('span');
    teaser.className = 'map-node__teaser';
    teaser.textContent = dest.teaser || 'Sealed';
    label.appendChild(teaser);

    node.appendChild(label);

    bindNodeClick(node, dest);
    return node;
  }

  function applyUnlockedPresentation(node, dest, index, animate) {
    node.classList.remove('map-node--locked');
    node.classList.add('map-node--unlocked');
    if (animate) node.classList.add('map-node--unlocking');
    node.setAttribute('aria-label', `Open ${dest.subtitle} gallery`);

    const inner = node.querySelector('.map-node__inner');
    if (inner) {
      inner.classList.remove('map-node__inner--locked');
      inner.innerHTML = '';
      if (dest.gallery && dest.gallery.length > 0) {
        const thumbSize = window.imageLoader ? 'map' : 200;
        inner.appendChild(
          createImageWithFallback(dest.gallery[0].src, dest.gallery[0].alt, index, thumbSize, {
            priority: animate,
          })
        );
      } else {
        inner.appendChild(icon('map'));
      }
    }

    const name = node.querySelector('.map-node__name');
    if (name) name.textContent = dest.subtitle;

    const teaser = node.querySelector('.map-node__teaser');
    if (teaser) {
      const photoCount = dest.gallery ? dest.gallery.length : 0;
      teaser.textContent = `${photoCount} photos`;
    }

    updateMapPath(index, animate);

    if (animate) {
      if (window.unlockEffects) window.unlockEffects.celebrate(node);

      node.addEventListener(
        'animationend',
        () => {
          node.classList.remove('map-node--unlocking');
        },
        { once: true }
      );
    }
  }

  async function runUnlockSequence() {
    const unlockedIndices = destinations
      .map((dest, index) => (dest.status === 'unlocked' ? index : -1))
      .filter((index) => index !== -1);

    updateMapPath(-1, false);

    if (!unlockedIndices.length) {
      updateProgress();
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lastAnimated = getLastAnimatedIndex();
    const instantIndices = unlockedIndices.filter((index) => index <= lastAnimated);
    let animateIndices = unlockedIndices.filter((index) => index > lastAnimated);
    const maxUnlocked = unlockedIndices[unlockedIndices.length - 1];

    let skipAnimateIndices = [];
    if (animateIndices.length > 1) {
      skipAnimateIndices = animateIndices.slice(0, -1);
      animateIndices = animateIndices.slice(-1);
    }

    const allInstant = instantIndices.concat(skipAnimateIndices);

    if (prefersReducedMotion || !animateIndices.length) {
      unlockedIndices.forEach((index) => {
        const node = grid.querySelector(`[data-dest-index="${index}"]`);
        if (node) applyUnlockedPresentation(node, destinations[index], index, false);
      });
      updateMapPath(maxUnlocked, false);
      updateProgress();
      if (maxUnlocked > lastAnimated) setLastAnimatedIndex(maxUnlocked);
      return;
    }

    instantIndices.forEach((index) => {
      const node = grid.querySelector(`[data-dest-index="${index}"]`);
      if (node) applyUnlockedPresentation(node, destinations[index], index, false);
    });

    skipAnimateIndices.forEach((index) => {
      const node = grid.querySelector(`[data-dest-index="${index}"]`);
      if (node) applyUnlockedPresentation(node, destinations[index], index, false);
    });

    if (allInstant.length) {
      updateMapPath(allInstant[allInstant.length - 1], false);
      updateProgress(allInstant.length);
    } else {
      updateProgress(0);
    }

    const thumbSize = window.imageLoader ? 'map' : 200;
    const preloadTargets = animateIndices
      .map((index) => destinations[index])
      .filter((dest) => dest.gallery && dest.gallery.length > 0);

    if (window.imageLoader && preloadTargets.length) {
      await Promise.race([
        Promise.allSettled(
          preloadTargets.map((dest) => window.imageLoader.preloadImage(dest.gallery[0].src, thumbSize))
        ),
        new Promise((resolve) => setTimeout(resolve, isTouchDevice ? 2200 : 3500)),
      ]);
    }

    unlockSequenceRunning = true;
    grid.classList.add('world-map--sequencing');
    const staggerMs = getUnlockStaggerMs();
    const initialDelay = isTouchDevice ? 280 : UNLOCK_INITIAL_DELAY_MS;

    animateIndices.forEach((destIndex, sequenceIndex) => {
      const delay = initialDelay + sequenceIndex * staggerMs;

      setTimeout(() => {
        const node = grid.querySelector(`[data-dest-index="${destIndex}"]`);
        if (!node) return;

        applyUnlockedPresentation(node, destinations[destIndex], destIndex, true);
        updateProgress(allInstant.length + sequenceIndex + 1);

        if (sequenceIndex === animateIndices.length - 1) {
          setTimeout(() => {
            unlockSequenceRunning = false;
            grid.classList.remove('world-map--sequencing');
            setLastAnimatedIndex(maxUnlocked);
          }, isTouchDevice ? 480 : 650);
        }
      }, delay);
    });
  }

  function renderCards() {
    grid.innerHTML = '';
    grid.className = 'world-map';
    grid.classList.remove('world-map--sequencing');

    grid.appendChild(createMapSvg());

    const nodesLayer = document.createElement('div');
    nodesLayer.className = 'world-map__nodes';

    destinations.forEach((dest, index) => {
      nodesLayer.appendChild(createLockedMapNode(dest, index));
    });

    grid.appendChild(nodesLayer);
    cacheNodePathLengths();
    void runUnlockSequence();
  }

  function prefetchGalleryPhotos(photos, includeLightbox) {
    if (!window.imageLoader || !photos || !photos.length) return;
    void window.imageLoader.preloadGalleryImages(photos);
    if (includeLightbox) {
      void window.imageLoader.preloadLightboxImages(photos);
    }
  }

  function prefetchLightboxPhoto(photo, neighbors) {
    if (!window.imageLoader || !photo) return;
    void window.imageLoader.preloadImage(photo.src, 'lightbox');
    if (neighbors && currentGallery.length) {
      const index = currentGallery.indexOf(photo);
      if (index !== -1) {
        void window.imageLoader.preloadLightboxNeighbors(currentGallery, index, 1);
      }
    }
  }

  function openGallery(dest) {
    galleryChapter.textContent = dest.title;
    galleryTitle.innerHTML = '';
    galleryTitle.appendChild(icon('unlock', 'gallery-title-icon'));
    galleryTitle.appendChild(document.createTextNode(dest.subtitle));
    galleryGrid.innerHTML = '';
    currentGallery = dest.gallery || [];

    prefetchGalleryPhotos(currentGallery, true);

    currentGallery.forEach((photo, i) => {
      const item = document.createElement('button');
      item.className = 'gallery-item';
      item.type = 'button';
      item.setAttribute('aria-label', photo.caption || photo.alt);

      const gallerySize = window.imageLoader ? 'gallery' : 600;
      const img = createImageWithFallback(photo.src, photo.alt, i, gallerySize, {
        priority: i < 6,
      });
      item.appendChild(img);

      if (photo.caption) {
        const cap = document.createElement('span');
        cap.className = 'gallery-item-caption';
        cap.textContent = photo.caption;
        item.appendChild(cap);
      }

      const warmLightbox = () => prefetchLightboxPhoto(photo, true);
      item.addEventListener('pointerenter', warmLightbox, { passive: true });
      item.addEventListener('focus', warmLightbox, { passive: true });
      item.addEventListener('touchstart', warmLightbox, { passive: true });

      item.addEventListener('click', () => openLightbox(i));
      galleryGrid.appendChild(item);
    });

    galleryModal.showModal();
  }

  function setLightboxLoading(loading) {
    lightbox.classList.toggle('lightbox--loading', loading);
    if (lightboxLoader) lightboxLoader.setAttribute('aria-hidden', loading ? 'false' : 'true');
  }

  function openLightbox(index) {
    const loadId = ++lightboxLoadId;
    lightboxIndex = index;
    const photo = currentGallery[index];
    if (!photo) return;

    const galleryUrl = resolveImageUrl(photo.src, window.imageLoader ? 'gallery' : 600);
    const hdUrl = resolveImageUrl(photo.src, window.imageLoader ? 'lightbox' : 1280);
    const hdReady = window.imageLoader && window.imageLoader.isProfileCached(photo.src, 'lightbox');

    lightboxCaption.textContent = photo.caption || photo.alt;
    lightboxImg.alt = photo.alt;
    lightboxImg.referrerPolicy = 'no-referrer';
    delete lightboxImg.dataset.fallbackStage;

    lightboxImg.onerror = () => {
      if (lightboxLoadId !== loadId) return;

      const clearOnLoad = () => {
        if (lightboxLoadId !== loadId) return;
        setLightboxLoading(false);
        lightboxImg.classList.remove('lightbox-img--preview');
      };
      lightboxImg.addEventListener('load', clearOnLoad, { once: true });

      if (!lightboxImg.dataset.fallbackStage) {
        lightboxImg.dataset.fallbackStage = 'jpeg';
        lightboxImg.src = resolveImageUrl(photo.src, window.imageLoader ? 'lightbox' : 1280, 'jpeg');
        return;
      }
      if (lightboxImg.dataset.fallbackStage === 'jpeg') {
        lightboxImg.dataset.fallbackStage = 'thumb';
        const driveIdMatch = photo.src.match(/[?&]id=([\w-]+)/) || photo.src.match(/\/d\/([\w-]+)/);
        if (driveIdMatch) {
          const sz = window.imageLoader ? window.imageLoader.lightboxSize() : 1280;
          lightboxImg.src = 'https://drive.google.com/thumbnail?id=' + driveIdMatch[1] + '&sz=w' + sz;
          return;
        }
      }
      lightboxImg.src = fallbackSrc(index);
    };

    if (hdReady) {
      lightboxImg.src = hdUrl;
      lightboxImg.classList.remove('lightbox-img--preview');
      setLightboxLoading(false);
    } else {
      lightboxImg.src = galleryUrl;
      lightboxImg.classList.add('lightbox-img--preview');
      setLightboxLoading(true);

      const showHd = (url) => {
        if (lightboxLoadId !== loadId || lightboxIndex !== index) return;
        if (url) lightboxImg.src = url;
        lightboxImg.classList.remove('lightbox-img--preview');
        setLightboxLoading(false);
      };

      if (window.imageLoader) {
        void window.imageLoader.preloadImage(photo.src, 'lightbox').then(showHd);
      } else {
        const hdPreload = new Image();
        hdPreload.referrerPolicy = 'no-referrer';
        hdPreload.onload = () => showHd(hdUrl);
        hdPreload.onerror = () => setLightboxLoading(false);
        hdPreload.src = hdUrl;
      }
    }

    if (window.imageLoader) {
      void window.imageLoader.preloadLightboxNeighbors(currentGallery, index, 2);
    }

    if (!lightbox.open) lightbox.showModal();
  }

  function navigateLightbox(dir) {
    lightboxIndex = (lightboxIndex + dir + currentGallery.length) % currentGallery.length;
    openLightbox(lightboxIndex);
  }

  function openLocked(dest) {
    lockedChapter.textContent = dest.title;
    lockedTitle.textContent = 'Destination Locked';
    lockedTeaser.innerHTML = '';
    lockedTeaser.appendChild(icon('spark'));
    lockedTeaser.appendChild(document.createTextNode(dest.teaser));
    lockedHint.textContent = dest.hint;
    lockedModal.showModal();
  }

  galleryClose.addEventListener('click', () => galleryModal.close());
  galleryModal.addEventListener('click', (e) => {
    if (e.target === galleryModal) galleryModal.close();
  });

  lightboxClose.addEventListener('click', () => lightbox.close());
  lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
  lightboxNext.addEventListener('click', () => navigateLightbox(1));
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.close();
  });

  lockedClose.addEventListener('click', () => lockedModal.close());
  lockedModal.addEventListener('click', (e) => {
    if (e.target === lockedModal) lockedModal.close();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.open) return;
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
    if (e.key === 'Escape') lightbox.close();
  });

  async function init() {
    initStaticIcons();

    try {
      if (SHEET_CONFIG.spreadsheetId) {
        destinations = await loadDestinationsFromSheets(SHEET_CONFIG);
      } else {
        destinations = FALLBACK_DESTINATIONS;
      }
    } catch (err) {
      console.error(err);
      showError('Could not load from Google Sheets — showing saved fallback data.');
      destinations = FALLBACK_DESTINATIONS;
    }

    if (window.imageLoader) {
      void window.imageLoader.preloadDestinationThumbnails(destinations);
      scheduleGalleryPreload(destinations);
    }

    renderCards();
  }

  function scheduleGalleryPreload(dests) {
    const run = function () {
      if (!window.imageLoader) return;
      dests
        .filter(function (dest) {
          return dest.status === 'unlocked' && dest.gallery && dest.gallery.length;
        })
        .forEach(function (dest) {
          dest.gallery.slice(0, 6).forEach(function (photo) {
            void window.imageLoader.preloadImage(photo.src, 'gallery');
          });
          dest.gallery.slice(0, 3).forEach(function (photo) {
            void window.imageLoader.preloadImage(photo.src, 'lightbox');
          });
        });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 3000 });
    } else {
      setTimeout(run, 1200);
    }
  }

  init();
})();
