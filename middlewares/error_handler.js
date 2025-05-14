const jwt = require("jsonwebtoken");
const { Token } = require("../models/token");

async function errorHandler(error, req, res, next) {
  if (error.name === "UnauthorizedError") {
    if (!error.message.includes("jwt expired")) {
      return res.status(error.status).json({
        type: error.name,
        message: error.message,
      });
    }
    try {
      const tokenHeader = req.header("Authorization");
      const accesToken = tokenHeader.replace("Bearer ", "").trim();
      let token = await token.findOne({
        accesToken,
        refreshToken: { $exists: true },
      });
      if (!token) {
        return res.status(401).json({
          type: "Unauthorized",
          message: "Token does not exist",
        });
      }
      const userData = jwt.verify(token.refreshToken, process.env.JWT_SECRET);
      const user = await user.findById(userData.id);
      if (!user) {
        return res.status(401).json({
          type: "Unauthorized",
          message: "Invalid user!",
        });
      }
      const newAccessToken = jwt.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "24h" }
      );

      req.headers["Authorization"] = `Bearer ${newAccessToken}`;
      await Token.updateOne({_id: token.id}, { accesToken: newAccessToken }).exec();

      res.set("Authorization", `Bearer ${newAccessToken}`);

      return next();

    } catch (refreshError) {
      return res.status(401).json({
        type: "Unauthorized",
        message: refreshError.message,
      });
    }
  }
  return res.status(error.status).json({
    type: error.name,
    message: error.message,
  });
}


module.exports = errorHandler;