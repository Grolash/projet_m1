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
                return hashiwokakero.get_rows(result)
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
                return shikaku.get_rows(result[0]), result[1]
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
            pass
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
