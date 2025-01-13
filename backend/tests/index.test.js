const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require("mongodb");
const app = require("../index"); // assuming your Express app is in app.js file

let mongoServer;
let dbUri;
let client;
let db;
let usersCollection;

describe("User CRUD Operations", () => {
  // Set up MongoDB in-memory server before the tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    dbUri = mongoServer.getUri();
    client = new MongoClient(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    db = client.db();
    usersCollection = db.collection("users");
    app.locals.db = db; // Make the db available to the app
  });

  afterAll(async () => {
    await mongoServer.stop();
    await client.close();
  });

  let userId;

  it("should create a new user", async () => {
    const newUser = { name: "John Doe", email: "johnDoe@example.com" };

    const res = await request(app).post("/users").send(newUser).expect(201);

    expect(res.body.name).toBe(newUser.name);
    expect(res.body.email).toBe(newUser.email);
    userId = res.body._id; // Save the userId for later tests
  });

  it("should fetch the created user", async () => {
    console.log("Userid ", userId);
    const res = await request(app).get(`/users/${userId}`).expect(200);

    expect(res.body.name).toBe("John Doe");
    expect(res.body.email).toBe("johnDoe@example.com");
  });

  it("should update the user email", async () => {
    const updatedUser = { name: "John Doe", email: "janeDutch@exp.com" };
    console.log("put userId", userId);
    const res = await request(app)
      .put(`/users/${userId}`)
      .send(updatedUser)
      .expect(200);

    expect(res.body.email).toBe(updatedUser.email);
  });

  it("should delete the user", async () => {
    const res = await request(app).delete(`/users/${userId}`).expect(200);

    expect(res.body.message).toBe("User deleted");
  });
});
