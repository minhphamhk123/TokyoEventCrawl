import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import { runCrawlForSetting } from './crawler.js';
import { startScheduler, runStartupCheck } from './scheduler.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Settings CRUD
app.get('/api/settings', async (req, res) => {
  try {
    const list = await db.settings.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const settingData = req.body;
    if (!settingData.url) {
      return res.status(400).json({ error: 'URL is required.' });
    }
    
    let result;
    if (settingData.id) {
      const existing = await db.settings.findOne({ id: settingData.id });
      if (existing) {
        // Update
        const { id, ...dataToUpdate } = settingData;
        await db.settings.update({ id }, dataToUpdate);
        result = { id, ...dataToUpdate };
      } else {
        // Insert with specified ID
        result = await db.settings.insert(settingData);
      }
    } else {
      // Insert
      result = await db.settings.insert(settingData);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/settings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.settings.delete({ id });
    // Also delete events crawled by this setting
    await db.events.delete({ settingId: id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crawl APIs
app.post('/api/crawl/preview', async (req, res) => {
  try {
    const config = req.body;
    if (!config.url) {
      return res.status(400).json({ error: 'URL is required for preview.' });
    }
    // Run crawler in preview mode (isPreview = true)
    const items = await runCrawlForSetting(config, true);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/:id/crawl', async (req, res) => {
  try {
    const { id } = req.params;
    const setting = await db.settings.findOne({ id });
    if (!setting) {
      return res.status(404).json({ error: 'Setting configuration not found.' });
    }
    
    // Run crawler in full mode (isPreview = false)
    const items = await runCrawlForSetting(setting, false);
    
    // Return all events currently stored for this setting or all settings
    const allEvents = await db.events.find();
    res.json({ items, events: allEvents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Events CRUD
app.get('/api/events', async (req, res) => {
  try {
    const list = await db.events.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { statusTags } = req.body;
    
    if (!Array.isArray(statusTags)) {
      return res.status(400).json({ error: 'statusTags must be an array.' });
    }
    
    await db.events.update({ id }, { statusTags });
    res.json({ success: true, id, statusTags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.events.delete({ id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startScheduler();
  runStartupCheck();
});
