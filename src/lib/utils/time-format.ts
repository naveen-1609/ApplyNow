export function normalizeTimeFormat(time: string): string {
  if (!time) {
    console.warn('Empty time value provided');
    return time;
  }

  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }

  if (/^\d{1}:\d{2}$/.test(time)) {
    return `0${time}`;
  }

  const pmMatch = time.match(/(\d{1,2}):(\d{2})\s*PM/i);
  const amMatch = time.match(/(\d{1,2}):(\d{2})\s*AM/i);

  if (pmMatch) {
    let hour = parseInt(pmMatch[1], 10);
    const minute = pmMatch[2];
    if (hour !== 12) {
      hour += 12;
    }
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }

  if (amMatch) {
    let hour = parseInt(amMatch[1], 10);
    const minute = amMatch[2];
    if (hour === 12) {
      hour = 0;
    }
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }

  const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1], 10).toString().padStart(2, '0');
    const minute = timeMatch[2];
    return `${hour}:${minute}`;
  }

  console.warn(`Could not normalize time format: ${time}, returning as-is`);
  return time;
}
