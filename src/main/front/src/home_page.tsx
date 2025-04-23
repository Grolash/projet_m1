import {ChangeEvent, useState} from "react";
import { Save, Upload, Play, RefreshCw, Check, Grid } from "lucide-react";

export default function HomePage() {
  const [puzzleType, setPuzzleType] = useState("sudoku");
  const [gridSize, setGridSize] = useState(5);
  const [showGrid, setShowGrid] = useState(false);
  
  // Handle grid size changes
  const handleSizeChange = (e : ChangeEvent) => {
    const value = parseInt(e.target.valueOf().toString());
    if (!isNaN(value) && value >= 5 && value <= 20) {
      setGridSize(value);
    }
  };
  
  const incrementSize = () => {
    if (gridSize < 20) setGridSize(gridSize + 1);
  };
  
  const decrementSize = () => {
    if (gridSize > 5) setGridSize(gridSize - 1);
  };
  
  // Display empty grid
  const displayEmptyGrid = () => {
    setShowGrid(true);
  };
  
  // Placeholder for future functionality buttons
  const notImplemented = () => {
    alert("This feature is not yet implemented");
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white p-6 shadow-md flex flex-col">
        <h1 className="text-2xl font-bold mb-6 text-indigo-700">Puzzle Solver</h1>
        
        {/* Puzzle Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Puzzle Type
          </label>
          <select
            value={puzzleType}
            onChange={(e) => setPuzzleType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="sudoku">Sudoku</option>
            <option value="kakuro">Kakuro</option>
            <option value="nonogram">Nonogram</option>
            <option value="crossword">Crossword</option>
          </select>
        </div>
        
        {/* Grid Size Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grid Size
          </label>
          <div className="flex items-center">
            <button
              onClick={decrementSize}
              className="px-3 py-2 bg-gray-200 rounded-l-md hover:bg-gray-300"
            >
              -
            </button>
            <input
              type="number"
              min="5"
              max="20"
              value={gridSize}
              onChange={handleSizeChange}
              className="w-full p-2 text-center border-t border-b border-gray-300"
            />
            <button
              onClick={incrementSize}
              className="px-3 py-2 bg-gray-200 rounded-r-md hover:bg-gray-300"
            >
              +
            </button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <button
          onClick={displayEmptyGrid}
          className="flex items-center justify-center mb-3 w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
        >
          <Grid className="mr-2 h-4 w-4" />
          Display Empty Grid
        </button>
        
        <button
          onClick={notImplemented}
          className="flex items-center justify-center mb-3 w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700"
        >
          <Play className="mr-2 h-4 w-4" />
          Load Random Puzzle
        </button>
        
        <button
          onClick={notImplemented}
          className="flex items-center justify-center mb-3 w-full bg-green-600 text-white p-2 rounded-md hover:bg-green-700"
        >
          <Check className="mr-2 h-4 w-4" />
          Solve Current Grid
        </button>
        
        <button
          onClick={notImplemented}
          className="flex items-center justify-center mb-3 w-full bg-amber-600 text-white p-2 rounded-md hover:bg-amber-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Current Grid
        </button>
        
        <button
          onClick={notImplemented}
          className="flex items-center justify-center mb-3 w-full bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700"
        >
          <Upload className="mr-2 h-4 w-4" />
          Load Grid From File
        </button>
        
        <button
          onClick={notImplemented}
          className="flex items-center justify-center mb-3 w-full bg-teal-600 text-white p-2 rounded-md hover:bg-teal-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate New Puzzle
        </button>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 p-8 flex items-center justify-center">
        {showGrid ? (
          <div 
            className="grid bg-white shadow-lg p-1"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
              gap: '1px',
              width: `${Math.min(600, gridSize * 40)}px`,
              height: `${Math.min(600, gridSize * 40)}px`
            }}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, index) => (
              <div 
                key={index} 
                className="bg-gray-50 border border-gray-200 flex items-center justify-center"
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <Grid className="mx-auto h-16 w-16 mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold">No Puzzle Grid Displayed</h2>
            <p>Select puzzle type and size, then click "Display Empty Grid"</p>
          </div>
        )}
      </div>
    </div>
  );
}
