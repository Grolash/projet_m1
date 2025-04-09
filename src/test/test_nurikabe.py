import pytest
from src.main.nurikabe import Nurikabe

puzzle = [
        [0, 0, 5, 0, 0],
        [0, 0, 0, 3, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [1, 0, 3, 0, 0]
    ]

wrong_puzzle = [
    [0, 2, 5, 0, 0],
    [0, 0, 0, 3, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 0, 3, 0, 0]
]

wrong_puzzle2 = [
    [0, 0, 5, 0, 0],
    [0, 0, 0, 3, 0],
    [1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 0, 3, 0, 0]
]

blank_puzzle = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
]

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

rows_list = [puzzle, big_puzzle]


def test_nurikabe_rows():
    n = len(puzzle)
    nuri = Nurikabe(puzzle)
    assert puzzle == nuri.get_rows(nuri.grid)
    assert len(nuri.get_rows(nuri.grid)) == n
    assert len(nuri.grid) == n * n
    assert len(nuri.grid_expr) == n * n


def test_nurikabe_columns():
    nuri = Nurikabe(puzzle)
    n = len(puzzle)
    columns = nuri.get_cols(nuri.grid)
    assert len(columns) == n
    for i in range(n):
        for j in range(n):
            assert puzzle[i][j] == columns[j][i]


def get_neighbors(n, cell_idx):
    r = cell_idx // n
    c = cell_idx % n
    neighbors = []
    if r > 0:
        neighbors.append((r - 1) * n + c)
    if r < n - 1:
        neighbors.append((r + 1) * n + c)
    if c > 0:
        neighbors.append(r * n + c - 1)
    if c < n - 1:
        neighbors.append(r * n + c + 1)
    return neighbors


def dfs(root_idx, sol, value, total, n):
    stack = [root_idx]
    visited = set()
    count = 0
    while stack:
        idx = stack.pop()
        if idx in visited:
            continue
        if sol[idx] != value:
            continue
        count += 1
        visited.add(idx)
        # Get the neighbors of the current index
        neighbors = get_neighbors(n, idx)
        for neighbor in neighbors:
            if neighbor not in visited:
                stack.append(neighbor)
    return count == total


def test_nurikabe_solve():
    count = 0
    for rows in rows_list:
        print("Testing Nurikabe puzzle %d" % count)
        count += 1
        nuri = Nurikabe(rows)
        sol = nuri.solve()
        assert sol is not None
        assert len(sol) == len(nuri.grid) == nuri.n * nuri.n
        nb_islands = 0
        for island in nuri.islands:
            assert dfs(island.pos, sol, island.index, island.value, nuri.n)
            nb_islands += island.value
        for i in range(len(sol)):
            if sol[i] == 0:
                assert dfs(i, sol, 0, (nuri.n * nuri.n) - nb_islands, nuri.n)
                break

def test_incomplete_nurikabe():
    incomplete_puzzle = [
        [0, 0, 5, 0, 0],
        [0, 0, 0, 3, 0],
    ]
    with pytest.raises(AssertionError):
        Nurikabe(incomplete_puzzle)

def test_nurikabe_wrong_puzzle():
    assert Nurikabe(wrong_puzzle).solve() is None
    assert Nurikabe(wrong_puzzle2).solve() is None
