import { type APIRoute } from 'astro';
import puppeteer from 'puppeteer-core';
import {chromium} from 'chrome-aws-lambda';

const exePath =
  process.platform === "win32"
    ? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
    : process.platform === "linux"
    ? "/usr/bin/google-chrome"
    : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const Localoptions = {
        args: [],
        executablePath: exePath,
        headless: true,
    };
const serverOptions = {
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
}

export const POST: APIRoute = async ({ request, url }) => {

    const isDev = url.searchParams.get('dev') === "true";
    console.log('isDev:', isDev);
    const options = isDev ? Localoptions : serverOptions;
    
  try {
    // Extract the "target" query parameter (the URL to capture)
    const targetUrl = url.searchParams.get('src');
    console.log('targetUrl:', targetUrl);

    if (!targetUrl) {
      return new Response('URL query parameter is required', { status: 400 });
    }

    // Validate that the URL starts with http or https
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return new Response('Invalid URL format', { status: 400 });
    }
    
     const browser = await puppeteer.launch(options);
     const page = await browser.newPage();
 
     // set the viewport size
     await page.setViewport({
       width: 1920,
       height: 1080,
       deviceScaleFactor: 1,
     });
 
     // tell the page to visit the url
     await page.goto(targetUrl);
 
     // take a screenshot
     const file = await page.screenshot({
       type: "png",
     });
 
     // close the browser
     await browser.close();

    // Return the PNG image as the response
    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
