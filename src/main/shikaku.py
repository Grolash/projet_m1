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
        print(self.grid_expr)
        for r in self.rectangles:
            print(r.index, r.pos, r.value, r.top, r.left, r.bottom, r.right, r.width, r.height)

    def get_rows(self, grid):
        rows = super().get_rows(grid)
        return rows

    def get_cols(self, grid):
        cols = super().get_cols(grid)
        return cols

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
        # Apply constraints for each cell in the grid
        for r in range(self.n):
            for c in range(self.n):
                cell_idx = r * self.n + c

                # For each clue's rectangle
                for rect in self.rectangles:
                    # Determine if cell is in rectangle
                    cell_in_rect = self.model.NewBoolVar(f'cell_{cell_idx}_in_{rect.index}')

                    # Check if cell is within rectangle boundaries
                    in_vertical = self.model.NewBoolVar(f'in_vertical_{cell_idx}_{rect.index}')
                    in_horizontal = self.model.NewBoolVar(f'in_horizontal_{cell_idx}_{rect.index}')

                    self.model.Add(rect.top <= r).OnlyEnforceIf(in_vertical)
                    self.model.Add(r <= rect.bottom).OnlyEnforceIf(in_vertical)
                    self.model.Add(rect.left <= c).OnlyEnforceIf(in_horizontal)
                    self.model.Add(c <= rect.right).OnlyEnforceIf(in_horizontal)

                    # Cell is in rectangle if it's in both horizontal and vertical ranges
                    self.model.AddBoolAnd([in_vertical, in_horizontal]).OnlyEnforceIf(cell_in_rect)
                    self.model.AddBoolOr([in_vertical.Not(), in_horizontal.Not()]).OnlyEnforceIf(cell_in_rect.Not())

                    # Link cell_in_rect to grid expression
                    self.model.Add(self.grid_expr[cell_idx] == rect.index).OnlyEnforceIf(cell_in_rect)
                    self.model.Add(self.grid_expr[cell_idx] != rect.index).OnlyEnforceIf(cell_in_rect.Not())

    def solve(self):
        self.constraints()
        solver = cp_model.CpSolver()
        status = solver.Solve(self.model)
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            return [solver.Value(x) for x in self.grid_expr]
        else:
            return None

    def print(self):
        result = self.solve()
        if result:
            print("Solution found:")
            for i in range(self.n):
                row = [str(r) for r in result[self.n * i: self.n * i + self.n]]
                print(" ".join(row))
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
