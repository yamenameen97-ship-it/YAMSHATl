import {
  getPosts,
  likePost,
  savePost,
  sharePost,
} from '../../api/posts.js';
import { getStories } from '../../api/stories.js';
import { followUser } from '../../api/users.js';

export const socialApi = {
  feed: (params = {}) => getPosts(params),
  stories: () => getStories(),
  follow: (username) => followUser(username),
  unfollow: (username) => Promise.resolve({ data: { status: 'use-block-or-unfollow-flow', username } }),
  react: (postId, reaction = 'like') => {
    if (reaction === 'like') return likePost(postId);
    return sharePost(postId, reaction || 'copy');
  },
  savePost: (postId) => savePost(postId),
};

export default socialApi;
