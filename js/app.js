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
  let unlockSequenceRunning = false;
  let nodePathLengths = [];

  const UNLOCK_INITIAL_DELAY_MS = 450;
  const UNLOCK_STAGGER_MS = 550;

  function resolveImageUrl(src, size) {
    if (!src) return src;

    var driveIdMatch = src.match(/[?&]id=([\w-]+)/) || src.match(/\/d\/([\w-]+)/);
    if (driveIdMatch && src.indexOf('drive.google.com') !== -1) {
      return 'https://lh3.googleusercontent.com/d/' + driveIdMatch[1] + '=w' + (size || 1200);
    }

    return src;
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

  function createImageWithFallback(src, alt, fallbackIndex, size) {
    const img = document.createElement('img');
    img.src = resolveImageUrl(src, size);
    img.alt = alt;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => {
      if (img.dataset.retried) {
        img.src = fallbackSrc(fallbackIndex);
        return;
      }
      img.dataset.retried = '1';
      // Retry with Drive thumbnail endpoint
      const driveIdMatch = src.match(/[?&]id=([\w-]+)/) || src.match(/\/d\/([\w-]+)/);
      if (driveIdMatch) {
        img.src = 'https://drive.google.com/thumbnail?id=' + driveIdMatch[1] + '&sz=w1000';
        return;
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
    lit.setAttribute('filter', 'url(#path-glow)');
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
    litPath.style.transition = animate ? 'stroke-dashoffset 0.65s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
    litPath.style.strokeDashoffset = `${Math.max(total - visible, 0)}`;
  }

  function cacheNodePathLengths() {
    const litPath = document.getElementById('map-path-lit');
    if (!litPath) return;
    nodePathLengths = measureAllNodePathLengths(litPath);
  }

  function bindNodeClick(node, dest) {
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
        inner.appendChild(createImageWithFallback(dest.gallery[0].src, dest.gallery[0].alt, index, 200));
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

  function runUnlockSequence() {
    const unlockedIndices = destinations
      .map((dest, index) => (dest.status === 'unlocked' ? index : -1))
      .filter((index) => index !== -1);

    updateMapPath(-1, false);

    if (!unlockedIndices.length) {
      updateProgress();
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      unlockedIndices.forEach((index) => {
        const node = grid.querySelector(`[data-dest-index="${index}"]`);
        if (node) applyUnlockedPresentation(node, destinations[index], index, false);
      });
      updateMapPath(unlockedIndices[unlockedIndices.length - 1], false);
      updateProgress();
      return;
    }

    unlockSequenceRunning = true;
    grid.classList.add('world-map--sequencing');
    updateProgress(0);

    unlockedIndices.forEach((destIndex, sequenceIndex) => {
      const delay = UNLOCK_INITIAL_DELAY_MS + sequenceIndex * UNLOCK_STAGGER_MS;

      setTimeout(() => {
        const node = grid.querySelector(`[data-dest-index="${destIndex}"]`);
        if (!node) return;

        applyUnlockedPresentation(node, destinations[destIndex], destIndex, true);
        updateProgress(sequenceIndex + 1);

        if (sequenceIndex === unlockedIndices.length - 1) {
          setTimeout(() => {
            unlockSequenceRunning = false;
            grid.classList.remove('world-map--sequencing');
          }, 650);
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
    runUnlockSequence();
  }

  function openGallery(dest) {
    galleryChapter.textContent = dest.title;
    galleryTitle.innerHTML = '';
    galleryTitle.appendChild(icon('unlock', 'gallery-title-icon'));
    galleryTitle.appendChild(document.createTextNode(dest.subtitle));
    galleryGrid.innerHTML = '';
    currentGallery = dest.gallery || [];

    currentGallery.forEach((photo, i) => {
      const item = document.createElement('button');
      item.className = 'gallery-item';
      item.type = 'button';
      item.setAttribute('aria-label', photo.caption || photo.alt);

      const img = createImageWithFallback(photo.src, photo.alt, i, 600);
      item.appendChild(img);

      if (photo.caption) {
        const cap = document.createElement('span');
        cap.className = 'gallery-item-caption';
        cap.textContent = photo.caption;
        item.appendChild(cap);
      }

      item.addEventListener('click', () => openLightbox(i));
      galleryGrid.appendChild(item);
    });

    galleryModal.showModal();
  }

  function openLightbox(index) {
    lightboxIndex = index;
    const photo = currentGallery[index];
    lightboxImg.src = resolveImageUrl(photo.src, 1600);
    lightboxImg.alt = photo.alt;
    lightboxCaption.textContent = photo.caption || photo.alt;
    lightboxImg.referrerPolicy = 'no-referrer';

    lightboxImg.onerror = () => {
      if (lightboxImg.dataset.retried) {
        lightboxImg.src = fallbackSrc(index);
        return;
      }
      lightboxImg.dataset.retried = '1';
      const driveIdMatch = photo.src.match(/[?&]id=([\w-]+)/) || photo.src.match(/\/d\/([\w-]+)/);
      if (driveIdMatch) {
        lightboxImg.src = 'https://drive.google.com/thumbnail?id=' + driveIdMatch[1] + '&sz=w1600';
        return;
      }
      lightboxImg.src = fallbackSrc(index);
    };

    lightbox.showModal();
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

    renderCards();
  }

  init();
})();
