import {useState, useEffect, ChangeEvent} from 'react';
import { Download, Upload, Plus, Grid, Settings, HelpCircle, CheckCircle, SunIcon, MoonIcon } from 'lucide-react';
import { useTheme } from './themeContext';
import {Switch} from '@heroui/react';
import { solvePuzzleService, solveShikakuPuzzleService, solveHashiwokakeroPuzzleService, validatePuzzle, generateEmptyGrid, generatePuzzle, generateFutoshikiPuzzle } from './utils/puzzleService';

// Define puzzle types
const puzzleTypes = [
  { id: 'numberlink', name: 'Numberlink' },
  { id: 'nurikabe', name: 'Nurikabe' },
  { id: 'shikaku', name: 'Shikaku' },
  { id: 'sudoku', name: 'Sudoku' },
  { id: 'futoshiki', name: 'Futoshiki' },
  { id: 'hashiwokakero', name: 'Hashiwokakero (Bridges)' }
];

// Default grid sizes for each puzzle type
const defaultGridSizes: { futoshiki: number; numberlink: number; shikaku: number; sudoku: number; nurikabe: number; hashiwokakero: number } = {
  numberlink: 7,
  nurikabe: 5,
  shikaku: 5,
  sudoku: 9,
  futoshiki: 5,
  hashiwokakero: 7
};

