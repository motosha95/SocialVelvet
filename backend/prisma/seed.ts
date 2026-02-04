import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CHALLENGES = [
  { name: 'First Steps', description: 'Attend your first event', type: 'ATTEND_EVENTS', targetCount: 1, rewardPoints: 25 },
  { name: 'Social Explorer', description: 'Attend 5 events', type: 'ATTEND_EVENTS', targetCount: 5, rewardPoints: 100 },
  { name: 'Event Enthusiast', description: 'Attend 10 events', type: 'ATTEND_EVENTS', targetCount: 10, rewardPoints: 250 },
  { name: 'Community Champion', description: 'Attend 25 events', type: 'ATTEND_EVENTS', targetCount: 25, rewardPoints: 500 },
  { name: 'Networking Pro', description: 'Attend 50 events', type: 'ATTEND_EVENTS', targetCount: 50, rewardPoints: 750 },
  { name: 'Social Legend', description: 'Attend 100 events', type: 'ATTEND_EVENTS', targetCount: 100, rewardPoints: 1500 },
  { name: 'Triple Threat', description: 'Attend 3 events', type: 'ATTEND_EVENTS', targetCount: 3, rewardPoints: 50 },
];

async function main() {
  let added = 0;
  for (const c of CHALLENGES) {
    const existing = await prisma.challenge.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.challenge.create({ data: c });
      added++;
    }
  }
  if (added > 0) {
    console.log(`Challenges seeded: ${added} new challenge(s) added`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
