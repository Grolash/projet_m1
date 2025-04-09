from ortools.sat.python import cp_model
from src.main.puzzle import Puzzle


class Futoshiki(Puzzle):
    def __init__(self, rows, ineqs):
        super().__init__(len(rows[0]), rows)
        try:
            assert len(self.grid) == self.n * self.n
        except AssertionError as e:
            raise e
        self.ineqs = ineqs
        self.model = cp_model.CpModel()  # Create the model
        self.DOMAIN = self.n
        self.grid_expr = [
            self.model.new_int_var(1, self.DOMAIN, 'x[%i]' % i) if x == 0 else self.model.new_int_var(x, x, 'x[%i]' % i) for i, x
            in enumerate(self.grid)]

    def get_rows(self, grid):
        rows = super().get_rows(grid)
        return rows

    def get_cols(self, grid):
        cols = super().get_cols(grid)
        return cols

    def constraints(self, grid):
        # AllDifferent on rows
        rows = self.get_rows(grid)
        for row in rows:
            self.model.add_all_different(row)

        # AllDifferent on columns
        cols = self.get_cols(grid)
        for col in cols:
            self.model.add_all_different(col)

        # Inequalities
        for inequality in self.ineqs:
            if inequality[0] == '<':
                self.model.Add(grid[inequality[1]] < grid[inequality[2]])
            elif inequality[0] == '>':
                self.model.Add(grid[inequality[1]] > grid[inequality[2]])
            elif inequality[0] == '=':
                self.model.Add(grid[inequality[1]] == grid[inequality[2]])

    def solve(self):
        self.constraints(self.grid_expr)
        solver = cp_model.CpSolver()
        status = solver.Solve(self.model)
        if status == cp_model.OPTIMAL:
            return [solver.Value(x) for x in self.grid_expr]
        else:
            return None

    def print(self):
        result = self.solve()
        if result:
            print("Solution found:")
            for i in range(self.n):
                row = [str(r) for r in result[self.n * i: self.n * i + self.n]]
                for j in range(self.n - 1):
                    ineqs = [ineq for ineq in self.ineqs if ineq[1] == i * self.n + j and ineq[2] == i * self.n + j + 1]
                    if ineqs and len(ineqs) == 1:
                        row[j] += ' ' + ineqs[0][0]
                    else:
                        row[j] += ' ' + ' '
                print(" ".join(row))
                newline = ''
                if i < self.n - 1:
                    for j in range(self.n):
                        ineqs = [ineq for ineq in self.ineqs if ineq[1] == i * self.n + j and
                                 ineq[2] == (i + 1) * self.n + j]
                        if ineqs and len(ineqs) == 1:
                            newline += 'v' + ' ' if ineqs[0][0] == '>' else '^' + ' '
                        else:
                            newline += ' ' + ' '
        else:
            print("No solution found")


if __name__ == '__main__':

    puzzle = [
        [[">", 0, 1], [">", 2, 3], [">", 3, 4], ["<", 18, 19], ["<", 20, 21], ["<", 21, 22]],
        [0, 0, 0, 0, 0],
        [4, 0, 0, 0, 2],
        [0, 0, 4, 0, 0],
        [0, 0, 0, 0, 4],
        [0, 0, 0, 0, 0]
    ]
    futoshiki = Futoshiki(puzzle[1:], puzzle[0])
    futoshiki.print()