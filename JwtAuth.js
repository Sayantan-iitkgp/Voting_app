const jwt = require("jsonwebtoken");
const Voter = require("./model/Voter");
const Candidate = require("./model/Candidate");

//Admin Verification by jwt token
const token_verification = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(400).json({ message: "token is tampered" });
    } else {
      const payload = jwt.verify(token, process.env.secret_key);
      const Aadhar = payload.Id;
      const voter = await Voter.findOne({ aadhar: Aadhar });
      if (!voter) {
        console.log("Illegal token is created to enter the website");
        res.status(400).json({ message: "You are an illegal voter" });
      } else {
        req.user = voter;
        next();
      }
    }
  } catch (err) {
    console.log("Internal server error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = token_verification;
