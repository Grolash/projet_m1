
export interface PuzzleConfig {
  type: string;
  size: number;
  grid: string[][];
  constraints?: any; // For puzzles like Futoshiki that have additional constraints
}

interface PuzzleResponse {
  solution: any;
}

export async function solvePuzzleService(puzzleConfig: PuzzleConfig): Promise<string[][]> {
  try {
    const response = await fetch('http://localhost:5000/api/solve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(puzzleConfig),
    });

    if (!response.ok) {
      throw new Error('Failed to solve puzzle');
    }

    const data: PuzzleResponse = await response.json();
    if (!data.solution) {
      throw new Error('No solution found');
    }
    return generateGridFromSolution(data.solution, puzzleConfig.type, puzzleConfig.size, puzzleConfig.grid, puzzleConfig.constraints);
  }
    catch (error) {
        console.error('Error solving puzzle:', error);
    }

}

function generateGridFromSolution(solution: any, type: string, size, original_grid, constraints): string[][] {
  switch (type) {
    case 'sudoku':
      // solution is a 9x9 array converted from python to json
      // Convert the grid to a 2D array to display in the UI
        return convertGenericGridTo2DArray(solution, size);
    case 'numberlink':
        // Convert the grid to a 2D array to display in the UI
        const convertedGrid = convertGenericGridTo2DArray(solution, size);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (original_grid[i][j] === 0) {
                    if (convertedGrid[i+1][j] === convertedGrid[i][j] && convertedGrid[i-1][j] === convertedGrid[i][j]) {
                      convertedGrid[i][j] = '│ ';
                    }
                    else if (convertedGrid[i][j+1] === convertedGrid[i][j] && convertedGrid[i][j-1] === convertedGrid[i][j]) {
                      convertedGrid[i][j] = '─ ';
                    }
                    else if (convertedGrid[i+1][j] === convertedGrid[i][j] && convertedGrid[i][j+1] === convertedGrid[i][j]) {
                      convertedGrid[i][j] = '┌ ';
                    }
                    else if (convertedGrid[i+1][j] === convertedGrid[i][j] && convertedGrid[i][j-1] === convertedGrid[i][j]) {
                      convertedGrid[i][j] = '└ ';
                    }
                    else if (convertedGrid[i-1][j] === convertedGrid[i][j] && convertedGrid[i][j+1] === convertedGrid[i][j]) {
                      convertedGrid[i][j] = '┐ ';
                    }
                    else if (convertedGrid[i-1][j] === convertedGrid[i][j] && convertedGrid[i][j-1] === convertedGrid[i][j]) {
                      convertedGrid[i][j] = '┘ ';
                }
                else {
                    convertedGrid[i][j] = original_grid[i][j].toString();
                }
            }
        }
        }
        return convertedGrid;
    case 'nurikabe':
        // Convert the grid to a 2D array to display in the UI
        const nurikabeGrid = convertGenericGridTo2DArray(solution, size);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
            if (original_grid[i][j] === 0) {
                if (solution[i][j] === 0) {
                    nurikabeGrid[i][j] = 'X';
                }
                else {nurikabeGrid[i][j] = ' ';}
            } else {
                nurikabeGrid[i][j] = original_grid[i][j].toString();
            }
            }
        }
        return nurikabeGrid;
    case 'shikaku':
    case 'futoshiki':
    case 'hashiwokakero':
    default:
      throw new Error('Unknown puzzle type');
  }
}

function convertGenericGridTo2DArray(grid: any, size: number): string[][] {
    const result: string[][] = [];
    for (let i = 0; i < size; i++) {
        const row: string[] = [];
        for (let j = 0; j < size; j++) {
        row.push(grid[i][j].toString());
        }
        result.push(row);
    }
    return result;
}

export function validatePuzzle(puzzleConfig: PuzzleConfig): boolean {
  const { type, size, grid } = puzzleConfig;

  // Basic validation
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    return false;
  }

  // Check for consistent grid dimensions
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
          if (cell < 0 || cell > 9) {
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

export function generateEmptyGrid(size: number): string[][] {
  const grid: string[][] = [];
  for (let i = 0; i < size; i++) {
    const row: string[] = [];
    for (let j = 0; j < size; j++) {
      row.push(String("0")); // Fill with zeros or any default value
    }
    grid.push(row);
  }
  return grid;
}

export async function generatePuzzle(type: string, size: number): Promise<string[][]> {
    const puzzleConfig: PuzzleConfig = {
        type,
        size,
        grid: generateEmptyGrid(size),
    };
  try {
    const response = await fetch('http://localhost:5000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(puzzleConfig),
    });

    if (!response.ok) {
      throw new Error('Failed to generate puzzle');
    }

    const data: PuzzleResponse = await response.json();
    if (!data.solution) {
      throw new Error('No solution found');
    }
    return generateGridFromSolution(data.solution, puzzleConfig.type, puzzleConfig.size, puzzleConfig.grid, puzzleConfig.constraints);
  } catch (error) {
    console.error('Error generating puzzle:', error);
  }
}
