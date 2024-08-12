// sokoban-logic.js
async function loadPyodideAndRunScript() {
    const { statusIndicator, output } = window.appState;
    try {
        statusIndicator.className = 'status-solving';
        statusIndicator.innerHTML = 'Solving<span class="blink">...</span>';
        
        let pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.21.3/full/" });
        await pyodide.loadPackage('numpy');
        await runPythonScript(pyodide);
        
        statusIndicator.className = 'status-solved';
        statusIndicator.textContent = 'Solved';
    } catch (err) {
        console.error('Error loading Pyodide:', err);
        output.innerText = 'Error loading Pyodide: ' + err.message;
        statusIndicator.textContent = 'Error';
        statusIndicator.className = 'status-error';
    }
}

async function runPythonScript(pyodide) {
    const { gridSizeSelect, output } = window.appState;
    try {
        const response = await fetch('/static/main.py');
        const pythonScript = await response.text();
        await pyodide.runPythonAsync(pythonScript);

        const size = parseInt(gridSizeSelect.value);
        const cells = document.querySelectorAll('.grid-item');
        let puzzleList = [], currentRow = '';

        cells.forEach((cell, index) => {
            currentRow += cell.dataset.value === ' ' ? ' ' : cell.dataset.value;
            if ((index + 1) % size === 0) {
                puzzleList.push(currentRow);
                currentRow = '';
            }
        });

        const puzzle = JSON.stringify(puzzleList);
        const pythonCode = `
import json
puzzle = json.loads('${puzzle}')
solution_bfs, steps = solve_puzzle_bfs(puzzle)
`;
        await pyodide.runPythonAsync(pythonCode);
        const solution_bfs = pyodide.globals.get('solution_bfs');
        const stepsProxy = pyodide.globals.get('steps');
        const steps = stepsProxy.toJs();
        window.appState.mapStates = steps;

        if (window.appState.mapStates.length > 0) {
            console.log(window.appState.mapStates[0]);
            drawMap(window.appState.mapStates[0]);
            output.textContent = `Solution steps: ${solution_bfs.solution}`;
        } else {
            console.error("No map states received from Python.");
            output.textContent = "No map states received from Python.";
        }
        stepsProxy.destroy();
    } catch (err) {
        console.error('Error running Python script:', err);
        output.innerText = 'Error running Python script: ' + err.message;
    }
}
