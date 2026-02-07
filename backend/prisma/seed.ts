import { PrismaClient, EffectType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. Characters Seed
  // ============================================
  console.log('📦 Seeding characters...');

  const characters = [
    {
      name: 'Pelican',
      assetFolder: 'pelicanImg',
      successRate: 0.15,
      isActive: true, // 첫 번째 캐릭터를 활성화
    },
    {
      name: 'Dolphin',
      assetFolder: 'dolphinImg',
      successRate: 0.12,
      isActive: false,
    },
    {
      name: 'Hamster',
      assetFolder: 'hamsterImg',
      successRate: 0.1,
      isActive: false,
    },
    {
      name: 'Mouse',
      assetFolder: 'mouseImg',
      successRate: 0.08,
      isActive: false,
    },
    {
      name: 'Penguin',
      assetFolder: 'penguinImg',
      successRate: 0.18,
      isActive: false,
    },
    {
      name: 'Seal',
      assetFolder: 'sealImg',
      successRate: 0.2,
      isActive: false,
    },
  ];

  for (const char of characters) {
    await prisma.character.upsert({
      where: { id: characters.indexOf(char) + 1 },
      update: {},
      create: char,
    });
  }

  console.log(`✅ Created ${characters.length} characters`);

  // ============================================
  // 2. Initialize Jackpot State for Active Character
  // ============================================
  console.log('📦 Initializing jackpot state...');

  const activeCharacter = await prisma.character.findFirst({
    where: { isActive: true },
  });

  if (activeCharacter) {
    await prisma.jackpotState.upsert({
      where: { characterId: activeCharacter.id },
      update: {},
      create: {
        characterId: activeCharacter.id,
        currentPool: 0,
      },
    });
    console.log(`✅ Jackpot state initialized for ${activeCharacter.name}`);
  }

  // ============================================
  // 3. Skills Seed
  // ============================================
  console.log('📦 Seeding skills...');

  const skills = [
    {
      name: 'Quick Hands',
      description: '쓰다듬기 실패 시 쿨타임을 15초 감소시킵니다 (30초 -> 15초)',
      effectType: EffectType.COOLDOWN_REDUCE,
      value: 15,
      durationSec: 3600, // 1시간
      priceWld: 5,
      isActive: true,
    },
    {
      name: 'Lucky Day',
      description: '출석 보상을 2배로 받습니다 (1회 사용)',
      effectType: EffectType.CHECKIN_BONUS,
      value: 2,
      durationSec: 86400, // 24시간
      priceWld: 3,
      isActive: true,
    },
    {
      name: 'Time Freeze',
      description: '5초간 다른 플레이어의 쓰다듬기를 차단합니다',
      effectType: EffectType.USER_BLOCK,
      value: 5,
      durationSec: 5, // 5초
      priceWld: 10,
      isActive: true,
    },
    {
      name: 'Speed Boost',
      description: '쿨타임을 완전히 제거합니다 (30분간)',
      effectType: EffectType.COOLDOWN_REDUCE,
      value: 30,
      durationSec: 1800, // 30분
      priceWld: 15,
      isActive: true,
    },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { id: skills.indexOf(skill) + 1 },
      update: {},
      create: skill,
    });
  }

  console.log(`✅ Created ${skills.length} skills`);

  // ============================================
  // Summary
  // ============================================
  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Characters: ${characters.length}`);
  console.log(`   - Skills: ${skills.length}`);
  console.log(`   - Active Character: ${activeCharacter?.name}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
