import pytest
from src.main.shikaku import Shikaku

rows_1 = [
    [0, 2, 2, 0, 0],
    [0, 4, 2, 0, 2],
    [0, 0, 3, 0, 0],
    [0, 0, 4, 0, 2],
    [0, 0, 0, 4, 0]
]
rows_2 = [
    [4, 0, 2, 0, 3],
    [0, 0, 0, 0, 0],
    [0, 0, 3, 3, 0],
    [2, 2, 0, 3, 0],
    [0, 0, 3, 0, 0]
]
rows_3 = [
    [0, 0, 0, 0, 0, 12, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 15, 0, 0],
    [0, 0, 15, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 21, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 7],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 7, 0, 4, 0]
]
rows_list = [rows_1, rows_2, rows_3]


def test_shikaku_rows():
    for rows in rows_list:
        shikaku = Shikaku(rows)
        n = len(rows)
        assert rows == shikaku.get_rows(shikaku.grid)
        assert len(shikaku.get_rows(shikaku.grid)) == n
        assert len(shikaku.grid) == n * n
        assert len(shikaku.grid_expr) == n * n


def test_shikaku_columns():
    for rows in rows_list:
        shikaku = Shikaku(rows)
        n = len(rows)
        columns = shikaku.get_cols(shikaku.grid)
        assert len(columns) == n
        for i in range(n):
            for j in range(n):
                assert rows[i][j] == columns[j][i]


def test_shikaku_solve():
    for rows in rows_list:
        shikaku = Shikaku(rows)
        sol = shikaku.solve()
        assert sol is not None
        result, rectangles = sol
        assert len(result) == len(shikaku.grid)
        assert len(rectangles) == len(shikaku.rectangles)
        curr_rows = shikaku.get_rows(result)
        for rect in rectangles:
            cells = []
            for i in range(len(curr_rows)):
                for j in range(len(curr_rows)):
                    if rectangles[rect]['top'] <= i <= rectangles[rect]['bottom'] and \
                            rectangles[rect]['left'] <= j <= rectangles[rect]['right']:
                        assert curr_rows[i][j] == rect
                        cells.append(curr_rows[i][j])
            assert len(cells) == rectangles[rect]['value']


def test_incomplete_shikaku():
    incomplete_puzzle = [
        [0, 2, 2, 0, 0],
        [0, 4, 2, 0, 2],
    ]
    with pytest.raises(AssertionError):
        Shikaku(incomplete_puzzle)


def test_wrong_shikaku():
    wrong_puzzle = [
        [2, 2, 2, 0, 0],  # 2 appears in a position that won't allow a rectangle to be formed
        [0, 4, 2, 0, 2],
        [0, 0, 3, 0, 0],
        [0, 0, 4, 0, 2],
        [0, 0, 0, 4, 0]
    ]
    assert Shikaku(wrong_puzzle).solve() is None
