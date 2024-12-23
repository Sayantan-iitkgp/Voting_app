const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { boolean } = require("webidl-conversions");

//define the pesrson schema
const Voterschema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  aadhar: {
    type: Number,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    unique: true,
    required: true,
  },
  Usertype: {
    type: String,
    enum: ["Admin", "Voter", "Elected_Candidate"],
    default: "Voter",
  },
  Voted: {
    type:Boolean,
    default:false
  },
  logout :{
    type:Boolean,
    default : false
  }
});
// Adding some salt in password and via using hasing (from bcrypt) making it much more stronger
Voterschema.pre("save", async function (next) {
  const User = this;

  if (!User.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const finalpassword = await bcrypt.hash(User.password, salt);
    User.password = finalpassword;
    return next();
  } catch (err) {
    return next(err);
  }
});
//password checking
Voterschema.methods.comparePassword = async function (pwd) {
  try {
    // Use the document's password field
    const isMatch = await bcrypt.compare(pwd, this.password);
    return isMatch; // Return true if passwords match, false otherwise
  } catch (err) {
    // Handle errors properly
    throw err;
  }
};

//create person model
const Voter = mongoose.model("Voter", Voterschema);
module.exports = Voter;
