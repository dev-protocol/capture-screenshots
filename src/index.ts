/* eslint-disable functional/no-expression-statements */
import type { Handler } from 'aws-lambda'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import chromium from '@sparticuz/chromium'
import { Chromium } from './libs/chromium.js'
import type { PuppeteerLifeCycleEvent } from 'puppeteer-core'

const exePath =
	process.platform === 'win32'
		? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
		: process.platform === 'linux'
			? '/usr/bin/google-chrome'
			: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const Localoptions = {
	args: [],
	executablePath: exePath,
	headless: true,
}
const serverOptions = {
	args: chromium.args,
	executablePath: await chromium.executablePath(),
	headless: true,
	ignoreHTTPSErrors: true,
}
const puppeteerLifeCycleEvents = [
	'load',
	'domcontentloaded',
	'networkidle0',
	'networkidle2',
] satisfies PuppeteerLifeCycleEvent[]

type APIGatewayEvent = Omit<APIGatewayProxyEvent, 'requestContext'> & {
	requestContext: APIGatewayProxyEvent['requestContext'] & {
		http?: { path?: string }
	}
}

const U = undefined
const EXP = /\/.+\/with\/([0-9]+)\/([0-9]+)\/(.+)/

export const handler: Handler = async ({
	queryStringParameters,
	requestContext,
}: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
	console.log('queryStringParameters', queryStringParameters)
	const path = requestContext.http?.path
	const pathParams = path
		? ((arg) =>
				arg
					? {
							w: arg[1],
							h: arg[2],
							src: decodeURIComponent(arg[3]).replace(
								/^(http)(s?):\/\/?/,
								'$1$2://',
							),
						}
					: U)(path.match(EXP))
		: U
	console.log('pathParams', pathParams)
	const params = { ...queryStringParameters }
	const { isDev, height, width, src, cacheControl, gotoThenWaitUntil } = {
		isDev: params['dev'] === 'true',
		height: pathParams?.h ?? params['h'],
		width: pathParams?.w ?? params['w'],
		src: pathParams?.src ?? params['src'],
		cacheControl: params['cache-control'],
		gotoThenWaitUntil: params['goto-then-waituntil'],
	}
	const options = isDev ? Localoptions : serverOptions

	try {
		// Extract the "target" query parameter (the URL to capture)
		const targetUrl = src

		if (!targetUrl) {
			return { statusCode: 404, body: 'URL query parameter is required' }
		}

		// Validate that the URL starts with http or https
		if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
			return { statusCode: 400, body: 'Invalid URL format' }
		}

		const browser = await Chromium.getInstance(options)
		const page = await browser.newPage()

		await Promise.all([
			// set the viewport size
			page.setViewport({
				width: width ? Math.abs(parseInt(width)) : 1920,
				height: height ? Math.abs(parseInt(height)) : 1080,
				deviceScaleFactor: 1,
			}),
			page.setRequestInterception(true),
		])

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
			isBase64Encoded: true,
		} satisfies APIGatewayProxyResult
	} catch (error) {
		console.error('Error capturing screenshot:', error)
		return {
			statusCode: 500,
			body: 'Internal Server Error',
		}
	}
}
