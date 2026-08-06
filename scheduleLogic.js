function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getNextAllowedDate(startDate, dayIndex, currentDay, tournamentType, playDay) {
  const candidate = addDays(startDate, currentDay);
  if (tournamentType !== 'weekend') {
    return candidate;
  }

  const targetDay = playDay === 'sunday' ? 0 : 6;
  let nextDate = candidate;
  while (nextDate.getDay() !== targetDay) {
    nextDate = addDays(nextDate, 1);
  }
  return nextDate;
}

function generateRoundRobinSchedule(teams, slots = ['6am', '10am', '2pm', '5pm', '8pm'], options = {}) {
  const teamList = [...teams];
  if (teamList.length % 2 !== 0) teamList.push('BYE');

  const rounds = [];
  const half = teamList.length / 2;
  const rotation = [...teamList];

  for (let round = 0; round < teamList.length - 1; round += 1) {
    const pairings = [];
    for (let i = 0; i < half; i += 1) {
      const home = rotation[i];
      const away = rotation[rotation.length - 1 - i];
      if (home !== 'BYE' && away !== 'BYE') {
        pairings.push({ home, away });
      }
    }
    rounds.push(pairings);

    const newRotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, rotation.length - 1)];
    rotation.splice(0, rotation.length, ...newRotation);
  }

  const schedule = [];
  const startDate = options.startDate ? new Date(options.startDate) : new Date();
  const slotList = slots.length ? slots : ['6am'];
  const tournamentType = options.tournamentType || 'weekend';
  const playDay = options.playDay || 'saturday';
  let currentDay = 0;
  const teamUsage = new Map();

  rounds.forEach((round, roundIndex) => {
    round.forEach((match, matchIndex) => {
      const targetDay = playDay === 'sunday' ? 0 : 6;
      let date = getNextAllowedDate(startDate, currentDay, currentDay, tournamentType, playDay);
      let key = formatDateKey(date);
      const slot = slotList[(roundIndex + matchIndex) % slotList.length];
      const home = match.home;
      const away = match.away;

      let homeUsed = teamUsage.get(home)?.has(key) || false;
      let awayUsed = teamUsage.get(away)?.has(key) || false;

      while (homeUsed || awayUsed) {
        currentDay += 1;
        date = getNextAllowedDate(startDate, currentDay, currentDay, tournamentType, playDay);
        key = formatDateKey(date);
        homeUsed = teamUsage.get(home)?.has(key) || false;
        awayUsed = teamUsage.get(away)?.has(key) || false;
      }

      schedule.push({
        id: `${roundIndex + 1}-${matchIndex + 1}`,
        home,
        away,
        round: roundIndex + 1,
        date: key,
        slot,
        venue: 'Main Ground',
        tournamentType
      });
      const homeUsage = teamUsage.get(home) || new Set();
      homeUsage.add(key);
      teamUsage.set(home, homeUsage);
      const awayUsage = teamUsage.get(away) || new Set();
      awayUsage.add(key);
      teamUsage.set(away, awayUsage);
    });
  });

  return schedule;
}

const exportedApi = {
  generateRoundRobinSchedule
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportedApi;
}

if (typeof window !== 'undefined') {
  window.scheduleLogic = exportedApi;
}
