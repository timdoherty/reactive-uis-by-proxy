import { Component, ProxyApp } from "./index.js";
console.log("WTF=========");
class Todos extends Component {
  constructor({ store }) {
    super();
    this._store = store;
  }
  html() {
    const { todos } = this._store;
    // well darn, how to read specific info without it being passed from above
    return `
      <div>
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
