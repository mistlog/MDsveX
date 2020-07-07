import { void_els } from './void_els';
import { run } from 'svelte/internal';

// custom mdsvex parse
// handles html-ish and { expression } syntax

// states
// tag_start | tag_end
// open_tag_start | open_tag | attr | attr_value | expression
// close_tag_start
export function remark_mdsvex(eat, value, silent) {
	let index = 0;
	let node;
	let current;
	const state = [];
	let in_quote = false;
	let curly_depth = 0;
	let name = '';

	if (!/^\s*[<{}]/.test(value)) return;
	if (silent) return true;

	run: for (;;) {
		if (last(state) !== 'child' && /</.test(value[index])) {
			state.push('tag_start');
		}

		if (last(state) === 'child' && /</.test(value[index])) {
			state.push('tag_start');
		}

		if (!state.length && /\{/.test(value[index])) {
			state.push('expression');
			current = { type: 'expression', value: '', pos: [index] };
			node = current;
			index++;
			continue run;
		}

		if (!state.length) {
			node.pos.push(index - 1);
			break;
		}

		if (last(state) === 'tag_start') {
			if (/\w/.test(value[index])) {
				state.push('open_tag_start');
				current = {
					type: 'el',
					name: '',
					pos: [index - 1],
					attrs: [],
					children: [],
					self_closing: false,
				};
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
				index++;
			}
		}

		if (last(state) === 'close_tag') {
			if (/\s/.test(value[index])) {
				index++;
				continue run;
			}

			if (/\w/.test(value[index])) name += value[index];

			if (/\s/.test(value[index])) {
				index++;
				continue run;
			}

			if (/\>/.test(value[index])) {
				if (node.name !== name) {
					console.log(node);
					throw new Error(
						`expected closing tagName ${node.name} but instead got ${name}. At offset ${index}`
					);
				}
				node.pos.push(index);
				break;
			}
		}

		if (last(state) === 'open_tag') {
			if (/\w/.test(value[index])) {
				state.push('attr');
				current = { type: 'attr', name: '', pos: [index], value: '' };
				node.attrs.push(current);
			}
		}

		if (last(state) === 'attr') {
			if (/\w/.test(value[index])) {
				current.name += value[index];
			}
			if (/=/.test(value[index])) {
				state.pop();
				state.push('attr_value');
				index++;
			}
			if (/[\s>]/.test(value[index])) {
				state.pop();
				current.value = 'true';
				current.pos.push(index - 1);
			}
		}

		if (last(state) === 'attr_value') {
			if (in_quote) {
				if (/"/.test(value[index])) {
					in_quote = false;
					index++;
					continue run;
				} else current.value += value[index];
			} else {
				if (/\{/.test(value[index])) {
					state.push('expression');
					current.type = 'expression';
					index++;
					continue run;
				}
				if (/"/.test(value[index])) {
					in_quote = true;
					index++;
					continue run;
				}
				if (/[\s>]/.test(value[index])) {
					state.pop();
					current.pos.push(index - 1);
				} else current.value += value[index];
			}
		}

		if (last(state) === 'expression') {
			if (/}/.test(value[index]) && curly_depth === 0) {
				state.pop();
				index++;
				continue run;
			}

			if (/{/.test(value[index])) curly_depth++;
			if (/}/.test(value[index])) curly_depth--;

			current.value += value[index];
			index++;
			continue run;
		}

		if (/>/.test(value[index])) {
			if (void_els.includes(node.name)) {
				node.self_closing = true;
			}
			if (!node.self_closing) {
				state.push('child');
				index++;
				continue run;
			}
			node.pos.push(index);
			break;
		}

		index++;
	}

	return eat(value)(node);
}

function last(arr) {
	return arr[arr.length - 1];
}
