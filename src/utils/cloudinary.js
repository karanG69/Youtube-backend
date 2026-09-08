import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: 'yovxstem',
    api_key: '182171519998327',
    api_secret: '268bnob2mJrFE7FEVM7gF1pJ5Ok'
});  

const uploadOnCloudinary = async (filePath) => {
    try {
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

