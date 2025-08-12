import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { videoAPI } from '../lib/api';
import VideoCard from '../components/Video/VideoCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortType, setSortType] = useState('desc');

  const { data: videosData, isLoading, error } = useQuery({
    queryKey: ['videos', searchQuery, sortBy, sortType],
    queryFn: () => videoAPI.getAllVideos({
      query: searchQuery,
      sortBy,
      sortType,
      page: 1,
      limit: 20
    }),
  });

  const videos = videosData?.data?.data?.videos?.docs || [];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to VideoTube
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover amazing videos, share your creativity, and connect with creators from around the world.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Latest Videos</h2>
        
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field w-auto"
          >
            <option value="createdAt">Date</option>
            <option value="views">Views</option>
            <option value="title">Title</option>
          </select>
          
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className="input-field w-auto"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-300 aspect-video rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Error loading videos. Please try again later.</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No videos found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;