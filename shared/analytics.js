/**
 * SiteAnalytics - Shared analytics module for micro-sites
 * Provides Google Analytics 4 loading, automatic event tracking, manual event reporting
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
      console.info('[SiteAnalytics] No valid gaId provided, skipping GA load');
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
