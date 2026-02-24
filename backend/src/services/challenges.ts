import { prisma } from '../db/client';

export const CHALLENGE_TYPE_ATTEND_EVENTS = 'ATTEND_EVENTS';

export const challengesService = {
  /**
   * Update challenge progress when user attends an event (ticket scanned).
   * Awards reward points when target is reached.
   */
  recordEventAttendance: async (userId: string): Promise<void> => {
    const challenges = await prisma.challenge.findMany({
      where: {
        type: CHALLENGE_TYPE_ATTEND_EVENTS,
        isActive: true,
      },
    });

    for (const challenge of challenges) {
      const uc = await prisma.userChallenge.upsert({
        where: {
          userId_challengeId: { userId, challengeId: challenge.id },
        },
        create: {
          userId,
          challengeId: challenge.id,
          currentCount: 1,
        },
        update: {
          currentCount: { increment: 1 },
        },
      });

      const updated = await prisma.userChallenge.findUnique({
        where: { id: uc.id },
      });

      if (updated && !updated.isCompleted && updated.currentCount >= challenge.targetCount) {
        await prisma.$transaction([
          prisma.userChallenge.update({
            where: { id: uc.id },
            data: { isCompleted: true, completedAt: new Date() },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { points: { increment: challenge.rewardPoints } },
          }),
        ]);
      }
    }
  },

  /**
   * Get all challenges with current user's progress, plus gamification stats.
   */
  getChallengesWithProgress: async (userId: string) => {
    const [challenges, progress, user] = await Promise.all([
      prisma.challenge.findMany({
        where: { isActive: true },
        orderBy: { targetCount: 'asc' },
      }),
      prisma.userChallenge.findMany({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
      }),
    ]);

    const progressMap = new Map(progress.map((p) => [p.challengeId, p]));
    const challengeList = challenges.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      type: c.type,
      targetCount: c.targetCount,
      rewardPoints: c.rewardPoints,
      currentCount: progressMap.get(c.id)?.currentCount ?? 0,
      isCompleted: progressMap.get(c.id)?.isCompleted ?? false,
      completedAt: progressMap.get(c.id)?.completedAt?.toISOString(),
    }));

    // Total events attended = max currentCount across ATTEND_EVENTS challenges
    const totalEventsAttended =
      challengeList
        .filter((c) => c.type === CHALLENGE_TYPE_ATTEND_EVENTS)
        .reduce((max, c) => Math.max(max, c.currentCount), 0) || 0;

    const completedCount = challengeList.filter((c) => c.isCompleted).length;

    return {
      challenges: challengeList,
      stats: {
        totalPoints: user?.points ?? 0,
        totalEventsAttended,
        completedChallenges: completedCount,
        totalChallenges: challenges.length,
      },
    };
  },
};