export default function PuzzleSolverHomepage() {
  const [selectedPuzzleType, setSelectedPuzzleType] = useState('sudoku');
  const [gridSize, setGridSize]: [number, ((value: number) => void)] = useState(defaultGridSizes[selectedPuzzleType as keyof typeof defaultGridSizes]);
  const [grid, setGrid] = useState<string[][]>([]);
  const [status, setStatus] = useState('ready'); // ready, solving, solved, error
  const [message, setMessage] = useState('');
  const [solution, setSolution] = useState<string[][] | null>(null);
  const [displayedGrid, setDisplayedGrid] = useState<boolean>(false);
  const [wantedSize, setWantedSize] = useState<number>(gridSize);

  // Shikaku specific states
  const [shikakuRectangles, setShikakuRectangles] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState({
      startRow: 0,
      endRow: 0,
      startCol: 0,
      endCol: 0
    });
  const [dragStart, setDragStart] = useState({ row: 0, col: 0 });
  const [shikakuEditMode, setShikakuEditMode] = useState(false);
  const [shikakuSolution, setShikakuSolution] = useState([]);
  const [displayShikakuSolution, setDisplayShikakuSolution] = useState(false);

  // Numberlink specific states
  const [numberlinkEditMode, setNumberlinkEditMode] = useState(false);
  const [numberlinkPaths, setNumberlinkPaths] = useState([]); // Array of path objects
  const [isDragging, setIsDragging] = useState(false);
  const [currentPath, setCurrentPath] = useState({
      start: { row: 0, col: 0 },
      end: { row: 0, col: 0},
      number: "",
      path: []
    });
  const [dragStartNumber, setDragStartNumber] = useState("");

  // Nurikabe specific states
  const [nurikabeEditMode, setNurikabeEditMode] = useState(false);
  const [nurikabeXCells, setNurikabeXCells] = useState(new Set());
  const [nurikabeSolutionCells, setNurikabeSolutionCells] = useState(new Set());

  // Futoshiki specific states
  const [futoshikiConstraints, setFutoshikiConstraints] = useState([]);

  // Hashiwokakero specific states
  const [hashiEditMode, setHashiEditMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState({}); // {row, col}
  const [hashiBridges, setHashiBridges] = useState(new Map()); // bridgeId -> {from: {row, col}, to: {row, col}, count: 1|2}
  const [hashiSolution, setHashiSolution] = useState(new Map());

  const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
      <Switch className={"bg-indigo-400 dark:bg-gray-500 text-yellow-200 dark:text-amber-300 rounded-full ml-2"}
              defaultSelected={theme !== 'light'}
              size="lg"
              color="secondary"
              startContent={<SunIcon />}
              endContent={<MoonIcon/>}
              thumbIcon={({isSelected}) =>
                  isSelected ? <MoonIcon className="text-indigo-600 fill-indigo-300" /> : <SunIcon className="text-yellow-600 fill-yellow-300" />
              }
              onChange={toggleTheme}
    />

  );}

  useEffect(() => {
    createEmptyGrid();
  }, [selectedPuzzleType]);

  const createEmptyGrid = () => {
    setGridSize(wantedSize)
    setDisplayedGrid(false)
    const newGrid = generateEmptyGrid(wantedSize);
    setGrid(newGrid);
    setSolution(null);
    setStatus('ready');
    setMessage('Empty grid created');
  };

  const handlePuzzleTypeChange = (e : ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setWantedSize(defaultGridSizes[newType as keyof typeof defaultGridSizes]);
    setSelectedPuzzleType(newType);
    clearSolutions();
    clearFutoshikiConstraints()
  };

  const clearSolutions = () => {
    setDisplayedGrid(false);
    setSolution(null);
    setShikakuSolution([]);
    setDisplayShikakuSolution(false);
    setNurikabeSolutionCells(new Set());
    setHashiSolution(new Map());
    setMessage('Solutions cleared');
    setStatus('ready');
  }

  const incrementGridSize = () => {
    if (wantedSize < 20) {
      setWantedSize(wantedSize + 1);
    }
  };

  const decrementGridSize = () => {
    if (wantedSize > 5) {
      setWantedSize(wantedSize - 1);
    }
  };

  const handleCellChange = (rowIndex : number, colIndex : number, value : string) => {
    const newGrid = [...grid];
    newGrid[rowIndex][colIndex] = String(isNaN(parseInt(value)) ? 0 : parseInt(value));
    setGrid(newGrid);
  };

  const savePuzzle = () => {
    try {
      const puzzleConfig = {
        type: selectedPuzzleType,
        size: gridSize,
        grid: grid,
        constraints: selectedPuzzleType === 'futoshiki' ? futoshikiConstraints : null,
      };

      const data = JSON.stringify(puzzleConfig);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedPuzzleType}_${gridSize}x${gridSize}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error : any) {
      setMessage(`Error saving puzzle: ${error.message}`);
    }
    setMessage('Puzzle saved successfully');
  };

  const loadPuzzle = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = event.target?.result;
          if (typeof result === 'string') {
            const puzzleConfig = JSON.parse(result);

            if (puzzleConfig.type && puzzleConfig.grid) {
              setSelectedPuzzleType(puzzleConfig.type);
              setGridSize(puzzleConfig.grid.length);
              setGrid(puzzleConfig.grid);
                if (puzzleConfig.constraints && puzzleConfig.type === 'futoshiki') {
                    setFutoshikiConstraints(puzzleConfig.constraints);
                }
              clearSolutions();
              setMessage('Puzzle loaded successfully');
            } else {
              setMessage('Invalid puzzle format');
            }
          }
        } catch (error : any) {
          setMessage(`Error loading puzzle: ${error.message}`);
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  const getPuzzle = () => {}

  const generateRandomPuzzle = async () => {
    try {
      const puzzle = {
        type: selectedPuzzleType,
        size: gridSize,
        grid: grid,
        constraints: selectedPuzzleType === 'futoshiki' ? [] : null,
      };
      const puzzleConfig = selectedPuzzleType === 'futoshiki' ? await generateFutoshikiPuzzle(puzzle) : await generatePuzzle(puzzle);
      setDisplayedGrid(false)
      if (puzzleConfig) {
        setGrid(selectedPuzzleType === 'futoshiki' ? puzzleConfig[0] : puzzleConfig);
      }
      if (selectedPuzzleType === 'futoshiki') {
          setFutoshikiConstraints(puzzleConfig[1]);
      }
      clearSolutions();
      setMessage('Random puzzle generated');
    } catch (error : any) {
      setMessage(`Error generating puzzle: ${error.message}`);
    }
  };

  const displaySolution = () => {
    if (solution) {
        setDisplayedGrid(!displayedGrid);
        if (selectedPuzzleType === 'shikaku') {
          setDisplayShikakuSolution(!displayShikakuSolution);
        }
    } else {
      solvePuzzle().then(r => {if(solution){setDisplayedGrid(!displayedGrid);} if (selectedPuzzleType === 'shikaku') {
          if(solution) {
            setDisplayShikakuSolution(!displayShikakuSolution);
          }
        }
    })}
  }

  const solvePuzzle = async () => {
    setStatus('solving');
    setMessage('Solving puzzle...');

    try {
      const puzzleConfig = {
        type: selectedPuzzleType,
        size: gridSize,
        grid: grid,
        constraints: selectedPuzzleType === 'futoshiki' ? getFutoshikiConstraintsForSolver() : null,
      };

      if (!validatePuzzle(puzzleConfig)) {
        setStatus('error');
        setMessage('Invalid puzzle configuration');
        return;
      }

      if (selectedPuzzleType !== 'shikaku' && selectedPuzzleType !== 'hashiwokakero') {
        const solvedGrid = await solvePuzzleService(puzzleConfig);
        if (selectedPuzzleType !== 'nurikabe') {
          setSolution(solvedGrid);
        }
        else {
          const solutionCells = new Set();
          solvedGrid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
              if (cell === 'X') {
                solutionCells.add(`${rowIndex}-${colIndex}`);
              }
            });
          });
          if (solvedGrid){
            setSolution(grid);
            setNurikabeSolutionCells(solutionCells);
          }
        }
      }
      else if (selectedPuzzleType === 'shikaku') {
        const solutionRectangles = await solveShikakuPuzzleService(puzzleConfig);
        setShikakuSolution(solutionRectangles);
        if(solutionRectangles){
          setSolution(grid);
        }
      }
      else if (selectedPuzzleType === 'hashiwokakero') {
        const solutionBridges = await solveHashiwokakeroPuzzleService(puzzleConfig);
        setHashiSolution(solutionBridges);
        if(solutionBridges){
          setSolution(grid);
        }
      }
      setStatus('solved');
      setMessage('Puzzle solved successfully!');
    } catch (error : any) {
      setDisplayedGrid(false);
      setStatus('error');
      setMessage(`Error solving puzzle: ${error.message}`);
    }
  };

  const sizeChanger = () => {
        return(
            <div className="my-8 mb-14">
          <label className="block text-lg font-medium text-gray-700 dark:text-neutral-200 mb-1">
            Grid Size
          </label>
          <div className="flex items-center">
            <button
              onClick={decrementGridSize}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:text-neutral-200 dark:bg-gray-600 dark:hover:bg-gray-400 rounded-l"
              disabled={wantedSize <= 5}
            >
              -
            </button>
            <input
              type="text"
              inputMode={'numeric'}
              min="5"
              max="20"
              value={wantedSize}
              className="w-16 p-2 text-center border-y border-gray-300 dark:text-neutral-200 dark:bg-gray-500 dark:border-gray-600 focus:outline-none"
            />
            <button
              onClick={incrementGridSize}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:text-neutral-200 dark:bg-gray-600 dark:hover:bg-gray-400 rounded-r"
              disabled={wantedSize >= 15}
            >
              +
            </button>
          </div>
        </div>
        )
      }

      // Shikaku specific functions
  const getCellKey = (row, col) => `${row}-${col}`;

  const isCellInRectangle = (row, col, rectangles) => {
    return rectangles.find(rect =>
      row >= rect.startRow && row <= rect.endRow &&
      col >= rect.startCol && col <= rect.endCol
    );
  };

  const handleShikakuMouseDown = (rowIndex, colIndex) => {
    if (displayedGrid) return;

    setIsDrawing(true);
    setDragStart({ row: rowIndex, col: colIndex });
    setCurrentRect({
      startRow: rowIndex,
      endRow: rowIndex,
      startCol: colIndex,
      endCol: colIndex
    });
  };

  const handleShikakuMouseEnter = (rowIndex, colIndex) => {
    if (!isDrawing || !dragStart) return;

    setCurrentRect({
      startRow: Math.min(dragStart.row, rowIndex),
      endRow: Math.max(dragStart.row, rowIndex),
      startCol: Math.min(dragStart.col, colIndex),
      endCol: Math.max(dragStart.col, colIndex)
    });
  };

  const handleShikakuMouseUp = () => {
    if (!isDrawing || !currentRect) return;

  // Check if rectangle overlaps with existing rectangles
  const overlaps = shikakuRectangles.some(rect =>
    !(currentRect.endRow < rect.startRow ||
      currentRect.startRow > rect.endRow ||
      currentRect.endCol < rect.startCol ||
      currentRect.startCol > rect.endCol)
    );

    if (!overlaps) {
      setShikakuRectangles(prev => [...prev, {
        ...currentRect,
        id: Date.now() // Simple ID generation
      }]);
    }

    setIsDrawing(false);
    setCurrentRect(null);
    setDragStart(null);
  };

  const removeRectangle = (rectId) => {
    setShikakuRectangles(prev => prev.filter(rect => rect.id !== rectId));
  };

  const clearAllRectangles = () => {
    setShikakuRectangles([]);
  };

  // Get rectangle coordinates for solution comparison
  const getRectangleCoordinates = () => {
    return shikakuRectangles.map(rect => ({
      topLeft: [rect.startRow, rect.startCol],
      topRight: [rect.startRow, rect.endCol],
      bottomLeft: [rect.endRow, rect.startCol],
      bottomRight: [rect.endRow, rect.endCol],
      width: rect.endCol - rect.startCol + 1,
      height: rect.endRow - rect.startRow + 1
    }));
  };

