// custom mdsvex parse
// handles html-ish and { expression } syntax

export function remark_mdsvex(eat, value, silent) {
	let end = false;
	let index = 0;
	let node;
	let stack = [];
	let states = [];

	if (!/^\s*[<{}]/.test(value)) return;
	if (silent) return true;

	run: while (!end) {
		if (value[index] === '<') {
			state = 'openTagStart';
			current = { type: 'el', name: '', pos: [index], attr: [] };
			node = current;
		}
	}
}
