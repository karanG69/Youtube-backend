import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import  ApiError  from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  asyncHandeler  from "../utils/asyncHandeler.js";


const createTweet = asyncHandeler(async (req, res) => {

    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required");
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    });

    const createdTweet = await Tweet.findById(tweet._id)
        .populate("owner", "userName fullName avatar");

    if (!createdTweet) {
        throw new ApiError(500, "Failed to create tweet");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            createdTweet,
            "Tweet created successfully"
        )
    );
});


const getUserTweets = asyncHandeler(async (req, res) => {

    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const tweets = await Tweet.find({
        owner: userId
    })
        .populate("owner", "userName fullName avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(
            200,
            tweets,
            "User tweets fetched successfully"
        )
    );
});


const updateTweet = asyncHandeler(async (req, res) => {

    const { tweetId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content is required");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // Only the owner can update the tweet
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this tweet"
        );
    }

    tweet.content = content.trim();

    await tweet.save();

    const updatedTweet = await Tweet.findById(tweet._id)
        .populate("owner", "userName fullName avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully"
        )
    );
});


const deleteTweet = asyncHandeler(async (req, res) => {

    const { tweetId } = req.params;

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // Only the owner can delete the tweet
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this tweet"
        );
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Tweet deleted successfully"
        )
    );
});


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
};