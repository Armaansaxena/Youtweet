import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { EyeIcon, ClockIcon } from '@heroicons/react/24/outline';

const VideoCard = ({ video }) => {
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <div className="video-card group">
      <Link to={`/video/${video._id}`}>
        <div className="relative aspect-video overflow-hidden">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
            <ClockIcon className="h-3 w-3" />
            <span>{formatDuration(video.duration)}</span>
          </div>
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex space-x-3">
          <Link to={`/channel/${video.ownerInfo?.username}`}>
            <img
              src={video.ownerInfo?.avatar}
              alt={video.ownerInfo?.fullName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link to={`/video/${video._id}`}>
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
                {video.title}
              </h3>
            </Link>
            
            <Link to={`/channel/${video.ownerInfo?.username}`}>
              <p className="text-sm text-gray-600 hover:text-gray-900 mt-1">
                {video.ownerInfo?.fullName}
              </p>
            </Link>
            
            <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <EyeIcon className="h-3 w-3" />
                <span>{formatViews(video.views)} views</span>
              </div>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;