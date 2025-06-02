from futoshiki import Futoshiki
from hashiwokakero import Hashiwokakero
from numberlink import Numberlink
from nurikabe import Nurikabe
from shikaku import Shikaku
from sudoku import Sudoku

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Configure CORS properly
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


# Add this route to handle preflight OPTIONS requests explicitly
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response


@app.route('/api/solve', methods=['POST', 'OPTIONS'])
def solve_puzzle():
    if request.method == 'OPTIONS':
        # Handle preflight request
        return '', 200

    data = request.get_json()
    puzzle = data.get('type')
    grid = data.get('grid')
    constraints = data.get('constraints')

    try:
        solution = call_puzzle_solver(puzzle, grid, constraints)
        return jsonify({"solution": solution})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


def call_puzzle_solver(puzzle, grid, constraints=None):
    match puzzle:
        case "futoshiki":
            if constraints:
                new_grid = [[int(x) for x in row] for row in grid]
                try:
                    futoshiki = Futoshiki(new_grid, constraints)
                except Exception as e:
                    print(f"Error constructing Futoshiki: {e}")
                    raise
                result = futoshiki.solve()
                if result:
                    return futoshiki.get_rows(result)
                else:
                    raise Exception("No solution found")
            else:
                raise Exception("Constraints are required for Futoshiki puzzles.")
        case "hashiwokakero":
            new_grid = [[int(x) for x in row] for row in grid]
            try:
                hashiwokakero = Hashiwokakero(new_grid)
            except Exception as e:
                print(f"Error constructing Hashiwokakero: {e}")
                raise
            result = hashiwokakero.solve()
            if result:
                return result
            else:
                raise Exception("No solution found")
        case "numberlink":
            new_grid = [[int(x) for x in row] for row in grid]
            try:
                numberlink = Numberlink(new_grid)
            except Exception as e:
                print(f"Error constructing Numberlink: {e}")
                raise
            result = numberlink.solve()
            if result:
                return numberlink.get_rows(result)
            else:
                raise Exception("No solution found")
        case "nurikabe":
            new_grid = [[int(x) for x in row] for row in grid]
            try:
                nurikabe = Nurikabe(new_grid)
            except Exception as e:
                print(f"Error constructing Nurikabe: {e}")
                raise
            result = nurikabe.solve()
            if result:
                return nurikabe.get_rows(result)
            else:
                raise Exception("No solution found")
        case "shikaku":
            new_grid = [[int(x) for x in row] for row in grid]
            try:
                shikaku = Shikaku(grid)
            except Exception as e:
                print(f"Error constructing Shikaku: {e}")
                raise
            result = shikaku.solve()
            if result:
                return result[1]
            else:
                raise Exception("No solution found")
        case "sudoku":
            new_grid = [[int(x) for x in row] for row in grid]
            try:
                sudoku = Sudoku(new_grid)
            except Exception as e:
                print(f"Error constructing Sudoku: {e}")
                raise
            result = sudoku.solve()
            if result:
                return sudoku.get_rows(result)
            else:
                raise Exception("No solution found")
        case _:
            raise Exception("Invalid puzzle type")


@app.route('/api/generate', methods=['POST', 'OPTIONS'])
def generate_puzzle():
    if request.method == 'OPTIONS':
        # Handle preflight request
        return '', 200

    data = request.get_json()
    puzzle = data.get('type')
    size = data.get('size')
    constraints = data.get('constraints')
    try:
        generated_puzzle = call_puzzle_generator(puzzle, size, constraints)
        return jsonify({"puzzle": generated_puzzle})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


def call_puzzle_generator(puzzle, size, constraints=None):
    match puzzle:
        case "futoshiki":
            k = 3  # Number of constraints to generate
            import random
            grid = [[0 for _ in range(size)] for _ in range(size)]
            row, col = random.randint(0, size - 1), random.randint(0, size - 1)
            grid[row][col] = random.randint(1, size)
            # Generate random constraints
            futoshiki = Futoshiki(grid, [])
            result = futoshiki.solve()
            if result:
                result = futoshiki.get_rows(result)
            else:
                raise Exception("Failed to generate a valid Futoshiki puzzle.")
            # Add constraints from result
            constraints = []
            for _ in range(k):
                row, col = random.randint(0, size - 1), random.randint(0, size - 1)
                horizontal = random.choice([True, False])
                new_col_1 = 0
                new_col_2 = 0
                new_row_1 = 0
                new_row_2 = 0
                if horizontal:
                    new_col = 0
                    if col < size - 1:
                        ineq = ""
                        new_col = col + 1
                        if result[row][col] < result[row][new_col]:
                            ineq = '<'
                        else:
                            ineq = '>'
                    else:
                        ineq = ''
                        new_col = col - 1
                        if result[row][col - 1] < result[row][col]:
                            ineq = '<'
                        else:
                            ineq = '>'
                    new_col_1 = min(col, new_col)
                    new_col_2 = max(col, new_col)
                    isHorizontal = True
                    key = f"h-{row}-{new_col_1}"
                    constraint = (key, ineq, row * size + new_col_1, row * size + new_col_2, isHorizontal)
                    if constraint not in constraints:
                        constraints.append(constraint)
                else:
                    new_row = 0
                    if row < size - 1:
                        ineq = ""
                        new_row = row + 1
                        if result[row][col] < result[new_row][col]:
                            ineq = '<'
                        else:
                            ineq = '>'
                    else:
                        ineq = ''
                        new_row = row - 1
                        if result[row - 1][col] < result[row][col]:
                            ineq = '<'
                        else:
                            ineq = '>'
                    new_row_1 = min(row, new_row)
                    new_row_2 = max(row, new_row)
                    isHorizontal = False
                    key = f"v-{new_row_1}-{col}"
                    constraint = (key, ineq, new_row_1 * size + col, new_row_2 * size + col, isHorizontal)
                    if constraint not in constraints:
                        constraints.append(constraint)
            return {"grid": grid, "constraints": constraints}
        case "hashiwokakero":
            pass
        case "numberlink":
            pass
        case "nurikabe":
            pass
        case "shikaku":
            pass
        case "sudoku":
            k = 40  # Number of cells to remove for the puzzle
            import random
            grid = [0 for _ in range(81)]
            col_indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8]
            numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]
            for i in range(9):
                random.shuffle(col_indexes)
                random.shuffle(numbers)
                col = col_indexes.pop()
                number = numbers.pop()
                grid[i * 9 + col] = number
            grid = [[x for x in grid[i:i + 9]] for i in range(0, 81, 9)]
            print(grid)
            s = Sudoku(grid)
            grid = s.solve()
            if grid:
                grid = [[grid[i * 9 + j] for j in range(9)] for i in range(9)]
                # Remove k numbers from the grid to create a puzzle
                for _ in range(k):
                    i = random.randint(0, 8)
                    j = random.randint(0, 8)
                    while grid[i][j] == 0:
                        i = random.randint(0, 8)
                        j = random.randint(0, 8)
                    grid[i][j] = 0
                return grid
            else:
                raise Exception("Failed to generate a valid Sudoku puzzle.")

        case _:
            raise Exception("Invalid puzzle type")


if __name__ == '__main__':
    app.run(debug=True, port=5000)
