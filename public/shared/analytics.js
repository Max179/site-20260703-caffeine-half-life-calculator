/**
 * SiteAnalytics - 微网站统计共享模块
 * 提供 Google Analytics 4 加载、自动事件追踪、手动事件上报能力
 * 被工具站 / 资讯站 / 计算站三类模板通过相对路径 ../shared/analytics.js 引用
 */
(function (global) {
  'use strict';

  // 内部状态:是否已成功初始化
  var initialized = false;
  // 存储的 gaId
  var storedGaId = '';

  /**
   * 判断 gaId 是否为有效(非空且非占位符)
   * @param {string} gaId
   * @returns {boolean}
   */
  function isValidGaId(gaId) {
    return !!gaId && gaId !== 'YOUR_GA_ID' && gaId.length > 0;
  }

  /**
   * 初始化 Google Analytics 4
   * @param {string} gaId - GA4 Measurement ID,如 'G-XXXXXXXXXX'
   */
  function initAnalytics(gaId) {
    // 开发环境占位符或空值时静默跳过,避免报错
    if (!isValidGaId(gaId)) {
      console.info('[SiteAnalytics] 未提供有效 gaId,跳过 GA 加载(开发环境正常行为)');
      return;
    }

    storedGaId = gaId;

    // 如果 gtag 已存在则不重复加载脚本
    if (global.gtag) {
      initialized = true;
      return;
    }

    // 注入 gtag.js 脚本
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
    document.head.appendChild(script);

    // 初始化 dataLayer 与 gtag 函数
    global.dataLayer = global.dataLayer || [];
    global.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      global.dataLayer.push(arguments);
    };
    global.gtag('js', new Date());
    global.gtag('config', gaId);

    initialized = true;

    // 绑定自动事件追踪
    setupAutoTracking();
  }

  /**
   * 自动追踪所有带 data-track 属性元素的 click 事件
   * 事件名取 data-track 属性值,可附加 data-track-params 上的额外参数
   */
  function setupAutoTracking() {
    // 事件委托:统一在 document 上监听 click
    document.addEventListener('click', function (event) {
      var target = event.target;
      // 沿 DOM 树向上查找带 data-track 属性的元素
      var trackedEl = target && target.closest ? target.closest('[data-track]') : null;
      if (!trackedEl) {
        return;
      }
      var eventName = trackedEl.getAttribute('data-track');
      if (!eventName) {
        return;
      }
      // 解析附加参数(可选,通过 data-track-params JSON 字符串)
      var params = {};
      var paramsAttr = trackedEl.getAttribute('data-track-params');
      if (paramsAttr) {
        try {
          params = JSON.parse(paramsAttr) || {};
        } catch (e) {
          params = {};
        }
      }
      trackEvent(eventName, params);
    }, true);
  }

  /**
   * 手动上报事件
   * @param {string} name - 事件名
   * @param {Object} [params] - 附加参数
   */
  function trackEvent(name, params) {
    if (!initialized || !global.gtag) {
      // 未初始化时静默忽略,避免开发环境报错
      return;
    }
    if (!name) {
      return;
    }
    var evtParams = params || {};
    evtParams.send_to = storedGaId;
    global.gtag('event', name, evtParams);
  }

  // 挂载到全局对象
  global.SiteAnalytics = {
    initAnalytics: initAnalytics,
    trackEvent: trackEvent
  };
})(typeof window !== 'undefined' ? window : this);
