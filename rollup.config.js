import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import { terser } from 'rollup-plugin-terser';

require('fs').unlink('dist/index.d.ts', (err) => {});

export default {
    input: 'src/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'cjs'
        },
        {
            file: pkg.module,
            format: 'es'
        },
        {
            file: pkg.browser,
            format: 'iife',
            name: 'TextSelect'
        }
    ],
    external: [...Object.keys(pkg.dependencies || {})],
    plugins: [
        typescript({
            typescript: require('typescript')
        }),
        terser()
    ]
};
