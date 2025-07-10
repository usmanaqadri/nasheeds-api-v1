const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

const verifyGoogleToken = async (code) => {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "postmessage",
        grant_type: "authorization_code",
      }),
    });

    const tokens = await response.json();

    if (!tokens.id_token) {
      return res.status(401).json({ message: "Failed to get ID token" });
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    console.log("here is error", error);
  }
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      picture: user.picture,
      admin: user.admin,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

module.exports = { isAuthenticated, verifyGoogleToken, generateToken };
