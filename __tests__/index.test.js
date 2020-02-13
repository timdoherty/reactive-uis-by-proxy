import { Component, ComponentGraph, ProxyApp, TheComponent } from "../index";

class Dep1 extends Component {
  constructor() {
    super();
    this.dependencies = [Dep2];
  }
}
class Dep2 extends Component {
  constructor() {
    super();
    this.dependencies = [];
  }
}

class Foo extends Component {
  constructor() {
    super();
    this.dependencies = [Dep1];
  }
}

describe("reactive UIs by proxy", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("given a component tree", () => {
    it("sorts the graph in dependency order", () => {
      const graph = new ComponentGraph(Foo);
      const sorted = graph.sort();

      //verify output - this works for a simple graph, but larger ones can have multiple correct sort orders
      expect(sorted[0] instanceof Foo).toBe(true);
      expect(sorted[1] instanceof Dep1).toBe(true);
      expect(sorted[2] instanceof Dep2).toBe(true);
      // expect(sorted).toEqual([new Foo(), new Dep1(), new Dep2()]);
    });

    it("evaluates the graph in dependency order", () => {
      let calls = [];
      class Dep1 extends Component {
        constructor() {
          super();
          this.dependencies = [Dep2];
        }
        render() {
          calls.push("dep1");
        }
      }
      class Dep2 extends Component {
        constructor() {
          super();
          this.dependencies = [];
        }
        render() {
          calls.push("dep2");
        }
      }

      class Foo extends Component {
        constructor() {
          super();
          this.dependencies = [Dep1];
        }
        render() {
          calls.push("foo");
        }
      }
      const graph = new ComponentGraph(Foo);

      graph.evaluate();
      expect(calls).toEqual(["dep2", "dep1", "foo"]);
    });

    it("builds and sorts the graph when instantiated", () => {
      const sortSpy = jest.spyOn(ComponentGraph.prototype, "sort");
      const buildSpy = jest.spyOn(ComponentGraph.prototype, "_build");
      const proxyApp = new ProxyApp(Foo);
      expect(sortSpy).toHaveBeenCalled();
      expect(buildSpy).toHaveBeenCalled();
    });

    it("evaluates the graph when rendered", () => {
      const evaluateSpy = jest.spyOn(ComponentGraph.prototype, "evaluate");
      const proxyApp = new ProxyApp(Foo);
      proxyApp.render(null);
      expect(evaluateSpy).toHaveBeenCalled();
    });

    it.only("evaluates the graph when the model changes", () => {
      const initialState = {
        foo: "bar",
        bar: "baz"
      };
      const evaluateSpy = jest.spyOn(ProxyApp.prototype, "evaluate");
      const proxyApp = new ProxyApp(Foo, initialState);

      proxyApp.store.foo = "bim";
      expect(evaluateSpy).toHaveBeenCalledTimes(2);
      expect(proxyApp.store.foo).toBe("bim");
    });
  });

  describe.skip("component graph", () => {
    it("builds the UI when rendered", () => {
      // build a component tree with output
      // instatiate the proxy app
      // render
      // assert the return string is correct
    });

    it.todo("updates the model from a component");

    it.todo("only updates a component when subscribed state changes");
  });
});
