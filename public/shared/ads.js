/**
 * SiteAds - 微网站广告共享模块
 * 提供 AdSense 广告位创建与展示能力
 * 被工具站 / 资讯站 / 计算站三类模板通过相对路径 ../shared/ads.js 引用
 */
(function (global) {
  'use strict';

  // 内部状态
  var state = {
    adsenseId: '',
    positions: ['header', 'incontent', 'sidebar'],
    scriptLoaded: false,
    initialized: false
  };

  // 标准广告位 ID 与位置映射
  var AD_SLOT_MAP = {
    'header': 'ad-header',
    'incontent': 'ad-incontent',
    'sidebar': 'ad-sidebar'
  };

  /**
   * 判断 adsenseId 是否有效
   * @param {string} id
   * @returns {boolean}
   */
  function isValidAdsenseId(id) {
    return !!id && id !== 'YOUR_ADSENSE_ID' && id.length > 0;
  }

  /**
   * 创建单个广告位 div(默认隐藏,等待 showAds 调用)
   * @param {string} slotId - 广告位 div 的 id
   * @returns {HTMLDivElement}
   */
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

  /**
   * 初始化广告模块
   * @param {Object} config - 广告配置
   * @param {string} config.adsenseId - AdSense 发布商 ID,如 'ca-pub-XXXXXXXXXXXXXXXX'
   * @param {string[]} [config.positions] - 启用的广告位置数组
   */
  function initAds(config) {
    if (!config) {
      console.warn('[SiteAds] initAds 缺少 config 参数');
      return;
    }

    state.adsenseId = config.adsenseId || '';
    if (Array.isArray(config.positions) && config.positions.length > 0) {
      state.positions = config.positions;
    }

    // 创建标准广告位 div(默认 display:none,等待流量达标后调用 showAds)
    state.positions.forEach(function (pos) {
      var slotId = AD_SLOT_MAP[pos];
      if (slotId) {
        createAdSlot(slotId);
      }
    });

    state.initialized = true;

    // 如果 adsenseId 无效,仅创建占位 div,不加载脚本(开发环境不报错)
    if (!isValidAdsenseId(state.adsenseId)) {
      console.info('[SiteAds] 未提供有效 adsenseId,仅创建占位广告位(开发环境正常行为)');
    }
  }

  /**
   * 加载 AdSense 脚本(按需加载,首次调用时注入)
   */
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

  /**
   * 在指定广告位中注入 AdSense ins 标签
   * @param {string} slotId - 广告位 div 的 id
   */
  function injectIns(slotId) {
    var container = document.getElementById(slotId);
    if (!container) {
      return;
    }
    // 避免重复注入
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

    // 触发 AdSense 渲染
    try {
      (global.adsbygoogle = global.adsbygoogle || []).push({});
    } catch (e) {
      // 静默忽略,避免渲染失败影响页面
    }
  }

  /**
   * 展示广告:将广告位 display 设为 block 并注入 ins 标签
   * 应在流量达标后调用
   */
  function showAds() {
    if (!state.initialized) {
      console.warn('[SiteAds] 请先调用 initAds 进行初始化');
      return;
    }

    // adsenseId 无效时静默跳过
    if (!isValidAdsenseId(state.adsenseId)) {
      return;
    }

    // 加载 AdSense 脚本(首次调用时)
    loadAdsenseScript();

    // 展示所有已配置的广告位
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

  // 挂载到全局对象
  global.SiteAds = {
    initAds: initAds,
    showAds: showAds
  };
})(typeof window !== 'undefined' ? window : this);
