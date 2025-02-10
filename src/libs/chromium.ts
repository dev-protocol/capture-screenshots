import type { Browser, LaunchOptions } from 'puppeteer-core'
import puppeteer from 'puppeteer-core'

export const Chromium = (() => {
	const instances: WeakMap<LaunchOptions, Browser> = new WeakMap()

	const createInstance = (options: LaunchOptions) => {
		// eslint-disable-next-line functional/no-expression-statements
		console.log('&&&&&', 'new chromium instanse will be created')
		return puppeteer.launch(options)
	}

	return {
		getInstance: async (options: LaunchOptions) => {
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
