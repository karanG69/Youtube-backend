import mongoose, {isValidObjectId} from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import  asyncHandeler  from "../utils/asyncHandeler.js"
import ApiError from "../utils/ApiErrors.js"


const toggleSubscription = asyncHandeler(async (req, res) => {

    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Don't allow user to subscribe to themselves
    if (channelId.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    // Check if channel exists
    const channel = await User.findById(channelId);

    if (!channel) {
        throw new ApiError(404, "Channel does not exist");
    }

    // Check existing subscription
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    if (existingSubscription) {

        // Already subscribed -> unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id);

        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Channel unsubscribed successfully"
            )
        );
    }

    // Not subscribed -> subscribe
    await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            {},
            "Channel subscribed successfully"
        )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandeler(async (req, res) => {

    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.find({
        channel: channelId
    })
        .populate("subscriber", "userName fullName avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers,
            "Channel subscribers fetched successfully"
        )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandeler(async (req, res) => {

    const { subscriberId } = req.params;

    if (!mongoose.isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const subscriptions = await Subscription.find({
        subscriber: subscriberId
    })
        .populate("channel", "userName fullName avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            subscriptions,
            "Subscribed channels fetched successfully"
        )
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}