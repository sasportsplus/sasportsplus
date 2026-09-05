// Date Utilities
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const dayName = date.toLocaleString('default', { weekday: 'short' });
  return `${dayName}, ${day} ${month}`;
};

export const formatDateTime = (dateString, time) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month}, ${year} at ${time}`;
};

export const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

export const getDayOfWeek = (dayName) => {
  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
  return dayMap[dayName];
};

export const getNextDateForDay = (dayName) => {
  const today = new Date();
  const targetDay = getDayOfWeek(dayName);
  const currentDay = today.getDay();

  let daysAhead = targetDay - currentDay;
  if (daysAhead <= 0) {
    daysAhead += 7;
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysAhead);
  return nextDate;
};

// Time Utilities
export const convertTo24Hour = (time) => {
  const [hours, meridiem] = time.split(' ');
  const [hour, minute] = hours.split(':');
  let hour24 = parseInt(hour);
  if (meridiem === 'PM' && hour24 !== 12) hour24 += 12;
  if (meridiem === 'AM' && hour24 === 12) hour24 = 0;
  return { hour: hour24, minute: parseInt(minute) };
};

export const convertTo12Hour = (hour24, minute) => {
  let hour = hour24;
  let meridiem = 'AM';
  
  if (hour24 >= 12) {
    meridiem = 'PM';
    if (hour24 > 12) hour = hour24 - 12;
  } else if (hour24 === 0) {
    hour = 12;
  }
  
  return `${hour}:${minute.toString().padStart(2, '0')} ${meridiem}`;
};

// Validation Utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidTeamName = (name) => {
  return name && name.trim().length >= 2;
};

export const isValidScore = (score) => {
  const num = parseInt(score);
  return !isNaN(num) && num >= 0;
};

// Match Utilities
export const getMatchWinner = (team1Score, team2Score) => {
  if (team1Score > team2Score) return 'team1';
  if (team2Score > team1Score) return 'team2';
  return 'draw';
};

export const isMatchCompleted = (matchStatus) => {
  return matchStatus === 'Completed';
};

export const isMatchScheduled = (matchStatus) => {
  return matchStatus === 'Scheduled';
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'Scheduled':
      return '#007AFF';
    case 'Completed':
      return '#00aa55';
    case 'Cancelled':
      return '#ff3b30';
    default:
      return '#999';
  }
};

export const getStatusBackgroundColor = (status) => {
  const color = getStatusColor(status);
  return `${color}20`; // Add 20% opacity
};

// Team Utilities
export const getTeamInitials = (teamName) => {
  return teamName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const getTeamColorCode = (index, colors) => {
  return colors[index % colors.length];
};

// Array Utilities
export const generateTeamPairings = (teams) => {
  const pairs = [];
  for (let i = 0; i < teams.length - 1; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairs.push([teams[i], teams[j]]);
    }
  }
  return pairs;
};

export const sortByDate = (matches) => {
  return [...matches].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
};

export const sortByTeamName = (teams) => {
  return [...teams].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};

// Storage Utilities
export const getStorageKey = (type) => {
  const keys = {
    teams: 'teams',
    matches: 'matches',
    adminSession: 'adminLoggedIn',
    adminEmail: 'adminEmail',
  };
  return keys[type] || type;
};

// UI Utilities
export const getEmptyStateIcon = (type) => {
  const icons = {
    teams: '👥',
    matches: '📅',
    tournaments: '🏆',
  };
  return icons[type] || '📭';
};

export const formatTimeSlot = (time) => {
  return time.toUpperCase();
};

// Number Utilities
export const formatScore = (score) => {
  return score.toString();
};

export const calculateTotalMatches = (teams) => {
  // Calculate total possible matches (team pairings)
  const n = teams.length;
  return (n * (n - 1)) / 2;
};

// Constants
export const TEAM_COLORS = [
  '#FFD700', // Cricket Super Star
  '#FF6B6B', // United Legacy
  '#FF8C42', // Fearless Falcons
  '#FF1493', // Apex Warriors
  '#00AA00', // United Champions
  '#6495ED', // Youth II
  '#9370DB', // Spartan Strikers
  '#C71585', // NoidaBlack Panthers
];

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TIME_SLOTS = ['6:00 AM', '9:30 AM', '1:30 PM', '4:30 PM', '8:00 PM'];

export const MATCH_STATUSES = ['Scheduled', 'Completed', 'Cancelled'];
