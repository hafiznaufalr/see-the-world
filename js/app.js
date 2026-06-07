(function () {
  const grid = document.getElementById('playlist-grid');
  const loadingEl = document.getElementById('loading');
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

  function updateProgress() {
    const unlocked = getUnlockedCount();
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

  function setLoading(isLoading) {
    if (loadingEl) {
      if (isLoading) {
        loadingEl.innerHTML = '';
        loadingEl.appendChild(icon('loader'));
        loadingEl.appendChild(document.createTextNode('Loading playlist…'));
        loadingEl.hidden = false;
      } else {
        loadingEl.hidden = true;
      }
    }
    if (isLoading && grid) grid.innerHTML = '';
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

  function renderCards() {
    grid.innerHTML = '';

    destinations.forEach((dest, index) => {
      const isUnlocked = dest.status === 'unlocked';
      const card = document.createElement('button');
      card.className = `card card--${isUnlocked ? 'unlocked' : 'locked'}`;
      card.type = 'button';
      card.setAttribute('aria-label', isUnlocked ? `Open ${dest.subtitle} gallery` : `Locked destination ${dest.title}`);

      const idx = document.createElement('span');
      idx.className = 'card-index';
      idx.textContent = String(index + 1).padStart(2, '0');
      card.appendChild(idx);

      if (isUnlocked && dest.gallery && dest.gallery.length > 0) {
        const thumb = document.createElement('div');
        thumb.className = 'card-thumb';
        thumb.appendChild(createImageWithFallback(dest.gallery[0].src, dest.gallery[0].alt, 0, 200));
        card.appendChild(thumb);
      } else if (!isUnlocked) {
        const placeholder = document.createElement('span');
        placeholder.className = 'card-lock-placeholder';
        placeholder.appendChild(icon('map'));
        card.appendChild(placeholder);
      }

      const body = document.createElement('div');
      body.className = 'card-body';

      const subtitle = document.createElement('h3');
      subtitle.className = 'card-subtitle';
      subtitle.textContent = isUnlocked ? dest.subtitle : '???';
      body.appendChild(subtitle);

      const desc = document.createElement('p');
      desc.className = 'card-desc';
      const photoCount = dest.gallery ? dest.gallery.length : 0;
      if (isUnlocked) {
        desc.appendChild(icon('images'));
        desc.appendChild(document.createTextNode(`${photoCount} photos`));
      } else {
        desc.appendChild(icon('pin'));
        desc.appendChild(document.createTextNode(dest.teaser));
      }
      body.appendChild(desc);

      card.appendChild(body);

      if (isUnlocked) {
        const status = document.createElement('span');
        status.className = 'card-status';
        status.appendChild(document.createTextNode('View'));
        status.appendChild(icon('chevronRight'));
        card.appendChild(status);
      } else {
        const lock = document.createElement('span');
        lock.className = 'card-lock';
        lock.appendChild(icon('lock'));
        card.appendChild(lock);
      }

      card.addEventListener('click', () => {
        if (isUnlocked) openGallery(dest);
        else openLocked(dest);
      });

      grid.appendChild(card);
    });
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
    setLoading(true);

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

    setLoading(false);
    updateProgress();
    renderCards();
  }

  init();
})();
