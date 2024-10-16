import mongoose from "mongoose";


export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(process.env.MONGO_URI)
        console.log("Mongo connected successfully")
    } catch (error) {
        console.log("Error connecting to mongoDB",error.message)
        process.exit(1)
    }
}