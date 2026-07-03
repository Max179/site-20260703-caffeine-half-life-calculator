/**
 * SiteAds - Shared ads module for micro-sites
 * Provides AdSense ad slot creation and display
 */
(function (global) {
  'use strict';

  var state = {
    adsenseId: '',
    positions: ['header', 'incontent', 'sidebar'],
    scriptLoaded: false,
    initialized: false
  };

  var AD_SLOT_MAP = {
    'header': 'ad-header',
    'incontent': 'ad-incontent',
    'sidebar': 'ad-sidebar'
  };

  function isValidAdsenseId(id) {
    return !!id && id !== 'YOUR_ADSENSE_ID' && id.length > 0;
  }

  function createAdSlot(slotId) {
    var existing = document.getElementById(slotId);
    if (existing) {
      return existing;
    }
    var div = document.createElement('div');
    div.id = slotId;
    div.className = 'ad-slot';
    div.style.display = 'none';
    div.setAttribute('data-ad-slot', slotId);
    document.body.appendChild(div);
    return div;
  }

  function initAds(config) {
    if (!config) {
      console.warn('[SiteAds] initAds missing config');
      return;
    }

    state.adsenseId = config.adsenseId || '';
    if (Array.isArray(config.positions) && config.positions.length > 0) {
      state.positions = config.positions;
    }

    state.positions.forEach(function (pos) {
      var slotId = AD_SLOT_MAP[pos];
      if (slotId) {
        createAdSlot(slotId);
      }
    });

    state.initialized = true;

    if (!isValidAdsenseId(state.adsenseId)) {
      console.info('[SiteAds] No valid adsenseId, only placeholder slots created');
    }
  }

  function loadAdsenseScript() {
    if (state.scriptLoaded || !isValidAdsenseId(state.adsenseId)) {
      return;
    }
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(state.adsenseId);
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
    state.scriptLoaded = true;
  }

  function injectIns(slotId) {
    var container = document.getElementById(slotId);
    if (!container) {
      return;
    }
    if (container.querySelector('ins.adsbygoogle')) {
      return;
    }
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', state.adsenseId);
    ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    container.appendChild(ins);

    try {
      (global.adsbygoogle = global.adsbygoogle || []).push({});
    } catch (e) {
      // ignore render failures
    }
  }

  function showAds() {
    if (!state.initialized) {
      console.warn('[SiteAds] Call initAds first');
      return;
    }

    if (!isValidAdsenseId(state.adsenseId)) {
      return;
    }

    loadAdsenseScript();

    state.positions.forEach(function (pos) {
      var slotId = AD_SLOT_MAP[pos];
      if (!slotId) {
        return;
      }
      var container = document.getElementById(slotId);
      if (container) {
        container.style.display = 'block';
        injectIns(slotId);
      }
    });
  }

  global.SiteAds = {
    initAds: initAds,
    showAds: showAds
  };
})(typeof window !== 'undefined' ? window : this);
