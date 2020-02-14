import { Component, ComponentGraph, ProxyApp } from "../index";

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

      describe("and it has dependencies", () => {
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

          const myComponent = new MyComponent();
          expect(myComponent.render()).toBe("<div><span>barbaz</span></div>");
        });
      });
    });

    describe("when it is given an observable model", () => {
      describe("and a component changes the model", () => {
        it("responds to the change outside the component", () => {
          const initialState = {
            foo: "bar",
            bar: "baz"
          };

          const evaluate = jest.fn();
          const store = new Proxy(initialState, {
            set(target, property, value, receiver) {
              evaluate({ property, value });
              return true;
            }
          });

          class HasStore extends Component {
            constructor({ store }) {
              super();
              this._store = store;
            }

            onChange() {
              this._store.foo = "bim";
            }

            html() {
              return `hello ${this._store.name}`;
            }
          }

          const hasStore = new HasStore({ store });
          hasStore.onChange();
          expect(evaluate).toHaveBeenCalledWith({
            property: "foo",
            value: "bim"
          });
        });
      });

      describe("and the model changes outside the component", () => {
        it("reacts to the model change", () => {
          const initialState = {
            foo: "bar",
            bar: "baz"
          };

          const store = new Proxy(initialState, {
            set(target, property, value, receiver) {
              // notify subsribers
              evaluate({ property, value });
              return true;
            },
            get(target, property, receiver) {
              // how to know who's listening
              return true;
            }
          });

          class HasStore extends Component {
            constructor({ store }) {
              super();
              this._store = store;
            }
            onChange() {
              this._store.foo = "bim";
            }
            html() {
              return `hello ${this._store.name}`;
            }
          }

          // const hasStore = new HasStore({ store });
          // hasStore.onChange();
          // expect(evaluate).toHaveBeenCalledWith({
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
      const proxyApp = new ProxyApp(Foo);
      expect(sortSpy).toHaveBeenCalled();
      expect(buildSpy).toHaveBeenCalled();
    });
  });

  describe("ProxyApp", () => {
    it("evaluates the graph when rendered", () => {
      const evaluateSpy = jest.spyOn(ComponentGraph.prototype, "evaluate");
      const proxyApp = new ProxyApp(Foo);
      proxyApp.render();
      expect(evaluateSpy).toHaveBeenCalled();
    });

    it("provides the model to the components", () => {
      class HasStore extends Component {
        constructor({ store }) {
          super();
          this._store = store;
        }

        html() {
          return `hello ${this._store.name}`;
        }
      }

      const initialState = { name: "world" };
      const proxyApp = new ProxyApp(HasStore, initialState);
      const result = proxyApp.evaluate();

      expect(result).toBe("hello world");
    });

    it("evaluates the graph when the model changes", () => {
      const initialState = {
        foo: "bar",
        bar: "baz"
      };
      const evaluateSpy = jest.spyOn(ProxyApp.prototype, "evaluate");
      const proxyApp = new ProxyApp(Foo, initialState);

      proxyApp.store.foo = "bim";
      expect(evaluateSpy).toHaveBeenCalled();
      expect(proxyApp.store.foo).toBe("bim");
    });
  });
});
