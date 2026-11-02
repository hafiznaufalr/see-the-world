// ponytail: assert dynamic map path follows destination count (no dangling tail)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'map-layout.js'), 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const { buildMapNodePositions, buildMapPath } = sandbox;

const eleven = buildMapNodePositions(11);
assert(eleven.length === 11, '11 nodes');
assert(eleven[0].x === 22 && eleven[1].x === 78, 'zigzag start');
assert(eleven[10].x === 50, 'finale centered');

const ten = buildMapNodePositions(10);
assert(ten.length === 10, '10 nodes after delete');
assert(ten[9].x === 50, 'new finale centered');
assert(ten[9].y === 89, 'path ends at bottom');

const path10 = buildMapPath(ten);
const path11 = buildMapPath(eleven);
assert(path10.startsWith('M '), 'path start');
assert(path10 !== path11, 'path changes with count');
assert(path10.split(' C ').length === 10, '10-node path has 9 curves + start');

assert(buildMapNodePositions(0).length === 0, 'empty');
assert(buildMapNodePositions(1).length === 1, 'single');
assert(buildMapNodePositions(1)[0].x === 50, 'single centered');

console.log('map layout check ok');
