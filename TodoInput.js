import { Component } from "./index.js";

export class TodoInput extends Component {
  constructor({ store }) {
    super();
    this._store = store;
    this.onKeyup = this.onKeyup.bind(this);
    this.addEventListener({
      selector: "input",
      type: "keyup",
      handler: this.onKeyup
    });
  }

  html() {
    return `<input type="text" />`;
  }

  onKeyup(e) {
    if (e.currentTarget.value && e.key === "Enter") {
      this._store.todos.set(e.currentTarget.value, false);
    }
  }
}
