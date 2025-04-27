import { loadPyodide } from 'pyodide';

let pyodide: any = null;
let loading = false;
let loadingPromise: Promise<any> | null = null;

export async function loadPyodide() {
  if (pyodide) {
    return pyodide;
  }

  if (loading && loadingPromise) {
    return loadingPromise;
  }

  loading = true;
  loadingPromise = (async () => {
    console.log('Loading Pyodide...');
    const loadPyodide = await loadPyodide();

    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
    });

    // Install required packages
    await pyodide.loadPackage(['micropip', 'numpy']);

    // We need to install or-tools using micropip
    await pyodide.runPythonAsync(`
      import micropip
      await micropip.install('ortools')
    `);

    console.log('Pyodide loaded successfully');
    return pyodide;
  })();

  return loadingPromise;
}

export async function runPython(pythonCode: string) {
  const pyodideInstance = await loadPyodide();
  return pyodideInstance.runPythonAsync(pythonCode);
}

export async function solvePuzzle(puzzleType: string, puzzleGrid: number[][]) {
  const pyodideInstance = await loadPyodide();

  // Convert the grid to a Python-friendly format
  pyodideInstance.globals.set('puzzle_grid', puzzleGrid);
  pyodideInstance.globals.set('puzzle_type', puzzleType);

  // Load the Python solver code
  const solverCode = `
import sys
from js import puzzle_grid, puzzle_type

# Convert JavaScript array to Python list
grid = puzzle_grid.to_py()

# This is where you would import your actual solver modules
# For now, we'll use this placeholder code
def solve_puzzle(puzzle_type, grid):
    if puzzle_type == 'numberlink':
        # Mock solution for testing
        return [[i % 5 for i in range(len(grid[0]))] for _ in range(len(grid))]
    elif puzzle_type == 'nurikabe':
        # Mock solution for testing
        return [[i % 2 for i in range(len(grid[0]))] for _ in range(len(grid))]
    elif puzzle_type == 'sudoku':
        # Mock solution for testing
        return [[((i + j) % 9) + 1 for i in range(len(grid[0]))] for j in range(len(grid))]
    # Add other puzzle types...
    else:
        return grid

solution = solve_puzzle(puzzle_type, grid)
solution
  `;

  try {
    const result = await pyodideInstance.runPythonAsync(solverCode);
    return result.toJs();
  } catch (error) {
    console.error('Error running Python code:', error);
    throw error;
  }
}