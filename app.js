const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const { Todo } = require("./models"); //for doing any operations on todo we should import models
const bodyParser = require("body-parser"); //for parsing from/to json
var cookieParser = require("cookie-parser");
const path = require("path");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false })); //for encoding urls  form submission for maniputlating todo

app.use(cookieParser("SSH! THIS IS A SCRET CODE"));
app.use(csrf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"]));
app.set("view engine", "ejs"); //setting up engine to work with ejs

app.get("/", async (request, response) => {
  const allTodo = await Todo.getTodos();
  const dueToday = await Todo.dueToday();
  const overdue = await Todo.overdue();
  const dueLater = await Todo.dueLater();
  const completedItems = await Todo.completedItems();

  if (request.accepts("html")) {
    //request from web i.e. it accepts html   but for postman it accepts json that is in else part
    response.render("index", {
      overdue,
      allTodo,
      dueToday,
      dueLater,
      completedItems,
      csrfToken: request.csrfToken(),
    });
  } else {
    //for postman like api  we should get json format as it donot support html
    response.json({
      allTodo,
      dueToday,
      dueLater,
      overdue,
      completedItems,
    });
  }
});
app.use(express.static(path.join(__dirname, "public")));

app.get("/todos", async (request, response) => {
  //getting todos from server
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE
  try {
    const todos = await Todo.findAll();
    return response.send(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }

  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  // Then, we have to respond with all Todos, like:
  // response.send(todos)
});

app.get("/todos/:id", async (request, response) => {
  //async for getting req
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async (request, response) => {
  //posting todos to server
  try {
    await Todo.addTodo({
      //here for posting we should pass a json format thing   before we directly type todo in body->raw of postman and post   now we should directly pass
      title: request.body.title,
      dueDate: request.body.dueDate,
    });
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  console.log("we have to update a todo with ID:", request.params.id);
  try {
    const todo = await Todo.findByPk(request.params.id);
    const updatedTodo = await todo.setCompletionStatus(
      request.body.completed //this part we are passing in index.js body attribute
    );
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  // FILL IN YOUR CODE HERE
  // try{//this code is by them i.e. wd   my code is below
  //   await Todo.remove(request.params.id);
  //   return response.json({success:true});
  // }catch(error){
  //   return response.status(422),json(error);
  // }
  try {
    var c = await Todo.destroy({
      //as this function return the number of rows delted do we can check if >0 we can delete it
      where: {
        id: request.params.id,
      },
    });
    response.send(c > 0); ///return bool value true if c>0 else false
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }

  // First, we have to query our database to delete a Todo by ID.
  // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
  // response.send(true)
});

module.exports = app;
