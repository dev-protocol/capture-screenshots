/* eslint-disable functional/no-expression-statements */
import { type APIRoute } from 'astro'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import 'puppeteer-extra-plugin-stealth/evasions/chrome.app';
import 'puppeteer-extra-plugin-stealth/evasions/chrome.csi';
import 'puppeteer-extra-plugin-stealth/evasions/chrome.loadTimes';
import 'puppeteer-extra-plugin-stealth/evasions/chrome.runtime';
import 'puppeteer-extra-plugin-stealth/evasions/iframe.contentWindow';
import 'puppeteer-extra-plugin-stealth/evasions/media.codecs';
import 'puppeteer-extra-plugin-stealth/evasions/navigator.hardwareConcurrency';
import 'puppeteer-extra-plugin-stealth/evasions/navigator.languages';
import 'puppeteer-extra-plugin-stealth/evasions/navigator.permissions';
import 'puppeteer-extra-plugin-stealth/evasions/navigator.plugins';
import 'puppeteer-extra-plugin-stealth/evasions/navigator.vendor';
import 'puppeteer-extra-plugin-stealth/evasions/navigator.webdriver';
import 'puppeteer-extra-plugin-stealth/evasions/sourceurl';
import 'puppeteer-extra-plugin-stealth/evasions/user-agent-override';
import 'puppeteer-extra-plugin-stealth/evasions/webgl.vendor';
import 'puppeteer-extra-plugin-stealth/evasions/window.outerdimensions';


// Use the stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin())

export const GET: APIRoute = async ({ url }) => {
  // Extract query parameters
  const isDev = url.searchParams.get('dev') === 'true'
  const heightParam = url.searchParams.get('h')
  const widthParam = url.searchParams.get('w')
  const cacheControl = url.searchParams.get('cache-control')
  const targetUrl = url.searchParams.get('src')

  // Basic error checks
  if (!targetUrl) {
    return new Response('URL query parameter (src) is required', { status: 400 })
  }
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return new Response('Invalid URL format', { status: 400 })
  }

  // Convert width/height strings to numbers
  const width = widthParam ? Math.abs(parseInt(widthParam, 10)) : 1920
  const height = heightParam ? Math.abs(parseInt(heightParam, 10)) : 1080

  try {
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      // If you need to debug locally, set headless to false
      // But by default it's safer to keep headless: true
      headless: true,
      // Possibly set args like:
      // args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    // Create a new page
    const page = await browser.newPage()

    // Optional: set your viewport
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
    })

    // Optional: set a realistic user-agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/109.0.5414.74 Safari/537.36'
    )

    // Navigate
    await page.goto(targetUrl, { waitUntil: 'networkidle2' })

    // Capture a screenshot
    const file = await page.screenshot({ type: 'png' })

    // Close the browser (optional, but recommended)
    await browser.close()

    // Return the screenshot as a PNG
    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'access-control-allow-origin': '*',
        'cache-control': cacheControl ?? 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Error capturing screenshot:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
