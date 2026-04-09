document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('grid');
    const solutionArea = document.getElementById('solution-area');
    const solutionGrid = document.getElementById('solution-grid');
    const animationStatus = document.getElementById('animation-status');
    const gridSizeSelect = document.getElementById('grid-size');
    const elementSelect = document.getElementById('element-select');
    const output = document.getElementById('output');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    const statusIndicator = document.getElementById('status-indicator');
    statusIndicator.className = 'status-ready';
    statusIndicator.textContent = 'Dibuja un mapa';

    let currentStep = 0;
    let mapStates = [];  // Aquí almacenaremos los estados del mapa
    let gridRows = 10;
    let gridCols = 10;
    let animationTimer = null;
    const animationDelayMs = 450;
    const cellLabels = {
        '#': 'Muro',
        '.': 'Objetivo',
        B: 'Caja',
        X: 'Caja colocada',
        '&': 'Jugador',
        ' ': 'Vacío',
    };

    // Añadir opciones de tamaño de cuadrícula dinámicamente
    for (let i = 5; i <= 20; i++) {
        let option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}x${i}`;
        gridSizeSelect.appendChild(option);
    }

    // Inicialización con un tamaño por defecto de 10x10 o basado en la selección del usuario
    createGrid(parseInt(gridSizeSelect.value) || 10);

    gridSizeSelect.addEventListener('change', () => {
        resetSolutionPreview();
        createGrid(parseInt(gridSizeSelect.value));
    });

    document.getElementById('solve-btn').addEventListener('click', solveCurrentGrid);

    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            drawMap(mapStates[currentStep]);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentStep < mapStates.length - 1) {
            currentStep++;
            drawMap(mapStates[currentStep]);
        }
    });

    function stopSolutionAnimation() {
        if (animationTimer) {
            clearInterval(animationTimer);
            animationTimer = null;
        }
    }

    function resetSolutionPreview() {
        stopSolutionAnimation();
        solutionArea.hidden = true;
        solutionGrid.innerHTML = '';
        animationStatus.textContent = 'Esperando solución';
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
        // Filtrar filas vacías
        let filteredRows = mapState.filter(row => row.some(cell => cell.trim() !== ''));
    
        if (filteredRows.length === 0) {
            return [];  // Retorna un array vacío si todas las filas son vacías
        }
    
        // Filtrar columnas vacías
        let columnsCount = filteredRows[0].length;
        let columnsToRemove = new Array(columnsCount).fill(true);
    
        // Determinar qué columnas son completamente vacías
        filteredRows.forEach(row => {
            row.forEach((cell, index) => {
                if (cell.trim() !== '') {
                    columnsToRemove[index] = false;
                }
            });
        });
    
        // Filtrar las columnas marcadas como 'true' en columnsToRemove
        return filteredRows.map(row =>
            row.filter((_, index) => !columnsToRemove[index])
        );
    }

    function createGrid(size) {
        gridRows = size;
        gridCols = size;
        grid.innerHTML = '';
        grid.style.setProperty('--cell-size', `${cellSizeForColumns(size)}px`);
        grid.style.gridTemplateColumns = `repeat(${size}, var(--cell-size))`;
        grid.style.gridTemplateRows = `repeat(${size}, var(--cell-size))`;
    
        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            setCellValue(cell, ' ');
            cell.addEventListener('click', () => {
                setCellValue(cell, elementSelect.value);
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

        for (let i = 0; i < rows * cols; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-item';
            if (options.editable) {
                cell.addEventListener('click', () => {
                    setCellValue(cell, elementSelect.value);
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

    function solveCurrentGrid() {
        try {
            resetSolutionPreview();
            statusIndicator.className = 'status-solving';
            statusIndicator.innerHTML = 'Solving<span class="blink">...</span>';

            const puzzle = collectPuzzleFromGrid();
            const solutionBfs = SokobanSolver.solvePuzzleBfs(puzzle);
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
        }
    }
});
