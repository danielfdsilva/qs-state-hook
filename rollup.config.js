import babel from '@rollup/plugin-babel';

import pkg from './package.json';

export default {
  input: 'src/index.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: false,
      strict: false
    }
  ],
  plugins: [babel({ babelHelpers: 'bundled' })],
  external: Object.keys(pkg.peerDependencies)
};
