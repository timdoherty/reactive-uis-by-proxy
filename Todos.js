import { Component } from "./index.js";
import { TodoInput } from "./TodoInput.js";

export class Todos extends Component {
  constructor({ store }) {
    super();
    this.addDependency(new TodoInput({ store }));
    this._store = store;
    this.onChecked = this.onChecked.bind(this);
    this.addEventListener({
      selector: "input[type='checkbox']",
      type: "click",
      handler: this.onChecked
    });
  }

  onChecked(e) {
    const todo = e.currentTarget.value;
    this._store.todos.set(todo, !this._store.todos.get(todo));
  }

  html() {
    const { todos } = this._store;
    // well darn, how to read specific info without it being passed from above
    return `
      <div>
        <TodoInput />
        <br />
        ${[...todos.entries()]
          .map(
            ([todo, isDone]) => `
            <div>
              ${todo}
              <input type="checkbox" value="${todo}" ${
              isDone ? "checked" : ""
            } />
            </div>
          `
          )
          .join("")}
      </div>
    `;
  }
}
