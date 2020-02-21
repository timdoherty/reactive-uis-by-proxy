export class Component {
  constructor() {
    this._dependencies = [];
    this._events = [];
  }

  addDependency(dep) {
    this._dependencies.push(dep);
  }

  _renderDependencies(fragment) {
    for (let dep of this._dependencies) {
      const element = dep.constructor.name;
      for (let selectedElement of fragment.querySelectorAll(element)) {
        selectedElement.parentNode.insertBefore(dep.rendered, selectedElement);
        // selectedElement.insertAdjacentHTML('afterend', this._htmlString);
        selectedElement.remove();
      }
    }

    // function componentReducer(html, component) {
    //   let componentPatten = `<${component.constructor.name}(.*?)(\/>|>.*<\/${
    //     component.constructor.name
    //   }>)`;
    //   let re = new RegExp(componentPatten, "gi");
    //   html = html.replace(re, component.html());
    //   return html;
    // }
    // const finalHtml = this._dependencies.reduce(componentReducer, renderedHtml);
    // return finalHtml;
  }

  addEventListener(event) {
    this._events.push(event);
  }

  _registerEvents() {
    for (let event of this._events) {
      for (let eventTarget of this._rendered.querySelectorAll(event.selector)) {
        eventTarget.addEventListener(event.type, event.handler);
      }
    }
  }

  _deregisterEvents() {
    for (let event of this._events) {
      for (let eventTarget of this._rendered.querySelectorAll(event.selector)) {
        eventTarget.removeEventListener(event.type, event.handler);
      }
    }
  }

  html() {
    return "";
  }

  render() {
    if (this._rendered) {
      this._deregisterEvents();
    }
    let html = this.html().replace(/(\\r\\n|\\n|\\r|\\")/gm, "");
    // https://github.com/jsdom/jsdom/issues/2274
    const frag = window.document.createDocumentFragment(); //new DocumentFragment();
    const div = document.createElement("div");
    div.innerHTML = html;
    while (div.firstChild) {
      frag.appendChild(div.firstChild);
    }
    this._renderDependencies(frag);
    this._rendered = frag;
    this._registerEvents();
    return frag;
  }

  get dependencies() {
    return this._dependencies;
  }

  get rendered() {
    if (!this._rendered) {
      this._rendered = this.render();
    }
    return this._rendered;
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
      this._rendered = comp.render();
    }
    return this._rendered;
  }

  get rendered() {
    return this._rendered;
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
}

export class ProxyApp {
  constructor(RootNode, initialState = {}) {
    const evaluate = this.evaluate.bind(this);
    const handler = {
      set(target, property, value, receiver) {
        Reflect.set(...arguments);
        evaluate();
        return true;
      }
    };
    this._store = new Proxy(initialState, handler);
    const rootNode = new RootNode({ store: this._store });
    this.graph = new ComponentGraph(rootNode);
  }

  get store() {
    return this._store;
  }

  evaluate() {
    const evaluatedGraph = this.graph.evaluate();
    if (this._element.hasChildNodes()) {
      this._element.replaceChild(evaluatedGraph, this._element.children[0]);
    } else {
      this._element.appendChild(evaluatedGraph);
    }
    // this._element.innerHTML = evaluatedGraph.trim();
    return evaluatedGraph;
  }

  render(
    element = { appendChild() {}, hasChildNodes() {}, set innerHtml(html) {} }
  ) {
    this._element = element;
    // evaluate the dependency graph and render into the DOM
    const evaluatedGraph = this.evaluate();
    return evaluatedGraph;
  }
}
