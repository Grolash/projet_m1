from futoshiki import Futoshiki
from hashiwokakero import Hashiwokakero
from numberlink import Numberlink
from nurikabe import Nurikabe
from shikaku import Shikaku
from sudoku import Sudoku


def call_puzzle_solver(puzzle, grid, constraints=None):
    match puzzle:
        case "futoshiki":
            if constraints:
                futoshiki = Futoshiki(grid, constraints)
                return futoshiki.solve()
            else:
                raise Exception
        case "hashiwokakero":
            hasiwokakero = Hashiwokakero(grid)
            return hasiwokakero.solve()
        case "numberlink":
            numberlink = Numberlink(grid)
            return numberlink.solve()
        case "nurikabe":
            nurikabe = Nurikabe(grid)
            return nurikabe.solve()
        case "shikaku":
            shikaku = Shikaku(grid)
            return shikaku.solve()
        case "sudoku":
            sudoku = Sudoku(grid)
            return sudoku.solve()
        case _:
            raise Exception


def call_puzzle_generator(puzzle):
    pass
