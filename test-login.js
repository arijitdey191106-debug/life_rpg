const puppeteer = require('puppeteer');

async function run() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  console.log("Navigating to /login...");
  await page.goto('http://localhost:3000/login');
  
  console.log("Typing credentials...");
  await page.type('input[type="text"]', 'testuser');
  await page.type('input[type="password"]', 'password123');
  
  console.log("Submitting...");
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);
  
  console.log("Current URL after login:", page.url());
  
  // Wait a bit to see if it redirects back
  await new Promise(r => setTimeout(r, 2000));
  console.log("Current URL after 2s:", page.url());

  const cookies = await page.cookies();
  console.log("Cookies:", cookies.map(c => c.name));

  await browser.close();
}

run().catch(console.error);
