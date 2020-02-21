import { Component, ProxyApp } from "./index.js";
import { TodoInput } from "./TodoInput.js";

class Todos extends Component {
  constructor({ store }) {
    super();
    this.addDependency(new TodoInput({ store }));
    this._store = store;
  }
  html() {
    const { todos } = this._store;
    // well darn, how to read specific info without it being passed from above
    return `
      <div>
        <TodoInput />
        <br />
        ${todos.map(todo => `<div>${todo}</div>`).join("")}
      </div>
    `;
  }
}

const initialState = {
  todos: ["foo", "bar", "baz"]
};

const app = new ProxyApp(Todos, initialState);
window.STORE = app.store;
window.addEventListener("DOMContentLoaded", event => {
  app.render(document.getElementById("root"));
});
