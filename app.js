/* eslint-disable no-unused-vars */
const express = require("express");
var csrf = require("tiny-csrf");

const app = express();
const { Todo, User } = require("./models"); //for doing any operations on todo we should import models
const bodyParser = require("body-parser"); //for parsing from/to json
var cookieParser = require("cookie-parser");
const path = require("path");
const user = require("./models/user");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false })); //for encoding urls  form submission for maniputlating todo

app.use(cookieParser("SSH! THIS IS A SCRET CODE"));
app.use(csrf("12345678998765432198765432112345", ["POST", "PUT", "DELETE"]));
app.set("view engine", "ejs"); //setting up engine to work with ejs
app.use(express.static(path.join(__dirname, "public")));

app.use(flash());
app.use(
  session({
    secret: "my-super-secret-keyq3243141234",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24hrs
    },
  })
);
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, {
              //if password is not correct
              message: "Invalid Emailid or password",
            });
          }
        })
        .catch((error) => {
          //if user is not found
          return done(null, false, { message: "Invalid Emailid or password" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user with id ", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});
//passport part ,session creation end.

app.get("/", async (request, response) => {
  var bul = false;
  if (request.user) {
    bul = true;
  }
  response.render("index", {
    title: "Todo Application",
    loginStatus: bul,
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const allTodo = await Todo.getTodos(loggedInUser);
    const dueToday = await Todo.dueToday(loggedInUser);
    const overdue = await Todo.overdue(loggedInUser);
    const dueLater = await Todo.dueLater(loggedInUser);
    const completedItems = await Todo.completedItems(loggedInUser);

    if (request.accepts("html")) {
      //request from web i.e. it accepts html   but for postman it accepts json that is in else part
      response.render("todos", {
        //new todos.ejs should be created
        title: "my todos",
        overdue,
        allTodo,
        dueToday,
        dueLater,
        completedItems,
        email: request.user.email,
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
  }
);

app.post("/users", async function (request, response) {
  if (request.body.firstName.length == 0) {
    request.flash("error", "First name Required");
    return response.redirect("/signup");
  } else if (request.body.email.length == 0) {
    request.flash("error", "Email Required");
    return response.redirect("/signup");
  } else if (request.body.password.length == 0) {
    request.flash("error", "Password Required");
    return response.redirect("/signup");
  }
  console.log("creating new User", request.body);
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const user = await User.create({
      firstName: request.body.firstname,
      lastName: request.body.lastname,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        response.redirect("/todos");
      } else {
        request.flash("success", "Successfully Signed up");
        response.redirect("/todos");
      }
    });
  } catch (error) {
    console.log(error);
    request.flash("error", "Email already Exists");
    return response.redirect("/signup");
  }
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    response.redirect("/todos");
  }
);

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    if (request.body.title.length == 0) {
      request.flash("error", "Enter the title");
      return response.redirect("/todos");
    }
    if (request.body.title.length < 5) {
      request.flash("error", "Title should be atleast 5 characters");
      return response.redirect("/todos");
    }
    if (request.body.dueDate.length == 0) {
      request.flash("error", "Enter the dueDate");
      return response.redirect("/todos");
    }
    console.log("creating new todo", request.body);
    try {
      await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    //async for getting req
    try {
      const todo = await Todo.findByPk(request.params.id);
      return response.json(todo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "signup",
    csrfToken: request.csrfToken(),
  });
});

//for login get and post
app.get("/login", (request, response) => {
  //getting login page to webpage
  response.render("login", {
    //we are rendering login.ejs
    title: "LogIn page",
    csrfToken: request.csrfToken(),
  });
});

//signout of user
app.get("/signout", (request, response, next) => {
  //next handler
  request.logOut((err) => {
    if (err) return next(err);
    response.redirect("/");
  });
});

app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const loggedInUser = request.user.id;
    console.log("we have to update a todo with ID:", request.params.id);
    try {
      const todo = await Todo.findByPk(request.params.id);
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed, //this part we are passing in index.js body attribute
        loggedInUser
      );
      console.log("the checkkkkkkkkkkkkkk.................", updatedTodo);
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    // FILL IN YOUR CODE HERE
    try {
      //this code is by them i.e. wd   my code is below
      var c = await Todo.remove({
        id: request.params.id,
        userId: request.user.id,
      });
      if (c > 0) return response.json(true);
      return response.json(false);
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);

module.exports = app;
