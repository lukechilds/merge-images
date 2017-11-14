import buble from 'rollup-plugin-buble';
import camelCase from 'camelcase';

const pkg = require('./package.json');

export default {
	input: 'src/index.js',
	plugins: [
		buble()
	],
	output: [
		{
			file: pkg.main,
			format: 'umd',
			name: camelCase(pkg.name),
			sourcemap: true
		},
		{
			file: pkg.module,
			format: 'es',
			sourcemap: true
		}
	]
};