const getCellCoordinates = (row, col) => `${row},${col}`;

const isValidDragTarget = (row, col, startNumber) => {
  const cellValue = grid[row][col];
  return cellValue === startNumber && !(row === currentPath?.start?.row && col === currentPath?.start?.col);
};

// Track actual mouse path through cells
const addCellToCurrentPath = (row, col) => {
  if (!currentPath) return;

  const lastCell = currentPath.path[currentPath.path.length - 1];
  // Only add if it's a different cell and adjacent to the last cell
  if (lastCell && (lastCell.row !== row || lastCell.col !== col)) {
    const isAdjacent = Math.abs(lastCell.row - row) + Math.abs(lastCell.col - col) === 1;
    if (isAdjacent) {
      setCurrentPath(prev => ({
        ...prev,
        path: [...prev.path, { row, col }]
      }));
    }
  }
};

const handleNumberlinkMouseDown = (rowIndex, colIndex) => {
  if (displayedGrid || numberlinkEditMode) return;

  const cellValue = grid[rowIndex][colIndex];
  if (cellValue !== "0") {
    setIsDragging(true);
    setDragStartNumber(cellValue);
    setCurrentPath({
      start: { row: rowIndex, col: colIndex },
      end: { row: rowIndex, col: colIndex },
      number: cellValue,
      path: [{ row: rowIndex, col: colIndex }]
    });
  }
};

const handleNumberlinkMouseEnter = (rowIndex, colIndex) => {
  if (!isDragging || !currentPath) return;

  addCellToCurrentPath(rowIndex, colIndex);
  setCurrentPath(prev => ({
    ...prev,
    end: { row: rowIndex, col: colIndex }
  }));
};

const handleNumberlinkMouseUp = (rowIndex, colIndex) => {
  if (!isDragging || !currentPath) return;

  // Add final cell to path if different
  addCellToCurrentPath(rowIndex, colIndex);

  if (isValidDragTarget(rowIndex, colIndex, dragStartNumber)) {
    // Valid connection - add path
    const newPath = {
      id: Date.now(),
      number: dragStartNumber,
      start: currentPath.start,
      end: { row: rowIndex, col: colIndex },
      path: currentPath.path
    };

    // Remove any existing paths for this number
    setNumberlinkPaths(prev => [
      ...prev.filter(p => p.number !== dragStartNumber),
      newPath
    ]);
  }

  setIsDragging(false);
  setCurrentPath(null);
  setDragStartNumber(null);
};

const clearNumberlinkPaths = () => {
  setNumberlinkPaths([]);
};

const removePathForNumber = (number) => {
  setNumberlinkPaths(prev => prev.filter(p => p.number !== number));
};

// Check if a cell is part of any path
const getCellPathInfo = (row, col) => {
  for (let path of numberlinkPaths) {
    const cellInPath = path.path.find(p => p.row === row && p.col === col);
    if (cellInPath) {
      return { path, isEndpoint: (row === path.start.row && col === path.start.col) || (row === path.end.row && col === path.end.col) };
    }
  }
  return null;
};

// Get the line character for display (using your existing logic)
const getLineCharacter = (row, col, pathNumber) => {
  const convertedGrid = Array(gridSize).fill("0").map(() => Array(gridSize).fill("0"));

  // Fill converted grid with path numbers
  numberlinkPaths.forEach(path => {
    if (path.number === pathNumber) {
      path.path.forEach(cell => {
        convertedGrid[cell.row][cell.col] = pathNumber;
      });
    }
  });

  // Apply your existing logic
  if (grid[row][col] !== "0") return grid[row][col];

  const i = row, j = col;
  const size = gridSize;

  if (i > 0 && i+1 < size && convertedGrid[i+1][j] === convertedGrid[i][j] && convertedGrid[i-1][j] === convertedGrid[i][j]) {
    return '│';
  }
  else if (j > 0 && j+1 < size && convertedGrid[i][j+1] === convertedGrid[i][j] && convertedGrid[i][j-1] === convertedGrid[i][j]) {
    return '─';
  }
  else if (i+1 < size && j+1 < size && convertedGrid[i+1][j] === convertedGrid[i][j] && convertedGrid[i][j+1] === convertedGrid[i][j]) {
    return '┌';
  }
  else if (j > 0 && i+1 < size && convertedGrid[i+1][j] === convertedGrid[i][j] && convertedGrid[i][j-1] === convertedGrid[i][j]) {
    return '┐';
  }
  else if (i > 0 && j+1 < size && convertedGrid[i-1][j] === convertedGrid[i][j] && convertedGrid[i][j+1] === convertedGrid[i][j]) {
    return '└';
  }
  else if (i > 0 && j > 0 && convertedGrid[i-1][j] === convertedGrid[i][j] && convertedGrid[i][j-1] === convertedGrid[i][j]) {
    return '┘';
  }

  return '';
};

// Nurikabe helper functions
const toggleNurikabeX = (row, col) => {
  const cellKey = `${row}-${col}`;
  const newXCells = new Set(nurikabeXCells);

  if (newXCells.has(cellKey)) {
    newXCells.delete(cellKey);
  } else {
    // Only add X if cell is empty (no number)
    if (grid[row][col] === "0") {
      newXCells.add(cellKey);
    }
  }

  setNurikabeXCells(newXCells);
};

const handleNurikabeClick = (e, row, col) => {
  e.preventDefault();
  if (!nurikabeEditMode && !displayedGrid) {
    toggleNurikabeX(row, col);
  }
};

const clearNurikabeXs = () => {
  setNurikabeXCells(new Set());
};

// Futoshiki helper functions
const getConstraintIndex = (row1, col1, row2, col2, isHorizontal) => {
  if (isHorizontal) {
    return `h-${row1}-${Math.min(col1, col2)}`;
  } else {
    return `v-${Math.min(row1, row2)}-${col1}`;
  }
};

const flattenIndex = (row, col, gridSize) => {
  return row * gridSize + col;
};

