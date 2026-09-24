import mongoose from "mongoose";

import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandeler from "../utils/asyncHandeler.js";


const getChannelStats = asyncHandeler(async (req, res) => {

    const channelId = new mongoose.Types.ObjectId(req.user._id);

    // Get total videos and total views
    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: channelId
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: {
                    $sum: 1
                },
                totalViews: {
                    $sum: "$views"
                }
            }
        }
    ]);

    // Get total subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    });

    // Get total likes on channel's videos
    const videoIds = await Video.find({
        owner: channelId
    }).distinct("_id");

    const totalLikes = await Like.countDocuments({
        video: {
            $in: videoIds
        }
    });

    const stats = {
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalSubscribers,
        totalLikes
    };

    return res.status(200).json(
        new ApiResponse(
            200,
            stats,
            "Channel stats fetched successfully"
        )
    );
});


const getChannelVideos = asyncHandeler(async (req, res) => {

    const channelId = new mongoose.Types.ObjectId(req.user._id);

    const videos = await Video.find({
        owner: channelId
    })
        .sort({
            createdAt: -1
        });

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Channel videos fetched successfully"
        )
    );
});


export {
    getChannelStats,
    getChannelVideos
};