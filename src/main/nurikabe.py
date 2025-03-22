from ortools.sat.python import cp_model
from src.main.puzzle import Puzzle


class Nurikabe(Puzzle):

    def __init__(self, rows):
        super().__init__(len(rows[0]), rows)
        try:
            assert len(self.grid) == self.n * self.n
        except AssertionError as e:
            raise e
        self.model = cp_model.CpModel()
        self.DOMAIN = len([x for x in self.grid if x != 0])
        self.grid_expr = []
        self.islands = []
        current = 1
        for i in range(len(self.grid)):
            if self.grid[i] == 0:
                self.grid_expr.append(self.model.new_int_var(0, self.DOMAIN, f'x[{i}]'))
            else:
                self.grid_expr.append(self.model.new_int_var(current, current, f'x[{i}]'))
                self.islands.append(self.Island(current, i, self.grid[i]))
                current += 1

    def is_black(self, i, j):
        return self.grid[i*self.n + j] == 0

    def is_white(self, i, j):
        return self.grid[i*self.n + j] != 0

    class Island:
        def __init__(self, index, pos, value):
            self.index = index
            self.pos = pos
            self.value = value

    def get_neighbors(self, cell_idx):
        r = cell_idx // self.n
        c = cell_idx % self.n
        neighbors = []
        if r > 0:
            neighbors.append((r - 1) * self.n + c)
        if r < self.n - 1:
            neighbors.append((r + 1) * self.n + c)
        if c > 0:
            neighbors.append(r * self.n + c - 1)
        if c < self.n - 1:
            neighbors.append(r * self.n + c + 1)
        return neighbors

    """
    Which island does this cell belong to, Mr Programmer? 
    Well, Mr Puter, for each island, take every fucking cell on the board, assign a boolean to it;
    if it's satisfied the cell belongs to this island; the amount of them that are satisfied equals exactly the value 
    the island is assigned to because that's the amount of cells you want in it;
    then if there are at least two of them, check that each one has at least one neighbor that is also in it.
    Then look at every fucking cell on the board, and check that the amount
    of islands for which this cells satisfies the belonging is at most one because it can't be in two islands.
    """
    def island_constraints(self):
        cell_in_island = {} # for all cells, what island they are in
        for island in self.islands: # for all islands, what cells are in the island?
            cell_in_island[island.index] = {}
            for r in range(self.n):
                for c in range(self.n):
                    cell_idx = r * self.n + c
                    cell_in_island[island.index][cell_idx] = self.model.NewBoolVar(
                        f'cell_{r}_{c}_in_island_{island.index}') # cell is in island boolean variable
                    self.model.Add(self.grid_expr[cell_idx] == island.index).OnlyEnforceIf(
                        cell_in_island[island.index][cell_idx]) # if cell is in island, then grid_expr is island index
                    if island.pos == cell_idx:
                        self.model.Add(self.grid_expr[cell_idx] == island.index) # if cell is the number, then grid_expr
                        # is island index ( => cell is in island)
            # The size of each island must match the number in the island
            island_cells = [cell_in_island[island.index][cell_idx] for cell_idx in cell_in_island[island.index]]
            self.model.Add(sum(island_cells) == island.value) # number of cells in island = value of the island
        # Each cell is in at most one island
        for idx in range(self.n * self.n):
            island_vars = [cell_in_island[island.index][idx] for island in self.islands]
            self.model.AddAtMostOne(island_vars)

        # Island connectivity constraints (all cells in an island must be connected)
        for island in self.islands:
            for idx in range(self.n * self.n):
                if idx == island.pos:
                    # if cell is the number, then it's in the island
                    # if there is no other cell in the island, then no need to check connectivity
                    # thus you only need to check connectivity for cells that are not the number
                    # they will have at least one neighbor that is the number anyway
                    continue
                neighbors = self.get_neighbors(idx)
                island_neighbors = [cell_in_island[island.index][neighbor] for neighbor in neighbors]
                self.model.AddBoolOr(island_neighbors)






