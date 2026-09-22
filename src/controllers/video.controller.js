import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandeler from "../utils/asyncHandeler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// const getAllVideos = asyncHandeler(async(requestAnimationFrame, res)=>{

// });;

const publishAVideo = asyncHandeler(async(req, res)=>{
    //get title and descriptiomn from body

    //console.log("Video upload controller reached");

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

// const getVideoById = asyncHandeler(async(req, res)=>{
    
// });

// const updateVideo = asyncHandeler(async(req, res)=>{

// });

// const deleteVideo = asyncHandeler(async(req, res)=>{

// });

export {
    publishAVideo
}
