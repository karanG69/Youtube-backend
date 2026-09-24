import { Router } from "express";

import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const playlistRoutes = Router();

playlistRoutes.route("/")
    .post(verifyJWT, createPlaylist);

playlistRoutes.route("/user/:userId")
    .get(getUserPlaylists);

playlistRoutes.route("/:playlistId")
    .get(getPlaylistById)
    .patch(verifyJWT, updatePlaylist)
    .delete(verifyJWT, deletePlaylist);

playlistRoutes.route("/:playlistId/videos/:videoId")
    .post(verifyJWT, addVideoToPlaylist)
    .delete(verifyJWT, removeVideoFromPlaylist);

export default playlistRoutes;