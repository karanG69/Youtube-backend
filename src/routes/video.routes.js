import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { publishAVideo } from "../controllers/video.controller.js";

const videoRoutes = Router();

console.log("VideoRouter reached");

videoRoutes.get("/test", (req, res) => {
    res.status(200).json({
        message: "Video routes are working"
    });
});

videoRoutes.route("/publish").post(upload.fields([{name: "video", maxCount: 1},{name: "thumbnail", maxCount: 1}]), verifyJWT, publishAVideo);

export default videoRoutes;


