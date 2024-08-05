document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('grid');
    const gridSizeSelect = document.getElementById('grid-size');
    const elementSelect = document.getElementById('element-select');
    const output = document.getElementById('output');

    // Añadir opciones de tamaño de cuadrícula dinámicamente
    for (let i = 5; i <= 20; i++) {
        let option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}x${i}`;
        gridSizeSelect.appendChild(option);
    }

    // Crear una cuadrícula de 5x5 por defecto
    createGrid(5);

    gridSizeSelect.addEventListener('change', () => createGrid(parseInt(gridSizeSelect.value)));
    document.getElementById('solve-btn').addEventListener('click', loadPyodideAndRunScript);

    function createGrid(size) {
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${size}, 40px)`;
        grid.style.gridTemplateRows = `repeat(${size}, 40px)`;

        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-item';
            cell.dataset.value = ' ';
            cell.addEventListener('click', () => {
                cell.textContent = elementSelect.value;
                cell.dataset.value = elementSelect.value;
            });
            grid.appendChild(cell);
        }
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
            const size = parseInt(gridSizeSelect.value);
            const cells = document.querySelectorAll('.grid-item');
            let puzzleList = [], currentRow = '';
            
            cells.forEach((cell, index) => {
                currentRow += cell.dataset.value;
                if ((index + 1) % size === 0) {
                    puzzleList.push(currentRow);
                    currentRow = '';
                }
            });

            const puzzle = JSON.stringify(puzzleList);


            console.log(puzzle);

            const response = await fetch('/static/main.py');  // Asegúrate de que la ruta es correcta
            const pythonScript = await response.text();
            await pyodide.runPythonAsync(pythonScript);
            
            const pythonCode = `
puzzle = ${puzzle}
solution = solve_puzzle_bfs(puzzle)
            `;

            pyodide.runPython(pythonCode);

            const solution = pyodide.globals.get('solution');
            output.textContent = `Solution:\n${solution}`;
        } catch (err) {
            console.error('Error running Python script:', err);
            output.innerText = 'Error running Python script: ' + err.message;
        }
    }
});
