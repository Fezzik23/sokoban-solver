document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('grid');
    const gridSizeSelect = document.getElementById('grid-size');
    const elementSelect = document.getElementById('element-select');
    const output = document.getElementById('output');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
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
        const rows = mapState.length;
        const cols = mapState[0].length;  // Asumiendo que todas las filas tienen la misma longitud

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
        if (!mapState || mapState.length === 0) {
            console.error('Invalid map state:', mapState);
            output.textContent = 'Invalid map state received.';
            return;
        }
    
        // Asegúrate de que el grid tenga el tamaño correcto
        if (grid.children.length !== mapState.length * mapState[0].length) {
            createGridFromMapState(mapState);  // Re-crear el grid para ajustar al tamaño correcto
        }
    
        const size = mapState[0].length;
        const cells = document.querySelectorAll('.grid-item');
    
        cells.forEach((cell, index) => {
            const x = index % size;
            const y = Math.floor(index / size);
            cell.textContent = mapState[y][x];
            cell.dataset.value = mapState[y][x];
        });
    }

    async function loadPyodideAndRunScript() {
        let pyodide;
        try {
            // Descomenta la siguiente línea si estás usando Pyodide localmente
            //@ pyodide = await loadPyodide({ indexURL : "/pyodide/" });
            pyodide = await loadPyodide({ indexURL : "https://cdn.jsdelivr.net/pyodide/v0.21.3/full/" });
            await pyodide.loadPackage('numpy');
            runPythonScript(pyodide);
        } catch (err) {
            console.error('Error loading Pyodide:', err);
            output.innerText = 'Error loading Pyodide: ' + err.message;
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
