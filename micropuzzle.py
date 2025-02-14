from microkanren import *

# This is an abstract class to treat specific puzzles as plug-ins
# Puzzles will be solved by the microKanren logic programming library
# All puzzles have in common a grid of cells. Each cell has either a value or a set of possible values.
# A grid is made of rows and columns. Each row and column has a set of cells. A cell belongs to a row and a column.

class Puzzle:
    def __init__(self, n, rows):
        self.n = n # length of a row or column of the grid (n x n)
        # Rows is a dictionary of rows, where each row is a list of cells.
        # Each row is identified by a key, which is a string, from "A" to the n-th letter.
        # Each column is identified by a key, which is an integer, from 1 to n.
        self.rows = {chr(65 + i): rows[i] for i in range(n)}
        # Columns is a dictionary of columns, where each column is a list of cells, transposed from the rows.
        self.cols = {i: [rows[j][i] for j in range(n)] for i in range(n)}



    def get_row(self, i):
        pass

    def get_col(self, i):
        pass

    def solve(self):
        pass

    def print(self):
        pass
