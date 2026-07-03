/**
 * SiteSEO - Shared SEO module for micro-sites
 * Provides SEO meta setup, JSON-LD structured data injection, and sitemap generation
 */
(function (global) {
  'use strict';

  function upsertMeta(selector, attrs) {
    var el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      document.head.appendChild(el);
    }
    Object.keys(attrs).forEach(function (key) {
      el.setAttribute(key, attrs[key]);
    });
    return el;
  }

  function injectJsonLd(jsonLdObj, dataKey) {
    var old = document.querySelector('script[type="application/ld+json"][data-siteseo="' + dataKey + '"]');
    if (old) {
      old.parentNode.removeChild(old);
    }
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-siteseo', dataKey);
    script.textContent = JSON.stringify(jsonLdObj);
    document.head.appendChild(script);
  }

  function buildJsonLd(config) {
    var type = config.type;
    var url = config.url || (typeof location !== 'undefined' ? location.href : '');
    var title = config.title || '';
    var description = config.description || '';

    if (type === 'tool' || type === 'calculator') {
      return {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': title,
        'description': description,
        'url': url,
        'applicationCategory': type === 'calculator' ? 'CalculatorApplication' : 'UtilitiesApplication',
        'operatingSystem': 'Any',
        'browserRequirements': 'Requires JavaScript'
      };
    }

    if (type === 'info') {
      return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': title,
        'description': description,
        'url': url
      };
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': title,
      'description': description,
      'url': url
    };
  }

  function setupSEO(config) {
    if (!config) {
      console.warn('[SiteSEO] setupSEO missing config');
      return;
    }

    var title = config.title || '';
    var description = config.description || '';
    var keywords = Array.isArray(config.keywords) ? config.keywords.join(',') : (config.keywords || '');
    var url = config.url || (typeof location !== 'undefined' ? location.href : '');

    if (title) {
      document.title = title;
    }

    if (description) {
      upsertMeta('meta[name="description"]', { name: 'description', content: description });
    }
    if (keywords) {
      upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywords });
    }

    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url });
    upsertMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: config.type === 'info' ? 'article' : 'website'
    });
    if (config.image) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: config.image });
    }

    try {
      var jsonLd = buildJsonLd(config);
      injectJsonLd(jsonLd, 'main');
    } catch (e) {
      console.warn('[SiteSEO] JSON-LD injection failed:', e);
    }
  }

  function generateSitemap(urls) {
    var header = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    var footer = '</urlset>';

    if (!Array.isArray(urls) || urls.length === 0) {
      return header + footer;
    }

    function escapeXml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    var body = urls.map(function (item) {
      var urlObj = (typeof item === 'string') ? { loc: item } : item;
      var xml = '  <url>\n';
      xml += '    <loc>' + escapeXml(urlObj.loc) + '</loc>\n';
      if (urlObj.lastmod) {
        xml += '    <lastmod>' + escapeXml(urlObj.lastmod) + '</lastmod>\n';
      }
      if (urlObj.changefreq) {
        xml += '    <changefreq>' + escapeXml(urlObj.changefreq) + '</changefreq>\n';
      }
      if (urlObj.priority !== undefined && urlObj.priority !== null) {
        xml += '    <priority>' + escapeXml(urlObj.priority) + '</priority>\n';
      }
      xml += '  </url>\n';
      return xml;
    }).join('');

    return header + body + footer;
  }

  global.SiteSEO = {
    setupSEO: setupSEO,
    generateSitemap: generateSitemap
  };
})(typeof window !== 'undefined' ? window : this);
