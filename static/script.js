async function cargarYejecutarScriptPython(pyodide, urlDelScriptPython) {
    // Carga el script Python usando fetch()
    const respuesta = await fetch(urlDelScriptPython);
    const codigoPython = await respuesta.text();

    // Ejecuta el código Python cargado
    await pyodide.runPythonAsync(codigoPython);
}

async function main() {
    // Carga Pyodide
    let pyodide = await loadPyodide({
      indexURL : "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/"
    });
    console.log("Pyodide cargado correctamente.");

    // URL del script Python servido por Flask
    const urlDelScriptPython = "{{ url_for('static', filename='main.py') }}";

    // Carga y ejecuta el script Python
    await cargarYejecutarScriptPython(pyodide, urlDelScriptPython);

    // Suponiendo que tu script Python define una función solve_puzzle()
    // y quieres llamarla desde aquí con parámetros específicos:
    let solution = await pyodide.runPythonAsync(`
        solve_puzzle('tu_puzle_aquí', 'bfs')
    `);

    console.log("Solución:", solution);
    document.body.innerHTML += `<p>Solución: ${solution}</p>`;
}

main().catch(console.error);
