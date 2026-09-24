import asyncHandeler from "../utils/asyncHandeler.js";
import ApiError from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshTokens = async(userId)=>{
    try{    
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false});

        return {accessToken, refreshToken};

    }catch(error){
        throw new ApiError(500, "Something went wrong while genrating refresh and access tokens")
    }
}


const registerUser = asyncHandeler(async (req, res) => {
    //get the user from the request
    //validate the user input
    //check if the user already exists
    //check if the avatar and cover image are present
    //upload the avatar and cover image to cloudinary
    //create the user object and create entry in the database
    //removing the password and refresh token from the response object
    //check if the user is created successfully and send the response back to the client


    const { userName, email, fullName, password } = req.body;

    //check if any of the required fields are missing
    if(
        [fullName, userName, email, password].some((field) => field.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }


    //check if the user already exists
    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if(existingUser){
        throw new ApiError(409, "Username or email already exists");
    }   

    //
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }   


    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(500, "Failed to upload avatar to cloudinary");
    }


    const user = await User.create({
        userName: userName.toLowerCase(),
        email,
        fullName,
        password,
        avatar: avatar.secure_url,
        coverImage: coverImage?.secure_url || "",
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser) {  
        throw new ApiError(500, "Failed to create user");
    }
    
    res.status(201).json(new ApiResponse(201, "User registered successfully", createdUser));

})


const loginUser = asyncHandeler(async(req, res)=>{

    console.log("loginUser Reached")
    //req body -> data
    //userName or email
    //find the user
    //password check
    //generate access and refresh token

    const{email, userName, password} = req.body;
    if(!userName && !email){
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{userName}, {email}]
    });
    if(!user){
        throw new ApiError(404, "User does not exist!");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid Password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }
    
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandeler(async(req, res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: { 
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res  
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})

const refreshAccessToken = asyncHandeler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
       throw new ApiError(401, "Unauthorized Request"); 
    }
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);

    if(!user){
        throw new ApiError(401, "Invalid RefreshToken");
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "RefreshToken is expired or used");
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken,
                },
                "Access token refreshed"
        )
    )

})

const changeCurrentPassword = asyncHandeler(async(req, res)=>{

    const {currentPassword, updatedPassword} = req.body;

    const user = await User.findById(req.user._id);

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if(!isPasswordCorrect){
        throw new ApiError(401, "wrong password");
    }

    user.password = updatedPassword;
    
    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            {},
            "Password updated successfull"
        )
    )
});

// const updateAccountDetails = asyncHandeler(async(req, res)=>{
//     const {updtaedFullName, updatedUserName, updatedEmail} = req.body;
// });

// const getCurrentUser = asyncHandeler(async(req, res)=>{

// });

// const updateUserAvatar = asyncHandeler(async(req, res)=>{

// });

const getUserChannelProfile = asyncHandeler(async (req, res) => {

    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriptions"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscriptionsCount: {
                    $size: "$subscriptions"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [
                                req.user?._id,
                                "$subscribers.subscriber"
                            ]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                subscriptionsCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            channel[0],
            "User channel fetched successfully"
        )
    );
});

const getWatchHistory = asyncHandeler(async (req, res) => {

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                watchHistory: 1
            }
        }
    ]);

    if (!user.length) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    );
});

export { 
    getWatchHistory,
    getUserChannelProfile,
    changeCurrentPassword,
    refreshAccessToken,
    registerUser,
    loginUser,
    logoutUser
}