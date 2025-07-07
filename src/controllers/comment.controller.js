import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  const isVideoExist = await Video.exists({ _id: videoId });

  if (!isVideoExist) {
    throw new ApiError(404, "Video not found");
  }
  const { page = 1, limit = 10 } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const paginatedVideoComments = await Comment.aggregatePaginate(
    Comment.aggregate([
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "owner",
          as: "commentUser",
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$commentUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          username: "$commentUser.username",
          avatar: "$commentUser.avatar",
        },
      },
      {
        $project: {
          content: 1,
          createdAt: 1,
          updatedAt: 1,
          username: 1,
          avatar: 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]),
    options
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments: paginatedVideoComments,
      },
      "Paginated video comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { content } = req.body;
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  const isVideoExist = await Video.exists({ _id: videoId });

  if (!isVideoExist) {
    throw new ApiError(404, "Video is not found ");
  }

  const newComment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user?.id,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comment: newComment,
      },
      "New comment has added successfully"
    )
  );
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment not found");
  }

  const existingComment = await Comment.findById(commentId);

  if (!existingComment) {
    throw new ApiError(404, "Comment did not exist");
  }
  const { content } = req.body;
  if (!content || !content.trim()) {
    throw new ApiError(400, "Comment should not be empty");
  }
  existingComment.content = content.trim();

  await existingComment.save();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { comment: existingComment },
        "Comment updated successfully"
      )
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment id is missing");
  }
  const comment = await Comment.findById(commentId).populate("video");

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (
    !comment.owner.eqals(req.user?.id) &&
    !comment.video?.owner.equals(req.user?.id)
  ) {
    throw new ApiError(402, "User unauthorized to perform this action ");
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};
