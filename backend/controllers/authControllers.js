import { redis } from "../lib/redis.js";
import User from "../models/Usermodel.js";
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "15d",
  });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    15 * 24 * 60 * 60
  );
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", //prevents CSRF ,cross-site request attack
    maxAge: 15 * 60 * 1000, //15min
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", //prevents CSRF ,cross-site request attack
    maxAge: 15 * 24 * 60 * 60 * 1000, //15min
  });
};

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateToken(user._id);

    await storeRefreshToken(user._id, refreshToken);

    setCookies(res, accessToken, refreshToken);

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "User created successful",
    });
  } catch (error) {
    console.log("Error in signup", error.message);
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: "USER NOT FOUND" });

    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateToken(user._id);

      await storeRefreshToken(user._id, refreshToken);

      setCookies(res, accessToken, refreshToken);

      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: "Unpassed" });
    }
  } catch (error) {
    console.log("Error in login", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token found" });
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: " Logged out successfully" });
  } catch (error) {
    console.log("Error in logout", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// refreshing accesstoken to user

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token provide" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "15m",
      }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", //prevents CSRF ,cross-site request attack
      maxAge: 15 * 60 * 1000, //15min
    });

    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.log("Error in refreshing Token", error.message);
    res.status(500).json({ message: "server error", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      console.log("not sent profile")
      return res.status(401).json({ message: "User not authenticated" });
  }
    res.json(req.user);
  } catch (error) {
    res.status(400).json({message: "Server error", error: error.message})
  }
};

// res.status(500).json({message:error.message})
