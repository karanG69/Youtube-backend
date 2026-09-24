import { Router } from "express";

import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const commentRoutes = Router();

commentRoutes.route("/:videoId").get(
    getVideoComments
);

commentRoutes.route("/:videoId").post(
    verifyJWT,
    addComment
);


commentRoutes.route("/c/:commentId").patch(
    verifyJWT,
    updateComment
);

commentRoutes.route("/c/:commentId").delete(
    verifyJWT,
    deleteComment
);

export default commentRoutes;