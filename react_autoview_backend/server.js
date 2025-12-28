const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0'
];

const viewports = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 390, height: 844 },
  { width: 414, height: 896 }
];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

app.get('/visit', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('URL parameter is required');
  }

  let browser;
  try {
    console.log(`[${new Date().toISOString()}] Visiting: ${url}`);
    
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: "new",
      timeout: 60000
    });
    
    const page = await browser.newPage();
    await page.setUserAgent(getRandomItem(userAgents));
    await page.setViewport(getRandomItem(viewports));
    
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // ✅ 랜덤 체류 시간 (15~30초)
    const stayTime = Math.floor(Math.random() * 15000) + 15000;
    
    // ✅ 자연스러운 스크롤 동작
    await page.evaluate(async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      const scrollStep = Math.floor(Math.random() * 300) + 200;
      
      for (let i = 0; i < 5; i++) {
        window.scrollBy(0, scrollStep);
        await delay(Math.floor(Math.random() * 1000) + 500);
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, stayTime));
    
    console.log(`[${new Date().toISOString()}] Completed: ${url} (${(stayTime/1000).toFixed(1)}초 체류)`);
    res.status(200).send('Visit completed');
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error.message);
    res.status(500).send('Error occurred');
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Browser close error:', e.message);
      }
    }
  }
});

app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});