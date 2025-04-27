import { solvePuzzle as pyodideSolvePuzzle } from './pyodide';

export interface PuzzleConfig {
  type: string;
  size: number;
  grid: number[][];
  constraints?: any; // For puzzles like Futoshiki that have additional constraints
}

export async function solvePuzzle(puzzleConfig: PuzzleConfig): Promise<number[][]> {
  try {
    // For Futoshiki, we need to handle the constraints separately
    if (puzzleConfig.type === 'futoshiki' && puzzleConfig.constraints) {
      return await pyodideSolvePuzzle(puzzleConfig.type, puzzleConfig.grid, puzzleConfig.constraints);
    }

    return await pyodideSolvePuzzle(puzzleConfig.type, puzzleConfig.grid);
  } catch (error) {
    console.error('Error solving puzzle:', error);
    throw error;
  }
}

export function validatePuzzle(puzzleConfig: PuzzleConfig): boolean {
  const { type, grid } = puzzleConfig;

  // Basic validation
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    return false;
  }

  // Check for consistent grid dimensions
  const size = grid.length;
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== size) {
      return false;
    }
  }

  // Specific validations for puzzle types
  switch (type) {
    case 'sudoku':
      // Check if the grid is 9x9
      if (size !== 9) {
        return false;
      }
      // Check if all values are between 0-9
      for (const row of grid) {
        for (const cell of row) {
          if (typeof cell !== 'number' || cell < 0 || cell > 9) {
            return false;
          }
        }
      }
      return true;

    case 'numberlink':
    case 'nurikabe':
    case 'shikaku':
    case 'futoshiki':
    case 'hashiwokakero':
      // Basic validation for other puzzle types
      return true;

    default:
      return false;
  }
}

export function generateEmptyGrid(size: number): number[][] {
  return Array(size).fill(0).map(() => Array(size).fill(0));
}

export function generateRandomPuzzle(type: string, size: number): PuzzleConfig {
  // This is a placeholder for actual puzzle generation
  // In a real implementation, this would call the backend to generate puzzles
  const grid = generateEmptyGrid(size);

  // For testing, add some random numbers
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < Math.ceil(size / 3); j++) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      grid[row][col] = Math.floor(Math.random() * size) + 1;
    }
  }

  return {
    type,
    size,
    grid
  };
}