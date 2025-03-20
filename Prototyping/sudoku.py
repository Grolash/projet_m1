import kanren as mk

from puzzle import Puzzle


# A sudoku is a puzzle with a 9x9 grid, divided into 9 3x3 squares, each with 9 cells.
# The goal is to fill the grid with numbers from 1 to 9, such that each row, each column,
# and each square contains each number exactly once.
# A cell can have a value from 1 to 9, or a set of possible values from 1 to 9.
# A cell belongs to a row, a column, and a square.
# We can extend the Puzzle class to represent a Sudoku puzzle.

class Sudoku(Puzzle):
    def __init__(self, rows):
        super().__init__(9, rows)
        assert len(self.grid) == 81
        assert max(self.grid) == 9
        assert min(self.grid) == 0
        self.grid_expr = tuple(mk.var() if x == 0 else x for x in self.grid)
        self.DOMAIN = tuple(range(1, 10))

    def get_rows(self, grid):
        rows = super().get_rows(grid)
        row_expr = tuple(row for row in rows)
        return row_expr

    def get_cols(self, grid):
        cols = super().get_cols(grid)
        col_expr = tuple(col for col in cols)
        return col_expr

    def get_squares(self, grid):
        squares = [self.get_rows(grid)[i:i+3][j:j+3] for j in range(0, 9, 3) for i in range(0, 9, 3)]
        assert len(squares) == 9
        square_expr = squares[0]
        return square_expr

    def constraints(self, grid):
        rows = self.get_rows(grid)
        cols = self.get_cols(grid)
        sqrs = self.get_squares(grid)
        return mk.lall(
            mk.lall(*(mk.permuteo(r, self.DOMAIN) for r in rows)),
            mk.lall(*(mk.permuteo(c, self.DOMAIN) for c in cols)),
            mk.lall(*(mk.permuteo(s, self.DOMAIN) for s in sqrs))
        )

    def solve(self):
        s = mk.run(0, self.grid_expr, self.constraints(self.grid_expr))
        return s[0:len(s)] if s else None

    def solve_one(self):
        s = mk.run(1, self.grid_expr, self.constraints(self.grid_expr))
        return s[0] if s else None

    def print_one(self):
        result = self.solve_one()
        if result:
            print("Solution found:")
            for i in range(9):
                row = [str(r) for r in result[9 * i: 9 * i + 9]]
                print(" ".join(row))
        else:
            print("No solution found")

    def print_all(self):
        results = self.solve()
        if results:
            print("Solutions found:")
            print("Solution count:", len(results))
            print("\n ===================================== \n")
            for result in results:
                for i in range(9):
                    row = [str(r) for r in result[9 * i: 9 * i + 9]]
                    print(" ".join(row))
                print("\n ===================================== \n")
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
    s.print_one()

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
    s.print_one()

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
    s.print_one()
