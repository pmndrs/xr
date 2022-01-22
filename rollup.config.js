import path from 'path'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import json from 'rollup-plugin-json'
import { sizeSnapshot } from 'rollup-plugin-size-snapshot'

const root = process.platform === 'win32' ? path.resolve('/') : '/'
const external = (id) => !id.startsWith('.') && !id.startsWith(root)
const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json']

const getBabelOptions = ({ useESModules }, targets) => ({
  babelrc: false,
  extensions,
  exclude: '**/node_modules/**',
  runtimeHelpers: true,
  presets: [['@babel/preset-env', { loose: true, modules: false, targets }], '@babel/preset-react', '@babel/preset-typescript'],
  plugins: [
    ['transform-react-remove-prop-types', { removeImport: true }],
    ['@babel/transform-runtime', { regenerator: false, useESModules }]
  ]
})

export default [
  {
    input: `./src/index.tsx`,
    output: { file: `dist/index.js`, format: 'esm' },
    external,
    plugins: [json(), babel(getBabelOptions({ useESModules: true }, 'supports webxr')), sizeSnapshot(), resolve({ extensions })]
  },
  {
    input: `./src/index.tsx`,
    output: { file: `dist/index.cjs.js`, format: 'cjs' },
    external,
    plugins: [json(), babel(getBabelOptions({ useESModules: false }, 'supports webxr')), sizeSnapshot(), resolve({ extensions })]
  }
]
