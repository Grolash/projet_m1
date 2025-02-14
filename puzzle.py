import kanren as mk

# This is an abstract class to treat specific puzzles as plug-ins
# Puzzles will be solved by the microKanren logic programming library
# All puzzles have in common a grid of cells. Each cell has either a value or a set of possible values.
# A grid is made of rows and columns. Each row and column has a set of cells. A cell belongs to a row and a column.

class Puzzle:
    def __init__(self, n, rows):
        self.n = n # length of a row or column of the grid (n x n)
        # rows is a list of rows, where each row is a list of values representing the cells.
        self.grid = [int(i) for row in rows for i in row]

    def get_rows(self, grid):
        # Returns a grid's rows as a list of rows.
        return [grid[i*self.n:(i+1)*self.n] for i in range(self.n)]

    def get_cols(self, grid):
        # Returns a grid's columns as a list of columns.
        return [grid[i::self.n] for i in range(self.n)]

    def solve(self):
        # Returns a solution to the puzzle.
        pass

    def print(self):
        # Prints the puzzle.
        pass



