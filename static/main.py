import collections
import numpy as np
import time

class PuzzleSolver:
    def __init__(self, layout, method='bfs'):
        self.game_state = self.transfer_to_game_state(layout)
        self.pos_walls = self.pos_of_walls()
        self.pos_goals = self.pos_of_goals()
        self.method = method

    def pos_of_player(self, game_state):
        """Devuelve la posición del agente."""
        return tuple(np.argwhere(game_state == 2)[0])

    def pos_of_goals(self):
        """Devuelve las posiciones de los objetivos."""
        return tuple(tuple(x) for x in np.argwhere((self.game_state == 4) | (self.game_state == 5)))

    def is_legal_action(self, action, pos_player, pos_box):
        """Verifica si la acción dada es legal."""
        x_player, y_player = pos_player
        if action[-1].isupper():  #@ El movimiento fue un empuje
            x1, y1 = x_player + 2 * action[0], y_player + 2 * action[1]
        else:
            x1, y1 = x_player + action[0], y_player + action[1]
        return (x1, y1) not in pos_box + self.pos_walls

    def pos_of_walls(self):
        """Devuelve las posiciones de las paredes."""
        return tuple(tuple(x) for x in np.argwhere(self.game_state == 1))

    def legal_actions(self, pos_player, pos_box):
        """Devuelve todas las acciones legales para el agente."""
        all_actions = [[-1, 0, 'u', 'U'], [1, 0, 'd', 'D'], [0, -1, 'l', 'L'], [0, 1, 'r', 'R']]
        legal_actions = []
        for action in all_actions:
            x1, y1 = pos_player[0] + action[0], pos_player[1] + action[1]
            if (x1, y1) in pos_box:  #@ El movimiento fue un empuje
                action.pop(2)  #@ Elimina la letra minúscula
            else:
                action.pop(3)  #@ Elimina la letra mayúscula
            if self.is_legal_action(action, pos_player, pos_box):
                legal_actions.append(action)
        return tuple(tuple(x) for x in legal_actions) #@ e.g. ((0, -1, 'l'), (0, 1, 'R')) (izquierda sin empujar caja y derecha sin empujar caja)

    def is_end_state(self, pos_box):
        """Verifica si todos los objetivos han sido alcanzados por las cajas."""
        return sorted(pos_box) == sorted(self.pos_goals)

    def is_failed(self, pos_box):
        """
        Verifica si el estado es fallido revisando las posiciones circundantes a cada caja
        y comprobando si en hay alguna posicion en la que no haya solucion,
        para esto se fijan unos patrones que son situaciones en las que no habria solucion
        y se le aplican rotaciones a esa matriz para comprobar si llegan a ese estado fijo.
        """

        #@Representación de las rotaciones de matrices de 3 posiciones (posiciones alrededor de cada caja)
        rotate_pattern = [[0,1,2,3,4,5,6,7,8], #@ Sin rotacion.
                          [0,1,2,3,4,5,6,7,8][::-1], #@ Original invertido (rot 180 grados)
                          [2,5,8,1,4,7,0,3,6], #@ Rotacion sentido antihorario.
                          [2,5,8,1,4,7,0,3,6][::-1]] #@ 
        flip_pattern = [[2,1,0,5,4,3,8,7,6], #@ Estas son las inversiones
                        [0,3,6,1,4,7,2,5,8],
                        [2,1,0,5,4,3,8,7,6][::-1],
                        [0,3,6,1,4,7,2,5,8][::-1]]
        all_pattern = rotate_pattern + flip_pattern
        #@EJEMPLO
        #@ 0 grados 180 grados -90 grados 90 grados
        #@      012        876        258       630
        #@      345        543        147       741
        #@      678        210        036       852
        for box in pos_box:
            if box not in self.pos_goals:
                board = [(box[0] - 1, box[1] - 1), (box[0] - 1, box[1]), (box[0] - 1, box[1] + 1),
                        (box[0], box[1] - 1), (box[0], box[1]), (box[0], box[1] + 1),
                        (box[0] + 1, box[1] - 1), (box[0] + 1, box[1]), (box[0] + 1, box[1] + 1)]
                for pattern in all_pattern:
                    new_board = [board[i] for i in pattern]
                    if new_board[1] in self.pos_walls and new_board[5] in self.pos_walls: return True
                    elif new_board[1] in pos_box and new_board[2] in self.pos_walls and new_board[5] in self.pos_walls: return True
                    elif new_board[1] in pos_box and new_board[2] in self.pos_walls and new_board[5] in pos_box: return True
                    elif new_board[1] in pos_box and new_board[2] in pos_box and new_board[5] in pos_box: return True
                    elif new_board[1] in pos_box and new_board[6] in pos_box and new_board[2] in self.pos_walls and new_board[3] in self.pos_walls and new_board[8] in self.pos_walls: return True
        return False

    def update_state(self, pos_player, pos_box, action):
        """Devuelve el estado de juego actualizado después de realizar una acción."""
        x_player, y_player = pos_player # the previous position of player
        new_pos_player = [x_player + action[0], y_player + action[1]] #@ Posicion actual del jugador
        pos_box = [list(x) for x in pos_box]
        if action[-1].isupper(): # if pushing, update the position of box
            pos_box.remove(new_pos_player)
            pos_box.append([x_player + 2 * action[0], y_player + 2 * action[1]])
        pos_box = tuple(tuple(x) for x in pos_box)
        new_pos_player = tuple(new_pos_player)
        return new_pos_player, pos_box

    def transfer_to_game_state(self, layout):
        """Transforma el diseño inicial del puzzle a un estado de juego."""
        layout = [','.join(layout[i]) for i in range(len(layout))]
        layout = [x.split(",") for x in layout]
        max_cols_num = max([len(x) for x in layout])
        for i_row in range(len(layout)):
            for i_col in range(len(layout[i_row])):
                if layout[i_row][i_col]   == ' ': layout[i_row][i_col] = 0   # free space
                elif layout[i_row][i_col] == '#': layout[i_row][i_col] = 1 # wall
                elif layout[i_row][i_col] == '&': layout[i_row][i_col] = 2 # player
                elif layout[i_row][i_col] == 'B': layout[i_row][i_col] = 3 # box
                elif layout[i_row][i_col] == '.': layout[i_row][i_col] = 4 # goal
                elif layout[i_row][i_col] == 'X': layout[i_row][i_col] = 5 # box on goal
            cols_num = len(layout[i_row])
            if cols_num < max_cols_num:
                layout[i_row].extend([1 for _ in range(max_cols_num-cols_num)])
        return np.array(layout)

    def pos_of_boxes(self, game_state):
        """Devuelve las posiciones de las cajas."""
        return tuple(tuple(x) for x in np.argwhere((game_state == 3) | (game_state == 5)))

    def breadth_first_search(self):
        """Implementación de la búsqueda en anchura."""
        beginBox = self.pos_of_boxes(self.game_state)
        beginPlayer = self.pos_of_player(self.game_state)

        startState = (beginPlayer, beginBox) # e.g. ((2, 2), ((2, 3), (3, 4), (4, 4), (6, 1), (6, 4), (6, 5)))
        frontier = collections.deque([[startState]]) #@ Guardamos estados
        actions = collections.deque([[0]]) #@ Guardamos acciones
        exploredSet = set()
        count = 0
        while frontier:
            node = frontier.popleft()
            node_action = actions.popleft()
            if self.is_end_state(node[-1][-1]):
                solution = ','.join(node_action[1:]).replace(',','')
                return solution
            if node[-1] not in exploredSet:
                exploredSet.add(node[-1])
                for action in self.legal_actions(node[-1][0], node[-1][1]):
                    count = count + 1
                    new_pos_player, new_pos_box = self.update_state(node[-1][0], node[-1][1], action)
                    if self.is_failed(new_pos_box):
                        continue #@ salta al inicio del bucle
                    frontier.append(node + [(new_pos_player, new_pos_box)]) #@ Expandimos la frontera de posibles soluciones.
                    actions.append(node_action + [action[-1]])


    def solve(self):
        """
        Resuelve el rompecabezas utilizando el método seleccionado.
        Devuelve una lista con los movimientos que tiene quehacer el jugador para pasarse el
        """

        time_start = time.time()
        
        if self.method == 'bfs':
            solution = self.breadth_first_search()
        elif self.method == 'astar':
            solution = self.a_star_search()  # Método A* 
        else:
            raise ValueError("Método de solución no soportado.")
        
        time_end = time.time()
        return solution, '%.2f segundos.' % (time_end - time_start)

    def a_star_search(self):
        """Implementación del algoritmo A* para resolver el rompecabezas."""
        # Aquí implementarías el algoritmo A*
        pass



def solve_puzzle_bfs(puzzle):
    solver_bfs = PuzzleSolver(puzzle, method='bfs')
    solution_bfs, time_taken_bfs = solver_bfs.solve()
    return solution_bfs

# Solución utilizando BFS
def test():
    # Ejemplo de uso:
    
    easy1 = [
    "#####",
    "#.  #",
    "# B #",
    "#  &#",
    "#####"
    ]
    easy2 = [
    "###",
    "# #",
    "###"
    ]
    easy3 = [
    "###",
    "#.#",
    "#B#",
    "#&#",
    "###"
    ]

    blocked= [
    "#####",
    "#.  #",
    "#   #",
    "#B &#",
    "#####"
    ]
    layout1 = [
    "#######",
    "##&##..#",
    "# BB B.#",
    "#   B  #",
    "####  .#",
    "#####"
    ]
    for row in easy1:
        print(row)
    solver_bfs = PuzzleSolver(easy3, method='bfs')
    solution_bfs, time_taken_bfs = solver_bfs.solve()
    print(f"BFS: {solution_bfs}, {time_taken_bfs}")
    return solution_bfs

#test()