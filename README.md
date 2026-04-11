# Sokoban Solver JS

Proyecto web de Sokoban con dos modos dentro de la misma interfaz:

- `Solver`: dibujas un mapa, lo resuelves con BFS y ves la solución paso a paso.
- `Juego`: juegas una campaña real de mapas con progreso guardado en el navegador.

## Autoría y ampliación

Este proyecto fue desarrollado originalmente de forma manual por Sergio Martín en Python, incluyendo la lógica inicial del solver y la estructura base del juego.

La versión actual amplía ese trabajo con ayuda de agentes de Codex: se migró el solver a JavaScript puro, se eliminó la dependencia de Python/Pyodide, se añadieron pruebas ejecutables con Node, una visualización animada de la solución, una campaña jugable con mapas en JSON y guardado de progreso en `localStorage`.

## Características

- Solver BFS en JavaScript puro.
- Resolución visual con replay automático en bucle.
- Editor de mapas por clic.
- Botón para cargar mapas de ejemplo aleatorios.
- Modo juego con control por teclado (`WASD` o flechas).
- Campaña de 10 mapas.
- Desbloqueo progresivo de niveles.
- Progreso persistente en el navegador.
- Panel lateral con mapas actuales, completados, disponibles y bloqueados.
- Web Worker para resolver mapas grandes sin congelar la interfaz.

## Casillas

```text
& = jugador
+ = jugador sobre objetivo
B = caja
X = caja sobre objetivo
. = objetivo
# = pared
  = espacio libre
```

## Estructura

- `index.html`: estructura principal de la app.
- `css/style.css`: estilos de la interfaz, tableros, paneles y estados.
- `js/app.js`: coordinación de la UI, solver, campaña, tabs y persistencia.
- `js/solver.js`: solver BFS exportable para navegador y Node.
- `js/solver-worker.js`: worker para resolver sin bloquear la UI.
- `js/game.js`: lógica del modo juego.
- `data/maps.json`: campaña de mapas.
- `assets/`: SVG de jugador, cajas, muros y objetivos.
- `test/solver.test.js`: tests del solver.
- `test/game.test.js`: tests del modo juego.

## Cómo usarlo

### Solver

1. Selecciona una pieza desde la paleta visual.
2. Dibuja el mapa haciendo clic sobre la cuadrícula.
3. Pulsa `Resolver`.
4. Usa `Anterior` y `Siguiente` para recorrer los estados.
5. Pulsa `Mapa de ejemplo` si quieres cargar un layout de muestra.

### Juego

1. Abre la pestaña `Juego`.
2. Mueve al jugador con `W`, `A`, `S`, `D` o con las flechas.
3. Al completar un mapa, el siguiente se desbloquea y se carga automáticamente.
4. El progreso queda guardado en `localStorage`.
5. Puedes volver a cualquier mapa ya desbloqueado desde el panel lateral.

## Desarrollo local

Como es una app estática, basta con servir la raíz del proyecto con cualquier servidor web simple.

Ejemplo:

```bash
python -m http.server
```

o con cualquier servidor estático equivalente.


## Ejecutar pruebas

```bash
node --test test/solver.test.js test/game.test.js
```

También puedes comprobar sintaxis:

```bash
node --check js/app.js
node --check js/game.js
node --check js/solver.js
node --check js/solver-worker.js
```

## Despliegue

La aplicación es estática y funciona bien en servicios como Netlify siempre que se publique la raíz del proyecto.

Rutas importantes:

- `/js/...`
- `/css/...`
- `/assets/...`
- `/data/maps.json`

## Solver BFS

El solver representa cada estado mediante la posición del jugador y las posiciones de las cajas. BFS explora los estados por niveles, evita repetir estados visitados y reconstruye la secuencia de movimientos cuando todas las cajas coinciden con los objetivos.

Si un mapa no tiene solución, devuelve una solución vacía y mantiene un estado estable para que la interfaz pueda mostrar el resultado sin romperse.
