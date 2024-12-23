require("dotenv").config();
const mongoose = require("mongoose");

//Define mongodb url and connect url
const MONGOURL = "mongodb://localhost:27017/Voting_app";
// const MONGOURL= process.env.mongourl;

//set up MongoDB connection
mongoose.connect(MONGOURL);

//get the default connection
//mongoose maintain a default connection object representing the MongoDB connection.

const db = mongoose.connection;

//Define event listners for database connection
db.on("connected", () => {
  console.log("Connected to MongoDB server");
});

db.on("error", () => {
  console.log("MongoDB connection error");
});

db.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

//export the module
module.exports = db;
