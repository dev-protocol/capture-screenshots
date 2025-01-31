// @ts-check
import { defineConfig } from 'astro/config'

import vercel from '@astrojs/vercel/serverless'
import netlify from '@astrojs/netlify'
import awsAmplify from 'astro-aws-amplify'

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: process.env.NETLIFY ? netlify() : awsAmplify(),
})
