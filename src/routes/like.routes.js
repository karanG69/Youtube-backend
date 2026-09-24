import { Router } from "express";

import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
} from "../controllers/like.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const likeRoutes = Router();

// Video like / unlike
likeRoutes.route("/video/:videoId").post(
    verifyJWT,
    toggleVideoLike
);

// Comment like / unlike
likeRoutes.route("/comment/:commentId").post(
    verifyJWT,
    toggleCommentLike
);

// Tweet like / unlike
likeRoutes.route("/tweet/:tweetId").post(
    verifyJWT,
    toggleTweetLike
);

// Get videos liked by current user
likeRoutes.route("/videos").get(
    verifyJWT,
    getLikedVideos
);

export default likeRoutes;