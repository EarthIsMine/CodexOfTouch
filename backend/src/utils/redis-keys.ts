export const RedisKeys = {
  cooldown: (userId: string) => `cooldown:user:${userId}`,
  skillActive: (userId: string, skillId: number) => `skill:active:${userId}:${skillId}`,
  skillDaily: (userId: string, skillId: number, date: string) => `skill:daily:${userId}:${skillId}:${date}`,
  characterLock: (characterId: number) => `character:lock:${characterId}`,
  session: (token: string) => `session:${token}`,
  activeCharacter: () => `character:active`,
  jackpotState: (characterId: number) => `jackpot:state:${characterId}`,
};
