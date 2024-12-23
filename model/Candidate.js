const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//define the pesrson schema
const Candidateschema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  aadhar: {
    type: Number,
    unique: true,
    required: true,
  },
  party: {
    type: String,
    required: true,
  },
  Id: {
    type: Number,
    unique: true,
    required: true,
  },
  Vote: [
    {
      Voter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Voter",
        required: true,
      },
      Voted_at: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
  Vote_Count: {
    type: Number,
    default: 0,
  },
});

const Candidate = mongoose.model("Candidate", Candidateschema);
module.exports = Candidate;
