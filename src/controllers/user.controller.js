import asyncHandeler from "../utils/asyncHandeler.js";
import ApiError from "../utils/ApiErrors.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";


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

export { registerUser };