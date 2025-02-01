import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import packageJson from './package.json'

export default {
	external: [
		...Object.keys(packageJson.dependencies),
		...Object.keys(packageJson.devDependencies),
	],
	input: 'src/index.ts',
	output: {
		file: 'dist/index.js',
		format: 'es',
	},
	plugins: [typescript(), commonjs(), nodeResolve(), json()],
}
