export const getExpirationDate = (expiration: string): Date => {
  const currentDate = new Date();
  const timeUnit = expiration.slice(-1); // Extract the last character (unit)
  const timeValue = parseInt(expiration.slice(0, -1), 10); // Extract the numeric value

  if (isNaN(timeValue)) {
    throw new Error('Invalid expiration format: numeric value is missing.');
  }

  switch (timeUnit) {
    case 's': // Seconds
      currentDate.setSeconds(currentDate.getSeconds() + timeValue);
      break;
    case 'm': // Minutes
      currentDate.setMinutes(currentDate.getMinutes() + timeValue);
      break;
    case 'h': // Hours
      currentDate.setHours(currentDate.getHours() + timeValue);
      break;
    case 'd': // Days
      currentDate.setDate(currentDate.getDate() + timeValue);
      break;
    case 'w': // Weeks
      currentDate.setDate(currentDate.getDate() + timeValue * 7);
      break;
    case 'M': // Months
      currentDate.setMonth(currentDate.getMonth() + timeValue);
      break;
    case 'y': // Years
      currentDate.setFullYear(currentDate.getFullYear() + timeValue);
      break;
    default:
      throw new Error('Invalid expiration format: unknown time unit.');
  }

  return currentDate;
};
