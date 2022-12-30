/* eslint-disable no-undef */
// models/todo.js
"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static async addTask(params) {
      return await Todo.create(params); //for adding creating tables and manipulating
    }
    static async showList() {
      // for entire list
      console.log("My Todo list \n");

      console.log("Overdue");
      // FILL IN HERE
      const overdueItems = await Todo.overdue();
      overdueItems.forEach((todoItem) =>
        console.log(todoItem.displayableString())
      );

      console.log("\n");

      console.log("Due Today");
      // FILL IN HERE
      const dueTodayItems = await Todo.dueToday();
      dueTodayItems.forEach((todoItem) =>
        console.log(todoItem.displayableString())
      );

      console.log("\n");

      console.log("Due Later");
      // FILL IN HERE
      const dueLaterItems = await Todo.dueLater();
      dueLaterItems.forEach((todoItem) =>
        console.log(todoItem.displayableString())
      );
    }

    static async overdue() {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      const overdueItems = await Todo.findAll({
        where: { dueDate: { [Op.lt]: new Date() } },
        order: [["id", "ASC"]],
      });

      return overdueItems;
    }

    static async dueToday() {
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
      const dueTodayItems = await Todo.findAll({
        where: { dueDate: new Date() },
        order: [["id", "ASC"]],
      });

      return dueTodayItems;
    }

    static async dueLater() {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      const dueLaterItems = await Todo.findAll({
        where: { dueDate: { [Op.gt]: new Date() } }, //greater than the duedate
        order: [["id", "ASC"]],
      });

      return dueLaterItems;
    }

    static async markAsComplete(id) {
      // FILL IN HERE TO MARK AN ITEM AS COMPLETE
      await Todo.update(
        { completed: true },
        {
          where: {
            id: id,
          },
        }
      );
    }

    displayableString() {
      let checkbox = this.completed ? "[x]" : "[ ]"; //completed or not
      let displayDate =
        this.dueDate === new Date().toLocaleDateString("en-CA")
          ? ""
          : this.dueDate;
      return `${this.id}. ${checkbox} ${this.title} ${displayDate}`.trim();
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
