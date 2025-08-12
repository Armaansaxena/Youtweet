import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const sortOrder = sortType === "asc" ? 1 : -1;
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  // Sanitize and ensure query is a string
  const searchQuery = typeof query === "string" ? query.trim() : "";

  const matchStage = {
    $match: {
      $or: [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
      ],
    },
  };

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    // If userId specified, filter by that user (show ALL videos)
    matchStage.$match.owner = new mongoose.Types.ObjectId(userId);
    // Note: no isPublished filter here to show private and public videos for user
  } else {
    // Public feed: only show published videos
    matchStage.$match.isPublished = true;
  }

  const filteredPaginatedVideos = await Video.aggregatePaginate(
    Video.aggregate([
      matchStage,
      {
        $sort: {
          [sortBy]: sortOrder,
        },
      },
    ]),
    options
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      { videos: filteredPaginatedVideos },
      "Sorted filtered videos with pagination fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Video title and description is required");
  }

  let thumbnailUrl;

  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length
  ) {
    thumbnailUrl = await uploadOnCloudinary(req.files.thumbnail[0].path);
  } else {
    throw new ApiError(400, "Thumbnail file is missing");
  }
  let videoUrl;
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length
  ) {
    videoUrl = await uploadOnCloudinary(req.files.videoFile[0].path);
  } else {
    throw new ApiError(400, "Video file is missing");
  }

  if (!thumbnailUrl || !videoUrl) {
    throw new ApiError(500, "Error uploading video or thumbnail");
  }

  const newVideo = await Video.create({
    title: title.trim(),
    description: description.trim(),
    thumbnail: thumbnailUrl.url,
    videoFile: videoUrl.url,
    owner: req.user?._id,
    duration: videoUrl.duration,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        video: newVideo,
      },
      "New video has been uploaded successfully"
    )
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) {
    throw new ApiError(400, "Video id is not provided");
  }
  const fullVideo = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
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
      $project: {
        owner: 0,
      },
    },
  ]);
  if (!fullVideo.length) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        fullVideo: fullVideo[0],
      },
      "Video and details fetched successfully"
    )
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  //TODO: update video details like title, description, thumbnail
  if (!videoId) {
    throw new ApiError(400, "Video id not provided");
  }
  if (!title && !description && req.file) {
    throw new ApiError(
      400,
      "Title, description and thumbnail needs to be updated"
    );
  }

  const existingVideo = await Video.findById(videoId);

  console.log("existingVideo.owner:", String(existingVideo.owner));
  console.log("req.user._id:", String(req.user._id));
  console.log(
    "Comparison result:",
    String(existingVideo.owner) === String(req.user._id)
  );

  if (!existingVideo) {
    throw new ApiError(404, "video not found");
  }

  const oldThumbnail = existingVideo.thumbnail;

  if (String(existingVideo.owner) !== req.user?._id) {
    throw new ApiError(402, "Unauthorized for this action");
  }

  const thumbnailPath = req.file?.path;
  const thumbnailUrl = await uploadFile(thumbnailPath);

  existingVideo.title = title?.trim() || existingVideo.title;
  existingVideo.description = description?.trim() || existingVideo.description;
  existingVideo.thumbnail = thumbnailUrl || existingVideo.thumbnail;

  await existingVideo.save();

  if (thumbnailUrl) {
    await deleteFile(oldThumbnail);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        newVideo: existingVideo,
      },
      "video updated successfully"
    )
  );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!videoId) {
    throw new ApiError(400, "video id is not provided");
  }

  const existingVideo = await Video.findById(videoId);

  if (!existingVideo) {
    throw new ApiError(404, "video not found");
  }
  const oldThumbnail = existingVideo.thumbnail;
  const oldVideo = existingVideo.videoFile;
  if (String(existingVideo.owner) !== req.user?._id) {
    throw new ApiError(402, "unauthorized to perform this action");
  }

  await Video.findByIdAndDelete(videoId);
  await deleteFile(oldThumbnail);
  await deleteFile(oldVideo);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "video id is not provided");

  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) throw new ApiError(404, "video not found");

  console.log("existingVideo.owner:", String(existingVideo.owner));
  console.log("req.user._id:", String(req.user._id));
  console.log(
    "Comparison:",
    String(existingVideo.owner) === String(req.user._id)
  );

  if (String(existingVideo.owner) !== String(req.user._id)) {
    throw new ApiError(402, "unauthorized to perform this action");
  }

  existingVideo.isPublished = !existingVideo.isPublished;
  await existingVideo.save();

  const status = existingVideo.isPublished ? "Published" : "Unpublished";
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { video: existingVideo, status },
        `video has been ${status.toLowerCase()} successfully`
      )
    );
});

const getUserVideos = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const videos = await Video.find({ owner: userId })
    .sort({ createdAt: -1 }) // optional: newest first
    .populate("owner", "username avatar") // optional: populate channel info
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "User videos fetched successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getUserVideos,
};
