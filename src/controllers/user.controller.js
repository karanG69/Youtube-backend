import asyncHandeler from "../utils/asyncHandeler.js";
import ApiError from "../utils/ApiErrors.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


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

export { 
    refreshAccessToken,
    registerUser,
    loginUser,
    logoutUser
}