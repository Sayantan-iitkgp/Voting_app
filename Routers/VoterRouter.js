const express = require("express");
require("dotenv").config();
const router = express.Router();
const jsonwebtoken = require("jsonwebtoken");
const Voter = require("../model/Voter");
const Candidate = require("../model/Candidate");
const token_verification = require("../JwtAuth");
const bcrypt = require("bcrypt");

//Sign-Up Router
router.post("/signup", async (req, res) => {
  try {
    const voter = new Voter(req.body);
    const response = await voter.save();
    console.log("data saved");
    const payload = {
      Id: voter.aadhar,
      Password: voter.password,
    };
    const token = jsonwebtoken.sign(payload, process.env.secret_key, {
      expiresIn: 3000000,
    });
    console.log("Voter signed up successfully");
    res.status(200).json({ response, token });
  } catch (err) {
    console.log("Internal server error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
//Login Router
router.post("/login", async (req, res) => {
  try {
    const voter_credentials = req.body;
    const aadhar = voter_credentials.aadhar;
    const password = voter_credentials.password;
    const voter = await Voter.findOne({ aadhar: aadhar });
    if (!voter) {
      console.log("Invalid Voter");
      res.status(400).json({ message: "Invalid voter! " });
    }

    if (voter.logout === true) {
      //const pwd = voter.password;
      const Compare = voter.comparePassword(password);
      if (!Compare) {
        console.log("Wrong password");
        res.status(400).json({
          message: "Wrong password ",
        });
      }
      const payload = {
        Id: voter.aadhar,
        Password: voter.password,
      };
      const token = jsonwebtoken.sign(payload, process.env.secret_key, {
        expiresIn: 3000000,
      });
      console.log("Voter logged in successfully");
      res.status(200).json({ voter, token });
      voter.logout = false;
      await voter.save();
    }
     else {
      return res.status(200).json({ message: "You are already logged in." });
    }
  } catch (err) {
    console.log("Internal server error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
//Entry of new candidate data by admin
router.post("/Candidate_Entry", token_verification, async (req, res) => {
  try {
    const voter = req.user;
    if (voter.logout) {
      return res.status(400).json({ message: "You are logged out" });
    }

    const Usertype = voter.Usertype;
    if (Usertype != "Admin") {
      res
        .status(400)
        .json({ message: "You are not eligible to enter candidate data" });
    }
    const candidate = new Candidate(req.body);
    const response = await candidate.save();
    console.log("Candidate data saved successfully");
    res.status(200).json(response);
  } catch (err) {
    console.log("Internal server error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
//Get the Candidate list for Votng
router.get("/Candidate_list", token_verification, async (req, res) => {
  try {
    const voter = req.user;
    if (voter.logout) {
      return res.status(400).json({ message: "You are logged out" });
    }
    const response = await Candidate.find();
    // Map to a new array with only the desired fields
    const filteredResponse = response.map((candidate) => ({
      name: candidate.name,
      party: candidate.party,
      id: candidate.Id, // or candidate.Id depending on your schema
    }));
    console.log(
      "All Candidates list is fetched successfully.Choose your desired leader!"
    );
    res.status(200).json(filteredResponse);
  } catch (error) {
    res.status(500).json({ message: "Error fetching candidates", error });
  }
});
//Voting Router
router.post("/Voting/:id", token_verification, async (req, res) => {
  try {
    const voter = req.user;
    if (voter.logout) {
      return res.status(400).json({ message: "You are logged out" });
    }
    const usertype = voter.Usertype;
    if (usertype === "Admin") {
      console.log("Admin is trying to cast vote");
      res.status(400).json({
        message: "As you are admin, so you are not eligible to give vote",
      });
    } else {
      const Id = req.params.id;
      const candidate = await Candidate.findOne({ Id: Id });
      const voted = voter.Voted;
      if (voted) {
        res.status(400).json({
          message:
            "You have already given your vote. So you are not allowed to cast vote further",
        });
      } else {
        if (!candidate) {
          res.status(400).json({
            message: "There is no valid Elected candidate with this Id",
          });
        }
        voter.Voted = true;
        await voter.save();
        // Add the voter ID to the candidate's Vote array
        candidate.Vote.push({ Voter_id: voter._id });
        candidate.Vote_Count += 1; // Increment the vote count

        // Save the updated candidate
        await candidate.save();

        // Respond with success
        res.status(200).json({
          message: "Vote successfully cast for the candidate",
          candidate,
        });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching candidates", error });
  }
});
//Update Voter profile
router.post("/Update/:id", token_verification, async (req, res) => {
  try {
    const change = req.params.id;
    const voter = req.user;
    if (voter.logout) {
      return res.status(400).json({ message: "You are logged out" });
    }
    if (change === "mobile") {
      const mobile = req.body.mobile;
      voter.mobile = mobile;
      res
        .status(200)
        .json({ message: "Your mobile number is changed succesfully" });
    } else if (change === "address") {
      const address = req.body.address;
      voter.address = address;
      res.status(200).json({ message: "Your address is changed succesfully" });
    } else if (change === "password") {
      const password = req.body.password;
      const salt = await bcrypt.genSalt(10);
      const hashed_New_password = await bcrypt.hash(password, salt);
      voter.password = hashed_New_password;
      res.status(200).json({ message: "Your password is changed succesfully" });
    } else {
      res.status(400).json({
        message:
          "You can't change anything other than mobile, address and password",
      });
    }
    await voter.save();
  } catch (error) {
    res.status(500).json({ message: "Error fetching candidates", error });
  }
});
//Delete your profile
router.delete("/Delete", token_verification, async (req, res) => {
  try {
    const voter = req.user;
    if (voter.logout) {
      return res.status(400).json({ message: "You are logged out" });
    }
    const id = req.user._id;
    const response = await Voter.findByIdAndDelete(id);
    if (!response) {
      res
        .status(400)
        .json({ message: "There is no voter with this credentials to delete" });
    } else {
      res
        .status(200)
        .json({ message: "Your credentials is deleted successsfully" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching candidates", error });
  }
});
//Candidate_detail update
router.post("/Update_Candidate/:id", token_verification, async (req, res) => {
  try {
    const voter = req.user;
    if (voter.logout) {
      return res.status(400).json({ message: "You are logged out" });
    }
    const usertype = voter.Usertype;
    if (usertype === "Admin") {
      const change = req.params.id;
      const Id = req.body.Id;
      const candidate = await Candidate.findOne({ Id: Id });
      if (!candidate) {
        res
          .status(400)
          .json({ message: "there is no cndidate with this mentiond Id" });
      } else {
        if (change === "name") {
          const new_name = req.body.new_name;
          candidate.name = new_name;
          res
            .status(200)
            .json({ message: "Candidate name is changed sucessfully" });
        } else if (change === "party") {
          const new_party = req.body.new_party;
          candidate.party = new_party;
          res
            .status(200)
            .json({ message: "Candidate party name is changed sucessfully" });
        } else if (change === "Id") {
          const new_Id = req.body.new_Id;
          const another = await Candidate.findOne({ Id: new_Id });
          if (!another) {
            candidate.Id = new_Id;
            res
              .status(200)
              .json({ message: " Candidate Id is changed successfully" });
          } else {
            res.status(400).json({
              message:
                "This new_Id is already available for other candidate so can't change to this Id",
            });
          }
        } else {
          res.status(400).json({
            message: "You can only change candidate name, party and Id",
          });
        }
      }
      await candidate.save();
    } else {
      res.status(400).json({ message: "You are not an Admin" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching candidates", error });
  }
});
//Candidate delete
router.delete("/Delete_candidate/:id", token_verification, async (req, res) => {
  try {
    const voter = req.user;
    if (voter.logout) {
      return res.status(400).json({ message: "You are logged out" });
    }
    const usertype = req.user.Usertype; // Ensure token_verification middleware sets req.user
    const candidateId = req.params.id; // Extract the candidate's custom ID from the URL

    if (usertype === "Admin") {
      const response = await Candidate.deleteOne({ Id: candidateId }); // Use deleteOne directly with the custom ID

      if (response.deletedCount === 0) {
        return res
          .status(400)
          .json({ message: "There is no candidate with this ID to delete" });
      }
      return res
        .status(200)
        .json({ message: "The candidate detail is deleted successfully" });
    } else {
      return res
        .status(403)
        .json({ message: "Unauthorized: Only Admin can delete candidates" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting candidate", error });
  }
});
//Vote Count
router.get("/vote_count", token_verification, async (req, res) => {
  try {
    const voter = req.user;
    if (voter.logout) {
      return res.status(400).json({ message: "You are logged out" });
    }
    const usertype = voter.Usertype;
    if (usertype != "Admin") {
      return res
        .status(400)
        .json({ message: "You are not allowed to see vote count" });
    }
    const response = await Candidate.find().sort({ Vote_Count: "desc" });
    const final_response = response.map((candidate) => ({
      Candidate_name: candidate.name,
      Party: candidate.party,
      Vote_Count: candidate.Vote_Count,
    }));
    return res.status(200).json(final_response);
  } catch (error) {
    res.status(500).json({ message: "Error fetching candidates", error });
  }
});
//logout router
router.post("/logout", token_verification, async (req, res) => {
  try {
    const voter = req.user;
    if (voter.logout) {
      return res.status(400).json({ message: "You are logged out" });
    }
    voter.logout = true;
    await voter.save();
    res.status(200).json({ message: "You are logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error fetching candidates", error });
  }
});
module.exports = router;
