import { db } from './db.js';
import { runCrawlForSetting } from './crawler.js';

export function startScheduler() {
  console.log('[Scheduler] Background auto-crawl scheduler initialized.');

  // Run check every 15 minutes
  setInterval(async () => {
    try {
      const now = new Date();
      // Check if it is morning (e.g. 7 AM)
      if (now.getHours() === 7) {
        const activeSettings = await db.settings.find({ autoCrawlEnabled: true });
        
        for (const setting of activeSettings) {
          const lastCrawled = setting.lastCrawled ? new Date(setting.lastCrawled) : null;
          const isCrawledToday = lastCrawled && 
            lastCrawled.getDate() === now.getDate() && 
            lastCrawled.getMonth() === now.getMonth() && 
            lastCrawled.getFullYear() === now.getFullYear();
            
          if (!isCrawledToday) {
            console.log(`[Scheduler] Scheduled auto-crawl running for setting: "${setting.name}"...`);
            await runCrawlForSetting(setting).catch(err => {
              console.error(`[Scheduler] Error crawling "${setting.name}":`, err.message);
            });
          }
        }
      }
    } catch (err) {
      console.error('[Scheduler Loop Error]', err);
    }
  }, 15 * 60 * 1000);
}

export async function runStartupCheck() {
  console.log('[Scheduler] Running startup check for scheduled auto-crawls...');
  try {
    const now = new Date();
    const activeSettings = await db.settings.find({ autoCrawlEnabled: true });
    
    for (const setting of activeSettings) {
      const lastCrawled = setting.lastCrawled ? new Date(setting.lastCrawled) : null;
      // If never crawled, or last crawled more than 20 hours ago, run crawler now
      const hoursSinceLastCrawl = lastCrawled ? (now - lastCrawled) / (1000 * 60 * 60) : Infinity;
      
      if (hoursSinceLastCrawl > 20) {
        console.log(`[Scheduler] Startup check: Running auto-crawl for "${setting.name}" (Last crawl: ${lastCrawled ? lastCrawled.toLocaleString() : 'Never'})`);
        await runCrawlForSetting(setting).catch(err => {
          console.error(`[Scheduler] Startup crawl failed for "${setting.name}":`, err.message);
        });
      }
    }
  } catch (err) {
    console.error('[Scheduler Startup Error]', err);
  }
}
