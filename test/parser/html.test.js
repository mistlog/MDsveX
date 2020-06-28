import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { parser } from '../../src/parser/';

const html = suite('html');

html('parses a simple html element', () => {
	const output = parser(`<input>`);

	const expected = {
		position: [0, 7],
		type: 'root',
		children: [
			{
				type: 'element',
				name: 'input',
				children: [],
				attrs: [],
				position: [0, 7],
			},
		],
	};

	assert.equal(output, expected);
});

html.run();
