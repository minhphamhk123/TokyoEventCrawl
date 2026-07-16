import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { db } from './db.js';

function buildSelector(value, type) {
  if (!value || value.trim() === '') return '';
  const trimmed = value.trim();
  switch (type) {
    case 'class': {
      const classes = trimmed.split(/\s+/).filter(Boolean);
      return classes.map(c => c.startsWith('.') ? c : '.' + c).join('');
    }
    case 'id':
      return trimmed.startsWith('#') ? trimmed : '#' + trimmed;
    case 'tag':
      return trimmed;
    case 'css':
    default:
      return trimmed;
  }
}

function getImageUrl(imgEl) {
  if (!imgEl || imgEl.length === 0) return '';
  const candidateAttrs = [
    'data-src',
    'data-lazy-src',
    'data-lazyload',
    'data-original',
    'data-fallback',
    'src',
    'srcset',
    'data-srcset'
  ];
  for (const attr of candidateAttrs) {
    let val = imgEl.attr(attr);
    if (val) {
      val = val.trim();
      if (val.startsWith('data:image')) {
        continue;
      }
      if (attr === 'srcset' || attr === 'data-srcset') {
        const parts = val.split(',');
        if (parts.length > 0) {
          const firstPart = parts[0].trim().split(/\s+/)[0];
          if (firstPart && !firstPart.startsWith('data:image')) {
            return firstPart;
          }
        }
        continue;
      }
      return val;
    }
  }
  return imgEl.attr('src') || '';
}

