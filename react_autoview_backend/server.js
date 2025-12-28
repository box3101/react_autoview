const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

// User-Agent 목록 추가
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0'
];

const getRandomUserAgent = () => {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

app.get('/visit', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('URL parameter is required');
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: "new",
      timeout: 60000
    });
    const page = await browser.newPage();
    
    // ✅ 랜덤 User-Agent 설정
    await page.setUserAgent(getRandomUserAgent());
    
    // ✅ 추가: 뷰포트도 랜덤하게 (선택사항)
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 390, height: 844 },   // iPhone
      { width: 414, height: 896 }    // iPhone XR
    ];
    await page.setViewport(viewports[Math.floor(Math.random() * viewports.length)]);
    
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
    res.send('Visit completed');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error occurred while visiting the URL');
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});