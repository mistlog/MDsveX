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

html('parses attribute expressions', () => {
	const result = remark_mdsvex(eat, `<img class={foo} class="myclass" >`);
	assert.equal(result, {
		value: `<img class={foo} class="myclass" >`,
		node: {
			type: 'el',
			name: 'img',
			pos: [0, 33],

			attrs: [
				{
					type: 'expression',
					pos: [5, 15],
					value: 'foo',
					name: 'class',
				},
				{
					type: 'attr',
					pos: [17, 31],
					value: 'myclass',
					name: 'class',
				},
			],
			children: [],
			self_closing: true,
		},
	});
});

html('parses attribute expressions: with curlies', () => {
	const result = remark_mdsvex(
		eat,
		`<img class={() => {booooo}} class="myclass" >`
	);
	assert.equal(result, {
		value: `<img class={() => {booooo}} class="myclass" >`,
		node: {
			type: 'el',
			name: 'img',
			pos: [0, 44],

			attrs: [
				{
					type: 'expression',
					pos: [5, 26],
					value: '() => {booooo}',
					name: 'class',
				},
				{
					type: 'attr',
					pos: [28, 42],
					value: 'myclass',
					name: 'class',
				},
			],
			children: [],
			self_closing: true,
		},
	});
});

html('parses raw expressions', () => {
	const result = remark_mdsvex(eat, `{foo}`);
	assert.equal(result, {
		value: '{foo}',
		node: {
			type: 'expression',
			pos: [0, 4],
			value: 'foo',
		},
	});
});

html('parses html tag pairs', () => {
	const result = remark_mdsvex(eat, `<h1></h1>`);
	assert.equal(result, {
		value: '<h1></h1>',
		node: {
			type: 'el',
			pos: [0, 8],
			name: 'h1',
			attrs: [],
			children: [],
			self_closing: false,
		},
	});
});

html('parses html tag pairs with attributes', () => {
	const result = remark_mdsvex(
		eat,
		`<h1 class={() => {booooo}} class="myclass"></h1>`
	);

	assert.equal(result, {
		value: '<h1 class={() => {booooo}} class="myclass"></h1>',
		node: {
			type: 'el',
			pos: [0, 47],
			name: 'h1',
			attrs: [
				{
					type: 'expression',
					pos: [4, 25],
					value: '() => {booooo}',
					name: 'class',
				},
				{
					type: 'attr',
					pos: [27, 41],
					value: 'myclass',
					name: 'class',
				},
			],
			children: [],
			self_closing: false,
		},
	});
});

html.run();
