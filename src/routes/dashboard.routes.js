import { Router } from "express";

import {
    getChannelStats,
    getChannelVideos
} from "../controllers/dashboard.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const dashboardRoutes = Router();

dashboardRoutes.route("/stats").get(
    verifyJWT,
    getChannelStats
);

dashboardRoutes.route("/videos").get(
    verifyJWT,
    getChannelVideos
);

export default dashboardRoutes;