/* eslint-disable functional/no-expression-statements */
import { type APIRoute } from 'astro'
import chromium from '@sparticuz/chromium-min'
import { Chromium } from '../../libs/chromium.ts'

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
const serverOptions = {
	args: chromium.args,
	executablePath: await chromium.executablePath(chromiumPack),
	headless: true,
}

export const GET: APIRoute = async ({ url }) => {
	const { isDev, height, width, cacheControl } = {
		isDev: url.searchParams.get('dev') === 'true',
		height: url.searchParams.get('h'),
		width: url.searchParams.get('w'),
		cacheControl: url.searchParams.get('cache-control'),
	}
	const options = isDev ? Localoptions : serverOptions

	try {
		// Extract the "target" query parameter (the URL to capture)
		const targetUrl = url.searchParams.get('src')

		if (!targetUrl) {
			return new Response('URL query parameter is required', { status: 400 })
		}

		// Validate that the URL starts with http or https
		if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
			return new Response('Invalid URL format', { status: 400 })
		}

		const browser = await Chromium.getInstance(options)
		const page = await browser.newPage()

		// set the viewport size
		await page.setViewport({
			width: width ? Math.abs(parseInt(width)) : 1920,
			height: height ? Math.abs(parseInt(height)) : 1080,
			deviceScaleFactor: 1,
		})

		// tell the page to visit the url
		await page.goto(targetUrl)

		// take a screenshot
		const file = await page.screenshot({
			type: 'png',
		})

		// close the browser
		// to reuse the instance, now commented out.
		// await browser.close()

		// Return the PNG image as the response
		return new Response(file, {
			status: 200,
			headers: {
				'Content-Type': 'image/png',
				'access-control-allow-origin': '*',
				'cache-control': cacheControl ?? `public, max-age=31536000`,
			},
		})
	} catch (error) {
		console.error('Error capturing screenshot:', error)
		return new Response('Internal Server Error', { status: 500 })
	}
}
