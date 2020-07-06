import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { remark_mdsvex } from '../../src/parser/';

const html = suite('html');

const eat = value => node => ({
	value,
	node,
});

html('parses a self-closing element', () => {
	const result = remark_mdsvex(eat, `<img />`);
	assert.equal(result, {
		value: `<img />`,
		node: {
			type: 'el',
			name: 'img',
			children: [],
			attrs: [],
			self_closing: true,
			pos: [0, 6],
		},
	});
});

html('parses a void element without a closing slash', () => {
	const result = remark_mdsvex(eat, `<img>`);
	assert.equal(result, {
		value: `<img>`,
		node: {
			type: 'el',
			name: 'img',
			children: [],
			attrs: [],
			self_closing: true,
			pos: [0, 4],
		},
	});
});

html('parses attributes', () => {
	const result = remark_mdsvex(eat, `<img class="myclass" />`);
	assert.equal(result, {
		value: `<img class="myclass" />`,
		node: {
			type: 'el',
			name: 'img',
			children: [],
			attrs: [
				{
					type: 'attr',
					pos: [5, 19],
					value: 'myclass',
					name: 'class',
				},
			],
			self_closing: true,
			pos: [0, 22],
		},
	});
});

html('parses multiple attributes', () => {
	const result = remark_mdsvex(eat, `<img class="myclass" class="myclass" />`);
	assert.equal(result, {
		value: `<img class="myclass" class="myclass" />`,
		node: {
			type: 'el',
			name: 'img',
			children: [],
			attrs: [
				{
					type: 'attr',
					pos: [5, 19],
					value: 'myclass',
					name: 'class',
				},
				{
					type: 'attr',
					pos: [21, 35],
					value: 'myclass',
					name: 'class',
				},
			],
			self_closing: true,
			pos: [0, 38],
		},
	});
});

html('parses multiple attributes on a void element', () => {
	const result = remark_mdsvex(eat, `<img class="myclass" class="myclass" >`);
	assert.equal(result, {
		value: `<img class="myclass" class="myclass" >`,
		node: {
			type: 'el',
			name: 'img',
			children: [],
			attrs: [
				{
					type: 'attr',
					pos: [5, 19],
					value: 'myclass',
					name: 'class',
				},
				{
					type: 'attr',
					pos: [21, 35],
					value: 'myclass',
					name: 'class',
				},
			],
			self_closing: true,
			pos: [0, 37],
		},
	});
});

html.run();
