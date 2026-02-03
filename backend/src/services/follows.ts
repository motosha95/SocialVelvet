import { prisma } from '../db/client';

export const followsService = {
  /**
   * Get list of user IDs that the current user follows
   */
  getFollowingIds: async (userId: string): Promise<string[]> => {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    return follows.map((f) => f.followingId);
  },

  /**
   * Check if followerId follows followingId
   */
  isFollowing: async (followerId: string, followingId: string): Promise<boolean> => {
    if (followerId === followingId) return false;
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    return !!follow;
  },

  /**
   * Follow a user
   */
  follow: async (followerId: string, followingId: string): Promise<void> => {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }
    await prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      create: { followerId, followingId },
      update: {},
    });
  },

  /**
   * Unfollow a user
   */
  unfollow: async (followerId: string, followingId: string): Promise<void> => {
    await prisma.follow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });
  },
};
