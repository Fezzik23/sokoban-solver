# Sokoban Solver JS

Solver visual de Sokoban con búsqueda en anchura (BFS), implementado en JavaScript puro.

Ya no depende de Python, NumPy ni Pyodide. La interfaz llama directamente a `js/solver.js` desde `js/app.js`, y el mismo solver se puede ejecutar desde Node para pruebas automatizadas.

## Casillas

```text
& = jugador
B = caja
. = objetivo
X = caja sobre objetivo
# = pared
  = espacio libre
```

## Ejecutar pruebas

```bash
node --test test/solver.test.js
```

La suite cubre un mapa sencillo y el mapa `bug1`, que ahora se resuelve sin cargar Pyodide.

## Estructura

- `index.html`: carga la interfaz y los scripts JavaScript.
- `js/app.js`: gestiona la cuadrícula, los botones y la visualización de pasos.
- `js/solver.js`: contiene el parser de mapas y el solver BFS exportable para navegador y Node.
- `test/solver.test.js`: pruebas del solver con `node:test`.

## BFS

El estado del juego se representa con la posición del jugador y las posiciones ordenadas de las cajas. BFS explora los estados por niveles, guarda los estados visitados para evitar ciclos y reconstruye el camino cuando todas las cajas coinciden con los objetivos.

Si no encuentra solución, devuelve una solución vacía y mantiene el estado inicial como único paso para que la UI pueda mostrar un resultado estable.
