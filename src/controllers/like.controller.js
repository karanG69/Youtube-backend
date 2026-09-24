import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import  ApiError  from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandeler from "../utils/asyncHandeler.js"

const toggleVideoLike = asyncHandeler(async (req, res) => {

    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    if (existingLike) {

        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Video unliked successfully"
            )
        );
    }

    await Like.create({
        video: videoId,
        likedBy: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            {},
            "Video liked successfully"
        )
    );
});

const toggleCommentLike = asyncHandeler(async (req, res) => {

    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    if (existingLike) {

        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Comment unliked successfully"
            )
        );
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            {},
            "Comment liked successfully"
        )
    );
});

const toggleTweetLike = asyncHandeler(async (req, res) => {

    const { tweetId } = req.params;

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });

    if (existingLike) {

        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Tweet unliked successfully"
            )
        );
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            {},
            "Tweet liked successfully"
        )
    );
});

const getLikedVideos = asyncHandeler(async (req, res) => {

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: {
                    $exists: true,
                    $ne: null
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        {
            $unwind: "$video"
        },
        {
            $lookup: {
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                _id: 0,
                video: {
                    _id: "$video._id",
                    videoFile: "$video.videoFile",
                    thumbnail: "$video.thumbnail",
                    title: "$video.title",
                    description: "$video.description",
                    duration: "$video.duration",
                    views: "$video.views",
                    createdAt: "$video.createdAt"
                },
                owner: {
                    _id: "$owner._id",
                    userName: "$owner.userName",
                    fullName: "$owner.fullName",
                    avatar: "$owner.avatar"
                }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            likedVideos,
            "Liked videos fetched successfully"
        )
    );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}