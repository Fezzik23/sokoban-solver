document.addEventListener('DOMContentLoaded', function () {
    const STORAGE_KEY = 'sokoban-game-progress-v1';
    const grid = document.getElementById('grid');
    const solutionArea = document.getElementById('solution-area');
    const solutionGrid = document.getElementById('solution-grid');
    const animationStatus = document.getElementById('animation-status');
    const gridSizeSelect = document.getElementById('grid-size');
    const output = document.getElementById('output');
    const solveBtn = document.getElementById('solve-btn');
    const sampleBtn = document.getElementById('sample-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const paletteButtons = document.querySelectorAll('.palette-option');
    const viewTabs = document.querySelectorAll('.view-tab');
    const solverView = document.getElementById('solver-view');
    const gameView = document.getElementById('game-view');

    const playGrid = document.getElementById('play-grid');
    const playLevelTitle = document.getElementById('play-level-title');
    const playLevelSubtitle = document.getElementById('play-level-subtitle');
    const playStatus = document.getElementById('play-status');
    const playProgressPill = document.getElementById('play-progress-pill');
    const playPrevMapBtn = document.getElementById('play-prev-map-btn');
    const playResetMapBtn = document.getElementById('play-reset-map-btn');
    const mapList = document.getElementById('map-list');

    const statusIndicator = document.getElementById('status-indicator');
    statusIndicator.className = 'status-ready';
    statusIndicator.textContent = 'Dibuja un mapa';

    const cellLabels = {
        '#': 'Muro',
        '.': 'Objetivo',
        B: 'Caja',
        X: 'Caja colocada',
        '&': 'Jugador',
        '+': 'Jugador sobre objetivo',
        ' ': 'Vacío',
    };

    let activeView = 'solver';
    let currentStep = 0;
    let mapStates = [];
    let gridRows = 10;
    let gridCols = 10;
    let selectedElement = '#';
    let animationTimer = null;
    let autoAdvanceTimer = null;
    const animationDelayMs = 450;
    const game = {
        levels: [],
        completedIds: new Set(),
        currentIndex: 0,
        state: null,
        loaded: false,
    };
    const sampleLayouts = [
        SokobanSolver.EXAMPLE_MAPS.easy1,
        SokobanSolver.EXAMPLE_MAPS.bug1,
        [
            '#######',
            '#     #',
            '# .B& #',
            '#     #',
            '#######',
        ],
        [
            '########',
            '# .  . #',
            '# B  B #',
            '#   &  #',
            '########',
        ],
        [
            '########',
            '#  .   #',
            '#  B   #',
            '#  #   #',
            '#  B . #',
            '#  &   #',
            '########',
        ],
    ];

    for (let i = 5; i <= 20; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}x${i}`;
        gridSizeSelect.appendChild(option);
    }

    createGrid(parseInt(gridSizeSelect.value, 10) || 10);

    gridSizeSelect.addEventListener('change', () => {
        resetSolutionPreview();
        createGrid(parseInt(gridSizeSelect.value, 10));
    });

    solveBtn.addEventListener('click', solveCurrentGrid);
    sampleBtn.addEventListener('click', loadRandomSampleMap);
    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep -= 1;
            drawMap(mapStates[currentStep]);
        }
    });
    nextBtn.addEventListener('click', () => {
        if (currentStep < mapStates.length - 1) {
            currentStep += 1;
            drawMap(mapStates[currentStep]);
        }
    });

    paletteButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectPaletteElement(button.dataset.value);
        });
    });

    viewTabs.forEach(button => {
        button.addEventListener('click', () => {
            setActiveView(button.dataset.viewTarget);
        });
    });

    playPrevMapBtn.addEventListener('click', () => {
        if (game.currentIndex > 0) {
            loadGameLevel(game.currentIndex - 1);
        }
    });

    playResetMapBtn.addEventListener('click', () => {
        if (game.levels.length > 0) {
            loadGameLevel(game.currentIndex);
        }
    });

    document.addEventListener('keydown', handleGameKeydown);

    setActiveView('solver');
    selectPaletteElement('#');
    loadGameLevels();

    function setActiveView(view) {
        activeView = view;
        viewTabs.forEach(button => {
            const isActive = button.dataset.viewTarget === view;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        solverView.hidden = view !== 'solver';
        gameView.hidden = view !== 'game';
    }

    function stopSolutionAnimation() {
        if (animationTimer) {
            clearInterval(animationTimer);
            animationTimer = null;
        }
    }

    function clearAutoAdvanceTimer() {
        if (autoAdvanceTimer) {
            clearTimeout(autoAdvanceTimer);
            autoAdvanceTimer = null;
        }
    }

    function resetSolutionPreview() {
        stopSolutionAnimation();
        solutionArea.hidden = true;
        solutionGrid.innerHTML = '';
        animationStatus.textContent = 'Esperando solución';
    }

    function selectPaletteElement(value) {
        selectedElement = value === 'empty' ? ' ' : value;

        paletteButtons.forEach(button => {
            const isSelected = button.dataset.value === value;
            button.classList.toggle('is-selected', isSelected);
            button.setAttribute('aria-pressed', String(isSelected));
        });
    }

    function setSolverLoadingState(isLoading) {
        loadingIndicator.hidden = !isLoading;
        solveBtn.disabled = isLoading;
        sampleBtn.disabled = isLoading;
        prevBtn.disabled = isLoading;
        nextBtn.disabled = isLoading;
        gridSizeSelect.disabled = isLoading;
        paletteButtons.forEach(button => {
            button.disabled = isLoading;
        });
    }

    function waitForPaint() {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });
    }

    function cellClassForValue(value) {
        if (value === '#') {
            return 'cell-wall';
        }
        if (value === '.') {
            return 'cell-goal';
        }
        if (value === 'B') {
            return 'cell-box';
        }
        if (value === 'X') {
            return 'cell-box-on-goal';
        }
        if (value === '&') {
            return 'cell-player';
        }
        if (value === '+') {
            return 'cell-player-on-goal';
        }
        return 'cell-empty';
    }

    function setCellValue(cell, value) {
        cell.className = `grid-item ${cellClassForValue(value)}`;
        cell.textContent = '';
        cell.dataset.value = value;
        cell.setAttribute('aria-label', cellLabels[value] || 'Vacío');
        cell.title = cellLabels[value] || 'Vacío';
    }

    function cellSizeForColumns(cols) {
        if (cols >= 18) {
            return 28;
        }
        if (cols >= 14) {
            return 32;
        }
        return 40;
    }

    function filterMapState(mapState) {
        const normalizedMap = mapState.map(row => (
            Array.isArray(row) ? row : Array.from(String(row))
        ));
        const filteredRows = normalizedMap.filter(row => row.some(cell => cell.trim() !== ''));

        if (filteredRows.length === 0) {
            return [];
        }

        const columnsCount = filteredRows[0].length;
        const columnsToRemove = new Array(columnsCount).fill(true);

        filteredRows.forEach(row => {
            row.forEach((cell, index) => {
                if (cell.trim() !== '') {
                    columnsToRemove[index] = false;
                }
            });
        });

        return filteredRows.map(row => (
            row.filter((_, index) => !columnsToRemove[index])
        ));
    }

    function createGrid(size) {
        gridRows = size;
        gridCols = size;
        grid.innerHTML = '';
        grid.style.setProperty('--cell-size', `${cellSizeForColumns(size)}px`);
        grid.style.gridTemplateColumns = `repeat(${size}, var(--cell-size))`;
        grid.style.gridTemplateRows = `repeat(${size}, var(--cell-size))`;

        for (let i = 0; i < size * size; i += 1) {
            const cell = document.createElement('div');
            setCellValue(cell, ' ');
            cell.addEventListener('click', () => {
                setCellValue(cell, selectedElement);
            });
            grid.appendChild(cell);
        }
    }

    function createGridFromMapState(targetGrid, mapState, options = {}) {
        if (mapState.length === 0 || mapState[0].length === 0) {
            console.error('Map state is empty or invalid.');
            return;
        }

        const rows = mapState.length;
        const cols = mapState[0].length;

        if (options.updateMainDimensions) {
            gridRows = rows;
            gridCols = cols;
        }

        targetGrid.innerHTML = '';
        targetGrid.style.setProperty('--cell-size', `${cellSizeForColumns(cols)}px`);
        targetGrid.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
        targetGrid.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;

        for (let i = 0; i < rows * cols; i += 1) {
            const cell = document.createElement('div');
            cell.className = 'grid-item';
            if (options.editable) {
                cell.addEventListener('click', () => {
                    setCellValue(cell, selectedElement);
                });
            }
            targetGrid.appendChild(cell);
        }
    }

    function drawMapInGrid(targetGrid, mapState, options = {}) {
        const filteredMapState = filterMapState(mapState);
        if (filteredMapState.length === 0 || filteredMapState[0].length === 0) {
            console.error('Filtered map state is empty or invalid.');
            return;
        }

        createGridFromMapState(targetGrid, filteredMapState, options);

        const cells = targetGrid.querySelectorAll('.grid-item');
        filteredMapState.forEach((row, y) => {
            row.forEach((value, x) => {
                const cell = cells[y * filteredMapState[0].length + x];
                setCellValue(cell, value);
            });
        });
    }

    function drawMap(mapState) {
        drawMapInGrid(grid, mapState, {
            editable: true,
            updateMainDimensions: true,
        });
    }

    function drawSolutionMap(mapState) {
        drawMapInGrid(solutionGrid, mapState);
    }

    function drawPlayableMap(mapState) {
        drawMapInGrid(playGrid, mapState);
    }

    function startSolutionAnimation(states) {
        stopSolutionAnimation();

        if (states.length === 0) {
            solutionArea.hidden = true;
            return;
        }

        let animationStep = 0;
        const lastStep = states.length - 1;
        solutionArea.hidden = false;
        drawSolutionMap(states[animationStep]);
        animationStatus.textContent = `Paso ${animationStep} / ${lastStep}`;

        if (lastStep === 0) {
            animationStatus.textContent = 'Sin movimientos';
            return;
        }

        animationTimer = setInterval(() => {
            animationStep += 1;
            if (animationStep > lastStep) {
                animationStep = 0;
            }

            drawSolutionMap(states[animationStep]);
            animationStatus.textContent = `Bucle: paso ${animationStep} / ${lastStep}`;
        }, animationDelayMs);
    }

    function collectPuzzleFromGrid() {
        const cells = grid.querySelectorAll('.grid-item');
        const puzzleList = [];
        let currentRow = '';

        cells.forEach((cell, index) => {
            currentRow += cell.dataset.value === ' ' ? ' ' : cell.dataset.value;
            if ((index + 1) % gridCols === 0) {
                puzzleList.push(currentRow);
                currentRow = '';
            }
        });

        return puzzleList.slice(0, gridRows);
    }

    function loadRandomSampleMap() {
        const availableSamples = game.loaded
            ? sampleLayouts.concat(game.levels.map(level => level.layout))
            : sampleLayouts;
        const randomLayout = availableSamples[Math.floor(Math.random() * availableSamples.length)];
        const mapState = randomLayout.map(row => Array.from(row));
        const suggestedSize = Math.max(...randomLayout.map(row => row.length), randomLayout.length);

        resetSolutionPreview();
        mapStates = [];
        currentStep = 0;
        if (suggestedSize >= 5 && suggestedSize <= 20) {
            gridSizeSelect.value = String(suggestedSize);
        }
        drawMap(mapState);
        statusIndicator.className = 'status-ready';
        statusIndicator.textContent = 'Mapa de ejemplo cargado';
        output.textContent = 'Se ha cargado un mapa de ejemplo aleatorio. Pulsa Resolver para ver la solución.';
    }

    function solvePuzzleInWorker(puzzle) {
        if (typeof Worker === 'undefined') {
            return Promise.resolve(SokobanSolver.solvePuzzleBfs(puzzle));
        }

        return new Promise((resolve, reject) => {
            const worker = new Worker('/js/solver-worker.js');

            worker.onmessage = event => {
                worker.terminate();

                if (event.data.ok) {
                    resolve(event.data.result);
                } else {
                    reject(new Error(event.data.error));
                }
            };

            worker.onerror = event => {
                worker.terminate();
                reject(new Error(event.message || 'Error en el worker del solver.'));
            };

            worker.postMessage({ puzzle });
        });
    }

    async function solveCurrentGrid() {
        try {
            resetSolutionPreview();
            setSolverLoadingState(true);
            statusIndicator.className = 'status-solving';
            statusIndicator.innerHTML = 'Resolviendo<span class="blink">...</span>';
            output.textContent = 'Resolviendo mapa...';
            await waitForPaint();

            const puzzle = collectPuzzleFromGrid();
            const solutionBfs = await solvePuzzleInWorker(puzzle);
            mapStates = solutionBfs.maps;
            currentStep = 0;

            if (mapStates.length > 0) {
                drawMap(mapStates[0]);
                startSolutionAnimation(mapStates);
                const solutionText = solutionBfs.solution || '(sin solución)';
                output.textContent = `Pasos de la solución: ${solutionText}`;

                if (solutionBfs.solution) {
                    statusIndicator.className = 'status-solved';
                    statusIndicator.textContent = 'Resuelto';
                } else {
                    statusIndicator.className = 'status-unsolved';
                    statusIndicator.textContent = 'Sin solución';
                }
            } else {
                output.textContent = 'No se recibieron estados del solver.';
                statusIndicator.className = 'status-error';
                statusIndicator.textContent = 'Error';
            }
        } catch (err) {
            console.error('Error running solver:', err);
            output.innerText = 'Error al ejecutar el solver: ' + err.message;
            statusIndicator.textContent = 'Error';
            statusIndicator.className = 'status-error';
        } finally {
            setSolverLoadingState(false);
        }
    }

    async function loadGameLevels() {
        try {
            const response = await fetch('/data/maps.json');
            if (!response.ok) {
                throw new Error('No se pudo cargar el listado de mapas.');
            }

            const data = await response.json();
            if (!data.levels || !Array.isArray(data.levels) || data.levels.length === 0) {
                throw new Error('El JSON de mapas está vacío o es inválido.');
            }

            game.levels = data.levels;
            game.completedIds = sanitizeCompletedIds(readStoredProgress());
            game.loaded = true;
            game.currentIndex = Math.min(getFirstIncompleteIndex(), game.levels.length - 1);
            loadGameLevel(game.currentIndex);
        } catch (err) {
            console.error('Error loading game levels:', err);
            playLevelSubtitle.textContent = 'No se pudieron cargar los mapas.';
            playStatus.className = 'status-error';
            playStatus.textContent = err.message;
            playResetMapBtn.disabled = true;
            playPrevMapBtn.disabled = true;
        }
    }

    function readStoredProgress() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return [];
            }
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.error('Error reading local progress:', err);
            return [];
        }
    }

    function sanitizeCompletedIds(storedIds) {
        const completed = new Set();

        game.levels.forEach(level => {
            if (storedIds.includes(level.id) && completed.size === game.levels.indexOf(level)) {
                completed.add(level.id);
            }
        });

        return completed;
    }

    function persistProgress() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(game.completedIds)));
        } catch (err) {
            console.error('Error saving local progress:', err);
        }
    }

    function getFirstIncompleteIndex() {
        for (let index = 0; index < game.levels.length; index += 1) {
            if (!game.completedIds.has(game.levels[index].id)) {
                return index;
            }
        }
        return game.levels.length - 1;
    }

    function getCompletedCount() {
        return game.completedIds.size;
    }

    function loadGameLevel(index) {
        if (!game.loaded || !game.levels[index]) {
            return;
        }

        clearAutoAdvanceTimer();
        game.currentIndex = index;
        game.state = SokobanGame.createInitialState(game.levels[index].layout);
        drawPlayableMap(SokobanGame.createBoard(game.state));
        renderGameView('Listo para jugar', 'status-ready');
    }

    function renderGameView(statusText, statusClass) {
        const level = game.levels[game.currentIndex];
        const completedCount = getCompletedCount();
        const isFinished = completedCount === game.levels.length;

        playLevelTitle.textContent = `Mapa ${game.currentIndex + 1}: ${level.name}`;
        playLevelSubtitle.textContent = isFinished
            ? 'Todos los mapas están completados.'
            : 'Usa W A S D o flechas para mover al jugador.';
        playProgressPill.textContent = `${completedCount} / ${game.levels.length} completados`;
        playStatus.className = statusClass;
        playStatus.textContent = statusText;
        playPrevMapBtn.disabled = game.currentIndex === 0;
        playResetMapBtn.disabled = false;
        renderMapList();
    }

    function renderMapList() {
        mapList.innerHTML = '';

        game.levels.forEach((level, index) => {
            const item = document.createElement('button');
            const status = getMapStatus(index, level.id);
            item.className = `map-list-item map-${status}`;
            item.type = 'button';
            item.disabled = status === 'locked';

            const title = document.createElement('span');
            title.className = 'map-name';
            title.textContent = `${index + 1}. ${level.name}`;

            const badge = document.createElement('span');
            badge.className = `map-badge badge-${status}`;
            badge.textContent = mapStatusLabel(status);

            item.appendChild(title);
            item.appendChild(badge);
            if (status !== 'locked') {
                item.addEventListener('click', () => {
                    loadGameLevel(index);
                });
            }
            mapList.appendChild(item);
        });
    }

    function getMapStatus(index, id) {
        if (index === game.currentIndex) {
            return 'current';
        }
        if (game.completedIds.has(id)) {
            return 'completed';
        }
        return index <= getCompletedCount() ? 'available' : 'locked';
    }

    function mapStatusLabel(status) {
        if (status === 'current') {
            return 'Actual';
        }
        if (status === 'completed') {
            return 'Completado';
        }
        if (status === 'available') {
            return 'Listo';
        }
        return 'Bloqueado';
    }

    function handleGameKeydown(event) {
        if (activeView !== 'game' || !game.state || !game.loaded) {
            return;
        }

        if (event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }

        const moves = {
            ArrowUp: { row: -1, col: 0 },
            ArrowDown: { row: 1, col: 0 },
            ArrowLeft: { row: 0, col: -1 },
            ArrowRight: { row: 0, col: 1 },
            w: { row: -1, col: 0 },
            W: { row: -1, col: 0 },
            s: { row: 1, col: 0 },
            S: { row: 1, col: 0 },
            a: { row: 0, col: -1 },
            A: { row: 0, col: -1 },
            d: { row: 0, col: 1 },
            D: { row: 0, col: 1 },
        };

        const move = moves[event.key];
        if (!move) {
            return;
        }

        event.preventDefault();
        attemptGameMove(move.row, move.col);
    }

    function attemptGameMove(rowDelta, colDelta) {
        if (!game.state) {
            return;
        }

        const result = SokobanGame.movePlayer(game.state, rowDelta, colDelta);
        if (!result.moved) {
            return;
        }

        game.state = result.state;
        drawPlayableMap(SokobanGame.createBoard(game.state));

        if (result.completed) {
            completeCurrentMap();
        } else {
            renderGameView('En curso', 'status-ready');
        }
    }

    function completeCurrentMap() {
        const currentLevel = game.levels[game.currentIndex];
        game.completedIds.add(currentLevel.id);
        persistProgress();

        if (game.currentIndex < game.levels.length - 1) {
            renderGameView('Completado. Cargando el siguiente mapa...', 'status-solved');
            autoAdvanceTimer = setTimeout(() => {
                loadGameLevel(game.currentIndex + 1);
            }, 850);
            return;
        }

        renderGameView('Has completado toda la campaña.', 'status-solved');
    }
});
