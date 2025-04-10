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
        # like Nurikabe but there is no sea and the paths do not have to be orthogonally separated
        # however, it must link the two cells with the same number
        # also path not zone so only one cell with a given reach
        reach = {}
        cell_in_path = {}
        for r in range(self.n):
            for c in range(self.n):
                cell_idx = r * self.n + c
                cell_in_path[cell_idx] = {}
                reach[cell_idx] = {}
                for path in self.paths:
                    cell_in_path[cell_idx][path.index] = self.model.new_bool_var(f'cell_in_path[{cell_idx}][{path.index}]')
                    self.model.Add(self.grid_expr[cell_idx] == path.index).\
                        OnlyEnforceIf(cell_in_path[cell_idx][path.index])
                    self.model.Add(self.grid_expr[cell_idx] != path.index).\
                        OnlyEnforceIf(cell_in_path[cell_idx][path.index].Not())

                    reach[cell_idx][path.index] = self.model.new_bool_var(f'reach[{cell_idx}][{path.index}]')
                    self.model.Add(reach[cell_idx][path.index] == 0).\
                        OnlyEnforceIf(cell_in_path[cell_idx][path.index].Not())
                    self.model.Add(reach[cell_idx][path.index] > 0).\
                        OnlyEnforceIf(cell_in_path[cell_idx][path.index])

                    if cell_idx == path.start:
                        self.model.Add(reach[cell_idx][path.index] == 1)
                    else:
                        self.model.Add(reach[cell_idx][path.index] != 1)

                    if cell_idx == path.start or cell_idx == path.end:
                        self.model.Add(self.grid_expr[cell_idx] == path.index)

                path_vars = [cell_in_path[cell_idx][path.index] for path in self.paths]
                self.model.AddAtMostOne(path_vars)

        for r in range(self.n):
            for c in range(self.n):
                cell_idx = r * self.n + c
                neighbors = self.get_neighbors(cell_idx)
                for path in self.paths:
                    neighbor_conditions = []
                    for neighbor in neighbors:
                        smaller_reach = self.model.new_bool_var(f'smaller_reach[{cell_idx}][{neighbor}][{path.index}]')
                        self.model.Add(reach[cell_idx][path.index] == reach[neighbor][path.index] + 1).\
                            OnlyEnforceIf(smaller_reach)
                        self.model.Add(reach[cell_idx][path.index] != reach[neighbor][path.index] + 1).\
                            OnlyEnforceIf(smaller_reach.Not())
                        neighbor_conditions.append(smaller_reach)
                    self.model.AddExactlyOne(neighbor_conditions).\
                        OnlyEnforceIf(cell_in_path[cell_idx][path.index])
    def solve(self):
        pass

    def print(self):
        pass