import { loadPyodide } from 'pyodide';

let pyodide: any = null;
let loading = false;
let loadingPromise: Promise<any> | null = null;

export async function loadPyodideService() {
  if (pyodide) {
    return pyodide;
  }

  if (loading && loadingPromise) {
    return loadingPromise;
  }

  loading = true;
  loadingPromise = (async () => {
    console.log('Loading Pyodide...');

    pyodide = await loadPyodide({indexURL: "src/main/front/node_modules/pyodide/"});

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

export async function solvePuzzle(pyodide: any, puzzleType: string, puzzleGrid: number[][], constraints?: any) {
  const pyodideInstance = pyodide;

  // Convert the grid to a Python-friendly format
  pyodideInstance.globals.set('puzzle_grid', puzzleGrid);
  pyodideInstance.globals.set('puzzle_type', puzzleType);
  if (constraints) {
    pyodideInstance.globals.set('constraints', constraints);
  } else {
    pyodideInstance.globals.set('constraints', null);
  }


  // Load the Python solver code
  const solverCode = `
import sys
from js import puzzle_grid, puzzle_type
from src.main.back.main.py import call_puzzle_solver

# Convert JavaScript array to Python list
grid = puzzle_grid.to_py()
puzzle = puzzle_type.to_py()

solution = call_puzzle_solver(puzzle, grid)
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