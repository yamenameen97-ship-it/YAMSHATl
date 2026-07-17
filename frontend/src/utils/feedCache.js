import { resolveMediaUrl } from '../config/mediaConfig.js';

const FEED_CACHE_PREFIX = 'yamshat:feed:cache:';

function toTimestamp(post = {}) {
  const rawValue = post?.published_at || post?.created_at || post?.updated_at || 0;
  const parsed = new Date(rawValue).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sortPostsNewestFirst(posts = []) {
  const seen = new Set();
  return [...posts]
    .filter(Boolean)
    .sort((left, right) => {
      const timeDelta = toTimestamp(right) - toTimestamp(left);
      if (timeDelta !== 0) return timeDelta;
      return Number(right?.id || 0) - Number(left?.id || 0);
    })
    .filter((post) => {
      const key = String(post?.id ?? `${post?.published_at || post?.created_at || ''}:${post?.content || ''}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function clearLocalFeedCaches() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(FEED_CACHE_PREFIX))
    .forEach((key) => window.localStorage.removeItem(key));
}

function normalizeInjectedPost(post = {}) {
  // ✅ v88.3 ROOT FIX: أي منشور يُحقَن في الكاش يمر عبر طبقة normalize قوية
  //   حتى لا تبقى المسارات غير محلولة (relative) ويفشل عرضها لاحقاً.
  const attachments = Array.isArray(post.attachments) ? post.attachments.filter(Boolean) : [];
  const attachmentCandidates = attachments.flatMap((attachment) => {
    if (!attachment) return [];
    if (typeof attachment === 'string') return [attachment];
    return [
      attachment.media_url,
      attachment.mediaUrl,
      attachment.cdn_url,
      attachment.url,
      attachment.file_url,
      attachment.fileUrl,
      attachment.path,
      attachment.file_path,
      attachment.src,
      attachment.href,
      attachment.download_url,
      attachment.thumbnail_url,
      attachment.preview_url,
    ];
  });
  const rawMediaCandidates = [
    ...(Array.isArray(post.media_urls) ? post.media_urls : []),
    post.media_url,
    post.media,
    post.video_url,
    post.image_url,
    post.thumbnail_url,
    ...attachmentCandidates,
  ].filter((value) => typeof value === 'string' && value.trim().length > 0);

  const normalizedMediaUrls = Array.from(new Set(rawMediaCandidates.map((value) => resolveMediaUrl(value)).filter(Boolean)));
  const lowerCandidates = normalizedMediaUrls.map((value) => String(value || '').toLowerCase());
  const hasVideo = Boolean(
    post.has_video
    || String(post.media_type || post.type || '').toLowerCase() === 'video'
    || lowerCandidates.some((value) => /\.(mp4|webm|mov|m4v|m3u8|mkv|avi)(\?.*)?$/i.test(value))
  );
  const mediaUrl = resolveMediaUrl(
    post.media_url
    || post.media
    || post.video_url
    || normalizedMediaUrls[0]
    || post.image_url
    || ''
  );
  const imageUrl = resolveMediaUrl(
    post.thumbnail_url
    || post.preview_url
    || (!hasVideo ? post.image_url : '')
    || normalizedMediaUrls.find((value) => !/\.(mp4|webm|mov|m4v|m3u8|mkv|avi)(\?.*)?$/i.test(String(value || '').toLowerCase()))
    || ''
  );

  return {
    ...post,
    media_url: mediaUrl || '',
    media: mediaUrl || '',
    image_url: imageUrl || '',
    thumbnail_url: imageUrl || '',
    preview_url: resolveMediaUrl(post.preview_url || imageUrl || mediaUrl || ''),
    media_urls: normalizedMediaUrls.length ? normalizedMediaUrls : mediaUrl ? [mediaUrl] : [],
    user_avatar: resolveMediaUrl(post.user_avatar || post.avatar || post.author_avatar || ''),
    has_video: hasVideo,
    media_type: hasVideo ? 'video' : String(post.media_type || post.type || 'image').toLowerCase(),
  };
}

export function injectPostIntoFeedCache(queryClient, post) {
  if (!queryClient || !post) return;

  const normalizedPost = normalizeInjectedPost(post);

  queryClient.setQueriesData({ queryKey: ['feed-data'] }, (current) => {
    if (!current?.pages?.length) return current;
    return {
      ...current,
      pages: current.pages.map((page, index) => {
        if (index !== 0) return page;
        return {
          ...page,
          items: sortPostsNewestFirst([normalizedPost, ...(Array.isArray(page?.items) ? page.items : [])]),
        };
      }),
    };
  });

  clearLocalFeedCaches();
}
