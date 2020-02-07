export function TheComponent(props) {
  return `<div>
            ${props.foo || ""}
            ${props.children({ bar: props.bar })}
          </div>`;
}

export class Component {
  constructor() {
    this._dependencies = [];
  }

  static addDependency(dep) {
    this._dependencies.push(dep);
  }

  static get dependencies() {
    return this._dependencies;
  }
}

export class Graph {
  // defining vertex array and
  // adjacent list
  constructor(noOfVertices) {
    this.noOfVertices = noOfVertices;
    this.adjacencyList = new Map();
  }

  get vertices() {
    return this.adjacencyList;
  }

  // functions to be implemented
  addVertex(v) {
    // initialize the adjacent list with a
    // null array
    this.adjacencyList.set(v, []);
  }

  addEdge(v, w) {
    // get the list for vertex v and put the
    // vertex w denoting edge between v and w
    this.adjacencyList.get(v).push(w);

    // Since graph is undirected,
    // add an edge from w to v also
    // this.adjacencyList.get(w).push(v);
  }

  printGraph() {
    // get all the vertices
    var get_keys = this.adjacencyList.keys();

    // iterate over the vertices
    for (var i of get_keys) {
      // great the corresponding adjacency list
      // for the vertex
      var get_values = this.adjacencyList.get(i);
      var conc = "";

      // iterate over the adjacency list
      // concatenate the values into a string
      for (var j of get_values) conc += j + " ";

      // print the vertex and its adjacency list
      console.log(i + " -> " + conc);
    }
  }
  // bfs(v)
}
