import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { create_stack } from '../../src/parser/';

const util = suite('util');

util('returns a stack', () => {
	const output = create_stack(`<hello>`);
	const expected = {
		position: [0, 7],
		type: 'root',
		children: [],
	};

	assert.equal(output.get(), expected);
});

util('can add to the stack at a set position', () => {
	const output = create_stack(`<hello>`);
	const expected = {
		position: [0, 7],
		type: 'root',
		children: [{ type: 'boo' }],
	};

	output.add({ type: 'boo' }, ['children', 0]);

	assert.equal(output.get(), expected);
});

util('can update a value on the stack at a set position', () => {
	const output = create_stack(`<hello>`);
	const expected = {
		position: [0, 7],
		type: 'root',
		children: [{ type: 'boop' }],
	};

	output.add({ type: 'boo' }, ['children', 0]);
	output.update('type', 'p', ['children', 0]);
	assert.equal(output.get(), expected);
});

util(
	'can update a value on the stack at a set position, replacing that value',
	() => {
		const output = create_stack(`<hello>`);
		const expected = {
			position: [0, 7],
			type: 'root',
			children: [{ type: 'p' }],
		};

		output.add({ type: 'boo' }, ['children', 0]);
		output.update('type', 'p', ['children', 0], true);
		assert.equal(output.get(), expected);
	}
);

util.run();
