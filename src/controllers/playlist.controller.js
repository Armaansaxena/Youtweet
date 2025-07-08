import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description} = req.body
    if (!(name?.trim()) || !(description?.trim())) {
        throw new ApiError(400 , "name and description both are required")
    }
    const newPlaylist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user?.id
    })
    return res 
        .status(200)
        .json(new ApiResponse(200, {Playlist:newPlaylist} , "New Playlist created successfully"))
    
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!userId) {
        throw new ApiError(400, "User id is required")
    }

    const isUserExist = await User.exists({ _id: userId })
    
    if (!isUserExist) {
        throw new ApiError(404, "User not found")
    }

    const userPlaylist = await Playlist
        .find({ owner: userId })
        .select("name description videos createdAt updatedAt ")
        .lean()
        .sort({ createdAt: -1 })
    
    const playlistWithVideoCount = userPlaylist.map(p1 => ({
        ...p1,
        videoCount: p1.videos.length
    }))
    return res
        .status(200)
        .json(new ApiResponse(200 , {playlists: playlistWithVideoCount}, "user playlists has been fetched successfully"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(400 , "playlist id is required");
    }
    const isPlaylistExist = await Playlist.findById(playlistId);
    if(!isPlaylistExist){
        throw new ApiError(404 , "playlist not found");
    }
  const playlistVideos =   await Playlist.aggregate([{
        $match:{
            _id: new mongoose.Types.ObjectId(playlistId)
        }
    },
    {
        $lookup:{
            from: "videos",
            foreignField: "_id",
            localField: "videos",
            as: "playlistVideos",
            pipeline:[
                {
                    $lookup:{
                        from: "users",
                        foreignField: "_id",
                        localField: "owner",
                        as: "videoOwner",
                        pipeline:[{
                            $project:{
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }]
                    }
                },
                {
                    $unwind:{
                        path: "$videoOwner",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields:{
                        owner: "$videoOwner"
                    }
                },
                {
                    $project:{
                        videoOwner: 0
                    }
                },
                {
                    $sort:{
                        createdAt: -1
                    }
                }
            ]
        },
        
    },
    {
        $lookup:{
            from: "users",
            foreignField: "_id",
            localField: "owner",
            as: "playlistOwner"
        }
    },
    {
        $unwind:{
            path: "$playlistOwner",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $addFields:{
            videoCount: {
                $size: "$playlistVideos"
            },
            playlistUsername: "$playlistOwner.username",
            playlistFullName: "$playlistOwner.fullName",
            playlistAvatar: "$playlistOwner.avatar"
        }
    },
    {
        $project:{
            name: 1,
            description: 1,
            playlistUsername: 1,
            playlistFullName: 1,
            playlistAvatar: 1,
            playlistVideos: 1,
            videoCount: 1,
            createdAt: 1,
            updatedAt: 1
        }
    }])
    if(!playlistVideos.length){
        throw new ApiError(404 , "playlist is missing")
    }
    return res.status(200).json(new ApiResponse(200 , {playlist: playlistVideos[0]} , "all the videos with their owner of playlist has been fetched successfully"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Video and playlist both id is required")
    }
    
    const existingPlaylist = await Playlist.findById(playlistId)
    if (!existingPlaylist) {
        throw new ApiError(404, "Playlist not found")
    }
    if(String(req.user?.id) !== String(existingPlaylist.owner)){
        throw new ApiError(403 , "user unauthorized to perform this action");
    }

    if (!existingPlaylist.videos.includes(videoId)) {
        existingPlaylist.videos.push(videoId)
    }
    await existingPlaylist.save()
    return res  
        .status(200)
        .json(new ApiResponse(200 , {playlist : existingPlaylist}, "video has beend added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    
    if (!playlistId) {
        throw new ApiError(400, "Playlist id is required")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if(String(req.user?.id) !== String(playlist.owner)){
        throw new ApiError(403 , "unauthorized to perform video removal acion");
    }

    const videos = playlist.videos.filter(vd => String(vd) !== String(videoId))
    playlist.videos = videos
    await playlist.save()
    return res
        .status(200)
        .json(200, {playlist}, "Video deleted from playlist successfully")

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if (!playlistId) {
        throw new ApiError(400, "Playlist id is required")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if(String(req.user?.id) !== String(playlist.owner)){
        throw new ApiError(403 , "unauthorized to perform video removal acion");
    }

    await playlist.deleteOne()
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!playlistId){
        throw new ApiError(400 , "playlist id is required");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404 , "playlist not found");
    }

    if(String(req.user?.id) !== String(playlist.owner)){
        throw new ApiError(403 , "unauthorized to perform update playlist action");
    }

    if (!(name?.trim()) && !(description?.trim())) {
        throw new ApiError(400 , "any one of the name and description must exist");
    }

    playlist.name = name?.trim() || playlist.name
    playlist.description = description?.trim() || playlist.description
    await playlist.save();
    return res.status(200).json(new ApiResponse(200 , {playlist} , "playlist has been updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}