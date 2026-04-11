(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.SokobanGame = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function pointKey(point) {
        return `${point.row},${point.col}`;
    }

    function parsePointKey(key) {
        const [row, col] = key.split(',').map(Number);
        return { row, col };
    }

    function normalizeLayout(layout) {
        if (!Array.isArray(layout) || layout.length === 0) {
            throw new Error('El mapa debe tener al menos una fila.');
        }

        const rows = layout.map(row => (
            Array.isArray(row) ? row.join('') : String(row)
        ));
        const width = Math.max(...rows.map(row => row.length));

        return rows.map(row => row.padEnd(width, '#'));
    }

    function createInitialState(layout) {
        const rows = normalizeLayout(layout);
        const walls = new Set();
        const goals = new Set();
        const boxes = new Set();
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
                    boxes.add(key);
                } else if (cell === '&') {
                    player = point;
                } else if (cell === 'X') {
                    boxes.add(key);
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

        if (boxes.size === 0) {
            throw new Error('El mapa necesita al menos una caja (B).');
        }

        if (goals.size === 0) {
            throw new Error('El mapa necesita al menos un objetivo (.).');
        }

        return {
            width: rows[0].length,
            height: rows.length,
            walls,
            goals,
            boxes,
            player,
        };
    }

    function isCompleted(state) {
        if (state.boxes.size !== state.goals.size) {
            return false;
        }

        return Array.from(state.goals).every(goal => state.boxes.has(goal));
    }

    function createBoard(state) {
        const board = Array.from({ length: state.height }, () => (
            Array.from({ length: state.width }, () => ' ')
        ));

        state.walls.forEach(key => {
            const point = parsePointKey(key);
            board[point.row][point.col] = '#';
        });

        state.goals.forEach(key => {
            const point = parsePointKey(key);
            board[point.row][point.col] = '.';
        });

        state.boxes.forEach(key => {
            const point = parsePointKey(key);
            board[point.row][point.col] = state.goals.has(key) ? 'X' : 'B';
        });

        const playerKey = pointKey(state.player);
        board[state.player.row][state.player.col] = state.goals.has(playerKey) ? '+' : '&';

        return board;
    }

    function movePlayer(state, rowDelta, colDelta) {
        const next = {
            row: state.player.row + rowDelta,
            col: state.player.col + colDelta,
        };
        const nextKey = pointKey(next);

        if (state.walls.has(nextKey)) {
            return {
                state,
                moved: false,
                pushed: false,
                completed: isCompleted(state),
            };
        }

        if (state.boxes.has(nextKey)) {
            const boxTarget = {
                row: next.row + rowDelta,
                col: next.col + colDelta,
            };
            const boxTargetKey = pointKey(boxTarget);

            if (state.walls.has(boxTargetKey) || state.boxes.has(boxTargetKey)) {
                return {
                    state,
                    moved: false,
                    pushed: false,
                    completed: isCompleted(state),
                };
            }

            const newBoxes = new Set(state.boxes);
            newBoxes.delete(nextKey);
            newBoxes.add(boxTargetKey);

            const newState = {
                ...state,
                boxes: newBoxes,
                player: next,
            };

            return {
                state: newState,
                moved: true,
                pushed: true,
                completed: isCompleted(newState),
            };
        }

        const newState = {
            ...state,
            player: next,
        };

        return {
            state: newState,
            moved: true,
            pushed: false,
            completed: isCompleted(newState),
        };
    }

    return {
        createInitialState,
        createBoard,
        movePlayer,
        isCompleted,
    };
}));
