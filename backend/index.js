const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// MongoDB connection variables
let db;
let usersCollection;

// In-memory MongoDB setup (for testing/development)
let mongoServer;
let dbUri;

// Function to connect to MongoDB
const connectDB = async (dbName = "defaultDB", useInMemoryDb = true) => {
  try {
    if (useInMemoryDb) {
      mongoServer = await MongoMemoryServer.create();
      dbUri = mongoServer.getUri(); // Get the URI for the in-memory MongoDB server
      console.log("Using in-memory MongoDB server");
    } else {
      dbUri = `mongodb://localhost:27017/${dbName}`;
      console.log(`Connecting to MongoDB at ${dbUri}`);
    }

    const client = new MongoClient(dbUri);
    await client.connect();
    db = client.db();
    usersCollection = db.collection("users");
    console.log(`Connected to database: ${dbName}`);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

// Connect to MongoDB (use in-memory DB if needed)
const dbName = process.env.DB_NAME || "defaultDB";
connectDB(dbName, true);

// CRUD Routes

// POST /users - Create a new user
app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const newUser = { name, email };
    const result = await usersCollection.insertOne(newUser);
    newUser._id = result.insertedId; // Get the _id from MongoDB
    res.status(201).json(newUser);
  } catch (err) {
    console.error("Error creating user:", err);
    res
      .status(400)
      .json({ message: "Error creating user", error: err.message });
  }
});

// GET /users - Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await usersCollection.find().toArray();
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res
      .status(500)
      .json({ message: "Error fetching users", error: err.message });
  }
});

// GET /users/:id - Get a user by ID
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res
      .status(500)
      .json({ message: "Error fetching user", error: err.message });
  }
});

// PUT /users/:id - Update a user by ID
app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    console.log("try put userId", id);
    const updatedUser = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name, email } },
      { returnDocument: "after" }
    );
    console.log("try updatedUser", updatedUser);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res
      .status(400)
      .json({ message: "Error updating user", error: err.message });
  }
});

// DELETE /users/:id - Delete a user by ID
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown for in-memory MongoDB
process.on("SIGINT", async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
  console.log("Shutting down...");
  process.exit(0);
});

module.exports = app;
