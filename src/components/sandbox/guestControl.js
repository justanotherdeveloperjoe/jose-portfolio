// A separate guest serial port keeps monitoring and resize commands out of the
// visitor's shell, including when an editor or an unfinished command is active.
export const startGuestControl = "stty -F /dev/ttyS1 raw -echo; setsid sh -c 'while IFS= read -r command; do eval \"$command\"; done' </dev/ttyS1 >/dev/ttyS1 2>&1 &";

export function createGuestControl(emulator) {
  let buffer = '', request = null, disposed = false;
  const send = command => {
    if (!disposed) emulator.serial_send_bytes(1, new TextEncoder().encode(command + '\n'));
  };
  const receive = byte => {
    buffer = (buffer + String.fromCharCode(byte)).slice(-65536);
    const start = buffer.indexOf('STUDIO_BEGIN\n'), end = buffer.indexOf('STUDIO_END\n', start);
    if (start < 0 || end < 0 || !request) return;
    const payload = buffer.slice(start + 13, end);
    buffer = buffer.slice(end + 11);
    const pending = request; request = null; clearTimeout(pending.timer);
    try { pending.resolve(parseGuestStats(payload)); } catch (error) { pending.reject(error); }
  };
  emulator.add_listener('serial1-output-byte', receive);
  return {
    resize(cols, rows) { send(`stty -F /dev/ttyS0 cols ${Math.max(1, Math.floor(cols))} rows ${Math.max(1, Math.floor(rows))}`); },
    sample() {
      if (disposed || request) return Promise.reject(new Error('Monitor is waiting for Linux.'));
      return new Promise((resolve, reject) => {
        request = { resolve, reject, timer: setTimeout(() => { request = null; buffer = ''; reject(new Error('Linux did not respond. Try refreshing.')); }, 6000) };
        send("printf 'STUDIO_BEGIN\\n'; cat /proc/meminfo; printf 'STUDIO_UPTIME\\n'; cat /proc/uptime; printf 'STUDIO_PROCESSES\\n'; ps; printf 'STUDIO_END\\n'");
      });
    },
    dispose() {
      disposed = true;
      emulator.remove_listener('serial1-output-byte', receive);
      if (request) { clearTimeout(request.timer); request.reject(new Error('Linux session ended.')); request = null; }
    },
  };
}

export function parseGuestStats(text) {
  const [memory, rest = ''] = text.split('STUDIO_UPTIME\n');
  const [uptime, processes = ''] = rest.split('STUDIO_PROCESSES\n');
  const values = Object.fromEntries([...memory.matchAll(/^(\w+):\s+(\d+) kB/gm)].map(match => [match[1], Number(match[2])]));
  const seconds = Number.parseFloat(uptime);
  if (!values.MemTotal || !Number.isFinite(seconds) || !processes.trim()) throw new Error('Waiting for a complete Linux sample.');
  const available = values.MemAvailable ?? ((values.MemFree || 0) + (values.Buffers || 0) + (values.Cached || 0));
  return { total: values.MemTotal, used: Math.max(0, values.MemTotal - available), seconds, processes: processes.trim(), sampledAt: Date.now() };
}
