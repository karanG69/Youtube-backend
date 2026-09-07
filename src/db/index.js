import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log("Connected to MongoDB");
    }catch (error) {
        console.log("Error while connecting to MongoDB", error);
    }
};

export default connectDB;