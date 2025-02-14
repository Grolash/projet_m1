from ortools.sat.python import cp_model
from OrToolsPuzzle import Puzzle

class Sudoku(Puzzle):
    def __init__(self, rows):
        super().__init__(9, rows)
        # Create the model.
        self.model = cp_model.CpModel()
        assert len(self.grid) == 81
        assert max(self.grid) == 9
        assert min(self.grid) == 0
        self.DOMAIN = 9
        self.grid_expr = [self.model.new_int_var(1, 9, 'x[%i]' % i) if x == 0 else self.model.new_int_var(x, x, 'x[%i]' % i) for i, x in enumerate(self.grid)]


    def get_rows(self, grid):
        rows = super().get_rows(grid)
        return rows

    def get_cols(self, grid):
        cols = super().get_cols(grid)
        return cols

    def get_squares(self, grid):
        squares = [self.get_rows(grid)[i:i+3][j:j+3] for j in range(0, 9, 3) for i in range(0, 9, 3)]
        assert len(squares) == 9
        return squares[0]

    def constraints(self, grid):
        # AllDifferent on rows
        rows = self.get_rows(grid)
        for row in rows:
            self.model.add_all_different(row)

        # AllDifferent on columns
        cols = self.get_cols(grid)
        for col in cols:
            self.model.add_all_different(col)

        # AllDifferent on squares
        sqrs = self.get_squares(grid)
        for sqr in sqrs:
            self.model.add_all_different(sqr)

    def solve(self):
        self.constraints(self.grid_expr)
        solver = cp_model.CpSolver()
        status = solver.Solve(self.model)
        if status == cp_model.OPTIMAL:
            return [solver.Value(x) for x in self.grid_expr]
        else:
            return None

    def print(self):
        result = self.solve()
        if result:
            print("Solution found:")
            for i in range(9):
                row = [str(r) for r in result[9 * i: 9 * i + 9]]
                print(" ".join(row))
        else:
            print("No solution found")


if __name__ == '__main__':
    # A sudoku puzzle
    ridiculously_easy_puzzle = (
        "5 0 4 6 7 8 0 1 2",
        "6 0 2 1 0 5 3 4 8",
        "1 9 8 3 4 2 5 6 7",
        "8 5 9 7 0 1 4 2 3",
        "4 0 6 8 5 3 7 9 0",
        "7 1 3 9 2 4 8 5 6",
        "9 6 1 5 3 7 2 8 4",
        "2 8 7 4 1 9 6 3 5",
        "3 0 5 2 0 6 0 7 9",
    )
    # Normalizing the puzzle to a list of rows
    grid = [[int(i) for i in row.split(" ")] for row in ridiculously_easy_puzzle]
    s = Sudoku(grid)
    s.print()
    print("\n ===================================== \n")
    puzzle = [[0, 0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 3, 0, 8, 5],
              [0, 0, 1, 0, 2, 0, 0, 0, 0],
              [0, 0, 0, 5, 0, 7, 0, 0, 0],
              [0, 0, 4, 0, 0, 0, 1, 0, 0],
              [0, 9, 0, 0, 0, 0, 0, 0, 0],
              [5, 0, 0, 0, 0, 0, 0, 7, 3],
              [0, 0, 2, 0, 1, 0, 0, 0, 0],
              [0, 0, 0, 0, 4, 0, 0, 0, 9]]

    s = Sudoku(grid)
    s.print()
    print("\n ===================================== \n")
    failpuzzle = [
        [0, 0, 3, 0, 2, 0, 6, 0, 0],
        [9, 0, 0, 3, 0, 5, 0, 0, 1],
        [0, 0, 1, 8, 0, 6, 4, 0, 0],
        [0, 0, 8, 1, 0, 2, 9, 0, 0],
        [7, 0, 0, 0, 0, 0, 0, 0, 8],
        [0, 0, 6, 7, 0, 8, 2, 0, 0],
        [0, 0, 2, 6, 0, 9, 5, 0, 0],
        [8, 0, 0, 2, 0, 3, 0, 0, 9],
        [0, 0, 5, 0, 1, 0, 3, 0, 0]
    ]
    s = Sudoku(failpuzzle)
    s.print()
