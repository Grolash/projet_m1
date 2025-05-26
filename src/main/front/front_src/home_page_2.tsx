import {useState, useEffect, ChangeEvent} from 'react';
import { Download, Upload, Plus, Grid, Settings, HelpCircle, CheckCircle, SunIcon, MoonIcon } from 'lucide-react';
import { useTheme } from './themeContext';
import {Switch} from '@heroui/react';
import { solvePuzzleService, validatePuzzle, generateEmptyGrid, generatePuzzle } from './utils/puzzleService';

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
  };

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
        grid: grid
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
              setSolution(null);
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
      const puzzleConfig = await generatePuzzle(selectedPuzzleType, gridSize);
      setDisplayedGrid(false)
      setGrid(puzzleConfig);
      setSolution(null);
      setMessage('Random puzzle generated');
    } catch (error : any) {
      setMessage(`Error generating puzzle: ${error.message}`);
    }
  };

  const displaySolution = () => {
    if (solution) {
        setDisplayedGrid(!displayedGrid);
    } else {
      solvePuzzle().then(r => setDisplayedGrid(!displayedGrid))
    }
  }

  const solvePuzzle = async () => {
    setStatus('solving');
    setMessage('Solving puzzle...');

    try {
      const puzzleConfig = {
        type: selectedPuzzleType,
        size: gridSize,
        grid: grid
      };

      if (!validatePuzzle(puzzleConfig)) {
        setStatus('error');
        setMessage('Invalid puzzle configuration');
        return;
      }

      const solvedGrid = await solvePuzzleService(puzzleConfig);
      setSolution(solvedGrid);
      setStatus('solved');
      setMessage('Puzzle solved successfully!');
    } catch (error : any) {
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

  // Render the grid based on puzzle type
  const renderGrid = () => {
    const displayGrid = displayedGrid ? solution || grid : grid;

    switch (selectedPuzzleType) {
      case "sudoku":
        case "futoshiki":
        case "nurikabe":
          case "numberlink":
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
                  displayedGrid ? 'bg-green-100 dark:bg-green-600 border-green-600 dark:border-green-300'  
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
            case "shikaku":
              // Render Shikaku grid, which is similar to Sudoku but there there is a constraint cell between each vue cell




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