import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await api.post('/users/refresh-token');
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Show error toast for non-401 errors
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Something went wrong');
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/users/register', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  login: (data) => api.post('/users/login', data),
  logout: () => api.post('/users/logout'),
  getCurrentUser: () => api.get('/users/current-user'),
  refreshToken: () => api.post('/users/refresh-token'),
  changePassword: (data) => api.post('/users/change-password', data),
  updateProfile: (data) => api.patch('/users/update-account', data),
  updateAvatar: (data) => api.patch('/users/avatar', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateCoverImage: (data) => api.patch('/users/cover-image', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getUserProfile: (username) => api.get(`/users/c/${username}`),
  getWatchHistory: () => api.get('/users/history'),
};

// Video API
export const videoAPI = {
  getAllVideos: (params) => api.get('/videos', { params }),
  getVideoById: (id) => api.get(`/videos/${id}`),
  uploadVideo: (data) => api.post('/videos', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateVideo: (id, data) => api.patch(`/videos/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteVideo: (id) => api.delete(`/videos/${id}`),
  togglePublishStatus: (id) => api.patch(`/videos/toggle/publish/${id}`),
};

// Comment API
export const commentAPI = {
  getVideoComments: (videoId, params) => api.get(`/comments/${videoId}`, { params }),
  addComment: (videoId, data) => api.post(`/comments/${videoId}`, data),
  updateComment: (commentId, data) => api.patch(`/comments/${commentId}`, data),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};

// Like API
export const likeAPI = {
  toggleVideoLike: (videoId) => api.post(`/likes/toggle/v/${videoId}`),
  toggleCommentLike: (commentId) => api.post(`/likes/toggle/c/${commentId}`),
  toggleTweetLike: (tweetId) => api.post(`/likes/toggle/t/${tweetId}`),
  getLikedVideos: () => api.get('/likes/videos'),
};

// Tweet API
export const tweetAPI = {
  createTweet: (data) => api.post('/tweets', data),
  getUserTweets: (userId) => api.get(`/tweets/user/${userId}`),
  updateTweet: (tweetId, data) => api.patch(`/tweets/${tweetId}`, data),
  deleteTweet: (tweetId) => api.delete(`/tweets/${tweetId}`),
};

// Playlist API
export const playlistAPI = {
  createPlaylist: (data) => api.post('/playlists', data),
  getUserPlaylists: (userId) => api.get(`/playlists/user/${userId}`),
  getPlaylistById: (playlistId) => api.get(`/playlists/${playlistId}`),
  updatePlaylist: (playlistId, data) => api.patch(`/playlists/${playlistId}`, data),
  deletePlaylist: (playlistId) => api.delete(`/playlists/${playlistId}`),
  addVideoToPlaylist: (videoId, playlistId) => api.patch(`/playlists/add/${videoId}/${playlistId}`),
  removeVideoFromPlaylist: (videoId, playlistId) => api.patch(`/playlists/remove/${videoId}/${playlistId}`),
};

// Subscription API
export const subscriptionAPI = {
  toggleSubscription: (channelId) => api.post(`/subscription/c/${channelId}`),
  getUserChannelSubscribers: (channelId) => api.get(`/subscription/c/${channelId}`),
  getSubscribedChannels: (subscriberId) => api.get(`/subscription/u/${subscriberId}`),
};

// Dashboard API
export const dashboardAPI = {
  getChannelStats: () => api.get('/dashboard/stats'),
  getChannelVideos: () => api.get('/dashboard/videos'),
};

export default api;