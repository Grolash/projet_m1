:- use_module(library(clpfd)).

sudoku(Rows) :-
        length(Rows, 9), maplist(same_length(Rows), Rows),
        append(Rows, Vs), Vs ins 1..9,
        maplist(all_distinct, Rows),
        transpose(Rows, Columns),
        maplist(all_distinct, Columns),
        Rows = [As,Bs,Cs,Ds,Es,Fs,Gs,Hs,Is],
        blocks(As, Bs, Cs),
        blocks(Ds, Es, Fs),
        blocks(Gs, Hs, Is).

blocks([], [], []).
blocks([N1,N2,N3|Ns1], [N4,N5,N6|Ns2], [N7,N8,N9|Ns3]) :-
        all_distinct([N1,N2,N3,N4,N5,N6,N7,N8,N9]),
        blocks(Ns1, Ns2, Ns3).

problem(1, [[_,_,_,_,_,_,_,_,_],
            [_,_,_,_,_,3,_,8,5],
            [_,_,1,_,2,_,_,_,_],
            [_,_,_,5,_,7,_,_,_],
            [_,_,4,_,_,_,1,_,_],
            [_,9,_,_,_,_,_,_,_],
            [5,_,_,_,_,_,_,7,3],
            [_,_,2,_,1,_,_,_,_],
            [_,_,_,_,4,_,_,_,9]]).


problem(2, [[5, _, 4, 6, 7, 8, _, 1, 2],
            [6, _, 2, 1, _, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, _, 1, 4, 2, 3],
            [4, _, 6, 8, 5, 3, 7, 9, _],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, _, 5, 2, _, 6, _, 7, 9]]).

problem(3, [[_, _, 3, _, 2, _, 6, _, _],
            [9, _, _, 3, _, 5, _, _, 1],
            [_, _, 1, 8, _, 6, 4, _, _],
            [_, _, 8, 1, _, 2, 9, _, _],
            [7, _, _, _, _, _, _, _, 8],
            [_, _, 6, 7, _, 8, 2, _, _],
            [_, _, 2, 6, _, 9, 5, _, _],
            [8, _, _, 2, _, 3, _, _, 9],
            [_, _, 5, _, 1, _, 3, _, _]]).


?- problem(1, Rows), sudoku(Rows), maplist(portray_clause, Rows).
?- nl.
?- problem(2, Rows), sudoku(Rows), maplist(portray_clause, Rows).
?- nl.
?- problem(3, Rows), sudoku(Rows), maplist(portray_clause, Rows).
