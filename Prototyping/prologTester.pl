:- consult('sudoku').

sudokuExample(1, [[_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,3,_,8,5],
            [_,_,1,_,2,_,_,_,_],
            [_,_,_,5,_,7,_,_,_],
            [_,_,4,_,_,_,1,_,_],
            [_,9,_,_,_,_,_,_,_],
            [5,_,_,_,_,_,_,7,3],
            [_,_,2,_,1,_,_,_,_],
            [_,_,_,_,4,_,_,_,9]]).


sudokuExample(2, [[5, _, 4, 6, 7, 8, _, 1, 2],
            [6, _, 2, 1, _, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, _, 1, 4, 2, 3],
            [4, _, 6, 8, 5, 3, 7, 9, _],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, _, 5, 2, _, 6, _, 7, 9]]).

sudokuExample(3, [[_, _, 3, _, 2, _, 6, _, _],
            [9, _, _, 3, _, 5, _, _, 1],
            [_, _, 1, 8, _, 6, 4, _, _],
            [_, _, 8, 1, _, 2, 9, _, _],
            [7, _, _, _, _, _, _, _, 8],
            [_, _, 6, 7, _, 8, 2, _, _],
            [_, _, 2, 6, _, 9, 5, _, _],
            [8, _, _, 2, _, 3, _, _, 9],
            [_, _, 5, _, 1, _, 3, _, _]]).

sudokuExample(4, [[4, 8, 3, 9, 2, 1, 6, 5, 7],
                  [9, 6, 7, 3, 4, 5, 8, 2, 1],
                  [2, 5, 1, 8, 7, 6, 4, 9, 3],
                  [5, 4, 8, 1, 3, 2, 9, 7, 6],
                  [7, 2, 9, 5, 6, 4, 1, 3, 8],
                  [1, 3, 6, 7, 9, 8, 2, 4, 5],
                  [3, 7, 2, 6, 8, 9, 5, 1, 4],
                  [8, 1, 4, 2, 5, 3, 7, 6, 9],
                  [6, 9, 5, 4, 1, 7, 3, 8, 2]]).

sudokuExample(5, [[4, 4, 3, 9, 2, 1, 6, 5, 7],
                  [9, 6, 7, 3, 4, 5, 8, 2, 1],
                  [2, 5, 1, 8, 7, 6, 4, 9, 3],
                  [5, 4, 8, 1, 3, 2, 9, 7, 6],
                  [7, 2, 9, 5, 6, 4, 1, 3, 8],
                  [1, 3, 6, 7, 9, 8, 2, 4, 5],
                  [3, 7, 2, 6, 8, 9, 5, 1, 4],
                  [8, 1, 4, 2, 5, 3, 7, 6, 9],
                  [6, 9, 5, 4, 1, 7, 3, 8, 2]]).


?- sudokuExample(1, Rows), sudoku(Rows), maplist(portray_clause, Rows).
?- nl.
?- sudokuExample(2, Rows), sudoku(Rows), maplist(portray_clause, Rows).
?- nl.
?- sudokuExample(3, Rows), sudoku(Rows), maplist(portray_clause, Rows).
?- nl.
?- (sudokuExample(4, Rows), sudoku(Rows) -> writeln(true) ; writeln(false)).
?- nl.
?- (sudokuExample(5, Rows), sudoku(Rows) -> writeln(true) ; writeln(false)).