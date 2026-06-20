export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  role: "user" | "admin" | "host";
  isVerified: boolean;
  level: number;
  totalFollowers: number;
  totalFollowing: number;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export interface Post {
  id: number;
  userId: number;
  content: string;
  image: string | null;
  video: string | null;
  hashtags: string[] | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reaction {
  id: number;
  userId: number;
  postId: number;
  type: "like" | "love" | "haha" | "wow" | "sad" | "angry";
  createdAt: Date;
}

export interface ReactionCount {
  id: number;
  postId: number;
  likeCount: number;
  loveCount: number;
  hahaCount: number;
  wowCount: number;
  sadCount: number;
  angryCount: number;
  totalCount: number;
  updatedAt: Date;
}

export interface Wallet {
  id: number;
  userId: number;
  balance: number;
  totalSpent: number;
  totalEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  description: string | null;
  relatedUserId: number | null;
  streamId: number | null;
  createdAt: Date;
}


export interface Gift {
  id: number;
  name: string;
  emoji: string;
  price: number;
  animationType: string;
  color: string;
  icon: string | null;
  createdAt: Date;
}

export interface GiftSent {
  id: number;
  streamId: number;
  giftId: number;
  senderId: number;
  receiverId: number;
  quantity: number;
  totalCoins: number;
  animationTriggered: boolean;
  createdAt: Date;
}

export interface HostEarning {
  id: number;
  hostId: number;
  totalEarned: number;
  totalWithdrawn: number;
  availableBalance: number;
  updatedAt: Date;
}

export interface WithdrawalRequest {
  id: number;
  hostId: number;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  bankAccount: string | null;
  bankName: string | null;
  accountHolder: string | null;
  reason: string | null;
  reviewedBy: number | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PkBattle {
  id: number;
  host1Id: number;
  host2Id: number;
  stream1Id: number;
  stream2Id: number;
  host1Score: number;
  host2Score: number;
  winner: number | null;
  status: "ongoing" | "finished";
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
}

export interface StreamGuest {
  id: number;
  streamId: number;
  guestId: number;
  seatNumber: number;
  status: "invited" | "accepted" | "active" | "removed";
  joinedAt: Date | null;
  leftAt: Date | null;
  createdAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  category: string;
  title: string;
  body: string | null;
  actorId: number | null;
  targetId: number | null;
  targetType: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyTask {
  id: number;
  userId: number;
  taskType: string;
  description: string;
  reward: number;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
}

export interface UserLevel {
  id: number;
  userId: number;
  level: number;
  experience: number;
  totalExperience: number;
  updatedAt: Date;
}

export interface Achievement {
  id: number;
  userId: number;
  badgeName: string;
  badgeIcon: string;
  description: string | null;
  unlockedAt: Date;
}

export interface ReferralCode {
  id: number;
  userId: number;
  code: string;
  totalUsed: number;
  totalReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreItem {
  id: number;
  itemType: string;
  name: string;
  description: string | null;
  price: number;
  image: string;
  rarity: string;
  createdAt: Date;
}

export interface UserStoreItem {
  id: number;
  userId: number;
  storeItemId: number;
  isActive: boolean;
  purchasedAt: Date;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  image: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface SpinWheelReward {
  id: number;
  segment: number;
  rewardType: string;
  rewardAmount: number;
  probability: number;
  createdAt: Date;
}

export interface SpinWheelSpin {
  id: number;
  userId: number;
  rewardId: number;
  rewardAmount: number;
  createdAt: Date;
}

export interface VoiceRoom {
  id: number;
  hostId: number;
  title: string;
  description: string | null;
  maxParticipants: number;
  currentParticipants: number;
  status: "active" | "inactive" | "ended";
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceRoomParticipant {
  id: number;
  roomId: number;
  userId: number;
  joinedAt: Date;
  leftAt: Date | null;
}
