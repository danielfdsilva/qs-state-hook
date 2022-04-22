import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

import pkg from './package.json';

const name = require('./package.json').main.replace(/\.js$/, '');

const bundle = (config) => ({
  ...config,
  input: 'src/index.ts',
  external: Object.keys(pkg.peerDependencies)
});

export default [
  bundle({
    plugins: [esbuild()],
    output: [
      {
        file: `${name}.js`,
        format: 'cjs',
        sourcemap: true
      },
      {
        file: `${name}.mjs`,
        format: 'es',
        sourcemap: true
      }
    ]
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: `${name}.d.ts`,
      format: 'es'
    }
  })
];
