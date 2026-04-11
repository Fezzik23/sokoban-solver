const assert = require('node:assert/strict');
const test = require('node:test');

const { createInitialState, createBoard, movePlayer, isCompleted } = require('../js/game');

test('creates a playable board with player and goals', () => {
    const state = createInitialState([
        '#####',
        '#.  #',
        '# B #',
        '#  &#',
        '#####',
    ]);
    const board = createBoard(state).map(row => row.join(''));

    assert.equal(board[1], '#.  #');
    assert.equal(board[2], '# B #');
    assert.equal(board[3], '#  &#');
});

test('pushes a box onto a goal and completes the level', () => {
    const start = createInitialState([
        '#######',
        '#     #',
        '# .B& #',
        '#     #',
        '#######',
    ]);

    const result = movePlayer(start, 0, -1);
    const board = createBoard(result.state).map(row => row.join(''));

    assert.equal(result.moved, true);
    assert.equal(result.pushed, true);
    assert.equal(result.completed, true);
    assert.equal(isCompleted(result.state), true);
    assert.equal(board[2], '# X&  #');
});

test('blocks movement against walls', () => {
    const start = createInitialState([
        '#####',
        '#&  #',
        '# B.#',
        '#####',
    ]);

    const result = movePlayer(start, -1, 0);

    assert.equal(result.moved, false);
    assert.equal(result.state, start);
});
