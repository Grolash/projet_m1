// main/front/src/pages/HomePage.tsx
import { useState, useRef, useEffect } from "react";
import { Save, Upload, Play, Grid, Plus, Loader } from "lucide-react";

// Pyodide type declarations
declare global {
  interface Window {
    loadPyodide: (options: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

interface PyodideInterface {
  loadPackage: (packages: string[]) => Promise<void>;
  runPythonAsync: (code: string) => Promise<any>;
}

type PuzzleType = 'sudoku' | 'futoshiki' | 'shikaku' | 'nurikabe' | 'numberlink' | 'hashiwokakero';

export default function HomePage() {
  const [puzzleType, setPuzzleType] = useState<PuzzleType>('sudoku');
  const [gridSize, setGridSize] = useState(9);
  const [gridData, setGridData] = useState<number[][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Pyodide
  useEffect(() => {
    const initPyodide = async () => {
      try {
        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
        });
        await pyodideInstance.loadPackage(['micropip']);
        setPyodide(pyodideInstance);
      } catch (error) {
        console.error('Pyodide initialization failed:', error);
        alert('Failed to initialize Python runtime');
      }
    };

    initPyodide().catch(error => {
      console.error('Pyodide initialization error:', error);
    });
  }, []);

  // Generate empty grid based on puzzle type
  const generateEmptyGrid = () => {
    const emptyGrid = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => 0)
    );
    setGridData(emptyGrid);
  };

  // Handle grid size changes
  const handleSizeChange = (value: number) => {
    if (value >= 5 && value <= 20) {
      setGridSize(value);
      generateEmptyGrid();
    }
  };

  // File handling
  // Add safety checks for file input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const data = JSON.parse(content);

      if (!Array.isArray(data) || !data.every(Array.isArray)) {
        throw new Error('Invalid puzzle format');
      }

      setGridData(data);
      setGridSize(data.length);
    } catch (error) {
      console.error('File load error:', error);
      alert('Invalid puzzle file format');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

   // File handling with proper type safety
  const savePuzzle = async () => {
    if (!('showSaveFilePicker' in window)) {
      alert('File System Access API not supported in this browser');
      return;
    }

    try {
      const blob = new Blob([JSON.stringify(gridData)], { type: 'application/json' });
      const handle = await window.showSaveFilePicker({
        suggestedName: `${puzzleType}_puzzle.json`,
        types: [{
          description: 'Puzzle Files',
          accept: { 'application/json': ['.json'] },
        }],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (error) {
      console.error('File save error:', error);
      if ((error as Error).name !== 'AbortError') {
        alert('Failed to save file');
      }
    }
  };

  // Updated grid input handler with null checks
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const numericValue = Math.min(gridSize, Math.max(0, parseInt(value) || 0));

    setGridData(prev => {
      const newGrid = [...prev];
      newGrid[rowIndex] = [...prev[rowIndex]];
      newGrid[rowIndex][colIndex] = numericValue;
      return newGrid;
    });
  };


  // Puzzle solving with Pyodide
  const solvePuzzle = async () => {
    if (!pyodide) {
      alert('Python runtime not loaded yet');
      return;
    }

    setIsProcessing(true);
    try {
      // Load Python solvers
      await pyodide.runPythonAsync(`
        from js import window
        import sys
        sys.path.append('/main/back/')
      `);

      // Convert grid data to Python format
      const solverName = puzzleType.charAt(0).toUpperCase() + puzzleType.slice(1);
      const pythonCode = `
        from ${puzzleType} import ${solverName}
        import json
        
        grid_data = json.loads('${JSON.stringify(gridData)}')
        solver = ${solverName}(grid_data)
        solution = solver.solve()
        str(solution) if solution else None
      `;

      const result = await pyodide.runPythonAsync(pythonCode);
      if (result) {
        // Handle solution display
        console.log('Solution:', result);
        alert('Solution found! Check console for details');
      } else {
        alert('No solution found');
      }
    } catch (error) {
      console.error('Solving error:', error);
      alert('Error solving puzzle');
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Control Panel */}
      <div className="w-80 bg-white shadow-lg p-6 flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-indigo-600 mb-4">Puzzle Solver</h1>

        <div className="space-y-6">
          {/* Puzzle Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puzzle Type
            </label>
            <select
              value={puzzleType}
              onChange={(e) => setPuzzleType(e.target.value as PuzzleType)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="sudoku">Sudoku</option>
              <option value="futoshiki">Futoshiki</option>
              <option value="shikaku">Shikaku</option>
              <option value="nurikabe">Nurikabe</option>
              <option value="numberlink">Numberlink</option>
              <option value="hashiwokakero">Hashiwokakero</option>
            </select>
          </div>

          {/* Grid Size Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grid Size ({gridSize}x{gridSize})
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSizeChange(gridSize - 1)}
                disabled={gridSize <= 5}
                className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                -
              </button>
              <input
                type="number"
                min="5"
                max="20"
                value={gridSize}
                onChange={(e) => handleSizeChange(Number(e.target.value))}
                className="w-20 p-2 text-center border rounded-md"
              />
              <button
                onClick={() => handleSizeChange(gridSize + 1)}
                disabled={gridSize >= 20}
                className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={generateEmptyGrid}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700"
            >
              <Grid className="h-5 w-5" />
              New Empty Grid
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white p-2 rounded-md hover:bg-green-700"
            >
              <Upload className="h-5 w-5" />
              Load Puzzle
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".json"
              />
            </button>

            <button
              onClick={savePuzzle}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
            >
              <Save className="h-5 w-5" />
              Save Puzzle
            </button>

            <button
              onClick={solvePuzzle}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              Solve Puzzle
            </button>
          </div>
        </div>
      </div>

      {/* Grid Display */}
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {gridData.length > 0 ? (
            <div className="grid gap-px bg-gray-200">
              {gridData.map((row, i) => (
                <div key={i} className="flex gap-px">
                  {row.map((cell, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="w-12 h-12 bg-white flex items-center justify-center text-xl font-medium hover:bg-gray-50 focus-within:bg-blue-50"
                    >
                      <input
                        type="number"
                        min="0"
                        max={gridSize}
                        value={cell || ''}
                        onChange={(e) => {
                          const newGrid = [...gridData];
                          newGrid[i][j] = Number(e.target.value) || 0;
                          setGridData(newGrid);
                        }}
                        className="w-full h-full text-center focus:outline-none bg-transparent"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 space-y-4">
              <Grid className="h-16 w-16 mx-auto" />
              <p className="text-xl font-medium">No grid displayed</p>
              <p>Create a new grid or load an existing puzzle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}