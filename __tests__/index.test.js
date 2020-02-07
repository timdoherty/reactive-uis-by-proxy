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
    function khansAlgorithm(graph) {
      // list of nodes with no incoming edges
      const S = [...graph.vertices.keys()].filter(
        key => ![...graph.vertices.values()].flat().find(value => value === key)
      );
      console.log([...graph.vertices.keys()]);
      console.log([...graph.vertices.values()].flat());
      console.log({ S });
      console.log([...graph.vertices.values()].flat().find(1234));
    }

    khansAlgorithm(graph);
    //verify output
  });
});
