import { ApiResponse } from "../utils/ApiResponse.js";
import  asyncHandeler  from "../utils/asyncHandeler.js";

const healthcheck = asyncHandeler(async (req, res) => {

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    status: "OK"
                },
                "Server is healthy"
            )
        );
});

export {
    healthcheck
};