// Test script to verify analytics calculations with actual database structure
import { calculateSessionResults } from './utils/formatters';

// Simulate the actual database structure from the export
const testSession = {
  sessionId: "session_1754150904722",
  candidates: {
    "34691605": true,
    "043BDCFD730000": true,
    "06B29F9F": true
  },
  duration: 120,
  end_time: "2025-08-02T23:10:29+07:00",
  end_time_unix: 1754151029,
  notVotedUsers: [
    "25087ABE",
    "25C76EBE", 
    "26F43F9F",
    "35AC6FF2",
    "4566C4BE",
    "582C4CD2",
    "656220BE",
    "65BEDDF1",
    "B8ED71D1",
    "E6577E9F"
  ],
  start_time: 1754150904,
  status: "stopped",
  voteType: "election"
};

const testVotes = {
  "25087ABE": {
    candidate_uid: "2",
    timestamp: 1754176151
  },
  "25C76EBE": {
    candidate_uid: "1", 
    timestamp: 1754176199
  },
  "26F43F9F": {
    candidate_uid: "3",
    timestamp: 1754176184
  },
  "4566C4BE": {
    candidate_uid: "1",
    timestamp: 1754176130
  },
  "582C4CD2": {
    candidate_uid: "3",
    timestamp: 1754176207
  },
  "656220BE": {
    candidate_uid: "2",
    timestamp: 1754176176
  },
  "B8ED71D1": {
    candidate_uid: "2",
    timestamp: 1754176142
  },
  "E6577E9F": {
    candidate_uid: "3",
    timestamp: 1754176169
  }
};

const testUsers = [
  { uid: "34691605", name: "User 11" },
  { uid: "043BDCFD730000", name: "User 12" },
  { uid: "06B29F9F", name: "User 9" },
  { uid: "25087ABE", name: "User 8" },
  { uid: "25C76EBE", name: "User 7" },
  { uid: "26F43F9F", name: "User 2" },
  { uid: "35AC6FF2", name: "Hoàng Minh Tú" },
  { uid: "4566C4BE", name: "User 6" },
  { uid: "582C4CD2", name: "User 1" },
  { uid: "656220BE", name: "User 5" },
  { uid: "65BEDDF1", name: "Duong Dai So" },
  { uid: "B8ED71D1", name: "User 3" },
  { uid: "E6577E9F", name: "User 10" }
];

// Test the calculation
const results = calculateSessionResults(testSession, testVotes, testUsers);

console.log('=== ANALYTICS TEST RESULTS ===');
console.log('Total Users:', testUsers.length);
console.log('Total Candidates:', Object.keys(testSession.candidates).length);
console.log('Total Votes:', results.sessionVotes);
console.log('Expected Votes (from database):', Object.keys(testVotes).length);
console.log('Participation Rate:', results.participationRate + '%');
console.log('Expected Participation Rate:', 
  Math.round((Object.keys(testVotes).length / (testUsers.length - Object.keys(testSession.candidates).length)) * 100) + '%'
);
console.log('Voted Users:', Object.keys(testVotes));
console.log('Not Voted Users Count:', results.notVotedUsers.length);
console.log('Candidate Votes:', results.candidateVotes);

export { testSession, testVotes, testUsers, results };
