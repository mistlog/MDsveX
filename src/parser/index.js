import { void_els } from './void_els';

// custom mdsvex parse
// handles html-ish and { expression } syntax

// states
// tag_start | tag_end
// open_tag_start | open_tag | attr | attr_value | expression
// close_tag_start
const lineFeed = 10;

export function remark_mdsvex(eat, value, silent, block) {
	// let tokenizer = this.prototype[`${block ? 'block' : inline}Tokenziers`];
	let index = 0;
	const place = Object.assign(eat.now(), { index });

	let node;
	let current;
	const state = [];
	let in_quote = false;
	let curly_depth = 0;
	let name = '';

	function now() {
		return Object.assign({}, place);
	}

	function consume() {
		// Line ending; assumes CR is not used (remark removes those).
		if (value.charCodeAt(index) === lineFeed) {
			place.line++;
			place.column = 1;
		}
		// Anything else.
		else {
			place.column++;
		}

		index++;

		place.offset++;
		place.index = index;
	}

	if (!/^\s*[<{}]/.test(value)) return;
	if (silent) return true;

	run: for (;;) {
		if (last(state) !== 'child' && /</.test(value[index])) {
			state.push('tag_start');
			consume();
		}

		if (last(state) === 'child' && /</.test(value[index])) {
			state.push('tag_start');
		}

		if (!state.length && /\{/.test(value[index])) {
			state.push('expression');
			current = { type: 'expression', value: '', position: { start: now() } };
			node = current;
			consume();
			continue run;
		}

		if (!state.length) {
			node.position.end = now();
			break;
		}

		if (last(state) === 'tag_start') {
			if (/\w/.test(value[index])) {
				state.push('open_tag_start');
				current = {
					type: 'el',
					name: '',
					attrs: [],
					children: [],
					self_closing: false,
					position: { start: now() },
				};

				current.position.start.offset -= 1;
				current.position.start.column -= 1;
				current.position.start.index -= 1;

				node = current;
			}
			if (/\//.test(value[index])) state.push('close_tag');
			if (/\s/.test(value[index])) {
				throw new Error(
					'Expected a valid tagName for an opening tag or "/" character for a closing tag. Opening tags must have a valid name and closing tags must not contain a space immediately after the opening "<".'
				);
			}
		}

		if (last(state) === 'open_tag_start') {
			if (/[\w]/.test(value[index])) current.name += value[index];
			if (/\//.test(value[index])) {
				state.pop();
				node.self_closing = true;
			}

			if (/\s/.test(value[index])) {
				state.pop();
				state.push('open_tag');
				consume();
			}
		}

		if (last(state) === 'close_tag') {
			if (/\s/.test(value[index])) {
				consume();
				continue run;
			}

			if (/\w/.test(value[index])) name += value[index];

			if (/\s/.test(value[index])) {
				consume();
				continue run;
			}

			if (/\>/.test(value[index])) {
				if (node.name !== name) {
					throw new Error(
						`expected closing tagName ${node.name} but instead got ${name}. At offset ${index}`
					);
				}
				node.position.end = now();
				break;
			}
		}

		if (last(state) === 'open_tag') {
			if (/\w/.test(value[index])) {
				state.push('attr');
				current = {
					type: 'attr',
					name: '',
					value: '',
					position: { start: now() },
				};
				node.attrs.push(current);
			}

			if (/\//.test(value[index])) {
				state.pop();
				node.self_closing = true;
				consume();
			}
		}

		if (last(state) === 'attr') {
			if (/\w/.test(value[index])) {
				current.name += value[index];
			}
			if (/=/.test(value[index])) {
				state.pop();
				state.push('attr_value');
				consume();
			}
			if (/[\s>]/.test(value[index])) {
				state.pop();
				current.value = 'true';
				current.position.end = now();
			}
		}

		if (last(state) === 'attr_value') {
			if (in_quote) {
				if (/"/.test(value[index])) {
					in_quote = false;
					consume();
					continue run;
				} else current.value += value[index];
			} else {
				if (/\{/.test(value[index])) {
					state.push('expression');
					current.type = 'expression';
					consume();
					continue run;
				}
				if (/"/.test(value[index])) {
					in_quote = true;
					consume();
					continue run;
				}
				if (/[\s>]/.test(value[index])) {
					state.pop();
					current.position.end = now();
				} else current.value += value[index];
			}
		}

		if (last(state) === 'expression') {
			if (/}/.test(value[index]) && curly_depth === 0) {
				state.pop();
				consume();
				continue run;
			}

			if (/{/.test(value[index])) curly_depth++;
			if (/}/.test(value[index])) curly_depth--;

			current.value += value[index];
			consume();
			continue run;
		}

		if (/>/.test(value[index])) {
			if (void_els.includes(node.name)) {
				node.self_closing = true;
			}
			if (!node.self_closing) {
				state.push('child');
				consume();
				continue run;
			}
			node.position.end = now();
			break;
		}

		consume();
	}

	return eat(value)(node);
}

function last(arr) {
	return arr[arr.length - 1];
}
