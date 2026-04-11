importScripts('/js/solver.js');

self.onmessage = function (event) {
    try {
        const result = self.SokobanSolver.solvePuzzleBfs(event.data.puzzle);
        self.postMessage({ ok: true, result });
    } catch (err) {
        self.postMessage({
            ok: false,
            error: err.message || 'No se pudo resolver el mapa.',
        });
    }
};
