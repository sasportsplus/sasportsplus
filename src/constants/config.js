// Constants for the Sanjay Sports Management App

export const APP_NAME = 'Sanjay Sports Management';
export const APP_VERSION = '1.0.0';

// Authentication
export const DEFAULT_ADMIN_EMAIL = 'admin@sanjay.com';
export const DEFAULT_ADMIN_PASSWORD = 'admin@123';

// Colors
export const COLORS = {
  primary: '#007AFF',
  secondary: '#6B63FF',
  success: '#00aa55',
  error: '#ff3b30',
  warning: '#FFD700',
  info: '#6495ED',
  white: '#ffffff',
  black: '#000000',
  lightGray: '#f5f5f5',
  darkGray: '#333333',
  mediumGray: '#666666',
  borderGray: '#ddd',
};

// Team Colors
export const TEAM_COLORS = [
  '#FFD700', // Cricket Super Star - Gold
  '#FF6B6B', // United Legacy - Red
  '#FF8C42', // Fearless Falcons - Orange
  '#FF1493', // Apex Warriors - Deep Pink
  '#00AA00', // United Champions - Green
  '#6495ED', // Youth II - Cornflower Blue
  '#9370DB', // Spartan Strikers - Medium Purple
  '#C71585', // NoidaBlack Panthers - Violet Red
];

// Schedule Configuration
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const TIME_SLOTS = ['6:00 AM', '9:30 AM', '1:30 PM', '4:30 PM', '8:00 PM'];

// Match Statuses
export const MATCH_STATUSES = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// Storage Keys
export const STORAGE_KEYS = {
  TEAMS: 'teams',
  MATCHES: 'matches',
  ADMIN_LOGGED_IN: 'adminLoggedIn',
  ADMIN_EMAIL: 'adminEmail',
};

// API Timeouts
export const API_TIMEOUT = 10000;

// Pagination
export const ITEMS_PER_PAGE = 10;

// Validation Rules
export const VALIDATION_RULES = {
  MIN_TEAM_NAME_LENGTH: 2,
  MAX_TEAM_NAME_LENGTH: 50,
  MIN_PLAYERS: 1,
  MAX_PLAYERS: 100,
  MIN_COACH_NAME_LENGTH: 2,
  MAX_COACH_NAME_LENGTH: 50,
  MIN_VENUE_LENGTH: 3,
  MAX_VENUE_LENGTH: 100,
};

// Error Messages
export const ERROR_MESSAGES = {
  TEAM_NAME_REQUIRED: 'Please enter team name',
  INVALID_TEAM_NAME: 'Team name must be at least 2 characters',
  PLAYERS_REQUIRED: 'Please enter number of players',
  INVALID_PLAYERS_COUNT: 'Please enter a valid number of players',
  VENUE_REQUIRED: 'Please enter venue',
  TEAMS_REQUIRED: 'Please select at least 2 teams',
  DAYS_REQUIRED: 'Please select at least one day',
  TIMES_REQUIRED: 'Please select at least one time slot',
  EMAIL_REQUIRED: 'Please enter email',
  PASSWORD_REQUIRED: 'Please enter password',
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOURNAMENT_NAME_REQUIRED: 'Please enter tournament name',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  TEAM_ADDED: 'Team added successfully!',
  TEAM_UPDATED: 'Team updated successfully!',
  TEAM_DELETED: 'Team deleted successfully!',
  MATCH_SCHEDULED: 'Matches scheduled successfully!',
  MATCH_UPDATED: 'Match updated successfully!',
  MATCH_DELETED: 'Match deleted successfully!',
  LOGIN_SUCCESS: 'Logged in successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
};

// Screen Names
export const SCREEN_NAMES = {
  LOGIN: 'Login',
  ADMIN_DASHBOARD: 'AdminDashboard',
  ADMIN_TABS: 'AdminTabs',
  VIEW_TEAMS: 'ViewTeams',
  ADD_TEAM: 'AddTeam',
  EDIT_TEAM: 'EditTeam',
  SCHEDULE_MATCH: 'ScheduleMatch',
  VIEW_MATCHES: 'ViewMatches',
  EDIT_MATCH: 'EditMatch',
};

// Numeric Limits
export const LIMITS = {
  MIN_SCORE: 0,
  MAX_SCORE: 999,
  MIN_TEAMS: 2,
  MAX_TEAMS: 20,
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_DAY: 'EEE, dd MMM yyyy',
  TIME: 'hh:mm a',
  FULL: 'MMM dd, yyyy hh:mm a',
};

// Features
export const FEATURES = [
  {
    title: 'Team Management',
    description: 'Add, edit, and manage teams effortlessly',
    icon: '👥',
  },
  {
    title: 'Match Scheduling',
    description: 'Schedule matches between teams with multiple time slots',
    icon: '📅',
  },
  {
    title: 'Score Tracking',
    description: 'Update match scores and track results',
    icon: '📊',
  },
  {
    title: 'Tournament Mode',
    description: 'Create and manage tournaments with auto-pairing',
    icon: '🏆',
  },
  {
    title: 'Admin Dashboard',
    description: 'Overview of all teams and matches statistics',
    icon: '📈',
  },
  {
    title: 'Local Storage',
    description: 'All data stored locally for offline access',
    icon: '💾',
  },
];
