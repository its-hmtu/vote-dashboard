/**
 * Time utility functions
 */

import moment from 'moment';
import { DATE_FORMATS } from '../constants';

/**
 * Format seconds as hh:mm:ss or mm:ss
 * @param {number} secs - Number of seconds
 * @returns {string} Formatted time string
 */
export function formatSeconds(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s]
    .map((v, i) => (i === 0 && v === 0 ? null : String(v).padStart(2, "0")))
    .filter(Boolean)
    .join(":");
}

/**
 * Format duration in minutes to readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}

/**
 * Get current timestamp in Unix format
 * @returns {number} Unix timestamp
 */
export function getCurrentUnixTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Get current timestamp in ISO format
 * @returns {string} ISO timestamp
 */
export function getCurrentISOTimestamp() {
  return moment().format(DATE_FORMATS.ISO);
}

/**
 * Format Unix timestamp to display format
 * @param {number} unixTimestamp - Unix timestamp
 * @returns {string} Formatted timestamp
 */
export function formatUnixTimestamp(unixTimestamp) {
  return moment.unix(unixTimestamp).format(DATE_FORMATS.DISPLAY);
}

/**
 * Format ISO timestamp to display format
 * @param {string} isoTimestamp - ISO timestamp
 * @returns {string} Formatted timestamp
 */
export function formatISOTimestamp(isoTimestamp) {
  return moment(isoTimestamp).format(DATE_FORMATS.DISPLAY);
}

/**
 * Get time remaining until a future timestamp
 * @param {number} futureUnixTimestamp - Future Unix timestamp
 * @returns {number} Seconds remaining (0 if past)
 */
export function getTimeRemaining(futureUnixTimestamp) {
  const now = getCurrentUnixTimestamp();
  return Math.max(0, futureUnixTimestamp - now);
}

/**
 * Calculate session end time
 * @param {number} startTime - Start time in Unix timestamp
 * @param {number} durationSeconds - Duration in seconds
 * @returns {number} End time in Unix timestamp
 */
export function calculateSessionEndTime(startTime, durationSeconds) {
  return startTime + durationSeconds;
}

/**
 * Check if a timestamp is from today
 * @param {number} unixTimestamp - Unix timestamp
 * @returns {boolean} Is from today
 */
export function isToday(unixTimestamp) {
  return moment.unix(unixTimestamp).isSame(moment(), 'day');
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {number} unixTimestamp - Unix timestamp
 * @returns {string} Relative time
 */
export function getRelativeTime(unixTimestamp) {
  return moment.unix(unixTimestamp).fromNow();
}
