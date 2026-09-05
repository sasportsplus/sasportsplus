# Sanjay Sports Management - Match Schedule Management App

A comprehensive React Native application for managing sports tournaments, team management, and match scheduling.

## Features

### 1. **Admin Authentication**
- Secure login system with admin credentials
- Session management using AsyncStorage
- Default credentials: `admin@sanjay.com` / `admin@123`

### 2. **Team Management**
- **Add Teams**: Create new teams with details
  - Team name
  - Captain name
  - Number of players
  - Team description

- **View Teams**: Display all teams in color-coded cards
  - Quick overview of team information
  - Edit and delete options

- **Edit Teams**: Modify team information
  - Update team details
  - Maintain team statistics

### 3. **Match Scheduling** (Based on Wireframe)
- **Generate Match Schedule**:
  - Select multiple teams
  - Choose available days (Mon-Sun)
  - Select match time slots (6:00 AM, 9:30 AM, 1:30 PM, 4:30 PM, 8:00 PM)
  - Specify venue
  - Auto-generate all team pairings
  - Quick select options: "All Days", "Clear All"

- **Schedule Visualization**:
  - Display scheduled matches in card format
  - Shows date, time, venue, and teams
  - Match status indicators (Scheduled, Completed, Confirmed)
  - Option to send reminders to teams

### 4. **Match Management**
- **View Matches**: Browse all scheduled matches
  - Filter by status (All, Scheduled, Completed, Cancelled)
  - Detailed match information cards
  - Edit and delete functionality

- **Edit Matches**:
  - Update match venue
  - Change match status
  - Update final scores (for completed matches)
  - Automatic winner determination

### 5. **Admin Dashboard**
- Quick statistics overview
  - Total teams
  - Total matches
  - Upcoming matches
  - Completed matches
- Quick action buttons for common tasks
- Admin profile and logout functionality

## Project Structure

```
sanjay-sports-management/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── AdminDashboard.js
│   │   ├── AddTeamScreen.js
│   │   ├── ViewTeamsScreen.js
│   │   ├── EditTeamScreen.js
│   │   ├── ScheduleMatchScreen.js
│   │   ├── ViewMatchesScreen.js
│   │   └── EditMatchScreen.js
│   └── context/
│       └── SportsDataContext.js
├── App.js
├── package.json
├── app.json
├── .babelrc
├── metro.config.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Steps

1. **Clone the repository**
   ```bash
   cd sanjay-sports-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install native dependencies** (if needed)
   ```bash
   npm install @react-native-async-storage/async-storage
   npm install react-native-uuid
   npx pod-install ios  # For iOS
   ```

4. **Run the app**

   **For Android:**
   ```bash
   npm run android
   # or
   react-native run-android
   ```

   **For iOS:**
   ```bash
   npm run ios
   # or
   react-native run-ios
   ```

   **Start Metro bundler:**
   ```bash
   npm start
   # or
   react-native start
   ```

## Usage Guide

### Login
- Use the default credentials to login as admin
- Email: `admin@sanjay.com`
- Password: `admin@123`

### Adding a Team
1. Navigate to **Teams** tab
2. Click **+ Add Team**
3. Fill in team details
4. Click **Add Team**

### Scheduling Matches
1. Navigate to **Matches** tab
2. Click **Schedule Match**
3. Enter tournament name
4. Select teams (minimum 2 required)
5. Select available days
6. Select match time slots
7. Enter venue
8. Click **Generate Matches**
9. Review generated matches
10. Matches are saved automatically

### Viewing Matches
1. Navigate to **Matches** tab
2. Use filters to view specific match statuses
3. Click **Edit** to update match details
4. Add final scores for completed matches

### Editing Team Information
1. Go to **Teams** tab
2. Click **Edit** on any team card
3. Update team details
4. Click **Update Team**

## Data Storage

All data is stored locally using AsyncStorage:
- **Teams**: Stored under key `teams`
- **Matches**: Stored under key `matches`
- **Admin Session**: Stored under key `adminLoggedIn`

Data persists across app restarts.

## Technologies Used

- **React Native**: Cross-platform mobile development
- **React Navigation**: Navigation between screens
- **AsyncStorage**: Local data persistence
- **UUID**: Unique identifier generation
- **date-fns**: Date manipulation and formatting

## Features & Screens

### Admin Dashboard
- Overview of all statistics
- Quick action buttons
- Logout functionality

### Team Management
- **Add Team Screen**: Create teams with color-coded badges
- **View Teams Screen**: List all teams with edit/delete options
- **Edit Team Screen**: Modify team information

### Match Management
- **Schedule Match Screen**: Advanced scheduling with day/time selection
- **View Matches Screen**: Filter and display matches by status
- **Edit Match Screen**: Update scores and match status

## UI Design Features

- Color-coded team badges
- Status-based color indicators
- Intuitive navigation with tab and stack navigators
- Responsive layout for various screen sizes
- Empty state messages with action buttons
- Pull-to-refresh functionality
- Loading states for async operations

## Future Enhancements

- [ ] Payment management system
- [ ] Email/SMS notifications
- [ ] Statistics and analytics
- [ ] Team standings/rankings
- [ ] Live match updates
- [ ] PDF report generation
- [ ] Multiple tournament support
- [ ] Player management
- [ ] Attendance tracking
- [ ] Performance analytics

## Troubleshooting

### Issue: App crashes on startup
- Clear cache: `npm start -- --reset-cache`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Issue: AsyncStorage not persisting data
- Ensure app has storage permissions
- Check if AsyncStorage is properly initialized

### Issue: Navigation not working
- Verify React Navigation is properly installed
- Check screen names match navigation configuration

## Support & Contact

For support or feature requests, please contact the development team.

## License

This project is proprietary and all rights are reserved.

---

**Version**: 1.0.0
**Last Updated**: 2026-09-01