const toggleConstraint = (row1, col1, row2, col2, isHorizontal) => {
  const constraintKey = getConstraintIndex(row1, col1, row2, col2, isHorizontal);
  const existingConstraint = futoshikiConstraints.find(c => c.key === constraintKey);

  let newConstraints = futoshikiConstraints.filter(c => c.key !== constraintKey);

  if (!existingConstraint) {
    // Add ">"
    newConstraints.push({
      key: constraintKey,
      symbol: ">",
      cell1: flattenIndex(row1, col1, gridSize),
      cell2: flattenIndex(row2, col2, gridSize),
      isHorizontal
    });
  } else if (existingConstraint.symbol === ">") {
    // Change to "<"
    newConstraints.push({
      key: constraintKey,
      symbol: "<",
      cell1: flattenIndex(row1, col1, gridSize),
      cell2: flattenIndex(row2, col2, gridSize),
      isHorizontal
    });
  }
  // If it was "<", remove it (cycle back to empty)

  setFutoshikiConstraints(newConstraints);
};

const getConstraintSymbol = (row1, col1, row2, col2, isHorizontal) => {
  const constraintKey = getConstraintIndex(row1, col1, row2, col2, isHorizontal);
  const constraint = futoshikiConstraints.find(c => c.key === constraintKey);
  return constraint ? constraint.symbol : "";
};

const getFutoshikiConstraintsForSolver = () => {
  return futoshikiConstraints.map(c => [c.symbol, c.cell1, c.cell2]);
};

const clearFutoshikiConstraints = () => {
  setFutoshikiConstraints([]);
};

// Hashiwokakero helper functions
  const getBridgeInfo = (row, col) => {
    const map = displayedGrid ? hashiSolution : hashiBridges;
  for (const [bridgeId, bridge] of map) {
    const isHorizontal = bridge.from.row === bridge.to.row;

    if (isHorizontal && bridge.from.row === row) {
      const minCol = Math.min(bridge.from.col, bridge.to.col);
      const maxCol = Math.max(bridge.from.col, bridge.to.col);
      if (col > minCol && col < maxCol) {
        return {
          isPartOfBridge: true,
          isHorizontal: true,
          bridgeCount: bridge.count,
          bridgeId: bridgeId
        };
      }
    } else if (!isHorizontal && bridge.from.col === col) {
      const minRow = Math.min(bridge.from.row, bridge.to.row);
      const maxRow = Math.max(bridge.from.row, bridge.to.row);
      if (row > minRow && row < maxRow) {
        return {
          isPartOfBridge: true,
          isHorizontal: false,
          bridgeCount: bridge.count,
          bridgeId: bridgeId
        };
      }
    }
  }
  return { isPartOfBridge: false };
};

// Check if a bridge would intersect with existing bridges
const wouldBridgeIntersect = (from, to) => {
  const isNewHorizontal = from.row === to.row;

  for (const [_, bridge] of hashiBridges) {
    const isExistingHorizontal = bridge.from.row === bridge.to.row;

    if (isNewHorizontal === isExistingHorizontal) continue; // Parallel bridges don't intersect

    if (isNewHorizontal) {
      // New bridge is horizontal, check against vertical bridges
      const minCol = Math.min(from.col, to.col);
      const maxCol = Math.max(from.col, to.col);
      const minRow = Math.min(bridge.from.row, bridge.to.row);
      const maxRow = Math.max(bridge.from.row, bridge.to.row);

      if (bridge.from.col > minCol && bridge.from.col < maxCol &&
          from.row > minRow && from.row < maxRow) {
        return true;
      }
    } else {
      // New bridge is vertical, check against horizontal bridges
      const minRow = Math.min(from.row, to.row);
      const maxRow = Math.max(from.row, to.row);
      const minCol = Math.min(bridge.from.col, bridge.to.col);
      const maxCol = Math.max(bridge.from.col, bridge.to.col);

      if (from.col > minCol && from.col < maxCol &&
          bridge.from.row > minRow && bridge.from.row < maxRow) {
        return true;
      }
    }
  }
  return false;
};

// Check if there's a clear path between two nodes (no islands in between)
const hasClearPath = (from, to) => {
  if (from.row === to.row) {
    // Horizontal path
    const minCol = Math.min(from.col, to.col);
    const maxCol = Math.max(from.col, to.col);
    for (let col = minCol + 1; col < maxCol; col++) {
      if (grid[from.row][col] !== "0") return false;
    }
  } else if (from.col === to.col) {
    // Vertical path
    const minRow = Math.min(from.row, to.row);
    const maxRow = Math.max(from.row, to.row);
    for (let row = minRow + 1; row < maxRow; row++) {
      if (grid[row][from.col] !== "0") return false;
    }
  } else {
    return false; // Not in same row or column
  }
  return true;
};

// Handle cell clicks in bridge drawing mode
const handleHashiCellClick = (row, col) => {
  if (displayedGrid) return;

  const isNode = grid[row][col] !== "0";
  const bridgeInfo = getBridgeInfo(row, col);

  if (bridgeInfo.isPartOfBridge) {
    // Clicked on a bridge - this is handled by the delete button
    return;
  }

  if (!isNode) {
    // Clicked on empty cell, deselect current node
    setSelectedNode(null);
    return;
  }

  if (!selectedNode) {
    // First node selection
    setSelectedNode({ row, col });
  } else if (selectedNode.row === row && selectedNode.col === col) {
    // Clicked on the same node, deselect
    setSelectedNode(null);
  } else {
    // Second node selection - try to create bridge
    const from = selectedNode;
    const to = { row, col };

    // Check if nodes are in same row or column
    if (from.row !== to.row && from.col !== to.col) {
      setSelectedNode({ row, col });
      return;
    }

    // Check if there's a clear path
    if (!hasClearPath(from, to)) {
      setSelectedNode({ row, col });
      return;
    }

    // Check for existing bridge
    const bridgeKey = `${Math.min(from.row, to.row)}-${Math.min(from.col, to.col)}-${Math.max(from.row, to.row)}-${Math.max(from.col, to.col)}`;
    const existingBridge = hashiBridges.get(bridgeKey);

    if (existingBridge) {
      if (existingBridge.count === 1) {
        // Upgrade to double bridge
        setHashiBridges(prev => new Map(prev.set(bridgeKey, { ...existingBridge, count: 2 })));
      }
      // If already double bridge, do nothing (as per requirements)
    } else {
      // Check if bridge would intersect
      if (wouldBridgeIntersect(from, to)) {
        setSelectedNode({ row, col });
        return;
      }

      // Create new bridge
      setHashiBridges(prev => new Map(prev.set(bridgeKey, {
        from,
        to,
        count: 1
      })));
    }

    setSelectedNode(null);
  }
};

