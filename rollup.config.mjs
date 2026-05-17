import typescript from '@rollup/plugin-typescript';

const outputOptions = {
	exports: 'default',
	sourcemap: true,
};

const config = {
	input: 'src/index.ts',
	plugins: [
		typescript({
			declaration: false,
			declarationMap: false,
			tsconfig: './tsconfig.json',
		}),
	],
	output: [
		{
			...outputOptions,
			file: 'dist/index.mjs',
			format: 'es',
		},
		{
			...outputOptions,
			file: 'dist/index.cjs',
			format: 'cjs',
		},
		{
			...outputOptions,
			file: 'dist/index.umd.js',
			format: 'umd',
			name: 'mergeImages',
		},
	],
};

export default config;
