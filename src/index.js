// import dotenv from "dotenv";
// dotenv.config({path: "./.env"});
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
// import express from "express";
import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
.then(() => {
    app.on("error", (err) => {
        console.log("Error: ", err);
    });
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.log("Error while connecting to database", error);
});

// const app = express();

// (async () => {
//     try {
//     await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//         app.on("error", (err) => {
//             console.log("Error: ", err);
//         });
//         app.listen(process.env.PORT, () => {
//             console.log(`Server is running on port ${process.env.PORT}`);
//         });
//         console.log("Connected to MongoDB");
//     }
//     catch (error) {
//         console.log("Error while connecting to MongoDB", error);
//     }
// })();