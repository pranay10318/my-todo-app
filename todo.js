/* eslint-disable no-undef */
const todoList = () => {
  all = [];
  const add = (todoItem) => {
    all.push(todoItem);
  };
  const markAsComplete = (index) => {
    all[index].completed = true;
  };

  const overdue = () => {
    return all.filter(
      (todos) => todos.dueDate < new Date().toLocaleDateString("en-CA")
    );
  };

  const dueToday = () => {
    return all.filter(
      (todos) => todos.dueDate == new Date().toLocaleDateString("en-CA")
    );
  };

  const dueLater = () => {
    return all.filter(
      (todos) => todos.dueDate > new Date().toLocaleDateString("en-CA")
    );
  };

  const toDisplayableList = (list) => {
    return list
      .map(
        (todos) =>
          `${todos.completed ? `[x]` : `[ ]`} ${todos.title} ${
            todos.dueDate == today ? " " : todos.dueDate
          }`
      )
      .join("\n");
  };
 
  return {
    all,
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
    toDisplayableList,
  };
};

module.exports = todoList;
