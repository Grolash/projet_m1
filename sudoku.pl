:- use_module(library(clpfd)).
:- consult('puzzle').

sudoku(Rows):-
    puzzle(Rows, 9, 9),
    maplist(all_distinct, Rows),
    transpose(Rows, Columns),
    maplist(all_distinct, Columns),
    Rows = [A,B,C,D,E,F,G,H,I],
    squares(A, B, C),
    squares(D, E, F),
    squares(G, H, I).

squares([], [], []).
squares([N1,N2,N3|Ns1], [N4,N5,N6|Ns2], [N7,N8,N9|Ns3]) :-
        all_distinct([N1,N2,N3,N4,N5,N6,N7,N8,N9]),
        squares(Ns1, Ns2, Ns3).