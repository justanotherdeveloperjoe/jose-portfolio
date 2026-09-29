// Visitor code runs in a worker owned by an opaque-origin iframe. The host
// never evaluates it. CSP blocks outside resources; teardown stops the worker.
const workerSource = `
const send = self.postMessage.bind(self);
self.onmessage = async ({ data }) => {
  const format = value => {
    try { return typeof value === 'string' ? value : JSON.stringify(value) ?? String(value); }
    catch { return String(value); }
  };
  let count = 0;
  const log = (...args) => { if (++count <= 40) send({type:'line', text:args.map(format).join(' ').slice(0,2000)}); };
  const console = {log, info:log, warn:log, error:log, table:log};
  try {
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    let fn;
    if (data.expression) { try { fn = new AsyncFunction('console', '"use strict";return (' + data.code + '\\n)'); } catch {} }
    fn ||= new AsyncFunction('console', '"use strict";\\n' + data.code);
    const value = await fn(console);
    if (value !== undefined) log(value);
    send({type:'done'});
  } catch (error) { send({type:'error', text:String(error.message).slice(0,2000)}); }
};`;

export function runJavaScript(code, { expression = false, onLine, onDone }) {
  const frame = document.createElement('iframe');
  frame.hidden = true;
  frame.title = 'Isolated JavaScript process';
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.referrerPolicy = 'no-referrer';
  const token = crypto.randomUUID();
  let finished = false, lines = 0;
  const finish = message => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    window.removeEventListener('message', receive);
    frame.remove();
    onDone(message);
  };
  const receive = event => {
    if (event.source !== frame.contentWindow || event.data?.token !== token) return;
    const data = event.data;
    if (data.type === 'ready') frame.contentWindow.postMessage({ token, code, expression }, '*');
    if (data.type === 'line' && typeof data.text === 'string') {
      if (++lines > 40) finish('Stopped: output limit reached.');
      else onLine(data.text.slice(0, 2000));
    }
    if (data.type === 'done') finish('Process finished.');
    if (data.type === 'error') finish('Error: ' + String(data.text).slice(0, 2000));
  };
  const timeout = setTimeout(() => finish('Stopped: 2 second time limit reached.'), 2000);
  window.addEventListener('message', receive);
  const bootstrap = `
    const token = ${JSON.stringify(token)};
    const send = data => parent.postMessage({...data,token}, '*');
    let worker, count = 0;
    addEventListener('message', event => {
      if (event.source !== parent || event.data?.token !== token || worker) return;
      try {
        const url = URL.createObjectURL(new Blob([${JSON.stringify(workerSource)}], {type:'text/javascript'}));
        worker = new Worker(url);
        URL.revokeObjectURL(url);
        worker.onmessage = ({data}) => {
          if (++count > 42) { worker.terminate(); send({type:'error',text:'Output limit reached.'}); return; }
          if (['line','done','error'].includes(data?.type)) send({type:data.type,text:typeof data.text==='string'?data.text.slice(0,2000):''});
        };
        worker.onerror = event => { event.preventDefault(); send({type:'error',text:'The script could not run.'}); };
        worker.postMessage({code:event.data.code,expression:event.data.expression});
      } catch { send({type:'error',text:'JavaScript execution is unavailable in this browser.'}); }
    });
    send({type:'ready'});`;
  frame.srcdoc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'; base-uri 'none'; form-action 'none'"><script>${bootstrap.replace(/<\/script/gi, '<\\/script')}</script>`;
  document.body.append(frame);
  return () => finish('Process stopped.');
}
