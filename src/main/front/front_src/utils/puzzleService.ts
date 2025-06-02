
export interface PuzzleConfig {
  type: string;
  size: number;
  grid: string[][];
  constraints?: any; // For puzzles like Futoshiki that have additional constraints
}

interface PuzzleResponse {
    solution: any; // The solution returned from the backend
  puzzle: any;
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
        throw new Error(`${error instanceof Error ? error.message : 'Unknown error'}`);
    }

}

export async function solveShikakuPuzzleService(puzzleConfig: PuzzleConfig): Promise<any[]> {
    try {
        const response = await fetch('http://localhost:5000/api/solve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(puzzleConfig),
        });

        if (!response.ok) {
            throw new Error('Failed to solve Shikaku puzzle');
        }

        const data: PuzzleResponse = await response.json();
        if (!data.solution) {
            throw new Error('No solution found');
        }
        return generateShikakuSolution(data.solution);
    }
    catch (error) {
        throw new Error(`${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function solveHashiwokakeroPuzzleService(puzzleConfig: PuzzleConfig): Promise<Map<any, any>> {
    try {
        const response = await fetch('http://localhost:5000/api/solve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(puzzleConfig),
        });

        if (!response.ok) {
            throw new Error('Failed to solve Hashiwokakero puzzle');
        }

        const data: PuzzleResponse = await response.json();
        if (!data.solution) {
            throw new Error('No solution found');
        }
        return generateHashiwokakeroSolution(data.solution, puzzleConfig.size); // Assuming the solution is already in the desired format
    }
    catch (error) {
        throw new Error(`${error instanceof Error ? error.message : 'Unknown error'}`);
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
        const solutionGrid = JSON.parse(JSON.stringify(original_grid));
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (original_grid[i][j] === "0") {
                    if (i > 0 && i+1 < size && convertedGrid[i+1][j] === convertedGrid[i][j] && convertedGrid[i-1][j] === convertedGrid[i][j]) {
                      solutionGrid[i][j] = '│ ';
                    }
                    else if (j > 0 && j+1 < size && convertedGrid[i][j+1] === convertedGrid[i][j] && convertedGrid[i][j-1] === convertedGrid[i][j]) {
                      solutionGrid[i][j] = '─ ';
                    }
                    else if (i+1 < size && j+1 < size && convertedGrid[i+1][j] === convertedGrid[i][j] && convertedGrid[i][j+1] === convertedGrid[i][j]) {
                      solutionGrid[i][j] = '┌ ';
                    }
                    else if (j > 0 && i+1 < size && convertedGrid[i+1][j] === convertedGrid[i][j] && convertedGrid[i][j-1] === convertedGrid[i][j]) {
                      solutionGrid[i][j] = '┐ ';
                    }
                    else if (i > 0 && j+1 < size && convertedGrid[i-1][j] === convertedGrid[i][j] && convertedGrid[i][j+1] === convertedGrid[i][j]) {
                      solutionGrid[i][j] = '└ ';
                    }
                    else if (i > 0 && j > 0 && convertedGrid[i-1][j] === convertedGrid[i][j] && convertedGrid[i][j-1] === convertedGrid[i][j]) {
                      solutionGrid[i][j] = '┘ ';
                }
                else {
                    solutionGrid[i][j] = original_grid[i][j].toString();
                }
            }
        }
        }
        return solutionGrid;
    case 'nurikabe':
        // Convert the grid to a 2D array to display in the UI
        const nurikabeGrid = convertGenericGridTo2DArray(solution, size);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
            if (original_grid[i][j] === "0" || original_grid[i][j] === "") {
                if (nurikabeGrid[i][j] === "0") {
                    nurikabeGrid[i][j] = 'X';
                }
                else {nurikabeGrid[i][j] = ' ';}
            } else {
                nurikabeGrid[i][j] = original_grid[i][j].toString();
            }
            }
        }
        console.log('nurikabeGrid', nurikabeGrid, 'original_grid', original_grid, 'solution', solution)
        return nurikabeGrid;
    case 'shikaku':
        throw new Error('Shikaku puzzle solving is handled separately');

    case 'futoshiki':
        return convertGenericGridTo2DArray(solution, size);

    case 'hashiwokakero':
        throw new Error('Hashiwokakero puzzle solving is not implemented yet');

    default:
        throw new Error('Unknown puzzle type');
  }
}

function generateShikakuSolution(solution: any): any[] {
    const rectangles: any[] = [];
    for (let index in solution) {
        const rect = solution[index];
        const rectangle = {
            startRow: rect.top,
            startCol: rect.left,
            endRow: rect.bottom,
            endCol: rect.right,
        };
        rectangles.push(rectangle);
    }
    return rectangles;
}

function generateHashiwokakeroSolution(solution: any, gridSize: number): Map<any, any> {
    const newBridges = new Map();

    // Convert solution format to bridge format
    Object.entries(solution).forEach(([nodeIndex, nodeInfo]) => {
        const nodeRow = Math.floor(parseInt(nodeIndex) / gridSize);
        const nodeCol = parseInt(nodeIndex) % gridSize;

        Object.entries(nodeInfo.edges).forEach(([neighborIndex, bridgeCount]) => {
        if (bridgeCount > 0) {
            const neighborRow = Math.floor(parseInt(neighborIndex) / gridSize);
            const neighborCol = parseInt(neighborIndex) % gridSize;

            // Only add bridge once (from lower index to higher index)
            if (parseInt(nodeIndex) < parseInt(neighborIndex)) {
            const bridgeKey = `${Math.min(nodeRow, neighborRow)}-${Math.min(nodeCol, neighborCol)}-${Math.max(nodeRow, neighborRow)}-${Math.max(nodeCol, neighborCol)}`;
            newBridges.set(bridgeKey, {
                from: {row: nodeRow, col: nodeCol},
                to: {row: neighborRow, col: neighborCol},
                count: bridgeCount
            });
            }
        }
        });
    });
    console.log('Generated Hashiwokakero bridges:', newBridges, 'from solution:', solution)
    return newBridges;
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

export async function generatePuzzle(puzzleConfig: PuzzleConfig): Promise<string[][]>{
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
    if (!data.puzzle) {
      throw new Error('Failed to generate puzzle');
    }
    if (puzzleConfig.type !== 'futoshiki'){
        return convertGenericGridTo2DArray(data.puzzle, puzzleConfig.size);
    }
    else {
        throw new Error('Futoshiki puzzle generation is implemented separately, use generateFutoshikiPuzzle instead.');
    }
  } catch (error) {
    console.error('Error generating puzzle:', error);
  }
}

export async function generateFutoshikiPuzzle(puzzleConfig: PuzzleConfig): Promise<any[]> {
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
    if (!data.puzzle || !data.puzzle.grid || !data.puzzle.constraints) {
      throw new Error('Failed to generate puzzle');
    }
    if (puzzleConfig.type === 'futoshiki'){
        return [convertGenericGridTo2DArray(data.puzzle.grid, puzzleConfig.size), convertFutoshikiConstraints(data.puzzle.constraints, puzzleConfig.size)];
    }
  } catch (error) {
    console.error('Error generating puzzle:', error);
  }
}

function convertFutoshikiConstraints(constraints: any[], size: number): any[] {
  return constraints.map(constraint => ({
      key: constraint[0], // Unique key for the constraint
      symbol: constraint[1],
      cell1: constraint[2],
      cell2: constraint[3],
      isHorizontal: constraint[4],
  }));
}