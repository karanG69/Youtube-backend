import {v2 as cloudinary} from "cloudinary";
import fs from "fs"; 

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
}); 

const uploadOnCloudinary = async (filePath) => {
    try {
        //console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
        //console.log("API key :", process.env.CLOUDINARY_API_KEY);
        //console.log("API secret :", process.env.CLOUDINARY_API_SECRET);

        if(!filePath) {
            throw new Error("File path is required");
            return null;
        } 
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
        });
        console.log("File uploaded to cloudinary: ", result.secure_url);
        fs.unlinkSync(filePath); // remove the file from local storage after uploading to cloudinary
        return result;
    }
    catch (error) {
        console.log("Error while uploading file to cloudinary: ", error);
        fs.unlinkSync(filePath); // remove the file from local storage if there is an error while uploading to cloudinary
        return null;
    }
}

export { uploadOnCloudinary };

