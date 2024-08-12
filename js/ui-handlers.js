// ui-handlers.js
document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('grid');
    const gridSizeSelect = document.getElementById('grid-size');
    const elementSelect = document.getElementById('element-select');
    const output = document.getElementById('output');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const statusIndicator = document.getElementById('status-indicator');

    window.appState = {
        grid,
        gridSizeSelect,
        elementSelect,
        output,
        prevBtn,
        nextBtn,
        statusIndicator,
        mapStates: [],
        currentStep: 0
    };

    // Añadir opciones de tamaño de cuadrícula dinámicamente
    for (let i = 5; i <= 20; i++) {
        let option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}x${i}`;
        gridSizeSelect.appendChild(option);
    }


    // Establecer un tamaño de cuadrícula inicial
    createGrid(parseInt(gridSizeSelect.value));  // Asegurarse de que esta línea esté después de configurar todas las opciones


    gridSizeSelect.addEventListener('change', function () {
        createGrid(parseInt(gridSizeSelect.value));
    });

    document.getElementById('solve-btn').addEventListener('click', function() {
        loadPyodideAndRunScript();
    });

    prevBtn.addEventListener('click', function() {
        if (appState.currentStep > 0) {
            appState.currentStep--;
            drawMap(appState.mapStates[appState.currentStep]);
        }
    });

    nextBtn.addEventListener('click', function() {
        if (appState.currentStep < appState.mapStates.length - 1) {
            appState.currentStep++;
            drawMap(appState.mapStates[appState.currentStep]);
        }
    });

    function createGrid(size) {
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${size}, 40px)`;
        grid.style.gridTemplateRows = `repeat(${size}, 40px)`;
        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-item';
            cell.textContent = ' ';  // Inicialmente vacío
            cell.dataset.value = ' ';  // Usamos un espacio para representar vacío
            cell.addEventListener('click', function () {
                cell.textContent = elementSelect.value;
                cell.dataset.value = elementSelect.value;
            });
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

    window.drawMap = drawMap;

    function filterMapState(mapState) {
        let filteredRows = mapState.filter(row => row.some(cell => cell.trim() !== ''));
        if (filteredRows.length === 0) {
            return [];  // Retorna un array vacío si todas las filas son vacías
        }
        let columnsCount = filteredRows[0].length;
        let columnsToRemove = new Array(columnsCount).fill(true);
        filteredRows.forEach(row => {
            row.forEach((cell, index) => {
                if (cell.trim() !== '') {
                    columnsToRemove[index] = false;
                }
            });
        });
        return filteredRows.map(row => row.filter((_, index) => !columnsToRemove[index]));
    }

    function createGridFromMapState(mapState) {
        if (mapState.length === 0 || mapState[0].length === 0) {
            console.error('Map state is empty or invalid.');
            return;
        }
        const rows = mapState.length;
        const cols = mapState[0].length;
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${cols}, 40px)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 40px)`;
        for (let i = 0; i < rows * cols; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-item';
            grid.appendChild(cell);
        }
    }
});
