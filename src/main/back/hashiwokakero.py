from ortools.sat.python import cp_model
from src.main.back.puzzle import Puzzle


class Hashiwokakero(Puzzle):
    def __init__(self, rows):
        super().__init__(len(rows[0]), rows)
        try:
            assert len(self.grid) == self.n * self.n
        except AssertionError as e:
            raise e
        self.model = cp_model.CpModel()
        self.nodes = []
        self.nodes_dict = {}
        for i in range(len(self.grid)):
            if self.grid[i] != 0:
                self.nodes.append(self.Node(i, self.grid[i], self))
                self.nodes_dict[i] = self.nodes[-1]

    class Node:
        def __init__(self, pos, value, neighbors=None):
            self.index = pos
            self.value = value
            self.neighbors = []  # First node encountered for each orthogonal direction
            self.edges = {}  # Edges to the neighbors

        def set_neighbors(self, hashiwokakero):
            # Set the neighbors for each direction
            if self.value == 0:
                return []
            r = self.index // hashiwokakero.n
            c = self.index % hashiwokakero.n
            if r > 0:
                for i in range(r - 1, -1, -1):
                    if hashiwokakero.grid[i * hashiwokakero.n + c] != 0:
                        index = i * hashiwokakero.n + c
                        self.neighbors.append(hashiwokakero.nodes_dict[index])
                        break
            if r < hashiwokakero.n - 1:
                for i in range(r + 1, hashiwokakero.n):
                    if hashiwokakero.grid[i * hashiwokakero.n + c] != 0:
                        index = i * hashiwokakero.n + c
                        self.neighbors.append(hashiwokakero.nodes_dict[index])
                        break
            if c > 0:
                for i in range(c - 1, -1, -1):
                    if hashiwokakero.grid[r * hashiwokakero.n + i] != 0:
                        index = r * hashiwokakero.n + i
                        self.neighbors.append(hashiwokakero.nodes_dict[index])
                        break
            if c < hashiwokakero.n - 1:
                for i in range(c + 1, hashiwokakero.n):
                    if hashiwokakero.grid[r * hashiwokakero.n + i] != 0:
                        index = r * hashiwokakero.n + i
                        self.neighbors.append(hashiwokakero.nodes_dict[index])
                        break

    def constraints(self):
        visited = set()
        reach = {}
        for node in self.nodes:
            visited.add(node.index)
            node.set_neighbors(self)
            # Set the number of neighbors for each node
            for neighbor in node.neighbors:
                if neighbor.index not in visited:  # we don't want to add the same edge twice
                    node.edges[neighbor.index] = self.model.new_int_var(0, 2, f'edge_{node.index}_{neighbor.index}')
                    neighbor.edges[node.index] = node.edges[neighbor.index]
                    # for each neighbor, the number of edges can be at most 2
                    # if there is and edge between the node and its neighbor,
                    # there is and edge between the neighbor and the node;
                    # they are equal in value (null, simple or double)
            node_edges = [node.edges[neighbor.index] for neighbor in node.neighbors]
            self.model.add(sum(node_edges) == node.value)
            # The sum of the number of edges for each node must be equal to the value of the node
            reach[node.index] = self.model.new_int_var(0, len(self.nodes), f'reach_{node.index}')
            if node == self.nodes[0]:
                self.model.add(reach[node.index] == 0)
            else:
                self.model.add(reach[node.index] > 0)

        # then we enforce the constraint that edges cannot intersect
        # i.e. if there is an edge existing (perpendicular) somewhere between the node and its neighbor
        # then you cannot draw an edge between them.
        # we don't need to check all nodes, only the half of the grid that is in the same direction
        # should be a reasonable amount of computation
        # we first need every edge variable to be established however
        # this is why this is done after the previous loop
        visited = set()
        for node in self.nodes:
            visited.add(node.index)
            neighbor_conditions = []
            for neighbor in node.neighbors:
                if node != self.nodes[0]:
                    smaller_reach = self.model.new_bool_var(f'smaller_reach_{node.index}_{neighbor.index}')
                    self.model.add(reach[node.index] == reach[neighbor.index] + 1).OnlyEnforceIf(smaller_reach)
                    self.model.add(reach[node.index] != reach[neighbor.index] + 1).OnlyEnforceIf(smaller_reach.Not())
                    neighbor_conditions.append(smaller_reach)

                if neighbor not in visited:
                    intersecting_edges = []
                    if node.index < neighbor.index:  # if the node is above the neighbor
                        # check all the rows between the node and the neighbor
                        for other_node in self.nodes:
                            if node.index // self.n < other_node.index // self.n < neighbor.index // self.n:
                                other_neighbors = other_node.neighbors
                                onc = other_node.index % self.n  # other node column
                                for other_neighbor in other_neighbors:
                                    if other_neighbor.index // self.n == other_node.index // self.n:  # horizontal neighbors
                                        onbc = other_neighbor.index % self.n  # other neighbor column
                                        if onc < node.index % self.n < onbc or onc < neighbor.index % self.n < onbc:
                                            # if the other node and its neighbors are left and right of the node
                                            # (or right and left of it)
                                            # then there is a possibility of intersection
                                            intersecting_edges.append(other_node.edges[other_neighbor.index])
                    elif node.index > neighbor.index:  # if the node is below the neighbor
                        # check all the rows between the node and the neighbor
                        for other_node in self.nodes:
                            if neighbor.index // self.n < other_node.index // self.n < node.index // self.n:
                                other_neighbors = other_node.neighbors
                                onc = other_node.index % self.n
                                for other_neighbor in other_neighbors:
                                    if other_neighbor.index // self.n == other_node.index // self.n:
                                        onbc = other_neighbor.index % self.n
                                        if onc < node.index % self.n < onbc or onc < neighbor.index % self.n < onbc:
                                            intersecting_edges.append(other_node.edges[other_neighbor.index])
                    elif node.index % self.n < neighbor.index % self.n:  # if the node is left of the neighbor
                        # check all the columns between the node and the neighbor
                        for other_node in self.nodes:
                            if node.index % self.n < other_node.index % self.n < neighbor.index % self.n:
                                other_neighbors = other_node.neighbors
                                onr = other_node.index // self.n
                                for other_neighbor in other_neighbors:
                                    if other_neighbor.index // self.n == other_node.index // self.n:
                                        onbr = other_neighbor.index // self.n
                                        if onr < node.index // self.n < onbr or onr < neighbor.index // self.n < onbr:
                                            intersecting_edges.append(other_node.edges[other_neighbor.index])
                    elif node.index % self.n > neighbor.index % self.n:  # if the node is right of the neighbor
                        # check all the columns between the node and the neighbor
                        for other_node in self.nodes:
                            if neighbor.index % self.n < other_node.index % self.n < node.index % self.n:
                                other_neighbors = other_node.neighbors
                                onr = other_node.index // self.n
                                for other_neighbor in other_neighbors:
                                    if other_neighbor.index // self.n == other_node.index // self.n:
                                        onbr = other_neighbor.index // self.n
                                        if onr < node.index // self.n < onbr or onr < neighbor.index // self.n < onbr:
                                            intersecting_edges.append(other_node.edges[other_neighbor.index])
                    # we now have all the intersecting edges
                    intedge = self.model.new_bool_var(f'intedge_{node.index}_{neighbor.index}')
                    self.model.add(sum(intersecting_edges) != 0).OnlyEnforceIf(intedge)
                    self.model.add(sum(intersecting_edges) == 0).OnlyEnforceIf(intedge.Not())
                    self.model.add(node.edges[neighbor.index] == 0).OnlyEnforceIf(intedge)
                    self.model.add(neighbor.edges[node.index] == 0).OnlyEnforceIf(intedge)
                    # this above means:
                    # either there are edges perpendicular to the potential edge between the node and the neighbor
                    # and the edge between them is null
                    # or there are no edges perpendicular to the potential edge between the node and the neighbor
                    # and the edge between them can be drawn if needed
            if node != self.nodes[0]:
                self.model.AddAtLeastOne(neighbor_conditions)

    def solve(self):
        self.constraints()
        solver = cp_model.CpSolver()
        status = solver.Solve(self.model)
        if status == cp_model.OPTIMAL:
            # return all the nodes
            # and their edges
            # and their neighbors
            # and their values
            nodes_info = {}
            for node in self.nodes:
                nodes_info[node.index] = {
                    'value': node.value,
                    'edges': {neighbor.index: solver.Value(node.edges[neighbor.index]) for neighbor in node.neighbors},
                    'neighbors': [neighbor.index for neighbor in node.neighbors],
                }
            return nodes_info
        else:
            return None

    def print(self):
        result = self.solve()
        if result:
            print("Solution found:")
            # print the grid, replacing empty cells with links where needed
            # link represented by - if horizontal and single, = if horizontal and double
            # | if vertical and single, || if vertical and double
            grid_result = [['  ' for _ in range(self.n)] for _ in range(self.n)]

            for node_index, node_info in result.items():
                r = node_index // self.n
                c = node_index % self.n
                grid_result[r][c] = str(node_info['value']) + ' '
                for neighbor_index, edge_value in node_info['edges'].items():
                    if edge_value != 0:
                        nr = neighbor_index // self.n
                        nc = neighbor_index % self.n
                        if r == nr:
                            start_col = min(c, nc)
                            end_col = max(c, nc)
                            for col in range(start_col + 1, end_col):
                                if edge_value == 1:
                                    grid_result[r][col] = '- '
                                elif edge_value == 2:
                                    grid_result[r][col] = '= '
                        elif c == nc:
                            start_row = min(r, nr)
                            end_row = max(r, nr)
                            for row in range(start_row + 1, end_row):
                                if edge_value == 1:
                                    grid_result[row][c] = '│ '
                                elif edge_value == 2:
                                    grid_result[row][c] = '││'
            for row in grid_result:
                print(" ".join(row))
        else:
            print("No solution found")


if __name__ == '__main__':
    # Example grid for Hashiwokakero
    grid = [
        [4, 0, 3, 0, 3, 0, 3],
        [0, 2, 0, 0, 0, 4, 0],
        [3, 0, 0, 3, 0, 0, 3],
        [0, 0, 0, 0, 0, 0, 0],
        [2, 0, 0, 8, 0, 4, 0],
        [0, 0, 0, 0, 1, 0, 3],
        [0, 1, 0, 4, 0, 1, 0],
    ]
    hashiwokakero = Hashiwokakero(grid)
    hashiwokakero.print()
