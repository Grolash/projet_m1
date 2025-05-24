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
                futoshiki = Futoshiki(grid, constraints)
                return futoshiki.solve()
            else:
                raise Exception("Constraints are required for Futoshiki puzzles.")
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
    return None


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
    pass


if __name__ == '__main__':
    app.run(debug=True, port=5000)
