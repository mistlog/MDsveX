export function create_stack(source) {
	const v = {
		type: 'root',
		position: [0, source.length],
		children: [],
	};

	function access(position) {
		let o = v;
		for (let i = 0; i < position.length - 1; i++) {
			o = o[position[i]];
		}
		return o[position[position.length - 1]];
	}

	return {
		get() {
			return v;
		},
		add(node, position) {
			let o = v;
			for (let i = 0; i < position.length - 1; i++) {
				console.log(position[i]);
				o = o[position[i]];
			}
			o[position[position.length - 1]] = node;
		},
		update(path, value, position, replace) {
			let v = value;
			if (!replace) {
				const current = access([...position, path]);
				v = Array.isArray(current) ? current.concat(v) : current + v;
			}
			this.add(v, [...position, path]);
		},
	};
}

export function create_node(type, start) {
	return {
		type,
		name: '',
		position: [start],
		children: [],
		attrs: [],
	};
}

function parse_tag(source, stack, pointer, position, terminator) {
	if (source[position.p] === terminator) {
		position.p++;

		stack.update('position', [position.p], pointer);
		return;
	}
	if (/[a-z]/.test(source[position.p])) {
		stack.update('type', 'element', pointer, true);
		stack.update('position', [position.p - 1], pointer, true);
		parse_name(source, stack, pointer, position, /[\s|>]/);
	} else if (/\s/.test(source[position])) {
		if (typeof pointer[pointer.length] === 'number') {
			pointer[pointer.length] = pointer[pointer.length] + 1;
			stack.add(create_node('attribute', position.p), pointer, true);
		} else {
			pointer.push('attrs');
			pointer.push(0);
		}
		position.p++;

		parse_attr(source, pointer, position, /\s/);
	}

	parse_tag(source, stack, pointer, position, terminator);
}

function parse_name(source, stack, pointer, position, terminator) {
	if (terminator.test(source[position.p])) return;
	stack.update('name', source[position.p], pointer);

	position.p++;
	return parse_name(source, stack, pointer, position, terminator);
}

function parse_attr_value() {}

function parse_attr(source, stack, pointer, position, terminator) {
	if (terminator.test(source[position.p])) {
		pointer.pop();
		return;
	}
	if (/\w|:/.test(source[position.p])) {
		stack.update('name', source[position.p], pointer);
	} else if (/=/.test(source[position.p])) {
		pointer.push('value');
	}
	stack.update('name', source[position.p], pointer);

	position.p++;
	return parse_attrs(source, stack, pointer, position, terminator);
}

export function parser(source) {
	const stack = create_stack(source);
	const tokens = {
		open_tag: '<',
		close_tag: '>',
		whitespace: ' ',
		lower_text: /[a-z]/,
	};

	const pointer = ['children', 0];
	const position = { p: 0 };

	if (source[position.p] === tokens.open_tag) {
		stack.add(create_node('tag', position.p), pointer);
		position.p++;
		parse_tag(source, stack, pointer, position, '>');
	}

	return stack.get();
}