export async function runCrawlForSetting(setting, isPreview = false) {
  const {
    url,
    itemSelector,
    itemSelectorType,
    titleSelector,
    titleSelectorType,
    imageSelector,
    imageSelectorType,
    descriptionSelector,
    descriptionSelectorType,
    autoScroll = true,
    maxScrollHeight = 5000,
    waitAfterScroll = 2000
  } = setting;

  if (!url) {
    throw new Error('URL is required for crawling.');
  }

  const resolvedItemSelector = buildSelector(itemSelector, itemSelectorType);
  const resolvedTitleSelector = buildSelector(titleSelector, titleSelectorType);
  const resolvedImageSelector = buildSelector(imageSelector, imageSelectorType);
  const resolvedDescriptionSelector = buildSelector(descriptionSelector, descriptionSelectorType);

  console.log(`\n=================== [Puppeteer Crawl] ===================`);
  console.log(`URL: ${url} (Preview mode: ${isPreview})`);
  
  let html = '';
  let browser;
  try {
    // Launch settings to prevent command prompt / GUI popups on Windows
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log(`[Crawl Log] Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Scroll to bottom (only when not in preview mode)
    if (autoScroll && !isPreview) {
      console.log(`[Crawl Log] Auto-scrolling up to ${maxScrollHeight}px...`);
      await page.evaluate(async (maxHt) => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 150;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight || totalHeight >= maxHt) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      }, maxScrollHeight);
      console.log(`[Crawl Log] Auto-scroll finished.`);
    }

    // Delay for lazy images/components
    if (waitAfterScroll > 0) {
      console.log(`[Crawl Log] Waiting ${waitAfterScroll}ms for lazy items...`);
      await new Promise(resolve => setTimeout(resolve, waitAfterScroll));
    }

    html = await page.content();
  } catch (err) {
    console.error(`[Crawl Puppeteer Core Error] ${err.message}`);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  const $ = cheerio.load(html);
  const items = [];

  let finalItemSelector = resolvedItemSelector;
  if (!finalItemSelector || finalItemSelector.trim() === '') {
    const candidateSelectors = ['.card', 'article', '.item', '.event-card', '.event', '.event-item', 'li', '.post', '.entry'];
    for (const sel of candidateSelectors) {
      if ($(sel).length > 0) {
        finalItemSelector = sel;
        break;
      }
    }
    if (!finalItemSelector) finalItemSelector = '.card';
  }

  const matches = $(finalItemSelector);
  
  // Preview mode crawls ONLY the first item
  const elementsToParse = isPreview ? matches.slice(0, 1) : matches;

  elementsToParse.each((index, element) => {
    const item = $(element);

    // Title
    let title = '';
    if (resolvedTitleSelector && resolvedTitleSelector.trim() !== '') {
      title = item.find(resolvedTitleSelector).first().text().trim();
    }
    if (!title) {
      const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      for (const h of headingTags) {
        const text = item.find(h).first().text().trim();
        if (text) {
          title = text;
          break;
        }
      }
    }
    if (!title) {
      const titleSelectors = ['.title', '.heading', '.name', '[class*="title"]', '[class*="heading"]', '[class*="name"]'];
      for (const sel of titleSelectors) {
        try {
          const text = item.find(sel).first().text().trim();
          if (text) {
            title = text;
            break;
          }
        } catch (e) {}
      }
    }
    if (!title) {
      const linkText = item.find('a').first().text().trim();
      if (linkText) title = linkText;
    }

    // Description
    let description = '';
    if (resolvedDescriptionSelector && resolvedDescriptionSelector.trim() !== '') {
      description = item.find(resolvedDescriptionSelector).first().text().trim();
    }
    if (!description) {
      const pText = item.find('p').first().text().trim();
      if (pText) description = pText;
    }
    if (!description) {
      const descSelectors = ['.description', '.desc', '.summary', '.text', '.excerpt', '.body', '[class*="desc"]', '[class*="summary"]', '[class*="text"]'];
      for (const sel of descSelectors) {
        try {
          const text = item.find(sel).first().text().trim();
          if (text && text !== title) {
            description = text;
            break;
          }
        } catch (e) {}
      }
    }

    // Image
    let image = '';
    if (resolvedImageSelector && resolvedImageSelector.trim() !== '') {
      const imgEl = item.find(resolvedImageSelector).first();
      if (imgEl.is('img')) {
        image = getImageUrl(imgEl);
      } else {
        image = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-original') || '';
      }
    }
    if (!image) {
      const imgEl = item.find('img').first();
      if (imgEl.length) {
        image = getImageUrl(imgEl);
      }
    }
    if (!image) {
      const imgSelectors = ['.image', '.img', '.thumb', '.photo', '.picture', '[class*="image"]', '[class*="img"]', '[class*="thumb"]'];
      for (const sel of imgSelectors) {
        try {
          const el = item.find(sel).first();
          if (el.length) {
            if (el.is('img')) {
              image = getImageUrl(el);
            } else {
              image = el.attr('src') || el.attr('data-src') || el.attr('data-original') || '';
            }
            const style = el.attr('style') || '';
            if (!image && style.includes('background-image')) {
              const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
              if (match && match[1]) {
                image = match[1];
                break;
              }
            }
            if (image) break;
          }
        } catch (e) {}
      }
    }

    // Link
    let href = '';
    const firstLink = item.find('a').first();
    if (firstLink.length) {
      href = firstLink.attr('href') || '';
    }
    if (!href) {
      item.find('[href], [data-href]').each((_, el) => {
        href = $(el).attr('href') || $(el).attr('data-href') || '';
        if (href) return false;
      });
    }

    const resolvedImage = image ? (image.startsWith('http') || image.startsWith('data:') ? image : new URL(image, url).toString()) : '';
    const resolvedHref = href ? (href.startsWith('http') ? href : new URL(href, url).toString()) : url;

    items.push({
      title: title || 'Untitled event',
      description: description || 'No description available.',
      image: resolvedImage,
      href: resolvedHref
    });
  });

  // Save to DB only if we are NOT in preview mode, and we have a valid setting object
  if (!isPreview && setting.id) {
    let savedCount = 0;
    for (const item of items) {
      // Check unique key: title or href
      const existingByHref = await db.events.findOne({ href: item.href });
      const existingByTitle = await db.events.findOne({ title: item.title });

      if (!existingByHref && !existingByTitle) {
        await db.events.insert({
          settingId: setting.id,
          title: item.title,
          description: item.description,
          image: item.image,
          href: item.href,
          statusTags: []
        });
        savedCount++;
      }
    }

    // Update lastCrawled date on the setting
    await db.settings.update({ id: setting.id }, { lastCrawled: new Date().toISOString() });
    console.log(`[Crawl Done] Saved ${savedCount} new unique events for setting: ${setting.name}`);
  }

  console.log(`=================== [Crawl Finished] ===================\n`);
  return items;
}
