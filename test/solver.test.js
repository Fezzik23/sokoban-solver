const assert = require('node:assert/strict');
const test = require('node:test');

const { EXAMPLE_MAPS, solvePuzzleBfs } = require('../js/solver');

test('solves a simple one-box puzzle', () => {
    const result = solvePuzzleBfs(EXAMPLE_MAPS.easy1);
    const finalMap = result.maps.at(-1).map(row => row.join(''));

    assert.notEqual(result.solution, '');
    assert.equal(result.maps.length, result.solution.length + 1);
    assert.equal(finalMap[1][1], 'X');
});

test('solves bug1 without Pyodide or Python', () => {
    const result = solvePuzzleBfs(EXAMPLE_MAPS.bug1);
    const finalMap = result.maps.at(-1).map(row => row.join(''));

    assert.notEqual(result.solution, '');
    assert.equal(result.maps.length, result.solution.length + 1);
    assert.deepEqual(finalMap, [
        '####',
        '#X##',
        '#X##',
        '#& #',
        '#  #',
        '#  #',
        '#  #',
        '#  #',
        '####',
    ]);
});