// Delete a specific bridge
const deleteBridge = (bridgeId) => {
  setHashiBridges(prev => {
    const newBridges = new Map(prev);
    newBridges.delete(bridgeId);
    return newBridges;
  });
};

// Clear all bridges
const clearAllBridges = () => {
  setHashiBridges(new Map());
  setSelectedNode(null);
};

  // Render the grid based on puzzle type
  const renderGrid = () => {
    const displayGrid = displayedGrid ? solution || grid : grid;

    switch (selectedPuzzleType) {
      case "sudoku":
        return (
    <div className="mt-6 w-full overflow-auto">
      <div
        className="grid gap-0.5 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(30px, 40px))`,
          maxWidth: Math.min(gridSize * 50, 800) + 'px'
        }}
      >
        {displayGrid.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <input
              key={`${rowIndex}-${colIndex}`}
              type="text"
              value={cell == "0" ? "" : cell || ''}
              onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
              className={`h-10 w-full dark:text-gray-200 border text-center focus:outline-none 
              focus:ring-0 focus:border-blue-400 dark:focus:outline-none dark:focus:border-blue-500 ${
                displayedGrid && solution ? 'bg-green-100 dark:bg-green-600 border-green-600 dark:border-green-300'  
                    : 'border-gray-700 dark:border-gray-400'
              } ${
                grid[rowIndex][colIndex] !== "0" && !displayedGrid ? 'font-semibold' : ''
              } ${solution && grid[rowIndex][colIndex] !== "0" && grid[rowIndex][colIndex] !== solution[rowIndex][colIndex] && displayedGrid ? 'bg-red-200 dark:bg-red-500 border-red-500 text-red-800 dark:border-red-400 dark:text-red-200' : ''}`}
              maxLength={selectedPuzzleType === 'sudoku' ? 1 : 2}
              readOnly={displayedGrid}
            />
          ))
        ))}
      </div>

      {displayedGrid && (
        <div className="flex justify-center mt-4 mr-20">
          <button
            onClick={() => setDisplayedGrid(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded shadow"
          >
            Back to Editing
          </button>
        </div>
        )}
      </div>
    );
        case "futoshiki":
          return (
    <div className="mt-6 w-full overflow-auto">
      <div
        className="mx-auto relative"
        style={{
          maxWidth: Math.min(gridSize * 50 + (gridSize - 1) * 25, 900) + 'px'
        }}
      >
        {/* Main grid container with alternating number rows and constraint rows */}
        <div
          className="grid gap-0 relative"
          style={{
            gridTemplateColumns: `repeat(${gridSize * 2 - 1}, minmax(15px, 40px))`,
            gridTemplateRows: `repeat(${gridSize * 2 - 1}, minmax(15px, 40px))`,
          }}
        >
          {Array.from({ length: gridSize * 2 - 1 }).map((_, rowIndex) => {
            const isNumberRow = rowIndex % 2 === 0;
            const actualRowIndex = Math.floor(rowIndex / 2);

            return Array.from({ length: gridSize * 2 - 1}).map((_, colIndex) => {
              const isNumberCol = colIndex % 2 === 0;
              const actualColIndex = Math.floor(colIndex / 2);

              if (isNumberRow && isNumberCol) {
                // Number cell
                const cell = displayGrid[actualRowIndex][actualColIndex];
                return (
                  <input
                    key={`${rowIndex}-${colIndex}`}
                    type="text"
                    value={cell == "0" ? "" : cell || ''}
                    onChange={(e) => handleCellChange(actualRowIndex, actualColIndex, e.target.value)}
                    className={`h-10 w-full dark:text-gray-200 border text-center focus:outline-none 
                    focus:ring-0 focus:border-blue-400 dark:focus:outline-none dark:focus:border-blue-500 ${
                      displayedGrid && solution ? 'bg-green-100 dark:bg-green-600 border-green-600 dark:border-green-300'  
                          : 'border-gray-700 dark:border-gray-400'
                    } ${
                      grid[actualRowIndex][actualColIndex] !== "0" && !displayedGrid ? 'font-semibold' : ''
                    }`}
                    maxLength={1}
                    readOnly={displayedGrid}
                  />
                );
              } else if (isNumberRow && !isNumberCol) {
                // Horizontal constraint cell
                const leftCol = actualColIndex;
                const rightCol = actualColIndex + 1;
                const symbol = getConstraintSymbol(actualRowIndex, leftCol, actualRowIndex, rightCol, true);

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`h-10 w-full flex items-center justify-center cursor-pointer select-none
                      hover:bg-gray-100 dark:hover:bg-gray-700 ${displayedGrid ? 'pointer-events-none' : ''}`}
                    onClick={() => !displayedGrid && toggleConstraint(actualRowIndex, leftCol, actualRowIndex, rightCol, true)}
                  >
                    <span className="text-lg font-bold dark:text-gray-200">
                      {symbol}
                    </span>
                  </div>
                );
              } else if (!isNumberRow && isNumberCol) {
                // Vertical constraint cell
                const topRow = actualRowIndex;
                const bottomRow = actualRowIndex + 1;
                const symbol = getConstraintSymbol(topRow, actualColIndex, bottomRow, actualColIndex, false);

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`h-10 w-full flex items-center justify-center cursor-pointer select-none
                      hover:bg-gray-100 dark:hover:bg-gray-700 ${displayedGrid ? 'pointer-events-none' : ''}`}
                    onClick={() => !displayedGrid && toggleConstraint(topRow, actualColIndex, bottomRow, actualColIndex, false)}
                  >
                    <span className="text-lg font-bold dark:text-gray-200" style={{ transform: 'rotate(90deg)' }}>
                      {symbol}
                    </span>
                  </div>
                );
              } else {
                // Empty intersection cell
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="h-6 w-full"
                  />
                );
              }
            });
          })}
        </div>
      </div>
      {displayedGrid && (
        <div className="flex justify-center mt-4 mr-12">
          <button
            onClick={() => displaySolution()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded shadow"
          >
            Back to Editing
          </button>
        </div>
      )}
    </div>
      );
        case "nurikabe":
          return (
    <div className="mt-6 w-full overflow-auto">
      {/* Mode toggle buttons */}
      <div className="flex justify-center gap-4 mb-4 mr-12">
        <button
          onClick={() => setNurikabeEditMode(false)}
          className={`px-4 py-2 rounded shadow ${
            !nurikabeEditMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          Mark X's
        </button>
        <button
          onClick={() => setNurikabeEditMode(true)}
          className={`px-4 py-2 rounded shadow ${
            nurikabeEditMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          Edit Numbers
        </button>
      </div>

      <div
        className="grid gap-0.5 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(30px, 40px))`,
          maxWidth: Math.min(gridSize * 50, 800) + 'px'
        }}
      >
        {displayGrid.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            const hasX = displayedGrid ? nurikabeSolutionCells.has(cellKey) : nurikabeXCells.has(cellKey);
            const hasNumber = grid[rowIndex][colIndex] !== "0";

            return nurikabeEditMode ? (
              // Edit mode - input fields
              <input
                key={`${rowIndex}-${colIndex}`}
                type="text"
                value={cell == "0" ? "" : cell || ''}
                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                className={`h-10 w-full dark:text-gray-200 border text-center focus:outline-none 
                focus:ring-0 focus:border-blue-400 dark:focus:outline-none dark:focus:border-blue-500 ${
                  displayedGrid && solution ? 'bg-green-100 dark:bg-green-600 border-green-600 dark:border-green-300'  
                      : 'border-gray-700 dark:border-gray-400'
                } ${
                  hasNumber && !displayedGrid ? 'font-semibold' : ''
                }`}
                maxLength={2}
                readOnly={displayedGrid}
              />
            ) : (
              // X marking mode
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`h-10 w-full border text-center flex items-center justify-center cursor-pointer select-none
                  ${hasX ? (displayedGrid ? 'bg-blue-200 dark:bg-blue-800' : 'bg-red-200 dark:bg-red-800') : (displayedGrid ? 'bg-green-100 dark:bg-green-600 border-green-600 dark:border-green-300' 
                    : 'border-gray-700 dark:border-gray-400')}
                  ${hasNumber ? 'bg-purple-100 dark:bg-purple-700 font-semibold' : ''}
                  ${displayedGrid ? 'pointer-events-none' : ''}
                `}
                onContextMenu={(e) => handleNurikabeClick(e, rowIndex, colIndex)}
                onClick={(e) => handleNurikabeClick(e, rowIndex, colIndex)}
              >
                <span className="text-sm font-semibold dark:text-gray-200">
                  {hasNumber ? (cell == "0" ? "" : cell || '') : (hasX ? "×" : "")}
                </span>
              </div>
            );
          })
        ))}
      </div>

      {!displayedGrid && !nurikabeEditMode && (
        <div className="flex justify-center gap-4 mt-4 mr-12">
          <button
            onClick={clearNurikabeXs}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow"
          >
            Clear All X's
          </button>
        </div>
      )}

      {displayedGrid && (
        <div className="flex justify-center mt-4 mr-20">
          <button
            onClick={() => setDisplayedGrid(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded shadow"
          >
            Back to Editing
          </button>
        </div>
      )}
    </div>
  );
            case "numberlink":
            return (
    <div className="mt-6 w-full overflow-auto">
      {/* Mode toggle buttons */}
      <div className="flex justify-center gap-4 mb-4 mr-12">
        <button
          onClick={() => setNumberlinkEditMode(false)}
          className={`px-4 py-2 rounded shadow ${
            !numberlinkEditMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          Draw Links
        </button>
        <button
          onClick={() => setNumberlinkEditMode(true)}
          className={`px-4 py-2 rounded shadow ${
            numberlinkEditMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          Edit Numbers
        </button>
      </div>

      <div
        className="mx-auto"
        style={{
          maxWidth: Math.min(gridSize * 50, 800) + 'px'
        }}
      >
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(30px, 40px))`,
          }}
        >
          {displayGrid.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const pathInfo = getCellPathInfo(rowIndex, colIndex);
              const isInCurrentPath = currentPath?.path.some(p => p.row === rowIndex && p.col === colIndex);

              return numberlinkEditMode ? (
                // Edit mode - input fields
                <input
                  key={`${rowIndex}-${colIndex}`}
                  type="text"
                  value={cell == "0" ? "" : cell || ''}
                  onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                  className={`h-10 w-full dark:text-gray-200 border text-center focus:outline-none 
                  focus:ring-0 focus:border-blue-400 dark:focus:outline-none dark:focus:border-blue-500 
                  border-gray-700 dark:border-gray-400`}
                  maxLength={2}
                  readOnly={displayedGrid}
                />
              ) : (
                // Link drawing mode
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`h-10 w-full border border-gray-700 dark:border-gray-400 text-center 
                    flex items-center justify-center cursor-pointer select-none relative
                    ${pathInfo ? 'bg-yellow-100 dark:bg-yellow-800' : 'bg-white dark:bg-gray-800'}
                    ${isInCurrentPath ? 'bg-blue-200 dark:bg-blue-700' : ''}
                    ${displayedGrid ? 'pointer-events-none' : ''}
                    ${grid[rowIndex][colIndex] !== "0" ? 'font-bold bg-gray-100 dark:bg-gray-700' : ''}
                  `}
                  onMouseDown={() => handleNumberlinkMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleNumberlinkMouseEnter(rowIndex, colIndex)}
                  onMouseUp={() => handleNumberlinkMouseUp(rowIndex, colIndex)}
                >
                  <span className="text-sm font-semibold dark:text-gray-200 z-10">
                    {displayGrid[rowIndex][colIndex] !== "0" ?
                      displayGrid[rowIndex][colIndex] :
                      pathInfo ? getLineCharacter(rowIndex, colIndex, pathInfo.path.number) : ''
                    }
                  </span>
                  {pathInfo && displayGrid[rowIndex][colIndex] === "0" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePathForNumber(pathInfo.path.number);
                      }}
                      className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs
                        rounded-bl opacity-70 hover:opacity-100 flex items-center justify-center z-20"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>

      {!displayedGrid && !numberlinkEditMode && (
        <div className="flex justify-center gap-4 mt-4 mr-15">
          <button
            onClick={clearNumberlinkPaths}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow"
          >
            Clear All Paths
          </button>
          {solution && (
            <button
              onClick={loadSolutionPaths}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded shadow"
            >
              Load Solution
            </button>
          )}
        </div>
      )}

      {displayedGrid && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setDisplayedGrid(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded shadow"
          >
            Back to Editing
          </button>
        </div>
      )}
    </div>
    );

            case "shikaku":
              const rectangles = displayShikakuSolution ? shikakuSolution : shikakuRectangles;
              return (
    <div className="mt-6 w-full overflow-auto">
      {/* Mode toggle buttons */}
      <div className="flex justify-center gap-4 mb-4 mr-12">
        <button
          onClick={() => setShikakuEditMode(false)}
          className={`px-4 py-2 rounded shadow ${
            !shikakuEditMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          Draw Rectangles
        </button>
        <button
          onClick={() => setShikakuEditMode(true)}
          className={`px-4 py-2 rounded shadow ${
            shikakuEditMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          Edit Numbers
        </button>
      </div>

      <div
        className="relative mx-auto"
        style={{
          maxWidth: Math.min(gridSize * 50, 800) + 'px'
        }}
        onMouseUp={!shikakuEditMode ? handleShikakuMouseUp : undefined}
        onMouseLeave={!shikakuEditMode ? handleShikakuMouseUp : undefined}
      >
        <div
          className="grid gap-0 relative"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(30px, 40px))`,
          }}
        >
          {displayGrid.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const existingRect = isCellInRectangle(rowIndex, colIndex, rectangles);
              const isInCurrentRect = currentRect &&
                rowIndex >= currentRect.startRow && rowIndex <= currentRect.endRow &&
                colIndex >= currentRect.startCol && colIndex <= currentRect.endCol;

              return shikakuEditMode ? (
                // Edit mode - input fields like other puzzle types
                <input
                  key={`${rowIndex}-${colIndex}`}
                  type="text"
                  value={cell == "0" ? "" : cell || ''}
                  onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                  className={`h-10 w-full dark:text-gray-200 border text-center focus:outline-none 
                  focus:ring-0 focus:border-blue-400 dark:focus:outline-none dark:focus:border-blue-500 
                  border-gray-700 dark:border-gray-400`}
                  maxLength={2}
                  readOnly={displayedGrid}
                />
              ) : (
                // Rectangle drawing mode
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`h-10 w-full border border-gray-700 dark:border-gray-400 text-center 
                    flex items-center justify-center cursor-pointer select-none relative
                    ${existingRect ? 'bg-blue-100 dark:bg-blue-950' : 'bg-white dark:bg-gray-800'}
                    ${isInCurrentRect ? 'bg-blue-300 dark:bg-blue-600' : ''}
                    ${displayedGrid ? 'pointer-events-none' : ''}
                  `}
                  onMouseDown={() => handleShikakuMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleShikakuMouseEnter(rowIndex, colIndex)}
                >
                  <span className='text-sm font-semibold dark:text-gray-200'>
                    {cell == "0" ? "" : cell || ''}
                  </span>
                  {existingRect && rowIndex === existingRect.endRow && colIndex === existingRect.endCol && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRectangle(existingRect.id);
                      }}
                      className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs
                        rounded-bl opacity-70 hover:opacity-100 flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })
          ))}
        </div>

        {/* Rectangle borders overlay - only show in rectangle drawing mode */}
        {!shikakuEditMode && (
          <div className="absolute inset-0 pointer-events-none">
            {rectangles.map(rect => (
              <div
                key={rect.id}
                className="absolute border-2 border-blue-600 dark:border-blue-400"
                style={{
                  left: `${(rect.startCol * (80 / gridSize))}%`,
                  top: `${(rect.startRow * (100 / gridSize))}%`,
                  width: `${((rect.endCol - rect.startCol + 1) * (80 / gridSize))}%`,
                  height: `${((rect.endRow - rect.startRow + 1) * (100 / gridSize))}%`,
                }}
              />
            ))}
            {currentRect && (
              <div
                className="absolute border-2 border-blue-400 dark:border-blue-300 border-dashed"
                style={{
                  left: `${(currentRect.startCol * (80 / gridSize))}%`,
                  top: `${(currentRect.startRow * (100 / gridSize))}%`,
                  width: `${((currentRect.endCol - currentRect.startCol + 1) * (80 / gridSize))}%`,
                  height: `${((currentRect.endRow - currentRect.startRow + 1) * (100 / gridSize))}%`,
                }}
              />
            )}
          </div>
        )}
      </div>

      {!displayedGrid && !shikakuEditMode && (
        <div className="flex justify-center gap-4 mt-4 mr-12">
          <button
            onClick={clearAllRectangles}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow"
          >
            Clear All Rectangles
          </button>
        </div>
      )}

      {displayedGrid && (
        <div className="flex justify-center mt-4 mr-12">
          <button
            onClick={() => displaySolution()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded shadow"
          >
            Back to Editing
          </button>
        </div>
      )}
    </div>
  );
              case "hashiwokakero":
                  return (
    <div className="mt-6 w-full overflow-auto">
      {/* Mode toggle buttons */}
      <div className="flex justify-center gap-4 mb-4 mr-12">
        <button
          onClick={() => setHashiEditMode(false)}
          className={`px-4 py-2 rounded shadow ${
            !hashiEditMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          Draw Bridges
        </button>
        <button
          onClick={() => setHashiEditMode(true)}
          className={`px-4 py-2 rounded shadow ${
            hashiEditMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          Edit Islands
        </button>
      </div>

      <div
        className="relative mx-auto"
        style={{
          maxWidth: Math.min(gridSize * 50, 800) + 'px'
        }}
      >
        <div
          className="grid gap-0 relative"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(30px, 40px))`,
          }}
        >
          {displayGrid.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const isNode = grid[rowIndex][colIndex] !== "0";
              const isSelected = selectedNode && selectedNode.row === rowIndex && selectedNode.col === colIndex;
              const bridgeInfo = getBridgeInfo(rowIndex, colIndex);

              return hashiEditMode ? (
                // Edit mode - input fields for island numbers
                <input
                  key={`${rowIndex}-${colIndex}`}
                  type="text"
                  value={cell == "0" ? "" : cell || ''}
                  onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                  className={`h-10 w-full dark:text-gray-200 border text-center focus:outline-none 
                  focus:ring-0 focus:border-blue-400 dark:focus:outline-none dark:focus:border-blue-500 
                  border-gray-700 dark:border-gray-400`}
                  maxLength={1}
                  readOnly={displayedGrid}
                />
              ) : (
                // Bridge drawing mode
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`h-10 w-full border border-gray-300 dark:border-gray-600 text-center 
                    flex items-center justify-center cursor-pointer select-none relative
                    ${isNode ? 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-500' : 'bg-white dark:bg-gray-800'}
                    ${isSelected ? 'bg-yellow-200 dark:bg-yellow-700' : ''}
                    ${bridgeInfo.isPartOfBridge && !isNode ? 'bg-gray-200 dark:bg-gray-700' : ''}
                    ${displayedGrid ? 'pointer-events-none' : ''}
                  `}
                  onClick={() => handleHashiCellClick(rowIndex, colIndex)}
                >
                  {isNode ? (
                    <span className="text-sm font-bold dark:text-gray-200">
                      {cell}
                    </span>
                  ) : bridgeInfo.isPartOfBridge ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {bridgeInfo.isHorizontal ? (
                        <div className="flex flex-col items-center justify-center w-full">
                          <div className="h-0.5 w-full bg-gray-600 dark:bg-gray-300"></div>
                          {bridgeInfo.bridgeCount === 2 && (
                            <div className="h-0.5 w-full bg-gray-600 dark:bg-gray-300 mt-1"></div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="w-0.5 h-full bg-gray-600 dark:bg-gray-300"></div>
                          {bridgeInfo.bridgeCount === 2 && (
                            <div className="w-0.5 h-full bg-gray-600 dark:bg-gray-300 ml-1"></div>
                          )}
                        </div>
                      )}
                      {/* Delete button for bridges */}
                      {(((rowIndex + 1 < gridSize) && grid[rowIndex + 1][colIndex] !== "O") || ((colIndex + 1 < gridSize) && grid[rowIndex][colIndex + 1] !== "O")) && (<button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBridge(bridgeInfo.bridgeId);
                        }}
                        className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs
                          rounded-bl opacity-50 hover:opacity-100 flex items-center justify-center z-10
                          transition-opacity duration-200"
                      >
                        ×
                      </button>)}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500"></span>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>

      {!displayedGrid && !hashiEditMode && (
        <div className="flex justify-center gap-4 mt-4 mr-12">
          <button
            onClick={clearAllBridges}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow"
          >
            Clear All Bridges
          </button>
        </div>
      )}

      {displayedGrid && (
        <div className="flex justify-center mt-4 mr-12">
          <button
            onClick={() => setDisplayedGrid(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded shadow"
          >
            Back to Editing
          </button>
        </div>
      )}
    </div>
  );

    default:
      return null;

    }


  };


  return (
  <div className="flex min-h-screen bg-gray-100 dark:bg-gray-800">
      {/* Sidebar (Control Panel) */}
      <div className="w-1/4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-lg flex-col">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-200 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Settings size={20} className="mr-2" />
            Settings Panel
          </div>

          <div className="flex items-center">
            <text className="text-gray-800 dark:text-neutral-200">Theme:</text>
            <ThemeToggle />
          </div>
        </h2>

        <div className="my-8">
          <label className="block text-lg font-medium text-gray-700 dark:text-neutral-200 mb-1">
            Puzzle Type
          </label>
          <select
            value={selectedPuzzleType}
            onChange={handlePuzzleTypeChange}
            className="w-full p-2 border bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-400 dark:text-neutral-200 rounded focus:outline-none focus:ring-2 focus:border-red-700"
          >
            {puzzleTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        {selectedPuzzleType != 'sudoku' ? sizeChanger() : <div className="mt-40.5"/>}

        <div className="space-y-3 mt-6">
          <button
            onClick={createEmptyGrid}
            className="w-full flex mb-5 items-center justify-center px-4 py-2 bg-indigo-100 hover:bg-indigo-100 text-indigo-700
            dark:bg-yellow-600 dark:hover:bg-stone-500 dark:text-stone-200 rounded"
          >
            <Grid size={18} className="mr-2" />
            New Empty Grid
          </button>
          <button
            onClick={loadPuzzle}
            className="w-full flex mb-5 items-center justify-center px-4 py-2 bg-emerald-100 hover:bg-emerald-100 text-emerald-700
             dark:bg-green-600 dark:hover:bg-green-500 dark:text-green-200 rounded"
          >
            <Upload size={18} className="mr-2" />
            Load Puzzle
          </button>
          <button
            onClick={savePuzzle}
            className="w-full flex mb-5 items-center justify-center px-4 py-2 bg-blue-100 hover:bg-blue-100 text-blue-700
             dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-blue-200 rounded"
          >
            <Download size={18} className="mr-2" />
            Save Puzzle
          </button>
          <button
            onClick={generateRandomPuzzle}
            className="w-full flex mb-5 items-center justify-center px-4 py-2 bg-purple-100 hover:bg-purple-100 text-purple-700
             dark:bg-pink-600 dark:hover:bg-pink-500 dark:text-pink-200 rounded"
          >
            <Plus size={18} className="mr-2" />
            Generate New Puzzle (May Take Some Time)
          </button>
          <button
            onClick={getPuzzle}
            className="w-full flex mb-5 items-center justify-center px-4 py-2 bg-red-100 hover:bg-red-100 text-red-700
             dark:bg-red-600 dark:hover:bg-red-500 dark:text-red-200 rounded"
          >
            <Plus size={18} className="mr-2" />
            Random Pregenerated Puzzle
          </button>
        </div>
      </div>

      {/* Main Area (Grid) */}
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-20">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-300">
            {puzzleTypes.find(t => t.id === selectedPuzzleType)?.name || 'Puzzle'} ({gridSize}×{gridSize})
          </h2>
          <div className="flex space-x-2">
            <button
                onClick={() => clearSolutions()}
                className={`px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded shadow
                ${!solution ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <>Clear Solution</>
              </button>
            <button
              onClick={displaySolution}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded shadow flex items-center"
              disabled={status === 'solving'}
            >
              {status === 'solving' ? (
                <>Solving...</>
              ) : (
                <>
                  <CheckCircle size={18} className="mr-2" />
                  Display Solution
                </>
              )}
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <HelpCircle size={20}>

                </HelpCircle>
            </button>
          </div>
        </div>

        {renderGrid()}

        {message && (
          <div className={`mt-20 p-3 rounded ${
            status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
            status === 'solved' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
            'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 bg-gray-100 dark:bg-gray-700 rounded p-4">
          <h3 className="font-medium text-gray-800 dark:text-gray-300 mb-2">About {puzzleTypes.find(t => t.id === selectedPuzzleType)?.name}</h3>
          <p className="text-gray-600 dark:text-gray-200 text-sm">
            {selectedPuzzleType === 'numberlink' && 'Connect matching numbers with a continuous path.'}
            {selectedPuzzleType === 'nurikabe' && 'Create islands of white cells surrounded by a continuous wall of black cells.'}
            {selectedPuzzleType === 'shikaku' && 'Divide the grid into rectangular regions, each containing exactly one number.'}
            {selectedPuzzleType === 'sudoku' && 'Fill the grid so that every row, column, and 3×3 box contains digits 1-9.'}
            {selectedPuzzleType === 'futoshiki' && 'Fill the grid with numbers following the inequality constraints.'}
            {selectedPuzzleType === 'hashiwokakero' && 'Connect islands with bridges to form a single connected group.'}
          </p>
        </div>
      </div>
    </div>
  );
}