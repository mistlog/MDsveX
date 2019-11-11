import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

import pkg from './package.json';

const opts = {
	plugins: [resolve({ preferBuiltins: true }), commonjs(), json()],
};

export default [
	{
		...opts,
		input: 'src/main.ts',
		output: [
			{ file: pkg.module, format: 'es', sourcemap: false },
			{ file: pkg.main, format: 'cjs', sourcemap: false },
		],
	},
];
