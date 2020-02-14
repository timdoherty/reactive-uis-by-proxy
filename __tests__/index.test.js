import { Component, ComponentGraph, ProxyApp, TheComponent } from "../index";

class Dep1 extends Component {
  constructor() {
    super();
    this.addDependency(new Dep2());
  }
}
class Dep2 extends Component {
  constructor() {
    super();
  }
}

class Foo extends Component {
  constructor() {
    super();
    this.addDependency(new Dep1());
  }
}

describe("reactive UIs by proxy", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("given a component", () => {
    describe("when renderered", () => {
      it("returns some content", () => {
        class MyComponent extends Component {
          html() {
            return `<div>foobar</div>`;
          }
        }

        const myComponent = new MyComponent();
        expect(myComponent.render()).toBe(`<div>foobar</div>`);
      });

      describe.only("and it has dependencies", () => {
        it("returns those too", () => {
          class Dep extends Component {
            html() {
              return "<span>barbaz</span>";
            }
          }
          class MyComponent extends Component {
            constructor() {
              super();
              this.addDependency(new Dep());
            }
            html() {
              return `<div><Dep /></div>`;
            }
          }

          // TODO how to get the dependency instance(s) - maybe inject instances instead of constructors?
          const myComponent = new MyComponent();
          expect(myComponent.render()).toBe("<div><span>barbaz</span></div>");
        });
      });
    });
  });

  describe("given a component graph", () => {
    it("sorts the graph in dependency order", () => {
      const graph = new ComponentGraph(new Foo());
      const sorted = graph.sort();
      expect(sorted[0] instanceof Foo).toBe(true);
      expect(sorted[1] instanceof Dep1).toBe(true);
      expect(sorted[2] instanceof Dep2).toBe(true);
    });

    it("evaluates the graph in dependency order", () => {
      let calls = [];
      class Dep1 extends Component {
        constructor() {
          super();
          this.addDependency(new Dep2());
        }
        render() {
          calls.push("dep1");
        }
      }
      class Dep2 extends Component {
        render() {
          calls.push("dep2");
        }
      }

      class Foo extends Component {
        constructor() {
          super();
          this.addDependency(new Dep1());
        }
        render() {
          calls.push("foo");
        }
      }
      const graph = new ComponentGraph(new Foo());

      graph.evaluate();
      expect(calls).toEqual(["dep2", "dep1", "foo"]);
    });

    it("builds and sorts the graph when instantiated", () => {
      const sortSpy = jest.spyOn(ComponentGraph.prototype, "sort");
      const buildSpy = jest.spyOn(ComponentGraph.prototype, "_build");
      const proxyApp = new ProxyApp(new Foo());
      expect(sortSpy).toHaveBeenCalled();
      expect(buildSpy).toHaveBeenCalled();
    });

    it("evaluates the graph when rendered", () => {
      const evaluateSpy = jest.spyOn(ComponentGraph.prototype, "evaluate");
      const proxyApp = new ProxyApp(new Foo());
      proxyApp.render(null);
      expect(evaluateSpy).toHaveBeenCalled();
    });

    it("evaluates the graph when the model changes", () => {
      const initialState = {
        foo: "bar",
        bar: "baz"
      };
      const evaluateSpy = jest.spyOn(ProxyApp.prototype, "evaluate");
      const proxyApp = new ProxyApp(new Foo(), initialState);

      proxyApp.store.foo = "bim";
      expect(evaluateSpy).toHaveBeenCalled();
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
