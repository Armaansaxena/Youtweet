import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { videoAPI } from '../lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CloudArrowUpIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters'),
  videoFile: z.any().refine(files => files?.length > 0, 'Video file is required'),
  thumbnail: z.any().refine(files => files?.length > 0, 'Thumbnail is required'),
});

const Upload = () => {
  const navigate = useNavigate();
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm({
    resolver: zodResolver(uploadSchema),
  });

  const watchVideoFile = watch('videoFile');
  const watchThumbnail = watch('thumbnail');

  // Handle video preview
  useState(() => {
    if (watchVideoFile && watchVideoFile[0]) {
      const file = watchVideoFile[0];
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [watchVideoFile]);

  // Handle thumbnail preview
  useState(() => {
    if (watchThumbnail && watchThumbnail[0]) {
      const file = watchThumbnail[0];
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result);
      reader.readAsDataURL(file);
    }
  }, [watchThumbnail]);

  const uploadMutation = useMutation({
    mutationFn: (formData) => videoAPI.uploadVideo(formData),
    onSuccess: (data) => {
      toast.success('Video uploaded successfully!');
      navigate(`/video/${data.data.data.video._id}`);
    },
    onError: (error) => {
      setError('root', { 
        message: error.response?.data?.message || 'Upload failed' 
      });
    },
  });

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('videoFile', data.videoFile[0]);
    formData.append('thumbnail', data.thumbnail[0]);

    uploadMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Video</h1>
        <p className="text-gray-600">Share your content with the world</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form Fields */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                {...register('title')}
                type="text"
                className="input-field"
                placeholder="Enter video title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows="6"
                className="input-field resize-none"
                placeholder="Describe your video"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Video File */}
            <div>
              <label htmlFor="videoFile" className="block text-sm font-medium text-gray-700 mb-2">
                Video File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors duration-200">
                <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="videoFile" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload video
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      MP4, WebM, or OGV up to 100MB
                    </span>
                  </label>
                  <input
                    {...register('videoFile')}
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    id="videoFile"
                  />
                </div>
              </div>
              {errors.videoFile && (
                <p className="mt-1 text-sm text-red-600">{errors.videoFile.message}</p>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors duration-200">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="thumbnail" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload thumbnail
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PNG, JPG, or GIF up to 5MB
                    </span>
                  </label>
                  <input
                    {...register('thumbnail')}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    id="thumbnail"
                  />
                </div>
              </div>
              {errors.thumbnail && (
                <p className="mt-1 text-sm text-red-600">{errors.thumbnail.message}</p>
              )}
            </div>
          </div>

          {/* Right Column - Previews */}
          <div className="space-y-6">
            {/* Video Preview */}
            {videoPreview && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Video Preview</h3>
                <video
                  src={videoPreview}
                  controls
                  className="w-full aspect-video rounded-lg bg-gray-100"
                />
              </div>
            )}

            {/* Thumbnail Preview */}
            {thumbnailPreview && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Thumbnail Preview</h3>
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full aspect-video rounded-lg object-cover bg-gray-100"
                />
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errors.root && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{errors.root.message}</p>
          </div>
        )}

        {/* Upload Progress */}
        {uploadMutation.isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-sm text-blue-600">Uploading video...</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Upload;