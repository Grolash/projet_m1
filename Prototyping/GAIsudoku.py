from constraint import *
from graph import *

rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"]

def get_row(i):
    k = i // 9
    return rows[k]

def get_col(i):
    return (i % 9) + 1

def get_square(i):
    letter = "S"
    if get_row(i) > "C":
        letter = "T"
    if get_row(i) > "F":
        letter = "U"

    if get_col(i) <= 3:
        return letter + str(1)
    if get_col(i) <= 6:
        return letter + str(2)
    else:
        return letter + str(3)

def make_constraint_graph():
    graph = Graph(81)

    for i in range(graph.n):
        for j in range(i+1, graph.n):
            # on a déjà fait les liens entre l'actuel et les précédents
            if get_row(i) == get_row(j):
                graph.add_edge(i, j)
            if get_col(i) == get_col(j):
                graph.add_edge(i, j)
            if get_square(i) == get_square(j):
                graph.add_edge(i, j)
    return graph

graph = make_constraint_graph()
v_vals = {}
for i in range(g.n):
    v_vals[i] = list(range(1, 10))
with open(sys.argv[1]) as file:
    i = 0
    for line in file:
        for word in line.split():
            number = int(word.strip())
            if int(number) != 0:
                v_vals[i] = [number]
            i += 1


if __name__ == '__main__':
    """
        Load a .col file and display graph
    """
    import sys
    file = open(file=sys.argv[1])