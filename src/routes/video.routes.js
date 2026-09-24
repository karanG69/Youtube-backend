import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    publishAVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo
} from "../controllers/video.controller.js";

const videoRoutes = Router();

// Publish video
videoRoutes.route("/publish").post(
    verifyJWT,
    upload.fields([
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
);

// Get all videos
videoRoutes.route("/").get(
    getAllVideos
);

// Get, update and delete a specific video
videoRoutes.route("/:videoId")
    .get(getVideoById)
    .patch(
        verifyJWT,
        upload.single("thumbnail"),
        updateVideo
    )
    .delete(
        verifyJWT,
        deleteVideo
    );

export default videoRoutes;