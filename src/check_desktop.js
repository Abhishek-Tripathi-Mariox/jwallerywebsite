const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 400));
  const d = await page.evaluate(() => {
    const logo = document.querySelector('.brand-logo').getBoundingClientRect();
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, logoWidth: Math.round(logo.width) };
  });
  console.log(JSON.stringify(d));
  await browser.close();
})();
