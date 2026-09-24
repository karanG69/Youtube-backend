import mongoose, { isValidObjectId } from "mongoose";

import { Playlist } from "../models/playlist.model.js";

import  ApiError  from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  asyncHandeler  from "../utils/asyncHandeler.js";


const createPlaylist = asyncHandeler(async (req, res) => {

    const { name, description } = req.body;

    if (!name?.trim()) {
        throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description?.trim() || "",
        owner: req.user._id,
        videos: []
    });

    const createdPlaylist = await Playlist.findById(playlist._id)
        .populate("owner", "userName fullName avatar");

    if (!createdPlaylist) {
        throw new ApiError(500, "Failed to create playlist");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            createdPlaylist,
            "Playlist created successfully"
        )
    );
});


const getUserPlaylists = asyncHandeler(async (req, res) => {

    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const playlists = await Playlist.find({
        owner: userId
    })
        .populate("owner", "userName fullName avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(
            200,
            playlists,
            "User playlists fetched successfully"
        )
    );
});


const getPlaylistById = asyncHandeler(async (req, res) => {

    const { playlistId } = req.params;

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate("owner", "userName fullName avatar")
        .populate(
            "videos",
            "videoFile thumbnail title description duration views createdAt"
        );

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Playlist fetched successfully"
        )
    );
});


const addVideoToPlaylist = asyncHandeler(async (req, res) => {

    const { playlistId, videoId } = req.params;

    if (
        !mongoose.isValidObjectId(playlistId) ||
        !mongoose.isValidObjectId(videoId)
    ) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Only playlist owner can modify it
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to modify this playlist"
        );
    }

    // Prevent duplicate videos
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(
            409,
            "Video already exists in playlist"
        );
    }

    playlist.videos.push(videoId);

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Video added to playlist successfully"
        )
    );
});


const removeVideoFromPlaylist = asyncHandeler(async (req, res) => {

    const { playlistId, videoId } = req.params;

    if (
        !mongoose.isValidObjectId(playlistId) ||
        !mongoose.isValidObjectId(videoId)
    ) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to modify this playlist"
        );
    }

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(
            404,
            "Video does not exist in playlist"
        );
    }

    playlist.videos = playlist.videos.filter(
        (id) => id.toString() !== videoId.toString()
    );

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Video removed from playlist successfully"
        )
    );
});


const deletePlaylist = asyncHandeler(async (req, res) => {

    const { playlistId } = req.params;

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this playlist"
        );
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Playlist deleted successfully"
        )
    );
});


const updatePlaylist = asyncHandeler(async (req, res) => {

    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if (!name?.trim()) {
        throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this playlist"
        );
    }

    playlist.name = name.trim();
    playlist.description = description?.trim() || "";

    await playlist.save();

    const updatedPlaylist = await Playlist.findById(playlistId)
        .populate("owner", "userName fullName avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Playlist updated successfully"
        )
    );
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
};