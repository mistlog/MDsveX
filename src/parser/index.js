// custom mdsvex parse
// handles html-ish and { expression } syntax

// states
// tag_start | tag_end
// open_tag_start | open_tag | attr | attr_value | expression
// close_tag_start
export function remark_mdsvex(eat, value, silent) {
	let end = false;
	let index = 0;
	let node;
	let current;
	const state = [];

	if (!/^\s*[<{}]/.test(value)) return;
	if (silent) return true;

	run: while (!end) {
		if (/</.test(value[index])) {
			state.push('tag_start');
			current = {
				type: 'el',
				name: '',
				pos: [index],
				attrs: [],
				children: [],
				self_closing: false,
			};
			node = current;
		}

		if (last(state) === 'tag_start') {
			if (/\w/.test(value[index])) state.push('open_tag_start');
			if (/\//.test(value[index])) state.push('close_tag_start');
		}

		if (last(state) === 'open_tag_start') {
			if (/\w/.test(value[index])) current.name += value[index];
			if (/\//.test(value[index])) {
				state.pop();
				node.self_closing = true;
			}
		}

		if (/>/.test(value[index])) {
			node.pos.push(index);
			break;
		}

		index++;

		function last(arr) {
			return arr[arr.length - 1];
		}
	}

	return eat(value)(node);
}
