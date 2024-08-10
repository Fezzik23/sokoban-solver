document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('grid');
    const gridSizeSelect = document.getElementById('grid-size');
    const elementSelect = document.getElementById('element-select');
    const output = document.getElementById('output');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    const statusIndicator = document.getElementById('status-indicator');
    console.log("Cambiando clase a status-ready");
    statusIndicator.className = 'status-ready';
    console.log("Clase cambiada:", statusIndicator.className);
    statusIndicator.textContent = 'Draw a map';

    let currentStep = 0;
    let mapStates = [];  // Aquí almacenaremos los estados del mapa

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

    gridSizeSelect.addEventListener('change', () => createGrid(parseInt(gridSizeSelect.value)));
    document.getElementById('solve-btn').addEventListener('click', loadPyodideAndRunScript);

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

    async function loadPyodideAndRunScript() {
        try {
            statusIndicator.className = 'status-solving';
            statusIndicator.innerHTML = 'Solving<span class="blink">...</span>';
            
            // Carga Pyodide y ejecuta el script
            let pyodide = await loadPyodide({ indexURL : "https://cdn.jsdelivr.net/pyodide/v0.21.3/full/" });
            await pyodide.loadPackage('numpy');
            await runPythonScript(pyodide);
            
            // Cambiar a resuelto si todo es exitoso
            statusIndicator.className = 'status-solved';
            statusIndicator.textContent = 'Solved';
        } catch (err) {
            console.error('Error loading Pyodide:', err);
            output.innerText = 'Error loading Pyodide: ' + err.message;
            statusIndicator.textContent = 'Error';
            statusIndicator.className = 'status-error'; // Asegúrate de definir una clase para errores si necesario
        }
    }

    async function runPythonScript(pyodide) {
        try {
            // Cargar y ejecutar el script de Python
            const response = await fetch('/static/main.py');
            const pythonScript = await response.text();
            await pyodide.runPythonAsync(pythonScript);
    
            // Recolectar el puzzle actual de la cuadrícula
            const size = parseInt(gridSizeSelect.value);
            const cells = document.querySelectorAll('.grid-item');
            let puzzleList = [], currentRow = '';
    
            cells.forEach((cell, index) => {
                currentRow += cell.dataset.value === ' ' ? ' ' : cell.dataset.value;  // Espacios se mantienen como espacios
                if ((index + 1) % size === 0) {
                    puzzleList.push(currentRow);
                    currentRow = '';
                }
            });
    
            const puzzle = JSON.stringify(puzzleList);
    
            // Preparar y ejecutar el código de Python para resolver el puzzle
            const pythonCode = `
import json
puzzle = json.loads('${puzzle}')
solution_bfs, steps = solve_puzzle_bfs(puzzle)
`;
            await pyodide.runPythonAsync(pythonCode);
    
            // Obtener los resultados desde Pyodide
            const solution_bfs = pyodide.globals.get('solution_bfs');
            const stepsProxy = pyodide.globals.get('steps');
    
            // Convertir el objeto PyProxy a un array JavaScript
            const steps = stepsProxy.toJs();
            mapStates = steps;
    
            // Asegurarse de que se recibieron estados válidos del mapa
            if (mapStates.length > 0) {
                console.log(mapStates[0]);  // Para depuración
                drawMap(mapStates[0]);  // Dibujar el primer estado del mapa
                output.textContent = `Solution steps: ${solution_bfs.solution}`;
            } else {
                console.error("No map states received from Python.");
                output.textContent = "No map states received from Python.";
            }
    
            // Limpiar el PyProxy para liberar memoria
            stepsProxy.destroy();
        } catch (err) {
            console.error('Error running Python script:', err);
            output.innerText = 'Error running Python script: ' + err.message;
        }
    }
});
