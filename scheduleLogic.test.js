const test = require('node:test');
const assert = require('node:assert/strict');
const { generateRoundRobinSchedule } = require('./scheduleLogic');

test('generates 28 matches for 8 teams in round-robin format', () => {
  const schedule = generateRoundRobinSchedule(
    ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H'],
    ['6am', '10am', '2pm', '5pm', '8pm'],
    { tournamentType: 'weekend', playDay: 'saturday', startDate: '2026-08-01' }
  );
  assert.equal(schedule.length, 28);
  assert.equal(schedule[0].slot, '6am');
  assert.equal(schedule[1].slot, '10am');
  assert.ok(schedule.some((item) => item.home === 'Team A' && item.away === 'Team H'));

  const perDay = {};
  schedule.forEach((item) => {
    if (!perDay[item.date]) perDay[item.date] = [];
    perDay[item.date].push(item);
  });

  Object.values(perDay).forEach((matches) => {
    const teamsSeen = new Set();
    matches.forEach((match) => {
      assert.ok(!teamsSeen.has(match.home), 'team played twice on the same day');
      assert.ok(!teamsSeen.has(match.away), 'team played twice on the same day');
      teamsSeen.add(match.home);
      teamsSeen.add(match.away);
    });
  });
});

test('keeps weekend schedules on the selected weekend day', () => {
  const schedule = generateRoundRobinSchedule(
    ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H'],
    ['6am', '10am', '2pm', '5pm', '8pm'],
    { tournamentType: 'weekend', playDay: 'sunday', startDate: '2026-08-01' }
  );

  const dates = new Set(schedule.map((item) => item.date));
  dates.forEach((date) => {
    const day = new Date(`${date}T00:00:00`).getDay();
    assert.equal(day, 0, 'weekend schedule should stay on Sundays only');
  });
});
