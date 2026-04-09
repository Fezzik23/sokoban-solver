document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('grid');
    const gridSizeSelect = document.getElementById('grid-size');
    const elementSelect = document.getElementById('element-select');
    const output = document.getElementById('output');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    const statusIndicator = document.getElementById('status-indicator');
    statusIndicator.className = 'status-ready';
    statusIndicator.textContent = 'Draw a map';

    let currentStep = 0;
    let mapStates = [];  // Aquí almacenaremos los estados del mapa
    let gridRows = 10;
    let gridCols = 10;

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
        grid.style.gridTemplateColumns = `repeat(${size}, 40px)`;
        grid.style.gridTemplateRows = `repeat(${size}, 40px)`;
    
        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-item';
            cell.textContent = ' ';  // Inicialmente vacío
            cell.dataset.value = ' ';  // Usamos un espacio para representar vacío
            cell.addEventListener('click', () => {
                cell.textContent = elementSelect.value;
                cell.dataset.value = elementSelect.value;
            });
            grid.appendChild(cell);
        }
    }

    function createGridFromMapState(mapState) {
        if (mapState.length === 0 || mapState[0].length === 0) {
            console.error('Map state is empty or invalid.');
            return;
        }

        const rows = mapState.length;
        const cols = mapState[0].length;
        gridRows = rows;
        gridCols = cols;

        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${cols}, 40px)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 40px)`;

        for (let i = 0; i < rows * cols; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-item';
            grid.appendChild(cell);
        }
    }

    function drawMap(mapState) {
        const filteredMapState = filterMapState(mapState);
        if (filteredMapState.length === 0 || filteredMapState[0].length === 0) {
            console.error('Filtered map state is empty or invalid.');
            return;
        }

        createGridFromMapState(filteredMapState);

        const cells = document.querySelectorAll('.grid-item');
        filteredMapState.forEach((row, y) => {
            row.forEach((value, x) => {
                const cell = cells[y * filteredMapState[0].length + x];
                cell.textContent = value;
                cell.dataset.value = value;
            });
        });
    }

    function collectPuzzleFromGrid() {
        const cells = document.querySelectorAll('.grid-item');
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
            statusIndicator.className = 'status-solving';
            statusIndicator.innerHTML = 'Solving<span class="blink">...</span>';

            const puzzle = collectPuzzleFromGrid();
            const solutionBfs = SokobanSolver.solvePuzzleBfs(puzzle);
            mapStates = solutionBfs.maps;
            currentStep = 0;

            if (mapStates.length > 0) {
                drawMap(mapStates[0]);
                const solutionText = solutionBfs.solution || '(sin solución)';
                output.textContent = `Solution steps: ${solutionText}`;

                if (solutionBfs.solution) {
                    statusIndicator.className = 'status-solved';
                    statusIndicator.textContent = 'Solved';
                } else {
                    statusIndicator.className = 'status-unsolved';
                    statusIndicator.textContent = 'No solution';
                }
            } else {
                output.textContent = 'No map states received from solver.';
                statusIndicator.className = 'status-error';
                statusIndicator.textContent = 'Error';
            }
        } catch (err) {
            console.error('Error running solver:', err);
            output.innerText = 'Error running solver: ' + err.message;
            statusIndicator.textContent = 'Error';
            statusIndicator.className = 'status-error';
        }
    }
});
