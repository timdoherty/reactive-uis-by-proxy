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
          console.log({ frag });
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
            console.log({ frag });

            const myComponent = new MyComponent();
            expect(myComponent.render()).toEqual(frag);
            // expect(myComponent.render()).toBe("<div><span>barbaz</span></div>");
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

      describe.only("when an event is triggered", () => {
        it("responds to the event", () => {
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

          const eventComponent = new EventComponent();
          const frag = eventComponent.render();
          frag.querySelector("button").dispatchEvent(new Event("click"));
          expect(clicked).toHaveBeenCalled();
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
          const result = proxyApp.render();

          expect(result).toBe("hello world");
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
        expect(evaluateSpy).toHaveBeenCalled();
        expect(proxyApp.store.foo).toBe("bim");
      });
    });
  });
});
