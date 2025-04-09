from ortools.sat.python import cp_model
from src.main.puzzle import Puzzle


class Numberlink(Puzzle):
    def __init__(self, rows):
        super().__init__(len(rows[0]), rows)
        try:
            assert len(self.grid) == self.n * self.n
        except AssertionError as e:
            raise e
        self.model = cp_model.CpModel()
        self.DOMAIN = len([x for x in self.grid if x != 0]) // 2 - 1  # Each number appears twice
        # using integer division to get an int and not a float, result will always be correct as
        # the total count of numbers (i.e. including duplicates) is even by definition of the puzzle
        self.grid_expr = []
        self.paths = []
        current = 0
        nb_set = {}
        for i in range(len(self.grid)):
            if self.grid[i] == 0:
                self.grid_expr.append(self.model.new_int_var(0, self.DOMAIN, f'x[{i}]'))
            else:
                if self.grid[i] not in nb_set.keys():
                    self.grid_expr.append(self.model.new_int_var(current, current, f'x[{i}]'))
                    self.paths.append(self.Path(current, i, self.grid[i], self))
                    nb_set[self.grid[i]] = current
                    current += 1
                else:
                    path = self.paths[nb_set[self.grid[i]]]
                    path.end = i
                    self.grid_expr.append(self.model.new_int_var(path.index, path.index, f'x[{i}]'))

    class Path:
        def __init__(self, index, start, value, numberlink):
            self.index = index
            self.start = start
            self.end = None
            self.value = value

    # Get the orthogonal neighbors of a cell
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

    def constraints(self):
        pass
        # like Nurikabe but there is no sea and the paths do not have to be orthogonally separated
        # however, it must link the two cells with the same number
        # also path not zone so only one cell with a given reach

    def solve(self):
        pass

    def print(self):
        pass