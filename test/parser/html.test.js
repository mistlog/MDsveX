import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { remark_mdsvex } from '../../src/parser/';
import unified from 'unified';
import remark from 'remark-parse';

function locate_mdsvex(value, from) {
	const brace = value.indexOf('{', from);
	const angle = value.indexOf('<', from);
	return angle === -1 ? brace : brace === -1 ? angle : Math.min(brace, angle);
}

function parse_mdsvex() {
	const proto = this.Parser.prototype;
	const spans = proto.inlineTokenizers;
	const blocks = proto.blockTokenizers;
	const inlineMethods = proto.inlineMethods;
	const blockMethods = proto.blockMethods;

	// Replace HTML in order with MDX.
	inlineMethods.splice(inlineMethods.indexOf('html'), 1, 'mdsvex');
	blockMethods.splice(blockMethods.indexOf('html'), 1, 'mdsvex');
	// Remove indented code and autolinks.
	blockMethods.splice(blockMethods.indexOf('indentedCode'), 1);
	inlineMethods.splice(inlineMethods.indexOf('autoLink'), 1);

	// Replace tokenizers.
	spans.autoLink = undefined;
	spans.html = undefined;
	spans.mdsvex = createParser(false);
	blocks.html = undefined;
	blocks.indentedCode = undefined;
	blocks.mdsvex = createParser(true);

	// Overwrite paragraph to ignore whitespace around line feeds.
	// blocks.paragraph = createParagraphParser(blocks.paragraph);

	// Find tokens fast.
	spans.mdsvex.locator = locate_mdsvex;

	Object.keys(proto).forEach(interrupt);

	function createParser(block) {
		parse.displayName = 'mdsvex' + (block ? 'Block' : 'Span');
		return parse;
		function parse(eat, value, silent) {
			return remark_mdsvex.call(this, eat, value, silent, block);
		}
	}

	// function createParagraphParser(oParagraph) {
	// 	return parseParagraph;
	// 	function parseParagraph(eat, value, silent) {
	// 		return paragraph.call(this, eat, value, silent, oParagraph);
	// 	}
	// }

	function interrupt(key) {
		const prefix = 'interrupt';

		if (key.slice(0, prefix.length) === prefix) {
			proto[key] = proto[key].filter(notHtmlOrIndentedCode);
		}

		function notHtmlOrIndentedCode(tuple) {
			const name = tuple[0];
			return name !== 'html' && name !== 'indentedCode';
		}
	}
}

const mdsvex = unified()
	.use(remark)
	.use(parse_mdsvex);

const html = suite('html');

const eat = value => node => ({
	value,
	node,
});

html('parses a self-closing element', () => {
	const result = mdsvex.parse(`<img />`);
	const expected = [
		{
			type: 'el',
			name: 'img',
			attrs: [],
			children: [],
			self_closing: true,
			position: {
				start: {
					line: 1,
					column: 1,
					offset: 0,
					index: 0,
				},
				end: {
					line: 1,
					column: 8,
					offset: 7,
				},
				indent: [],
			},
		},
	];

	console.log('ACTUAL: ', JSON.stringify(result.children, null, 2));
	console.log('EXPECTS:', JSON.stringify(expected, null, 2));
	assert.equal(result.children, expected);
});

html.skip('parses a void element without a closing slash', () => {
	const result = mdsvex.parse(`<img>`);
	assert.equal(result, {
		value: `<img>`,
		node: {
			type: 'el',
			name: 'img',
			children: [],
			attrs: [],
			self_closing: true,
			position: {
				start: {
					line: 1,
					column: 1,
					offset: 0,
					index: 0,
				},
				end: {
					line: 1,
					column: 8,
					offset: 7,
				},
				indent: [],
			},
		},
	});
});

html.skip('parses attributes', () => {
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

html.skip('parses multiple attributes', () => {
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

html.skip('parses multiple attributes on a void element', () => {
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

html.skip('parses attribute expressions', () => {
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

html.skip('parses attribute expressions: with curlies', () => {
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

html.skip('parses raw expressions', () => {
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

html.skip('parses html tag pairs', () => {
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

html.skip('parses html tag pairs with attributes', () => {
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

html.skip('parses html tag pairs with children', () => {
	const o = new Object();
	o.isPrototypeOf.tokenisers = remark_mdsvex;
	const result = remark_mdsvex.apply(
		{ blockTokenizer: remark_mdsvex, inlineTokenizer: remark_mdsvex },
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
