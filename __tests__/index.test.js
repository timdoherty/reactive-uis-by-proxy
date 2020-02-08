import { Component, ComponentGraph, TheComponent } from "../index";

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
  it.skip("builds a directed graph", () => {
    const graph = new ComponentGraph(foo);
    // recurse through deps and build the graph

    // traverseComponents(graph, foo);
    // assert output matches
    graph.printGraph();
  });

  it("sorts the graph in dependency order", () => {
    const graph = new ComponentGraph(foo);
    const sorted = graph.sort();

    //verify output - this works for a simple graph, but larger ones can have multiple correct sort orders
    expect(sorted).toEqual([foo, dep1, dep2]);
  });

  it("evaluates the graph in dependency order", () => {
    let calls = [];
    function dep1(argument) {
      calls.push("dep1");
    }
    function dep2(argument) {
      calls.push("dep2");
    }
    dep1.dependencies = [dep2];
    function foo() {
      calls.push("foo");
    }

    foo.dependencies = [dep1];
    const graph = new ComponentGraph(foo);
    const sorted = graph.sort();

    graph.evaluate();
    expect(calls).toEqual(["dep2", "dep1", "foo"]);
  });

  it("description", () => {});
});
