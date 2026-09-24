import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandeler from "../utils/asyncHandeler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";


const getAllVideos = asyncHandeler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    const match = {
        isPublished: true
    };

    // Search by title or description
    if (query) {
        match.$or = [
            {
                title: {
                    $regex: query,
                    $options: "i"
                }
            },
            {
                description: {
                    $regex: query,
                    $options: "i"
                }
            }
        ];
    }

    // Filter by user
    if (userId) {
        if (!mongoose.isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        match.owner = new mongoose.Types.ObjectId(userId);
    }

    // Sort
    const sort = {};
    sort[sortBy] = sortType === "asc" ? 1 : -1;

    const pipeline = [
        {
            $match: match
        },
        {
            $sort: sort
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: {
                path: "$owner",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                owner: {
                    _id: 1,
                    username: 1,
                    avatar: 1
                }
            }
        }
    ];

    const options = {
        page: Number(page),
        limit: Number(limit)
    };

    const videos = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        options
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Videos fetched successfully"
        )
    );
});


const publishAVideo = asyncHandeler(async(req, res)=>{

    const { title, description } = req.body;
    if([title, description].some((field) => field.trim() === "")){
        throw new ApiError(400, "All fields are required");
    }


    //videoFile and thumbnail localPath from multer and upload them on cloudinary

    const videoLocalPath = req.files?.video[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(400, "video file and thumbnail are required");
    }
    
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    
    if(!videoFile || !thumbnail){
        throw new ApiError(500, "Falied to upload on cloudinary");
    }

    const owner = await User.findById(req.user._id);
    
    const video = await Video.create({
        videoFile: videoFile.secure_url,
        thumbnail: thumbnail.secure_url,
        title,
        description,
        owner,
        duration: videoFile.duration,
        isPublished: true
    })

    const publishedVideo = await Video.findById(video._id);

    if(!publishedVideo){
        throw new ApiError(500, "Failed to publish video");
    }
    
    res.status(200).json(new ApiResponse(200, "Published Video Successfully", publishedVideo));
});


 const getVideoById = asyncHandeler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId)
        .populate("owner", "username avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video fetched successfully"
        )
    );
});

const updateVideo = asyncHandeler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const { title, description } = req.body;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    // Update title
    if (title?.trim()) {
        video.title = title.trim();
    }

    // Update description
    if (description?.trim()) {
        video.description = description.trim();
    }

    // Update thumbnail if provided
    const thumbnailLocalPath = req.file?.path;

    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnail) {
            throw new ApiError(500, "Failed to upload thumbnail");
        }

        video.thumbnail = thumbnail.secure_url;
    }

    await video.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video updated successfully"
        )
    );
});

const deleteVideo = asyncHandeler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this video"
        );
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Video deleted successfully"
        )
    );
});

export {
    deleteVideo,
    updateVideo,
    getVideoById,
    getAllVideos,
    publishAVideo
}
