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

  describe("Component", () => {
    describe("given a component", () => {
      describe("when renderered", () => {
        it("returns some content", () => {
          class MyComponent extends Component {
            html() {
              return `<div>foobar</div>`;
            }
          }

          const myComponent = new MyComponent();
          // https://github.com/jsdom/jsdom/issues/2274
          const frag = window.document.createDocumentFragment(); //new DocumentFragment();
          const div = document.createElement("div");
          div.innerHTML = `<div>foobar</div>`;
          frag.appendChild(div.firstChild);
          expect(myComponent.render()).toEqual(frag);
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

            // https://github.com/jsdom/jsdom/issues/2274
            const frag = window.document.createDocumentFragment(); //new DocumentFragment();
            const div = document.createElement("div");
            div.innerHTML = `<div><span>barbaz</span></div>`;
            frag.appendChild(div.firstChild);

            const myComponent = new MyComponent();
            expect(myComponent.render()).toEqual(frag);
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
      });

      describe("when an event is registered", () => {
        const clicked = jest.fn();
        class EventComponent extends Component {
          constructor() {
            super();
            this.addEventListener({
              selector: "button",
              type: "click",
              handler: this.onClick
            });
          }

          onClick(e) {
            clicked();
          }

          html() {
            return `<button></button>`;
          }
        }

        describe("and the event is triggered", () => {
          it("responds to the event", () => {
            const eventComponent = new EventComponent();
            const frag = eventComponent.render();
            frag.querySelector("button").dispatchEvent(new Event("click"));
            expect(clicked).toHaveBeenCalled();
          });
        });

        describe("and the component re-renders", () => {
          it("de-registers the event handler first", () => {
            const spy = jest.spyOn(
              EventComponent.prototype,
              "_deregisterEvents"
            );
            const eventComponent = new EventComponent();
            eventComponent.render();
            // re-render to force cleanup
            eventComponent.render();
            expect(spy).toHaveBeenCalled();
          });
        });
      });
    });
  });

  describe("ComponentGraph", () => {
    describe("given a component graph", () => {
      describe("when initialized with an entry point", () => {
        it("builds the dependency graph", () => {
          const buildSpy = jest.spyOn(ComponentGraph.prototype, "_build");
          const proxyApp = new ProxyApp(Foo);
          expect(buildSpy).toHaveBeenCalled();
        });
      });

      describe("when sorted", () => {
        it("sorts the graph in dependency order", () => {
          const graph = new ComponentGraph(new Foo());
          const sorted = graph.sort();
          expect(sorted[0] instanceof Foo).toBe(true);
          expect(sorted[1] instanceof Dep1).toBe(true);
          expect(sorted[2] instanceof Dep2).toBe(true);
        });
      });

      describe("when evaluated", () => {
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
      });
    });
  });

  describe("ProxyApp", () => {
    describe("given an entry point and some state", () => {
      describe("when rendered", () => {
        it("evaluates the graph", () => {
          const evaluateSpy = jest.spyOn(ComponentGraph.prototype, "evaluate");
          const proxyApp = new ProxyApp(Foo);
          proxyApp.render();
          expect(evaluateSpy).toHaveBeenCalled();
        });

        it("provides the data to the entry point", () => {
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
          const frag = window.document.createDocumentFragment(); //new DocumentFragment();
          const div = document.createElement("div");
          div.innerHTML = "hello world";
          frag.appendChild(div.firstChild);
          const result = proxyApp.render();

          expect(result).toEqual(frag);
        });
      });
    });

    describe("when the state changes", () => {
      it("re-evaluates the graph", () => {
        const initialState = {
          foo: "bar",
          bar: "baz"
        };
        const evaluateSpy = jest.spyOn(ProxyApp.prototype, "evaluate");
        const proxyApp = new ProxyApp(Foo, initialState);
        proxyApp.render();

        proxyApp.store.foo = "bim";
        expect(evaluateSpy).toHaveBeenCalledTimes(2);
        expect(proxyApp.store.foo).toBe("bim");
      });
    });
  });

  describe.only("when nested state changes", () => {
    describe("and the nested state is an object", () => {
      it("re-evaluates the graph", () => {
        const initialState = {
          foo: {
            bar: "baz"
          }
        };
        const evaluateSpy = jest.spyOn(ProxyApp.prototype, "evaluate");
        const proxyApp = new ProxyApp(Foo, initialState);
        proxyApp.render();

        proxyApp.store.foo.bar = "bim";
        expect(evaluateSpy).toHaveBeenCalledTimes(2);
        expect(proxyApp.store.foo.bar).toBe("bim");
      });
    });

    describe("and the nested state involves a collection", () => {
      it("re-evaluates the graph", () => {
        const initialState = {
          foo: [1, 2, 3]
        };
        const evaluateSpy = jest.spyOn(ProxyApp.prototype, "evaluate");
        const proxyApp = new ProxyApp(Foo, initialState);
        proxyApp.render();

        proxyApp.store.foo.push(4);
        expect(evaluateSpy).toHaveBeenCalledTimes(2);
        expect(proxyApp.store.foo).toEqual([1, 2, 3, 4]);
      });
    });
  });
});
