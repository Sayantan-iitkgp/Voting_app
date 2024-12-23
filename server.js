require("dotenv").config();
const express = require("express");
const app = express();
const db = require("./db");
const bodyParser = require("body-parser");
const VoterRouter= require('./Routers/VoterRouter');
const req = require("express/lib/request.js");
const Voter = require("./model/Voter");
const Candidate = require("./model/Candidate");
const admin_verification = require("./JwtAuth");
app.use(bodyParser.json()); //req.body
//Home page
app.get("/Vote/Home", function (req, res) {
  res.send(
    "If you are a adult citizen of India then it's your duty to cast your vote and to choose a correct leader for our nation"
  );
});
//All voters routes
app.use('/Vote/Voter',VoterRouter);

//PORT Listening
var PORT = process.env.Port || 3000;
app.listen(PORT, () => {
  console.log("listening on port", PORT);
});
