import { Component, Graph, TheComponent } from "../index";

function traverseComponents(graph, comp) {
  graph.addVertex(comp);
  if (!comp.dependencies) {
    return;
  }
  let index = 0;
  const len = comp.dependencies.length;
  let dep;
  for (index; index < len; index++) {
    dep = comp.dependencies[index];
    graph.addVertex(dep);
    graph.addEdge(comp, dep);
    traverseComponents(graph, dep);
  }
}

function ChildComponent(props) {}

function dep1(argument) {
  return "dep1";
}
function dep2(argument) {
  return "dep2";
}
dep1.dependencies = [dep2];
function foo() {
  return "foo";
}

foo.dependencies = [dep1];

describe("given a component", () => {
  describe.skip("when it has dependencies", () => {
    it("allows inspects of dependencies", () => {
      expect(foo.dependencies[0].dependencies).toEqual([dep2]);
    });
  });

  describe.skip("when rendered", () => {
    it("returns a dom string", () => {
      const rendered = TheComponent({ foo: "bar" });
      expect(rendered).toBe("<div>bar</div>");
    });

    describe("and contains a child component", () => {
      it("invokes the child component", () => {
        const rendered = TheComponent({
          bar: "baz",
          children: ChildComponent
        });
        console.log({ rendered });
        expect(rendered).toBe(`
          <div><span>baz</span></div>
        `);
      });

      it.todo("gets a dependency relationship with children");
      it.todo(
        "probably needs to return instructions rather than html, so we can traverse child functions"
      );
    });
  });
});

describe("given a component tree", () => {
  it("builds a directed graph", () => {
    const graph = new Graph();
    // recurse through deps and build the graph

    traverseComponents(graph, foo);
    // assert output matches
    graph.printGraph();
  });

  it.only("evaluates the graph with khans algorithm", () => {
    const graph = new Graph();
    traverseComponents(graph, foo);

    //implement khan's algorithm
    function kahnsAlgorithm(graph) {
      // TODO copy vertices so as not to mutate the original graph

      // list of nodes with no incoming edges
      const S = [...graph.vertices.keys()].filter(
        key => ![...graph.vertices.values()].flat().find(value => value === key)
      );
      const L = [];
      while (S.length) {
        const n = S.shift();
        L.push(n);
        // for each node m with an edge e from n to m do
        const edges = [...graph.vertices.get(n)];
        for (let i = 0; i < edges.length; i++) {
          //         remove edge e from the graph
          console.log(graph.vertices.get(n));
          graph.vertices
            .get(n)
            .splice(graph.vertices.get(n).indexOf(edges[i]), 1);
          console.log(graph.vertices.get(n));
          //         if m has no other incoming edges then
          //             insert m into S
          if (
            ![...graph.vertices.values()]
              .flat()
              .find(value => value === edges[i])
          ) {
            S.push(edges[i]);
          }
        }
      }
      // if graph has edges then
      //     return error   (graph has at least one cycle)
      if ([...graph.vertices.values()].flat().length > 0) {
        throw new Error("Cyclical graph");
      }
      // else
      // return L   (a topologically sorted order)
      return L;
    }

    const sorted = kahnsAlgorithm(graph);
    console.log({ sorted });
    //verify output
  });
});
