import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscriptions.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!channelId) {
        throw new ApiError(400, "Channel id not found")
    }
    if (String(channelId) === String(req.user?.id)) {
        throw new ApiError(400, "User can't subscibed its own channel")
    }

    const isChannelExist = await User.exists({ _id: channelId })
    
    if (!isChannelExist) {
        throw new ApiError(404, "Channel does not exist")
    }

    const subscription = await Subscription.findOne({channel: channelId, subscriber: req.user?.id})

    let isSubscribed
    if (subscription) {
        await subscription.deleteOne()
        isSubscribed: false
    }
    else {
        await Subscription.create({
            channel: channelId,
            subscriber: req.user?.id
        })
        isSubscribed = true
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, `Channel has been ${isSubscribed ? "Subscribed" : "Unsubscribed"} successfully  `))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!subscriberId) {
        throw new ApiError(400, "Subscriber ID is required");
    }

    const isSubscriberExist = await User.exists({ _id: subscriberId });
    if (!isSubscriberExist) {
        throw new ApiError(404, "Subscriber not found with this ID");
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelInfo",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "$channelInfo",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                username: "$channelInfo.username",
                fullName: "$channelInfo.fullName",
                avatar: "$channelInfo.avatar"
            }
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                avatar: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, { subscriptions }, "Subscribed channels fetched successfully")
    );
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!subscriberId) {
        throw new ApiError(400, "subscriber id is required");
    }

    const isSubscriberExist = await User.exists({ _id: subscriberId });

    if (!isSubscriberExist) {
        return res.status(200).json(
        new ApiResponse(
            200,
            { subscriber: [] },
            "No subscriptions found for this subscriber id"
        )
    );
    }

    const channelList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelInfo",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: {
                path: "$channelInfo",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $addFields: {
                username: "$channelInfo.username",
                fullName: "$channelInfo.fullName",
                avatar: "$channelInfo.avatar",
            },
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                avatar: 1,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            { subscriber: channelList },
            "all channel details subscribed by the subscriber are fetched successfully"
        )
    );
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}