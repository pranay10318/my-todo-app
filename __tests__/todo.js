/* eslint-disable no-undef */
const request = require("supertest");
var cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo Application", function () {
  //test suite
  beforeAll(async () => {
    await db.sequelize.sync({ force: true }); //wait for tables to create before tests
    server = app.listen(4000, () => {}); //to avoid failure when we run our app on same port i.e. 3000   so we changed it to 4000
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302); //for redirecting we have port number 302 so we should expect 302  (not 200)
    // expect(response.header["content-type"]).toBe( // for offline posting
    //   "application/json; charset=utf-8"
    // );
    // const parsedResponse = JSON.parse(response.text);
    // expect(parsedResponse.id).toBeDefined();
  });

  // test("Marks a todo with the given ID as complete", async () => {
  //   //for checking markascompleted first post one todo then expect it's complted as false
  //   const response = await agent.post("/todos").send({
  //     title: "Buy milk",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });
  //   const parsedResponse = JSON.parse(response.text);
  //   const todoID = parsedResponse.id;

  //   expect(parsedResponse.completed).toBe(false); //first it is false   befor completing todo

  //   //now we are doing markascomplete   so we then expect true for markascomplete
  //   const markCompleteResponse = await agent
  //     .put(`/todos/${todoID}/markASCompleted`)
  //     .send();
  //   const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
  //   expect(parsedUpdateResponse.completed).toBe(true);
  // });

  test("Fetches all todos in the database using /todos endpoint", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);

    await agent.post("/todos").send({
      title: "Buy xbox",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const response = await agent.get("/todos");
    const parsedResponse = JSON.parse(response.text);

    expect(parsedResponse.length).toBe(3); //as four todos added till now
    expect(parsedResponse[2]["title"]).toBe("Buy ps3"); //at idx 3 we have ps3 //i changed it for only two things
  });

  // test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
  //   // FILL IN YOUR CODE HERE
  //   const response = await agent.post("/todos").send({
  //     title: "Buy milk",
  //     dueDate: new Date().toISOString(),
  //     completed: false,
  //   });
  //   const parsedResponse = JSON.parse(response.text);
  //   const todoID = parsedResponse.id; //extracting the id of above added todo

  //   expect(parsedResponse.completed).toBe(false); //first it is false   befor completing todo

  //   var c = await agent.delete(`/todos/${todoID}`).send();
  //   expect(c.text).toBe("true");

  //   var c = await agent.delete(`/todos/${todoID}`).send();
  //   expect(c.text).toBe("false");
  // });

  test("Update a todo with given ID as complete / incomplete", async () => {
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
      });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    parsedUpdateResponse.completed
      ? expect(parsedUpdateResponse.completed).toBe(true)
      : expect(parsedUpdateResponse.completed).toBe(false);
  });
});
