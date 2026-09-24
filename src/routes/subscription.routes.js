import { Router } from "express";

import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const subscriptionRoutes = Router();

subscriptionRoutes.route("/c/:channelId").post(
    verifyJWT,
    toggleSubscription
);

subscriptionRoutes.route("/c/:channelId").get(
    verifyJWT,
    getUserChannelSubscribers
);

subscriptionRoutes.route("/u/:subscriberId").get(
    verifyJWT,
    getSubscribedChannels
);

export default subscriptionRoutes;