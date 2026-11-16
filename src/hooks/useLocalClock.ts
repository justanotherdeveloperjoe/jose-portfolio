import { useEffect, useState } from 'react';

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Monterrey',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function useLocalClock() {
  const [time, setTime] = useState(() => formatter.format(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTime(formatter.format(new Date())), 15000);
    return () => clearInterval(id);
  }, []);

  return time;
}
