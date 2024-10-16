import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cartRoutes from "./routes/cartRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import couponRoutes from './routes/couponRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import cors from 'cors'
import path from 'path'



dotenv.config();

connectDB();

const app = express();
app.use(cors())

const PORT = process.env.PORT || 5000;


const __dirname = path.resolve()

// Middleware to parse JSON requests
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);


if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname,"/frontend/dist")));


  app.get("*",(req,res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"))
  })
}

app.listen(PORT, () => {
  console.log(`Server connected and running on port ${PORT}`);
});

// zuVV9Y20TdIusPGW
