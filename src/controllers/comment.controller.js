import mongoose from "mongoose";

import { Comment } from "../models/comment.model.js";
import  ApiError  from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  asyncHandeler  from "../utils/asyncHandeler.js";


const getVideoComments = asyncHandeler(async (req, res) => {

    const { videoId } = req.params;

    const {
        page = 1,
        limit = 10
    } = req.query;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const comments = await Comment.find({
        video: videoId
    })
        .populate("owner", "userName fullName avatar")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

    const totalComments = await Comment.countDocuments({
        video: videoId
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                totalComments,
                currentPage: Number(page),
                totalPages: Math.ceil(
                    totalComments / Number(limit)
                )
            },
            "Comments fetched successfully"
        )
    );
});


const addComment = asyncHandeler(async (req, res) => {

    const { videoId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    });

    const createdComment = await Comment.findById(comment._id)
        .populate("owner", "userName fullName avatar");

    return res.status(201).json(
        new ApiResponse(
            201,
            createdComment,
            "Comment added successfully"
        )
    );
});


const updateComment = asyncHandeler(async (req, res) => {

    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Only comment owner can update it
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this comment"
        );
    }

    comment.content = content.trim();

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
        .populate("owner", "userName fullName avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedComment,
            "Comment updated successfully"
        )
    );
});


const deleteComment = asyncHandeler(async (req, res) => {

    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Only comment owner can delete it
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this comment"
        );
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    );
});


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};