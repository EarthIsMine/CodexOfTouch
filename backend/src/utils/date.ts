export const getUTCDateString = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

export const isToday = (date: Date | null): boolean => {
  if (!date) return false;
  const today = getUTCDateString();
  const checkDate = getUTCDateString(date);
  return today === checkDate;
};

export const getStreakDays = (lastCheckIn: Date | null, currentDate: Date = new Date()): number => {
  if (!lastCheckIn) return 0;

  const yesterday = new Date(currentDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const lastCheckInStr = getUTCDateString(lastCheckIn);
  const yesterdayStr = getUTCDateString(yesterday);

  return lastCheckInStr === yesterdayStr ? 1 : 0;
};

export const addSeconds = (date: Date, seconds: number): Date => {
  const newDate = new Date(date);
  newDate.setSeconds(newDate.getSeconds() + seconds);
  return newDate;
};

export const getSecondsUntil = (targetDate: Date): number => {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
};
