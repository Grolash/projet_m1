import unittest
from src.main.sudoku import Sudoku

class TestSudoku(unittest.TestCase):
    def setUp(self):
        rows = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 3, 0, 8, 5],
            [0, 0, 1, 0, 2, 0, 0, 0, 0],
            [0, 0, 0, 5, 0, 7, 0, 0, 0],
            [0, 0, 4, 0, 0, 0, 1, 0, 0],
            [0, 9, 0, 0, 0, 0, 0, 0, 0],
            [5, 0, 0, 0, 0, 0, 0, 7, 3],
            [0, 0, 2, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 4, 0, 0, 0, 9]
        ]
        self.rows = rows
        self.s = Sudoku(rows)

    def test_sudoku_rows(self):
        self.assertEqual(len(self.rows), 9)
        self.assertEqual(self.rows, self.s.get_rows(self.s.grid))

    def test_sudoku_columns(self):
        rows = self.rows
        columns = self.s.get_cols(self.s.grid)
        self.assertEqual(len(columns), 9)
        for i in range(self.s.n):
            for j in range(self.s.n):
                self.assertEqual(rows[i][j], columns[j][i])

    def test_sudoku_squares(self):
        rows = self.rows
        squares = self.s.get_squares(self.s.grid)
        self.assertEqual(len(squares), 9)
        for i in range(9):
            for j in range(9):
                self.assertEqual(squares[i][j], rows[(i // 3) * 3 + (j // 3)][(i % 3) * 3 + (j % 3)])

    def test_sudoku_solve(self):
        sol = self.s.solve()
        assert sol is not None

        rows = self.s.get_rows(sol)
        for row in rows:
            current = []
            for i in range(9):
                if row[i] not in current:
                    current.append(row[i])
                else:
                    self.fail("Duplicate in row")
            self.assertEqual(len(current), 9)

        cols = self.s.get_cols(sol)
        for col in cols:
            current = []
            for i in range(9):
                if col[i] not in current:
                    current.append(col[i])
                else:
                    self.fail("Duplicate in column")
            self.assertEqual(len(current), 9)

        sqrs = self.s.get_squares(sol)
        for sqr in sqrs:
            current = []
            for i in range(9):
                if sqr[i] not in current:
                    current.append(sqr[i])
                else:
                    self.fail("Duplicate in square")
            self.assertEqual(len(current), 9)

    def test_incomplete_sudoku(self):
        incomplete_puzzle = [
            [4, 8, 3, 9, 2, 1, 6, 5, 7]
        ]
        self.assertRaises(AssertionError, Sudoku, incomplete_puzzle)

    def test_wrong_sudoku(self):
        rows = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 3, 0, 8, 3],
            [0, 0, 1, 0, 2, 0, 0, 0, 0],
            [0, 0, 0, 5, 0, 7, 0, 0, 0],
            [0, 0, 4, 0, 0, 0, 1, 0, 0],
            [0, 9, 0, 0, 0, 0, 0, 0, 0],
            [5, 0, 0, 0, 0, 0, 0, 7, 3],
            [0, 0, 2, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 4, 0, 0, 0, 9]
        ]
        self.assertIsNone(Sudoku(rows).solve())
        wrong_puzzle = [[4, 8, 3, 9, 2, 1, 6, 5, 7],
                        [9, 6, 7, 3, 4, 5, 8, 2, 1],
                        [2, 5, 1, 8, 7, 6, 4, 9, 3],
                        [5, 4, 8, 1, 3, 2, 9, 7, 6],
                        [7, 2, 9, 5, 6, 4, 1, 3, 8],
                        [1, 3, 6, 7, 9, 8, 2, 4, 5],
                        [3, 7, 2, 6, 8, 9, 5, 1, 4],
                        [8, 1, 4, 2, 5, 3, 7, 6, 9],
                        [6, 9, 5, 4, 1, 7, 3, 8, 1]]
        self.assertIsNone(Sudoku(wrong_puzzle).solve())

    def test_completed_sudoku(self):
        completed_puzzle = [[4, 8, 3, 9, 2, 1, 6, 5, 7],
                            [9, 6, 7, 3, 4, 5, 8, 2, 1],
                            [2, 5, 1, 8, 7, 6, 4, 9, 3],
                            [5, 4, 8, 1, 3, 2, 9, 7, 6],
                            [7, 2, 9, 5, 6, 4, 1, 3, 8],
                            [1, 3, 6, 7, 9, 8, 2, 4, 5],
                            [3, 7, 2, 6, 8, 9, 5, 1, 4],
                            [8, 1, 4, 2, 5, 3, 7, 6, 9],
                            [6, 9, 5, 4, 1, 7, 3, 8, 2]
        ]
        self.assertIsNotNone(Sudoku(completed_puzzle).solve())


if __name__ == '__main__':
    unittest.main()
