/* eslint-disable functional/no-expression-statements */
import type { Handler } from 'aws-lambda'
import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'
import chromium from '@sparticuz/chromium-min'
import { Chromium } from './libs/chromium.js'
import type { PuppeteerLifeCycleEvent } from 'puppeteer-core'

const exePath =
	process.platform === 'win32'
		? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
		: process.platform === 'linux'
			? '/usr/bin/google-chrome'
			: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const chromiumPack =
	'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar'

const Localoptions = {
	args: [],
	executablePath: exePath,
	headless: true,
}
await chromium.font(
	'https://raw.githack.com/dev-protocol/stackroom/main/fonts/IBM_Plex_Sans_JP/IBMPlexSansJP-Medium.ttf',
)
await chromium.font(
	'https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf',
)
const serverOptions = {
	args: chromium.args,
	executablePath: await chromium.executablePath(chromiumPack),
	headless: true,
}
const puppeteerLifeCycleEvents = [
	'load',
	'domcontentloaded',
	'networkidle0',
	'networkidle2',
] satisfies PuppeteerLifeCycleEvent[]

export const handler: Handler = async (
	event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
	const url = new URL(event.path)
	const { isDev, height, width, cacheControl, gotoThenWaitUntil } = {
		isDev: url.searchParams.get('dev') === 'true',
		height: url.searchParams.get('h'),
		width: url.searchParams.get('w'),
		cacheControl: url.searchParams.get('cache-control'),
		gotoThenWaitUntil: url.searchParams.get('goto-then-waituntil'),
	}
	const options = isDev ? Localoptions : serverOptions

	try {
		// Extract the "target" query parameter (the URL to capture)
		const targetUrl = url.searchParams.get('src')

		if (!targetUrl) {
			return { statusCode: 404, body: 'URL query parameter is required' }
		}

		// Validate that the URL starts with http or https
		if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
			return { statusCode: 400, body: 'Invalid URL format' }
		}

		const browser = await Chromium.getInstance(options)
		const page = await browser.newPage()

		// set the viewport size
		await page.setViewport({
			width: width ? Math.abs(parseInt(width)) : 1920,
			height: height ? Math.abs(parseInt(height)) : 1080,
			deviceScaleFactor: 1,
		})

		await page.setRequestInterception(true)

		// eslint-disable-next-line functional/no-return-void
		page.on('request', (req) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			req.url().includes('capture.clubs.place') ? req.abort() : req.continue()
		})

		// tell the page to visit the url
		const waitUntil: PuppeteerLifeCycleEvent =
			gotoThenWaitUntil &&
			puppeteerLifeCycleEvents.some((x) => x === gotoThenWaitUntil)
				? (gotoThenWaitUntil as PuppeteerLifeCycleEvent)
				: ('networkidle2' as PuppeteerLifeCycleEvent)
		await page.goto(targetUrl, { waitUntil, timeout: 0 })

		// take a screenshot
		const file = await page.screenshot({
			type: 'png',
		})

		// close the browser
		// to reuse the instance, now commented out.
		// await browser.close()

		// Return the PNG image as the response
		return {
			statusCode: 200,
			body: Buffer.from(file).toString('base64'),
			headers: {
				'Content-Type': 'image/png',
				'access-control-allow-origin': '*',
				'cache-control': cacheControl ?? `public, max-age=31536000`,
			},
		} satisfies APIGatewayProxyResult
	} catch (error) {
		console.error('Error capturing screenshot:', error)
		return {
			statusCode: 500,
			body: 'Internal Server Error',
		}
	}
}
