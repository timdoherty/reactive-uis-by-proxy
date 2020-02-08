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

export class ComponentGraph {
  // defining vertex array and
  // adjacent list
  constructor(rootComponent) {
    // this.noOfVertices = noOfVertices;
    this.adjacencyList = new Map();
    this._build(rootComponent);
  }

  get vertices() {
    return this.adjacencyList;
  }

  _build(comp) {
    this.addVertex(comp);
    if (!comp.dependencies) {
      return;
    }
    let index = 0;
    const len = comp.dependencies.length;
    let dep;
    for (index; index < len; index++) {
      dep = comp.dependencies[index];
      this.addVertex(dep);
      this.addEdge(comp, dep);
      this._build(dep);
    }
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

  /**
   * implements Kahn's Algorthim
   **/
  sort() {
    const vertices = new Map(this.vertices);

    // list of nodes with no incoming edges
    const noIncomingEdges = [...vertices.keys()].filter(
      key => ![...vertices.values()].flat().find(value => value === key)
    );

    const topologicallySortedList = [];

    while (noIncomingEdges.length) {
      const currentNode = noIncomingEdges.shift();
      topologicallySortedList.push(currentNode);

      // for each node m with an edge e from currentNode to m do
      const edges = [...vertices.get(currentNode)];
      for (let i = 0; i < edges.length; i++) {
        // remove edge e from the graph
        vertices
          .get(currentNode)
          .splice(vertices.get(currentNode).indexOf(edges[i]), 1);

        // if edge has no other incoming edges then insert edge into noIncomingEdges
        if (![...vertices.values()].flat().find(value => value === edges[i])) {
          noIncomingEdges.push(edges[i]);
        }
      }
    }

    // if graph has edges then
    if ([...vertices.values()].flat().length > 0) {
      throw new Error("Cyclical graph");
    }

    return topologicallySortedList;
  }

  evaluate() {
    // naive invocation of sorted functions in dependency order
    const sorted = this.sort().reverse();
    for (let fn of sorted.values()) {
      fn();
    }
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
