document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('grid');
    const elementSelect = document.getElementById('element-select');
    const output = document.getElementById('output');
    
    // Create a 5x5 grid
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-item';
        cell.dataset.value = ' ';
        cell.addEventListener('click', () => {
            cell.textContent = elementSelect.value;
            cell.dataset.value = elementSelect.value;
        });
        grid.appendChild(cell);
    }

    document.getElementById('solve-btn').addEventListener('click', loadPyodideAndRunScript);

    async function loadPyodideAndRunScript() {
        let pyodide;
        try {
            // Descomenta la siguiente línea si estás usando Pyodide localmente
            //@ pyodide = await loadPyodide({ indexURL : "/pyodide/" });
            
            // Comenta la siguiente línea si estás usando Pyodide localmente
            pyodide = await loadPyodide({ indexURL : "https://cdn.jsdelivr.net/pyodide/v0.21.3/full/" });
            
            await pyodide.loadPackage('numpy');

            runPythonScript(pyodide);
        } catch (err) {
            console.error('Error loading Pyodide:', err);
            document.getElementById('output').innerText = 'Error loading Pyodide: ' + err.message;
        }
    }

    async function runPythonScript(pyodide) {
        try {
            const cells = document.querySelectorAll('.grid-item');
            let puzzleList = [];
            let currentRow = '';

            cells.forEach((cell, index) => {
                currentRow += cell.dataset.value;
                if ((index + 1) % 5 === 0) {
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
            document.getElementById('output').innerText = 'Error running Python script: ' + err.message;
        }
    }
});
