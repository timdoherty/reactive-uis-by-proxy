import { Component, ProxyApp } from "./index.js";
import { Todos } from './Todos.js'


const initialState = {
  todos: new Map([["foo", false], ["bar", false], ["baz", false]])
};
// const initialState = {
//   todos: ["foo", "bar", "baz"]
// };

const app = new ProxyApp(Todos, initialState);
window.STORE = app.store;
window.addEventListener("DOMContentLoaded", event => {
  app.render(document.getElementById("root"));
});
