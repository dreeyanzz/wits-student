/**
 * Time utility functions
 */

/**
 * Get today's day code (M, T, W, TH, F, S, SU)
 * @returns {string} Day code
 */
export function getTodayCode() {
  const days = ['SU', 'M', 'T', 'W', 'TH', 'F', 'S'];
  const today = new Date().getDay();
  return days[today];
}

/**
 * Convert time string to minutes from 7:00 AM
 * @param {string} timeStr - Time string (e.g., "08:00 AM")
 * @returns {number} Minutes from 7:00 AM
 */
export function getMinutesFrom7AM(timeStr) {
  if (!timeStr) return 0;

  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  const totalMinutes = hours * 60 + minutes;
  const sevenAM = 7 * 60;

  return totalMinutes - sevenAM;
}

/**
 * Parses time string into hours and minutes
 * @param {string} timeStr - Time string (e.g., "9:30 AM")
 * @returns {{hours: number, minutes: number}}
 */
export function parseTime(timeStr) {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
}

/**
 * Gets full day name from day code
 * @param {string} dayCode - Day code
 * @returns {string} Full day name
 */
export function getDayName(dayCode) {
  const DAY_NAME_MAP = {
    M: "Monday",
    T: "Tuesday",
    W: "Wednesday",
    TH: "Thursday",
    F: "Friday",
    S: "Saturday",
    SU: "Sunday",
  };
  return DAY_NAME_MAP[dayCode] || dayCode;
}

/**
 * Maps day code to array index
 * @param {string} dayCode - Day code (M, T, W, TH, F, S, SU)
 * @returns {number} Day index
 */
export function getDayIndex(dayCode) {
  const DAY_CODE_MAP = {
    M: 0,
    T: 1,
    W: 2,
    TH: 3,
    F: 4,
    S: 5,
    SU: 6,
  };
  return DAY_CODE_MAP[dayCode];
}
