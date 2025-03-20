:- use_module(library(clpfd)).

puzzle(Rows, Size, Celldomain) :-
    length(Rows, Size),
    maplist(same_length(Rows), Rows),
    append(Rows, Vs), Vs ins 1..Celldomain.