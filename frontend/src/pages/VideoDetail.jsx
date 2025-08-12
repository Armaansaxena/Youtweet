import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videoAPI, commentAPI, likeAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import VideoPlayer from '../components/Video/VideoPlayer';
import { 
  HandThumbUpIcon, 
  HandThumbDownIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpSolidIcon,
} from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const VideoDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  // Fetch video details
  const { data: videoData, isLoading: videoLoading } = useQuery({
    queryKey: ['video', id],
    queryFn: () => videoAPI.getVideoById(id),
  });

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => commentAPI.getVideoComments(id, { page: 1, limit: 20 }),
  });

  const video = videoData?.data?.data?.fullVideo;
  const comments = commentsData?.data?.data?.comments?.docs || [];

  // Like video mutation
  const likeMutation = useMutation({
    mutationFn: () => likeAPI.toggleVideoLike(id),
    onSuccess: (data) => {
      setIsLiked(data.data.data.status === 'Liked');
      toast.success(`Video ${data.data.data.status.toLowerCase()}`);
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (content) => commentAPI.addComment(id, { content }),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries(['comments', id]);
      toast.success('Comment added successfully');
    },
  });

  const handleLike = () => {
    if (!user) {
      toast.error('Please login to like videos');
      return;
    }
    likeMutation.mutate();
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    if (!comment.trim()) return;
    addCommentMutation.mutate(comment.trim());
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Video link copied to clipboard');
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views?.toString() || '0';
  };

  if (videoLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-300 aspect-video rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Video not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Video Player */}
      <div className="aspect-video">
        <VideoPlayer
          src={video.videoFile}
          poster={video.thumbnail}
        />
      </div>

      {/* Video Info */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <EyeIcon className="h-4 w-4" />
              <span>{formatViews(video.views)} views</span>
            </div>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                isLiked
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {isLiked ? (
                <HandThumbUpSolidIcon className="h-5 w-5" />
              ) : (
                <HandThumbUpIcon className="h-5 w-5" />
              )}
              <span>Like</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
            >
              <ShareIcon className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Channel Info */}
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <Link to={`/channel/${video.ownerInfo?.username}`}>
            <img
              src={video.ownerInfo?.avatar}
              alt={video.ownerInfo?.fullName}
              className="w-12 h-12 rounded-full object-cover"
            />
          </Link>
          <div className="flex-1">
            <Link to={`/channel/${video.ownerInfo?.username}`}>
              <h3 className="font-semibold text-gray-900 hover:text-primary-600">
                {video.ownerInfo?.fullName}
              </h3>
            </Link>
            <p className="text-sm text-gray-600">@{video.ownerInfo?.username}</p>
          </div>
          <button className="btn-primary">Subscribe</button>
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 whitespace-pre-wrap">{video.description}</p>
        </div>
      </div>

      {/* Comments Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <ChatBubbleLeftIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Comments ({comments.length})
          </h2>
        </div>

        {/* Add Comment */}
        {user && (
          <form onSubmit={handleAddComment} className="space-y-4">
            <div className="flex space-x-4">
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows="3"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setComment('')}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!comment.trim() || addCommentMutation.isPending}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addCommentMutation.isPending ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {commentsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="flex space-x-4">
                <img
                  src={comment.avatar}
                  alt={comment.username}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-gray-900">{comment.username}</span>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;