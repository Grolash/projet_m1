import pytest
from src.main.sudoku import Sudoku

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


@pytest.fixture
def sudoku():
    return Sudoku(rows)


def test_sudoku_rows(sudoku):
    assert len(rows) == 9
    assert rows == sudoku.get_rows(sudoku.grid)


def test_sudoku_columns(sudoku):
    columns = sudoku.get_cols(sudoku.grid)
    assert len(columns) == 9
    for i in range(sudoku.n):
        for j in range(sudoku.n):
            assert rows[i][j] == columns[j][i]


def test_sudoku_squares(sudoku):
    squares = sudoku.get_squares(sudoku.grid)
    assert len(squares) == 9
    for i in range(9):
        for j in range(9):
            assert squares[i][j] == rows[(i // 3) * 3 + (j // 3)][(i % 3) * 3 + (j % 3)]


def test_sudoku_solve(sudoku):
    sol = sudoku.solve()
    assert sol is not None

    rows = sudoku.get_rows(sol)
    for row in rows:
        current = []
        for i in range(9):
            if row[i] not in current:
                current.append(row[i])
            else:
                pytest.fail("Duplicate in row")
        assert len(current) == 9

    cols = sudoku.get_cols(sol)
    for col in cols:
        current = []
        for i in range(9):
            if col[i] not in current:
                current.append(col[i])
            else:
                pytest.fail("Duplicate in column")
        assert len(current) == 9

    sqrs = sudoku.get_squares(sol)
    for sqr in sqrs:
        current = []
        for i in range(9):
            if sqr[i] not in current:
                current.append(sqr[i])
            else:
                pytest.fail("Duplicate in square")
        assert len(current) == 9


def test_incomplete_sudoku():
    incomplete_puzzle = [
        [4, 8, 3, 9, 2, 1, 6, 5, 7]
    ]
    with pytest.raises(AssertionError):
        Sudoku(incomplete_puzzle)


def test_wrong_sudoku():
    rows = [  # From rows fixture
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 3, 0, 8, 3],  # Duplicate '3'
        [0, 0, 1, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 5, 0, 7, 0, 0, 0],
        [0, 0, 4, 0, 0, 0, 1, 0, 0],
        [0, 9, 0, 0, 0, 0, 0, 0, 0],
        [5, 0, 0, 0, 0, 0, 0, 7, 3],
        [0, 0, 2, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 4, 0, 0, 0, 9]
    ]
    assert Sudoku(rows).solve() is None

    wrong_puzzle = [  # Another wrong puzzle
        [4, 8, 3, 9, 2, 1, 6, 5, 7],
        [9, 6, 7, 3, 4, 5, 8, 2, 1],
        [2, 5, 1, 8, 7, 6, 4, 9, 3],
        [5, 4, 8, 1, 3, 2, 9, 7, 6],
        [7, 2, 9, 5, 6, 4, 1, 3, 8],
        [1, 3, 6, 7, 9, 8, 2, 4, 5],
        [3, 7, 2, 6, 8, 9, 5, 1, 4],
        [8, 1, 4, 2, 5, 3, 7, 6, 9],
        [6, 9, 5, 4, 1, 7, 3, 8, 1]  # Duplicate '1'
    ]
    assert Sudoku(wrong_puzzle).solve() is None


def test_completed_sudoku():  # Tests if a completed sudoku puzzle is accepted (no solving needed, but no error)
    completed_puzzle = [
        [4, 8, 3, 9, 2, 1, 6, 5, 7],
        [9, 6, 7, 3, 4, 5, 8, 2, 1],
        [2, 5, 1, 8, 7, 6, 4, 9, 3],
        [5, 4, 8, 1, 3, 2, 9, 7, 6],
        [7, 2, 9, 5, 6, 4, 1, 3, 8],
        [1, 3, 6, 7, 9, 8, 2, 4, 5],
        [3, 7, 2, 6, 8, 9, 5, 1, 4],
        [8, 1, 4, 2, 5, 3, 7, 6, 9],
        [6, 9, 5, 4, 1, 7, 3, 8, 2]
    ]
    assert Sudoku(completed_puzzle).solve() is not None
