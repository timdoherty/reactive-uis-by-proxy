export class Component {
  constructor() {
    this._dependencies = [];
  }

  addDependency(dep) {
    this._dependencies.push(dep);
  }

  _renderDependencies(renderedHtml) {
    function componentReducer(html, component) {
      let componentPatten = `<${component.constructor.name}(.*?)(\/>|>.*<\/${
        component.constructor.name
      }>)`;
      let re = new RegExp(componentPatten, "gi");
      html = html.replace(re, component.html());
      return html;
    }
    const finalHtml = this._dependencies.reduce(componentReducer, renderedHtml);
    return finalHtml;
  }

  html() {
    return "";
  }

  render() {
    let html = this.html();
    html = this._renderDependencies(html);
    return html;
  }

  get dependencies() {
    return this._dependencies;
  }
}

export class ComponentGraph {
  constructor(rootComponent) {
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
    const len = comp.dependencies.length;
    for (let index = 0; index < len; index++) {
      const depInstance = comp.dependencies[index];
      this.addVertex(depInstance);
      this.addEdge(comp, depInstance);
      this._build(depInstance);
    }
  }

  addVertex(v) {
    this.adjacencyList.set(v, []);
  }

  addEdge(v, w) {
    this.adjacencyList.get(v).push(w);
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
    for (let comp of sorted.values()) {
      comp.render();
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

export class ProxyApp {
  constructor(rootNode, initialState = {}) {
    this.graph = new ComponentGraph(rootNode);
    this.sort();
    // this.evaluate();
    const evaluate = this.evaluate.bind(this);
    const handler = {
      set(target, property, value, receiver) {
        evaluate();
        return Reflect.set(...arguments);
      }
    };
    this._store = new Proxy(initialState, handler);
  }

  get store() {
    return this._store;
  }

  sort() {
    this.graph.sort();
  }

  evaluate() {
    this.graph.evaluate();
  }

  render() {
    // evaluate the dependency graph and render into the DOM
    this.evaluate();
  }
}
