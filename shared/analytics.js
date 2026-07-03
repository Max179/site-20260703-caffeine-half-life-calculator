/**
 * SiteAnalytics - 微网站统计共享模块
 * 提供 Google Analytics 4 加载、自动事件追踪、手动事件上报能力
 * 被工具站 / 资讯站 / 计算站三类模板通过相对路径 ../shared/analytics.js 引用
 */
(function (global) {
  'use strict';
  var initialized = false;
  var storedGaId = '';
  function isValidGaId(gaId) {
    return !!gaId && gaId !== 'YOUR_GA_ID' && gaId.length > 0;
  }
  function initAnalytics(gaId) {
    if (!isValidGaId(gaId)) {
      console.info('[SiteAnalytics] 未提供有效 gaId,跳过 GA 加载(开发环境正常行为)');
      return;
    }
    storedGaId = gaId;
    if (global.gtag) {
      initialized = true;
      return;
    }
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
    document.head.appendChild(script);
    global.dataLayer = global.dataLayer || [];
    global.gtag = function () {
      global.dataLayer.push(arguments);
    };
    global.gtag('js', new Date());
    global.gtag('config', gaId);
    initialized = true;
    setupAutoTracking();
  }
  function setupAutoTracking() {
    document.addEventListener('click', function (event) {
      var target = event.target;
      var trackedEl = target && target.closest ? target.closest('[data-track]') : null;
      if (!trackedEl) {
        return;
      }
      var eventName = trackedEl.getAttribute('data-track');
      if (!eventName) {
        return;
      }
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
  function trackEvent(name, params) {
    if (!initialized || !global.gtag) {
      return;
    }
    if (!name) {
      return;
    }
    var evtParams = params || {};
    evtParams.send_to = storedGaId;
    global.gtag('event', name, evtParams);
  }
  global.SiteAnalytics = {
    initAnalytics: initAnalytics,
    trackEvent: trackEvent
  };
})(typeof window !== 'undefined' ? window : this);
