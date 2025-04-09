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

    def get_rows(self, grid):
        rows = super().get_rows(grid)
        return rows

    def get_cols(self, grid):
        cols = super().get_cols(grid)
        return cols

    class Island:
        def __init__(self, index, pos, value):
            self.index = index
            self.pos = pos
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

    """
    Which island does this cell belong to, Mr Programmer? 
    Well, Mr Puter, for each island, take every cell on the board, assign a boolean to it;
    if it's satisfied the cell belongs to this island; the amount of them that are satisfied equals exactly the value 
    the island is assigned to because that's the amount of cells you want in it;
    then if there are at least two of them, check that each one has at least one neighbor that is also in it.
    Then look at every cell on the board again, and check that the amount
    of islands for which this cells satisfies the belonging is at most one because it can't be in two or more islands.
    """

    def island_constraints(self):
        cell_in_island = {}  # for all cells, what island they are in
        cell_reach = {}  # for all cells, what is the reach of the cell
        for island in self.islands:  # for all islands, what cells are in the island?
            cell_in_island[island.index] = {}
            cell_reach[island.index] = {}
            for r in range(self.n):
                for c in range(self.n):
                    cell_idx = r * self.n + c
                    cell_in_island[island.index][cell_idx] = self.model.NewBoolVar(
                        f'cell_{r}_{c}_in_island_{island.index}')  # cell is in island boolean variable
                    self.model.Add(self.grid_expr[cell_idx] == island.index).OnlyEnforceIf(
                        cell_in_island[island.index][cell_idx])  # if cell is in island, then grid_expr is island index
                    self.model.Add(self.grid_expr[cell_idx] != island.index).OnlyEnforceIf(
                        cell_in_island[island.index][cell_idx].Not())

                    cell_reach[island.index][cell_idx] = self.model.NewIntVar(0, self.n * self.n,
                                                                              f'reach_{island.index}_{cell_idx}')
                    # if cell is white, then reach is 0
                    self.model.Add(cell_reach[island.index][cell_idx] == 0).OnlyEnforceIf(
                        cell_in_island[island.index][cell_idx].Not())
                    # if cell is black, then reach is > 0
                    self.model.Add(cell_reach[island.index][cell_idx] > 0).OnlyEnforceIf(
                        cell_in_island[island.index][cell_idx])

                    if island.pos == cell_idx:
                        self.model.Add(
                            self.grid_expr[cell_idx] == island.index)  # if cell is the number, then grid_expr
                        # is island index ( => cell is in island)
                        self.model.Add(cell_reach[island.index][cell_idx] == 1)
                    else:
                        self.model.Add(cell_reach[island.index][cell_idx] != 1)
            # The size of each island must match the number in the island
            island_cells = [cell_in_island[island.index][cell_idx] for cell_idx in cell_in_island[island.index]]
            self.model.Add(sum(island_cells) == island.value)  # number of cells in island = value of the island
        # Each cell is in at most one island
        for idx in range(self.n * self.n):
            island_vars = [cell_in_island[island.index][idx] for island in self.islands]
            self.model.AddAtMostOne(island_vars)

        # Island connectivity constraints (all cells in an island must have at least one neighbor in the island)
        # Island isolation constraints (all neighbors of a cell in an island that are not in the island must be black)
        for island in self.islands:
            for idx in range(self.n * self.n):
                neighbors = self.get_neighbors(idx)
                neighbor_conditions = []
                for neighbor in neighbors:
                    smaller_reach = self.model.NewBoolVar(f'smaller_reach_{idx}_{neighbor}')
                    self.model.Add(cell_reach[island.index][idx] == cell_reach[island.index][neighbor] + 1)\
                        .OnlyEnforceIf(smaller_reach)
                    self.model.Add(cell_reach[island.index][idx] != cell_reach[island.index][neighbor] + 1)\
                        .OnlyEnforceIf(smaller_reach.Not())
                    neighbor_conditions.append(smaller_reach)

                self.model.AddAtLeastOne(neighbor_conditions).OnlyEnforceIf(cell_in_island[island.index][idx])
                # if neighbor is not in the island, then neighbor is in the sea
                # thus it must be black and value must be 0
                for neighbor in neighbors:
                    self.model.Add(self.grid_expr[neighbor] == 0).OnlyEnforceIf(
                        [cell_in_island[island.index][idx], cell_in_island[island.index][neighbor].Not()])


    """
    If cell is black, then it has a value of 0
    No 2x2 squares of black cells can exist, so for each cell, if it's black, 
    then at least one of its neighbors must be white
    All black cells must be reachable from one another.
    There can be exactly one root cell, which is the only cell with a reach of 1. 
    Its neighbors can have a reach of 0.
    All other cells must have a neighbor with a lower reach that is at least 1.
    """

    def sea_constraints(self):
        reach = {}
        cells_is_black = {}
        for r in range(self.n):
            for c in range(self.n):
                idx = r * self.n + c

                # setup no 2x2 squares while we're at it
                cell_is_black = self.model.NewBoolVar(f'cell_{idx}_is_black')
                self.model.Add(self.grid_expr[idx] == 0).OnlyEnforceIf(cell_is_black)
                self.model.Add(self.grid_expr[idx] != 0).OnlyEnforceIf(cell_is_black.Not())
                # get cells in a 2x2 square, at least one of them must be white (!= 0) and so their sum must be > 0
                if r < self.n - 1 and c < self.n - 1:
                    self.model.Add(self.grid_expr[idx] + self.grid_expr[idx + 1] + self.grid_expr[idx + self.n] +
                                   self.grid_expr[idx + self.n + 1] > 0)

                reach[idx] = self.model.NewIntVar(0, self.n * self.n, f'reach_{idx}')
                # if cell is white, then reach is 0
                self.model.Add(reach[idx] == 0).OnlyEnforceIf(cell_is_black.Not())
                # if cell is black, then reach is > 0
                self.model.Add(reach[idx] > 0).OnlyEnforceIf(cell_is_black)
                cells_is_black[idx] = cell_is_black

        # once every reach constraint is set up, we can set up the reachability constraints
        # at most one cell can be the root of a sea, with a reach of one and neighbors with a reach of 0 valid
        # all other cells must have a neighbor with a lower reach that theirs that is at least 1
        cell_is_root = []
        for r in range(self.n):
            for c in range(self.n):
                idx = r * self.n + c

                root = self.model.NewBoolVar(f'root_{idx}')
                self.model.Add(reach[idx] == 1).OnlyEnforceIf(root)
                self.model.Add(reach[idx] != 1).OnlyEnforceIf(root.Not())
                cell_is_root.append(root)

                neighbors = self.get_neighbors(idx)
                neighbor_conditions = []

                for neighbor in neighbors:
                    smaller_reach = self.model.NewBoolVar(f'smaller_reach_{idx}_{neighbor}')
                    self.model.Add(reach[idx] == reach[neighbor] + 1).OnlyEnforceIf(smaller_reach)
                    self.model.Add(reach[idx] != reach[neighbor] + 1).OnlyEnforceIf(smaller_reach.Not())
                    neighbor_conditions.append(smaller_reach)

                self.model.AddAtLeastOne(neighbor_conditions).OnlyEnforceIf(cells_is_black[idx])
        self.model.AddExactlyOne(cell_is_root)

    def solve(self):
        self.island_constraints()
        self.sea_constraints()
        # solve the model
        solver = cp_model.CpSolver()
        status = solver.Solve(self.model)
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            return [solver.Value(x) for x in self.grid_expr]
        else:
            return None

    def print(self):
        result = self.solve()
        if result:
            print("Solution found:")
            for i in range(self.n):
                row = [str(r) for r in result[self.n * i: self.n * i + self.n]]
                print(" ".join(row))
        else:
            print("No solution found")


if __name__ == "__main__":
    puzzle = [
        [0, 0, 5, 0, 0],
        [0, 0, 0, 3, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [1, 0, 3, 0, 0]
    ]
    nurikabe = Nurikabe(puzzle)
    nurikabe.print()

    wrong_puzzle = [
        [0, 2, 5, 0, 0],
        [0, 0, 0, 3, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [1, 0, 3, 0, 0]
    ]
    nurikabe = Nurikabe(wrong_puzzle)
    nurikabe.print()

    wrong_puzzle2 = [
        [0, 0, 5, 0, 0],
        [0, 0, 0, 3, 0],
        [1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [1, 0, 3, 0, 0]
    ]
    nurikabe = Nurikabe(wrong_puzzle2)
    nurikabe.print()

    blank_puzzle = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
    ]
    nurikabe = Nurikabe(blank_puzzle)
    nurikabe.print()

    big_puzzle = [
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 6, 0, 0, 3, 0],
        [0, 0, 0, 0, 0, 0, 4, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 2, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
        [0, 8, 0, 0, 4, 0, 0, 0, 0, 2],
        [0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
    ]
    nurikabe = Nurikabe(big_puzzle)
    nurikabe.print()

