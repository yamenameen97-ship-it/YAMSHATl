
import { useSocialStore } from '../../store/socialStore.js';

export default function FollowControls({ userId, username }) {
  const follows = useSocialStore((state) => state.follows);
  const followUser = useSocialStore((state) => state.followUser);
  const unfollowUser = useSocialStore((state) => state.unfollowUser);
  const blockUser = useSocialStore((state) => state.blockUser);
  const muteUser = useSocialStore((state) => state.muteUser);
  const addCloseFriend = useSocialStore((state) => state.addCloseFriend);

  const isFollowing = follows[userId]?.following;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => (isFollowing ? unfollowUser(userId) : followUser(userId, 'creator'))}
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
      >
        {isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
      </button>

      <button
        onClick={() => addCloseFriend(userId)}
        className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
      >
        الأصدقاء المقربون
      </button>

      <button
        onClick={() => muteUser(userId)}
        className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
      >
        كتم
      </button>

      <button
        onClick={() => blockUser(userId)}
        className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-200"
      >
        حظر @{username}
      </button>
    </div>
  );
}
