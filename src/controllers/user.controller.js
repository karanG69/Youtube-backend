import asyncHandeler from "../utils/asyncHandeler.js";
import ApiError from "../utils/ApiErrors.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";


const registerUser = asyncHandeler(async (req, res) => {

    const { username, email, fullname, password } = req.body;
    if(
        [fullname, username, email, password].some((field) => field.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if(existingUser){
        throw new ApiError(409, "Username or email already exists");
    }   

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
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: avatar.secure_url,
        coverImage: coverImage?.secure_url || "",
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser) {  
        throw new ApiError(500, "Failed to create user");
    }
    
    return res.status(201).json(new ApiResponse(201, "User registered successfully", createdUser));

})

export { registerUser };