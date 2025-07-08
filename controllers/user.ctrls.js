const db = require("../models");
const { generateToken, verifyGoogleToken } = require("../utils/helperFuncs");

const index = (req, res) => {
  db.User.find({}, (error, users) => {
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      users,
      requestedAt: new Date().toLocaleString(),
    });
  });
};

const auth = async (req, res) => {
  const { token: googleToken } = req.body;
  try {
    const googleUser = await verifyGoogleToken(googleToken);

    // Example user object
    const user = {
      googleId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      admin: false,
    };

    // Check if user exists in MongoDB
    let existingUser = await db.User.findOne({ googleId: user.googleId });
    if (!existingUser) {
      existingUser = await db.User.create(user);
    }

    console.log("do we make it here?");
    console.log("do i have an existing user", existingUser);
    const token = generateToken(existingUser);
    console.log("do I get a token", token);

    return res.status(200).json({ token });
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Authentication failed", error: err });
  }
};

const seed = (req, res) => {
  db.User.create(
    {
      googleId: "blahblah",
      name: "Usman Qadri",
      email: "usmanaqadri@gmail.com",
      admin: true,
    },
    (err, createdUser) => {
      if (err) {
        return res.status(404).json({ message: err.message, code: err.code });
      }
      return res.status(200).json(createdUser);
    }
  );
};

const create = (req, res) => {
  db.User.create(req.body, (err, createdUser) => {
    if (err)
      return res.status(404).json({ message: err.message, code: err.code });

    return res.status(200).json(createdUser);
  });
};

const update = (req, res) => {
  db.User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true },
    (err, updatedUser) => {
      if (err) return res.status(400).json({ error: err });
      return res.status(200).json(updatedUser);
    }
  );
};

const show = (req, res) => {
  db.User.findById(req.params.id, (error, foundUser) => {
    if (error) return res.status(400).json({ error });
    return res.status(200).json({ foundUser });
  });
};

const destroy = (req, res) => {
  db.User.findByIdAndDelete(req.params.id, (err, deletedUser) => {
    if (!deletedUser) return res.status(400).json({ error: "User not found" });
    if (err) return res.status(400).json({ err });
    return res.status(200).json({
      message: `User ${deletedUser.name} was successfully deleted`,
    });
  });
};

const echo = (req, res) => {
  const { message } = req.body;
  return res.status(200).json(message);
};

module.exports = { index, auth, seed, create, echo, show, update, destroy };
