import microkanren
from microkanren import *

from micropuzzle import Puzzle


# A sudoku is a puzzle with a 9x9 grid, divided into 9 3x3 squares, each with 9 cells.
# The goal is to fill the grid with numbers from 1 to 9, such that each row, each column, and each square contains each number exactly once.
# A cell can have a value from 1 to 9, or a set of possible values from 1 to 9.
# A cell belongs to a row, a column, and a square.
# We can extend the Puzzle class to represent a Sudoku puzzle.


class Sudoku(Puzzle):
    def __init__(self, rows):
        super().__init__(9, rows)
        row_expr = [x if x != 0 else microkanren.Value for x in row]
        self.squares = {self.get_square(i): [] for i in range(9)}
        self.domain = microkanren.mkrange(0, 9)

    def make_squares(self):
        for i in range(9):
            self.squares[self.get_square(i)].append(self.rows[chr(65 + i)][0:3])
            self.squares[self.get_square(i)].append(self.rows[chr(65 + i + 1)][0:3])
            self.squares[self.get_square(i)].append(self.rows[chr(65 + i + 2)][0:3])


    def get_row(self, i):
        return self.rows[chr(65 + i)]

    def get_col(self, i):
        return self.cols[i]

    def get_square(self, i):
        letter = "S"
        if i > 2:
            letter = "T"
        if i > 5:
            letter = "U"

        if i % 3 == 0:
            return letter + str(1)
        if i % 3 == 1:
            return letter + str(2)
        else:
            return letter + str(3)

    def solve(self):
        pass

    def make_sudoku(self):
        pass












