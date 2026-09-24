import { Router } from "express";

import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const tweetRoutes = Router();

tweetRoutes.route("/")
    .post(
        verifyJWT,
        createTweet
    );

tweetRoutes.route("/user/:userId")
    .get(
        getUserTweets
    );

tweetRoutes.route("/:tweetId")
    .patch(
        verifyJWT,
        updateTweet
    )
    .delete(
        verifyJWT,
        deleteTweet
    );

export default tweetRoutes;