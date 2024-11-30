import dts from 'rollup-plugin-dts';
import typescript from 'rollup-plugin-typescript2';
import fs from 'fs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const ts = typescript({
	useTsconfigDeclarationDir: true
});

const packageJson = JSON.parse(fs.readFileSync('./package.json'));
const external = Object.keys(packageJson.peerDependencies);

export default [
	{
		input: './src/index.ts',
		plugins: [ts],
		cache: false,
		external,
		output: [
			{
				file: './lib/esm/index.js',
				format: 'es'
			},
			{
				file: './lib/cjs/index.cjs',
				format: 'cjs'
			}
		]
	},
	{
		input: './src/index.ts',
		plugins: [
			ts,
			commonjs(),
			nodeResolve({
				browser: true,
			})
		],
		cache: false,
		output: [
			{
				file: './dist/index.umd.js',
				format: 'umd',
				name: 'html2llm'
			}
		]
	},
	{
		input: './build/index.d.ts',
		output: [
			{
				file: './lib/index.d.ts',
				format: 'es'
			}
		],
		plugins: [dts()],
	}
];
