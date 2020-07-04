import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { parser } from '../../src/parser/';

const html = suite('html');

html('parses a simple html element', () => {});

html.run();
