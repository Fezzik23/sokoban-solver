async function loadPyodideAndRunScript() {
    let pyodide = await loadPyodide({
        indexURL : "https://cdn.jsdelivr.net/pyodide/v0.21.3/full/"
    });
    await pyodide.loadPackage('numpy');
    runPythonScript(pyodide);
}

async function runPythonScript(pyodide) {
    try {
        const response = await fetch('static/main.py');
        const pythonScript = await response.text();
        await pyodide.runPythonAsync(pythonScript);
        let output = await pyodide.runPythonAsync('test()');
        document.getElementById('output').innerText = JSON.stringify(output);
    } catch (err) {
        console.error(err);
        document.getElementById('output').innerText = 'Error running Python script: ' + err.message;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('run-btn').addEventListener('click', loadPyodideAndRunScript);
});
