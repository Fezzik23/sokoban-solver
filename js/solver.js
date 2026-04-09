(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.SokobanSolver = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const DIRECTIONS = [
        { row: -1, col: 0, move: 'u', push: 'U' },
        { row: 1, col: 0, move: 'd', push: 'D' },
        { row: 0, col: -1, move: 'l', push: 'L' },
        { row: 0, col: 1, move: 'r', push: 'R' },
    ];

    const EXAMPLE_MAPS = {
        easy1: [
            '#####',
            '#.  #',
            '# B #',
            '#  &#',
            '#####',
        ],
        easy2: [
            '###',
            '# #',
            '###',
        ],
        easy3: [
            '###',
            '#.#',
            '#B#',
            '#&#',
            '###',
        ],
        blocked: [
            '#####',
            '#.  #',
            '#   #',
            '#B &#',
            '#####',
        ],
        layout1: [
            '#######',
            '##&##..#',
            '# BB B.#',
            '#   B  #',
            '####  .#',
            '#####',
        ],
        bug1: [
            '###',
            '#.#',
            '#.#',
            '#B #',
            '#& #',
            '#  #',
            '#B #',
            '#  #',
            '####',
        ],
    };

    function pointKey(point) {
        return `${point.row},${point.col}`;
    }

    function parsePointKey(key) {
        const [row, col] = key.split(',').map(Number);
        return { row, col };
    }

    function sortPoints(points) {
        return points
            .map(point => ({ row: point.row, col: point.col }))
            .sort((a, b) => a.row - b.row || a.col - b.col);
    }

    function boxesKey(boxes) {
        return sortPoints(boxes).map(pointKey).join(';');
    }

    function stateKey(player, boxes) {
        return `${pointKey(player)}|${boxesKey(boxes)}`;
    }

    function samePoint(a, b) {
        return a.row === b.row && a.col === b.col;
    }

    function normalizeLayout(layout) {
        if (!Array.isArray(layout) || layout.length === 0) {
            throw new Error('El mapa debe tener al menos una fila.');
        }

        const rows = layout.map(row => {
            if (Array.isArray(row)) {
                return row.join('');
            }
            return String(row);
        });
        const width = Math.max(...rows.map(row => row.length));

        return rows.map(row => row.padEnd(width, '#'));
    }

    function parseLayout(layout) {
        const rows = normalizeLayout(layout);
        const walls = new Set();
        const goals = new Set();
        const boxes = [];
        let player = null;

        rows.forEach((row, rowIndex) => {
            Array.from(row).forEach((cell, colIndex) => {
                const point = { row: rowIndex, col: colIndex };
                const key = pointKey(point);

                if (cell === '#') {
                    walls.add(key);
                } else if (cell === '.') {
                    goals.add(key);
                } else if (cell === 'B') {
                    boxes.push(point);
                } else if (cell === '&') {
                    player = point;
                } else if (cell === 'X') {
                    boxes.push(point);
                    goals.add(key);
                } else if (cell === '+') {
                    player = point;
                    goals.add(key);
                }
            });
        });

        if (!player) {
            throw new Error('El mapa necesita un jugador (&).');
        }

        if (boxes.length === 0) {
            throw new Error('El mapa necesita al menos una caja (B).');
        }

        if (goals.size === 0) {
            throw new Error('El mapa necesita al menos un objetivo (.).');
        }

        return {
            height: rows.length,
            width: rows[0].length,
            walls,
            goals,
            player,
            boxes: sortPoints(boxes),
        };
    }

    function isEndState(boxes, goals) {
        const boxKeys = boxesKey(boxes);
        const goalKeys = Array.from(goals)
            .sort((a, b) => {
                const pointA = parsePointKey(a);
                const pointB = parsePointKey(b);
                return pointA.row - pointB.row || pointA.col - pointB.col;
            })
            .join(';');

        return boxKeys === goalKeys;
    }

    function legalActions(state, puzzle) {
        const boxSet = new Set(state.boxes.map(pointKey));
        const actions = [];

        DIRECTIONS.forEach(direction => {
            const next = {
                row: state.player.row + direction.row,
                col: state.player.col + direction.col,
            };
            const nextKey = pointKey(next);

            if (puzzle.walls.has(nextKey)) {
                return;
            }

            if (boxSet.has(nextKey)) {
                const boxTarget = {
                    row: next.row + direction.row,
                    col: next.col + direction.col,
                };
                const boxTargetKey = pointKey(boxTarget);

                if (!puzzle.walls.has(boxTargetKey) && !boxSet.has(boxTargetKey)) {
                    actions.push({ ...direction, symbol: direction.push, pushesBox: true });
                }
                return;
            }

            actions.push({ ...direction, symbol: direction.move, pushesBox: false });
        });

        return actions;
    }

    function updateState(state, action) {
        const newPlayer = {
            row: state.player.row + action.row,
            col: state.player.col + action.col,
        };
        let newBoxes = state.boxes;

        if (action.pushesBox) {
            const pushedBox = newPlayer;
            const movedBox = {
                row: pushedBox.row + action.row,
                col: pushedBox.col + action.col,
            };

            newBoxes = state.boxes.map(box => (
                samePoint(box, pushedBox) ? movedBox : box
            ));
        }

        return {
            player: newPlayer,
            boxes: sortPoints(newBoxes),
        };
    }

    function buildStates(finalKey, statesByKey, parents) {
        const states = [];
        let currentKey = finalKey;

        while (currentKey) {
            states.push(statesByKey.get(currentKey));
            const parent = parents.get(currentKey);
            currentKey = parent ? parent.previousKey : null;
        }

        return states.reverse();
    }

    function buildSolution(finalKey, parents) {
        const actions = [];
        let currentKey = finalKey;

        while (parents.has(currentKey)) {
            const parent = parents.get(currentKey);
            actions.push(parent.action);
            currentKey = parent.previousKey;
        }

        return actions.reverse().join('');
    }

    function createMapFromState(state, puzzle) {
        const map = Array.from({ length: puzzle.height }, () => (
            Array.from({ length: puzzle.width }, () => ' ')
        ));

        puzzle.walls.forEach(key => {
            const wall = parsePointKey(key);
            map[wall.row][wall.col] = '#';
        });

        puzzle.goals.forEach(key => {
            const goal = parsePointKey(key);
            map[goal.row][goal.col] = '.';
        });

        state.boxes.forEach(box => {
            map[box.row][box.col] = puzzle.goals.has(pointKey(box)) ? 'X' : 'B';
        });

        map[state.player.row][state.player.col] = '&';

        return map;
    }

    function generateMaps(states, puzzle) {
        return states.map(state => createMapFromState(state, puzzle));
    }

    function breadthFirstSearch(layout) {
        const puzzle = parseLayout(layout);
        const startState = {
            player: puzzle.player,
            boxes: puzzle.boxes,
        };
        const startKey = stateKey(startState.player, startState.boxes);
        const frontier = [startState];
        const visited = new Set([startKey]);
        const parents = new Map();
        const statesByKey = new Map([[startKey, startState]]);
        let frontierIndex = 0;

        while (frontierIndex < frontier.length) {
            const currentState = frontier[frontierIndex];
            frontierIndex += 1;

            if (isEndState(currentState.boxes, puzzle.goals)) {
                const finalKey = stateKey(currentState.player, currentState.boxes);
                const states = buildStates(finalKey, statesByKey, parents);

                return {
                    solution: buildSolution(finalKey, parents),
                    steps: states,
                    maps: generateMaps(states, puzzle),
                    posWalls: Array.from(puzzle.walls).map(parsePointKey),
                    posGoals: Array.from(puzzle.goals).map(parsePointKey),
                };
            }

            legalActions(currentState, puzzle).forEach(action => {
                const nextState = updateState(currentState, action);
                const nextKey = stateKey(nextState.player, nextState.boxes);

                if (visited.has(nextKey)) {
                    return;
                }

                visited.add(nextKey);
                parents.set(nextKey, {
                    previousKey: stateKey(currentState.player, currentState.boxes),
                    action: action.symbol,
                });
                statesByKey.set(nextKey, nextState);
                frontier.push(nextState);
            });
        }

        return {
            solution: '',
            steps: [startState],
            maps: generateMaps([startState], puzzle),
            posWalls: Array.from(puzzle.walls).map(parsePointKey),
            posGoals: Array.from(puzzle.goals).map(parsePointKey),
        };
    }

    function solvePuzzleBfs(layout) {
        return breadthFirstSearch(layout);
    }

    return {
        EXAMPLE_MAPS,
        PuzzleSolver: {
            parseLayout,
            solvePuzzleBfs,
        },
        solvePuzzleBfs,
    };
}));
