/**
 * SiteSEO - 微网站 SEO 共享模块
 * 提供页面 SEO 元信息设置、JSON-LD 结构化数据注入、Sitemap 生成能力
 * 被工具站 / 资讯站 / 计算站三类模板通过相对路径 ../shared/seo.js 引用
 */
(function (global) {
  'use strict';

  /**
   * 创建或更新一个 meta 标签
   * @param {string} selector - meta 选择器,如 'meta[name="description"]'
   * @param {Object} attrs - 属性键值对,如 { name: 'description', content: '...' }
   * @returns {HTMLMetaElement} 创建或更新后的 meta 元素
   */
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

  /**
   * 注入或替换 JSON-LD 结构化数据脚本
   * @param {Object} jsonLdObj - 结构化数据对象
   * @param {string} dataKey - 用于标识的 data 属性值,便于重复调用时替换
   */
  function injectJsonLd(jsonLdObj, dataKey) {
    // 移除旧的同类结构化数据
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

  /**
   * 根据 type 生成对应的 JSON-LD 结构化数据
   * @param {Object} config - SEO 配置
   * @returns {Object} JSON-LD 对象
   */
  function buildJsonLd(config) {
    var type = config.type;
    var url = config.url || (typeof location !== 'undefined' ? location.href : '');
    var title = config.title || '';
    var description = config.description || '';

    // 工具站 / 计算站使用 WebApplication 类型
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

    // 资讯站使用 CollectionPage 类型(包含 Article 子项可选)
    if (type === 'info') {
      return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': title,
        'description': description,
        'url': url
      };
    }

    // 默认回退为 WebPage
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': title,
      'description': description,
      'url': url
    };
  }

  /**
   * 设置页面 SEO 信息
   * @param {Object} config - SEO 配置
   * @param {string} config.title - 页面标题
   * @param {string} config.description - 页面描述
   * @param {string[]} config.keywords - 关键词数组
   * @param {string} config.url - 页面规范 URL
   * @param {string} config.type - 站点类型: 'tool' | 'info' | 'calculator'
   */
  function setupSEO(config) {
    if (!config) {
      console.warn('[SiteSEO] setupSEO 缺少 config 参数');
      return;
    }

    var title = config.title || '';
    var description = config.description || '';
    var keywords = Array.isArray(config.keywords) ? config.keywords.join(',') : (config.keywords || '');
    var url = config.url || (typeof location !== 'undefined' ? location.href : '');

    // 设置 <title>
    if (title) {
      document.title = title;
    }

    // 设置基础 meta
    if (description) {
      upsertMeta('meta[name="description"]', { name: 'description', content: description });
    }
    if (keywords) {
      upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywords });
    }

    // 设置 Open Graph 系列标签
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

    // 注入 JSON-LD 结构化数据
    try {
      var jsonLd = buildJsonLd(config);
      injectJsonLd(jsonLd, 'main');
    } catch (e) {
      console.warn('[SiteSEO] JSON-LD 注入失败:', e);
    }
  }

  /**
   * 生成符合 sitemap 协议的 XML 字符串
   * @param {Array<string|Object>} urls - URL 数组,可为字符串或 { loc, lastmod, changefreq, priority } 对象
   * @returns {string} sitemap XML 字符串
   */
  function generateSitemap(urls) {
    var header = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    var footer = '</urlset>';

    if (!Array.isArray(urls) || urls.length === 0) {
      return header + footer;
    }

    // 转义 XML 特殊字符
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

  // 挂载到全局对象
  global.SiteSEO = {
    setupSEO: setupSEO,
    generateSitemap: generateSitemap
  };
})(typeof window !== 'undefined' ? window : this);
