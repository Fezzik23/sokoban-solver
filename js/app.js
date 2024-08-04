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
        const response = await fetch('/static/main.py');  // Asegúrate de que la ruta es correcta
        const pythonScript = await response.text();
        await pyodide.runPythonAsync(pythonScript);
        let output = await pyodide.runPythonAsync('test()');
        document.getElementById('output').innerText = JSON.stringify(output);
    } catch (err) {
        console.error('Error running Python script:', err);
        document.getElementById('output').innerText = 'Error running Python script: ' + err.message;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('run-btn').addEventListener('click', loadPyodideAndRunScript);
});
