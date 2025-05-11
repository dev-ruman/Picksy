const { validationResult } = require("express-validator");
const { User } = require("../models/user");
const bcrypt = require("bcryptjs");
const JsonWebToken = require("jsonwebtoken");
const { Token } = require("../models/token");
const emailSender = require("../helpers/email_sender");
require("dotenv/config");

exports.login = async function (req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        type: "AuthError",
        message: "User not found",
      });
    }
    if (!bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(400).json({
        type: "AuthError",
        message: "Incorrect password",
      });
    }

    const accessToken = JsonWebToken.sign(
      { id: user.id, isAdmin: user.isAdmin },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "24h" }
    );
    const refreshToken = JsonWebToken.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "60d" }
    );

    const token = await Token.findOne({ userId: user.id });
    if (token) await token.deleteOne({ userId: user.id });
    await new Token({
      userId: user.id,
      refreshToken,
      accessToken,
    }).save();

    user.passwordHash = undefined;
    return res.json({ ...user._doc, accessToken });
  } catch (error) {
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};
exports.register = async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => {
      return { field: error.path, message: error.msg };
    });
    return res.status(422).json({ errors: errorMessages });
  }

  try {
    let user = new User({
      ...req.body,
      passwordHash: bcrypt.hashSync(req.body.password, 8),
    });
    user = await user.save();

    if (!user) {
      return res.status(500).json({
        type: "InternalServerError",
        message: "User registration failed",
      });
    }

    return res.status(201).json(user);
  } catch (error) {
    if (error.message.includes("email_1 dup key")) {
      return res.status(409).json({
        type: "AuthError",
        message: "Email already exists",
      });
    }
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};
exports.verifyToken = async function (req, res) {
  try {
    let accessToken = req.headers.authorization;
    if (!accessToken) return res.json(false);
    accessToken = accessToken.replace("Bearer ", "");

    const token = await Token.findOne({ accessToken });
    if (!token) return res.json(false);

    const tokenData = JsonWebToken.decode(token.refreshToken);

    const user = await User.findById(tokenData.id);
    if (!user) return res.json(false);

    const isValid = JsonWebToken.verify(
      token.refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!isValid) return res.json(false);
    return res.json(true);
  } catch (error) {
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};
exports.forgotPassword = async function (req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        type: "AuthError",
        message: "User not found",
      });
    }
    const otp = Math.floor(1000 + Math.random() * 9000);

    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 600000;

    await user.save();

    const response = await emailSender.sendEmail(
      email,
      "Reset Password",
      `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`
    );

    return res.json({ message: response });
  } catch (error) {
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};
exports.verifyOtp = async function (req, res) {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        type: "AuthError",
        message: "User not found",
      });
    }

    if (
      user.resetPasswordOtp !== otp ||
      user.resetPasswordExpires < Date.now()
    ) {
      return res.status(401).json({
        type: "AuthError",
        message: "Invalid or expired OTP",
      });
    }
    user.resetPasswordOtp = 1;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.json({ message: "OTP verified successfully" });
  } catch (error) {
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};
exports.resetPassword = async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => {
      return { field: error.path, message: error.msg };
    });
    return res.status(422).json({ errors: errorMessages });
  }
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        type: "AuthError",
        message: "User not found",
      });
    }

    if (user.resetPasswordOtp !== 1) {
      return res.status(401).json({
        type: "AuthError",
        message: "OTP not verified",
      });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 8);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};

exports.logout = async function (req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        type: "AuthError",
        message: "Refresh token not provided",
      });
    }
    const token = await Token.findOne({ refreshToken });
    if (!token) {
      return res.status(404).json({
        type: "AuthError",
        message: "Token not found",
      });
    }
    await token.deleteOne({ refreshToken });
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};
