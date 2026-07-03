/**
 * SiteAds - 微网站广告共享模块
 * 提供 AdSense 广告位创建与展示能力
 * 被工具站 / 资讯站 / 计算站三类模板通过相对路径 ../shared/ads.js 引用
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
      console.warn('[SiteAds] initAds 缺少 config 参数');
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
      console.info('[SiteAds] 未提供有效 adsenseId,仅创建占位广告位(开发环境正常行为)');
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
    }
  }
  function showAds() {
    if (!state.initialized) {
      console.warn('[SiteAds] 请先调用 initAds 进行初始化');
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
