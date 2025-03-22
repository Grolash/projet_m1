from ortools.sat.python import cp_model
from src.main.puzzle import Puzzle


class Shikaku(Puzzle):
    def __init__(self, rows):
        super().__init__(len(rows[0]), rows)
        try:
            assert len(self.grid) == self.n * self.n
        except AssertionError as e:
            raise e
        self.model = cp_model.CpModel()
        self.DOMAIN = len([x for x in self.grid if x != 0]) - 1
        self.grid_expr = []
        self.rectangles = []
        current = 0
        for i in range(len(self.grid)):
            if self.grid[i] == 0:
                self.grid_expr.append(self.model.new_int_var(0, self.DOMAIN, f'x[{i}]'))
            else:
                self.grid_expr.append(self.model.new_int_var(current, current, f'x[{i}]'))
                self.rectangles.append(self.Rectangle(current, i, self.grid[i], self))
                current += 1

    def get_rows(self, grid):
        rows = super().get_rows(grid)
        return rows

    def get_cols(self, grid):
        cols = super().get_cols(grid)
        return cols

    def get_rectangles(self):  # For testing purposes
        sol = self.solve()
        if sol:
            return sol[1]
        else:
            return None

    class Rectangle:
        def __init__(self, index, pos, value, shikaku):
            self.index = index
            self.pos = pos
            self.value = value

            # Convert flat position to 2D coordinates
            self.source_row = self.pos // shikaku.n
            self.source_col = self.pos % shikaku.n

            # Define rectangle boundaries
            self.top = shikaku.model.new_int_var(0, shikaku.n - 1, f'top_{self.index}')
            self.left = shikaku.model.new_int_var(0, shikaku.n - 1, f'left_{self.index}')
            self.bottom = shikaku.model.new_int_var(0, shikaku.n - 1, f'bottom_{self.index}')
            self.right = shikaku.model.new_int_var(0, shikaku.n - 1, f'right_{self.index}')

            # Define rectangle dimensions
            self.width = shikaku.model.new_int_var(1, self.value, f'width_{self.index}')
            self.height = shikaku.model.new_int_var(1, self.value, f'height_{self.index}')

            # Ensure the rectangle includes the clue cell
            shikaku.model.Add(self.top <= self.source_row)
            shikaku.model.Add(self.bottom >= self.source_row)
            shikaku.model.Add(self.left <= self.source_col)
            shikaku.model.Add(self.right >= self.source_col)

            # Ensure the rectangle is the correct size
            shikaku.model.Add(self.right == self.left + self.width - 1)
            shikaku.model.Add(self.bottom == self.top + self.height - 1)

            # Ensure the rectangle is the correct area
            shikaku.model.add_multiplication_equality(self.value, self.width, self.height)

    def constraints(self):
        # Create a 3D array to store which cells belong to which rectangles
        # cell_in_rect[r][c][rect_idx] indicates if cell (r,c) is in rectangle rect_idx
        cell_in_rect = {}

        # Initialize cell_in_rect for all cells and rectangles
        for r in range(self.n):
            for c in range(self.n):
                cell_idx = r * self.n + c
                cell_in_rect[cell_idx] = {}

                for rect in self.rectangles:
                    # Create a boolean variable indicating if this cell is in this rectangle
                    cell_in_rect[cell_idx][rect.index] = self.model.NewBoolVar(f'cell_{r}_{c}_in_rect_{rect.index}')

                    # A cell is in a rectangle if it's within the rectangle's boundaries
                    self.model.Add(rect.top <= r).OnlyEnforceIf(cell_in_rect[cell_idx][rect.index])
                    self.model.Add(r <= rect.bottom).OnlyEnforceIf(cell_in_rect[cell_idx][rect.index])
                    self.model.Add(rect.left <= c).OnlyEnforceIf(cell_in_rect[cell_idx][rect.index])
                    self.model.Add(c <= rect.right).OnlyEnforceIf(cell_in_rect[cell_idx][rect.index])

                    # The negation of the above conditions
                    # If any boundary condition is violated, the cell is not in the rectangle
                    top_cond = self.model.NewBoolVar(f'top_cond_{r}_{c}_{rect.index}')
                    bottom_cond = self.model.NewBoolVar(f'bottom_cond_{r}_{c}_{rect.index}')
                    left_cond = self.model.NewBoolVar(f'left_cond_{r}_{c}_{rect.index}')
                    right_cond = self.model.NewBoolVar(f'right_cond_{r}_{c}_{rect.index}')

                    self.model.Add(rect.top > r).OnlyEnforceIf(top_cond)
                    self.model.Add(r > rect.bottom).OnlyEnforceIf(bottom_cond)
                    self.model.Add(rect.left > c).OnlyEnforceIf(left_cond)
                    self.model.Add(c > rect.right).OnlyEnforceIf(right_cond)

                    # Cell is outside rectangle if any condition is true
                    self.model.AddBoolOr([top_cond, bottom_cond, left_cond, right_cond]).OnlyEnforceIf(
                        cell_in_rect[cell_idx][rect.index].Not())

                # Each cell must belong to exactly one rectangle
                rect_vars = [cell_in_rect[cell_idx][rect.index] for rect in self.rectangles]
                self.model.AddExactlyOne(rect_vars)

        # Link grid_expr to cell_in_rect
        for r in range(self.n):
            for c in range(self.n):
                cell_idx = r * self.n + c
                for rect in self.rectangles:
                    # If cell is in rectangle, grid_expr equals rectangle index
                    self.model.Add(self.grid_expr[cell_idx] == rect.index).OnlyEnforceIf(
                        cell_in_rect[cell_idx][rect.index])

    def solve(self):
        self.constraints()
        solver = cp_model.CpSolver()
        status = solver.Solve(self.model)
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            rectangles_info = {}
            for rect in self.rectangles:
                rectangles_info[rect.index] = {
                    'top': solver.Value(rect.top),
                    'left': solver.Value(rect.left),
                    'bottom': solver.Value(rect.bottom),
                    'right': solver.Value(rect.right),
                    'value': rect.value,
                }
            return [solver.Value(x) for x in self.grid_expr], rectangles_info
        else:
            return None

    def print(self):
        sol = self.solve()
        result, rectangles = sol if sol else (None, None)
        if result:
            print("Solution found:")
            for i in range(self.n):
                row = [str(r) for r in result[self.n * i: self.n * i + self.n]]
                print(" ".join(row))
            print("Rectangles:")
            for rect in rectangles:
                print(f'{rect}: {rectangles[rect]}')

        else:
            print("No solution found")


if __name__ == '__main__':
    rows = [
        [0, 2, 2, 0, 0],
        [0, 4, 2, 0, 2],
        [0, 0, 3, 0, 0],
        [0, 0, 4, 0, 2],
        [0, 0, 0, 4, 0]
    ]
    shikaku = Shikaku(rows)
    shikaku.print()

    wrong_puzzle = [
        [2, 2, 2, 0, 0],  # 2 appears in a position that won't allow a rectangle to be formed
        [0, 4, 2, 0, 2],
        [0, 0, 3, 0, 0],
        [0, 0, 4, 0, 2],
        [0, 0, 0, 4, 0]
    ]
    shikaku = Shikaku(wrong_puzzle)
    shikaku.print()

    wrong_puzzle = [
        [2, 2, 2, 0, 0],  # 2 appears in a position that won't allow a rectangle to be formed
        [0, 4, 2, 0, 2],
        [0, 4, 3, 0, 0],  # 4 appears in a position that won't allow a rectangle to be formed
        [0, 0, 4, 0, 2],
        [0, 0, 0, 4, 0]
    ]
    shikaku = Shikaku(wrong_puzzle)
    shikaku.print()

    big_puzzle = [
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
    shikaku = Shikaku(big_puzzle)
    shikaku.print()

