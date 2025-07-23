# Vote Dashboard - Refactored Architecture

## Overview

This React-based voting dashboard has been refactored into a modular, maintainable structure with clear separation of concerns. The application manages RFID-based voting sessions with real-time Firebase integration.

## Architecture Overview

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks for state management
├── services/           # External service integrations (Firebase)
├── utils/              # Utility functions and helpers
├── constants/          # Application constants and configuration
├── App.js              # Main application component
└── firebase.js         # Firebase configuration
```

## Components Structure

### Core Components
- **AppLayout**: Main layout wrapper
- **SessionControl**: Session start/stop controls with validation
- **CurrentSessionDashboard**: Live voting session display
- **SessionHistory**: Historical session data with sorting/filtering
- **UserManagement**: User CRUD operations
- **SessionDetailsModal**: Detailed session information

### Sub-Components
- **SessionConfigModal**: Session configuration form
- **AddUserModal**: User registration with RFID scanning
- **UserActions**: User action buttons (edit/delete)
- **VoteResultsTable**: Reusable vote results display

## Custom Hooks

### useUsers()
Manages user data and operations:
```javascript
const { users, addUser, removeUser } = useUsers();
```

### useSessions()
Manages session history:
```javascript
const { sessions, removeSession } = useSessions();
```

### useVotingSession(users)
Manages active voting session state:
```javascript
const {
  votingActive,
  sessionTimeLeft,
  sessionVoteCount,
  sessionCandidates,
  candidateVotes,
  notVotedUserCount,
  startVotingSession,
  stopVotingSession,
} = useVotingSession(users);
```

### useCardScanning()
Handles RFID card scanning:
```javascript
const { waitingForCard, listenForCard, stopListening } = useCardScanning();
```

### useSessionDetails()
Manages session detail modal state:
```javascript
const {
  selectedSession,
  openSessionDetail,
  detailSession,
  detailCandidates,
  detailCandidateVotes,
  openDetails,
  closeDetails,
} = useSessionDetails();
```

## Services

### FirebaseService
Centralized Firebase operations:
- User management (CRUD)
- Session management
- Real-time data listening
- Card scanning integration
- Vote tracking

Key methods:
```javascript
FirebaseService.listenToUsers(callback)
FirebaseService.createUser(uid, name)
FirebaseService.startVotingSession(duration, candidates)
FirebaseService.stopVotingSession(sessionId, notVotedUsers)
```

## Utilities

### Time Utilities (`utils/time.js`)
- `formatSeconds(secs)` - Format seconds to HH:MM:SS
- `formatDuration(minutes)` - Human-readable duration
- `getCurrentUnixTimestamp()` - Current timestamp
- `getTimeRemaining(futureTimestamp)` - Time remaining calculation

### Validation Utilities (`utils/validation.js`)
- `validateSessionDuration(duration)` - Session duration validation
- `validateCandidates(candidates)` - Candidate selection validation
- `validateUser(uid, name)` - User data validation
- `checkVotingEligibility(uid, candidates, votes, users)` - Voting eligibility

### Formatter Utilities (`utils/formatters.js`)
- `getNotVotedUsers(users, candidates, votes)` - Calculate non-voters
- `calculateCandidateVotes(votes)` - Vote count calculation
- `getChoiceLetter(candidates, uid)` - Generate choice letters (A, B, C, D)
- `getCandidateName(uid, users)` - Get candidate name with fallback
- `sortSessions(sessions)` - Sort sessions by status/date

## Constants (`constants/index.js`)

### Session Configuration
```javascript
SESSION_CONFIG = {
  MIN_DURATION: 1,        // minutes
  MAX_DURATION: 120,      // minutes
  MIN_CANDIDATES: 2,
  MAX_CANDIDATES: 4,
}
```

### Firebase Paths
```javascript
FIREBASE_PATHS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  VOTES: 'votes',
  // ... other paths
}
```

### Messages
Centralized user messages for consistency:
```javascript
MESSAGES = {
  SUCCESS: { USER_ADDED: 'User added successfully', ... },
  ERROR: { USER_ADD_FAILED: 'Failed to add user', ... },
  CONFIRMATION: { REMOVE_USER: 'Are you sure...', ... },
}
```

## Key Features

### 1. Modular Component Design
- Small, focused components with single responsibilities
- Reusable components (VoteResultsTable, UserActions)
- Clear prop interfaces

### 2. State Management with Custom Hooks
- Separation of business logic from UI
- Reusable state logic
- Clean component interfaces

### 3. Centralized Services
- Firebase operations abstracted into service layer
- Consistent error handling
- Real-time data synchronization

### 4. Comprehensive Validation
- Input validation for all forms
- Business rule validation
- User-friendly error messages

### 5. Utility Functions
- Pure functions for data transformation
- Time formatting and calculations
- Reusable formatting logic

### 6. Constants Management
- Centralized configuration
- Easy maintenance of settings
- Consistent messaging

## Benefits of This Structure

1. **Maintainability**: Clear separation makes code easier to understand and modify
2. **Reusability**: Components and hooks can be reused across the application
3. **Testability**: Pure functions and isolated components are easier to test
4. **Scalability**: New features can be added without modifying existing code
5. **Consistency**: Centralized constants ensure consistent behavior
6. **Developer Experience**: Clear interfaces and documentation improve productivity

## Usage Examples

### Adding a New Feature
1. Create new components in `components/`
2. Add business logic to custom hooks in `hooks/`
3. Add service methods to `services/`
4. Add utilities to `utils/`
5. Update constants as needed

### Customizing Behavior
- Modify constants in `constants/index.js`
- Update validation rules in `utils/validation.js`
- Customize messages in constants

### Testing
- Test pure utility functions independently
- Test components with mock props
- Test hooks with React Testing Library
- Test services with Firebase emulator

This refactored structure provides a solid foundation for future development while maintaining clean, readable, and maintainable code.
