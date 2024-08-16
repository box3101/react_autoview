const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

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
      timeout: 180000 // 브라우저 시작 타임아웃을 3분으로 설정
    });
    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 60000 // 페이지 로드 타임아웃은 그대로 60초로 유지
    });

    // 3분 동안 20초마다 스크롤
    for (let i = 0; i < 9; i++) {
      await new Promise(resolve => setTimeout(resolve, 20000)); // 20초 대기
      await page.evaluate(() => {
        window.scrollBy(0, Math.floor(Math.random() * 500) + 100); // 랜덤하게 100-600px 스크롤
      });
    }

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