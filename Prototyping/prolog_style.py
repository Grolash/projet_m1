from ortools.sat.python import cp_model


def prolog_style_example():
    model = cp_model.CpModel()

    # Define our grid dimensions
    width, height = 5, 5

    # In Prolog, we might represent cells as c(X, Y, Z) where Z is the value
    # In OR-Tools, we'll use a dictionary with (x, y) tuples as keys
    cell = {}

    # Define our values (0 = black, 1 = white)
    BLACK, WHITE = 0, 1

    # Create variables for each cell
    for x in range(width):
        for y in range(height):
            cell[x, y] = model.NewIntVar(BLACK, WHITE, f'cell_{x}_{y}')

    # Now let's implement the Prolog-style condition:
    # is_white(c(X, Y, Z)) :- cell(X, Y, Z) & same(Z, white)

    # In OR-Tools, we would do this directly with constraints:
    is_white = {}
    for x in range(width):
        for y in range(height):
            # This creates a boolean variable that is True if cell[x,y] == WHITE
            is_white[x, y] = model.NewBoolVar(f'is_white_{x}_{y}')
            model.Add(cell[x, y] == WHITE).OnlyEnforceIf(is_white[x, y])
            model.Add(cell[x, y] != WHITE).OnlyEnforceIf(is_white[x, y].Not())

    # More complex Prolog-style rules
    # For example, neighbors(X1,Y1,X2,Y2) :- adjacent(X1,Y1,X2,Y2)
    neighbors = {}
    for x1 in range(width):
        for y1 in range(height):
            for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:  # 4-connected neighbors
                x2, y2 = x1 + dx, y1 + dy
                if 0 <= x2 < width and 0 <= y2 < height:
                    # Create a boolean variable representing that these cells are neighbors
                    neighbors[x1, y1, x2, y2] = model.NewConstant(1)  # Always true for adjacent cells

    # Now for a more complex rule:
    # connected(X1,Y1,X2,Y2) :- neighbors(X1,Y1,X2,Y2) & is_white(X1,Y1) & is_white(X2,Y2)
    connected = {}
    for x1 in range(width):
        for y1 in range(height):
            for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                x2, y2 = x1 + dx, y1 + dy
                if 0 <= x2 < width and 0 <= y2 < height:
                    connected[x1, y1, x2, y2] = model.NewBoolVar(f'connected_{x1}_{y1}_{x2}_{y2}')

                    # This implements the logical AND of three conditions
                    model.AddBoolAnd([
                        neighbors[x1, y1, x2, y2],
                        is_white[x1, y1],
                        is_white[x2, y2]
                    ]).OnlyEnforceIf(connected[x1, y1, x2, y2])

                    # If any condition is false, connected is false
                    # We need to explicitly handle the negation
                    not_neighbors = model.NewBoolVar(f'not_neighbors_{x1}_{y1}_{x2}_{y2}')
                    model.Add(neighbors[x1, y1, x2, y2] == 0).OnlyEnforceIf(not_neighbors)
                    model.Add(neighbors[x1, y1, x2, y2] == 1).OnlyEnforceIf(not_neighbors.Not())

                    model.AddBoolOr([
                        not_neighbors,
                        is_white[x1, y1].Not(),
                        is_white[x2, y2].Not()
                    ]).OnlyEnforceIf(connected[x1, y1, x2, y2].Not())

    # You can then use these boolean variables in other constraints

    # Just to complete the example, let's create a simple pattern
    # Set some cells to be white
    model.Add(cell[1, 1] == WHITE)
    model.Add(cell[1, 2] == WHITE)
    model.Add(cell[2, 2] == WHITE)

    # Ensure these white cells are connected
    model.AddBoolOr([
        connected[1, 1, 1, 2],
        connected[1, 2, 2, 2]
    ])

    # Add some additional constraints
    # For example, let's require that at least half the cells are white
    model.Add(sum(is_white[x, y] for x in range(width) for y in range(height)) >= width * height // 2)

    # Solve the model
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    # Print the solution
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        print("Solution found:")
        for y in range(height):
            line = ""
            for x in range(width):
                if solver.Value(cell[x, y]) == WHITE:
                    line += "□ "  # White cell
                else:
                    line += "■ "  # Black cell
            print(line)

        print("\nConnected cells:")
        for x1 in range(width):
            for y1 in range(height):
                for dx, dy in [(0, 1), (1, 0)]:  # Just check right and down
                    x2, y2 = x1 + dx, y1 + dy
                    if 0 <= x2 < width and 0 <= y2 < height:
                        if (x1, y1, x2, y2) in connected and solver.Value(connected[x1, y1, x2, y2]):
                            print(f"Cells ({x1},{y1}) and ({x2},{y2}) are connected")
    else:
        print("No solution found.")

    return solver


# Run the example
if __name__ == "__main__":
    prolog_style_example()