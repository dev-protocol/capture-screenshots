import type { Browser, PuppeteerLaunchOptions } from 'puppeteer-core'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

export const Chromium = (() => {
	const instances: WeakMap<PuppeteerLaunchOptions, Browser> = new WeakMap()

	const createInstance = (options: PuppeteerLaunchOptions) => {
		// eslint-disable-next-line functional/no-expression-statements
		console.log('&&&&&', 'new chromium instanse will be created')
		return puppeteer.launch(options)
	}

	return {
		getInstance: async (options: PuppeteerLaunchOptions) => {
			const fromCache = instances.get(options)
			const instance = fromCache
				? fromCache
				: (instances
						.set(options, await createInstance(options))
						.get(options) as Browser)
			return instance
		},
	}
})()
