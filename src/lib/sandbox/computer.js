import { HOME, children, filesystem, freshHome, resolvePath, saveFile, validateHome, writable } from './home.js';

export const computerCommands = ['help', 'ls', 'cd', 'pwd', 'cat', 'tree', 'mkdir', 'touch', 'echo', 'cp', 'mv', 'rm', 'edit', 'run', 'js', 'download', 'history', 'whoami', 'date', 'clear', 'theme', 'open', 'learn', 'play', 'exit'];

export function computerCommand(command, args, state, raw) {
  const home = state.home || freshHome();
  const fs = filesystem(home, state.drafts);
  const cwd = state.cwd || HOME;
  const arg = args[0];
  const path = resolvePath(arg || '', cwd);
  const text = value => ({ text: value });
  const changed = (next, message = '') => ({ text: message, home: validateHome(next) });
  const requireArgs = count => { if (args.length !== count) throw new Error(`Usage: ${command} ${count === 2 ? '<source> <destination>' : '<path>'}`); };
  switch (command) {
    case 'pwd': return text(cwd);
    case 'whoami': return text('guest');
    case 'date': return text(new Date().toLocaleString());
    case 'history': return text((state.history || []).map((line, i) => `${String(i + 1).padStart(3)}  ${line}`).join('\n') || 'No commands yet.');
    case 'exit': return { text: 'Session saved. See you around.', action: { type: 'exit' } };
    case 'ls': {
      if (args.length > 1) return text('Usage: ls [path]');
      if (fs.files.has(path)) return text(path.split('/').pop());
      if (!fs.dirs.has(path)) throw new Error(`ls: no such directory: ${arg}`);
      const listing = children(path, fs);
      return { text: listing.map(entry => entry.name + (entry.directory ? '/' : '')).join('  ') || '(empty)', listing };
    }
    case 'tree': {
      if (!fs.dirs.has(path)) throw new Error(`tree: no such directory: ${arg}`);
      const walk = (dir, indent = '') => children(dir, fs).flatMap((entry, index, entries) => {
        const last = index === entries.length - 1;
        return [indent + (last ? '└── ' : '├── ') + entry.name + (entry.directory ? '/' : ''), ...(entry.directory ? walk((dir === '/' ? '' : dir) + '/' + entry.name, indent + (last ? '    ' : '│   ')) : [])];
      });
      return text([path, ...walk(path)].join('\n'));
    }
    case 'cd': {
      const destination = arg ? path : HOME;
      if (!fs.dirs.has(destination)) throw new Error(`cd: no such directory: ${arg}`);
      return { text: '', cwd: destination };
    }
    case 'cat': requireArgs(1); if (!fs.files.has(path)) throw new Error(`cat: no such file: ${arg}`); return text(fs.files.get(path));
    case 'mkdir':
      requireArgs(1);
      if (!writable(path) || fs.dirs.has(path) || fs.files.has(path)) throw new Error('Choose a new folder name inside your home.');
      return changed({ ...home, dirs: [...home.dirs, path] });
    case 'touch': requireArgs(1); return changed(saveFile(home, path, fs.files.get(path) || ''));
    case 'echo': {
      // Redirection is recognized only outside quotes by the shared tokenizer.
      const index = args.findIndex(item => item === '\u0000>' || item === '\u0000>>');
      if (index === -1) return text(args.join(' '));
      if (index !== args.length - 2) throw new Error('Usage: echo "your text" > notes.txt (or >> to append)');
      const destination = resolvePath(args[index + 1], cwd);
      const content = (args[index] === '\u0000>>' ? fs.files.get(destination) || '' : '') + args.slice(0, index).join(' ') + '\n';
      return changed(saveFile(home, destination, content));
    }
    case 'cp': case 'mv': {
      requireArgs(2);
      if (!fs.files.has(path)) throw new Error('Source must be a file.');
      if (command === 'mv' && !writable(path)) throw new Error('Portfolio files are read-only. Use cp to copy one into your home.');
      let destination = resolvePath(args[1], cwd);
      if (fs.dirs.has(destination)) destination += '/' + path.split('/').pop();
      if (fs.files.has(destination) || fs.dirs.has(destination)) throw new Error('Destination exists. Choose another name.');
      const next = saveFile(home, destination, fs.files.get(path));
      if (command === 'mv') next.files = next.files.filter(([name]) => name !== path);
      return changed(next);
    }
    case 'rm':
      requireArgs(1);
      if (!writable(path)) throw new Error('Only your own files and empty folders can be removed.');
      if (fs.dirs.has(path)) {
        if (children(path, fs).length) throw new Error('Folder is not empty. Remove its files first.');
        if (path === cwd || cwd.startsWith(path + '/')) throw new Error('Leave this folder before removing it.');
        return changed({ ...home, dirs: home.dirs.filter(name => name !== path) });
      }
      if (!fs.files.has(path)) throw new Error('File not found.');
      return changed({ ...home, files: home.files.filter(([name]) => name !== path) });
    case 'download': requireArgs(1); if (!fs.files.has(path)) throw new Error('File not found.'); return { text: `Downloading ${arg}`, action: { type: 'download', path, content: fs.files.get(path) } };
    case 'run': requireArgs(1); if (!path.endsWith('.js') || !fs.files.has(path)) throw new Error('Choose a JavaScript file. Try run hello.js.'); return { text: '', action: { type: 'run', code: fs.files.get(path) } };
    case 'js': return { text: '', action: { type: 'run', code: raw.replace(/^\s*js\s*/i, ''), expression: true } };
    default: return null;
  }
}

export function completeCommand(input, state) {
  if (/["']/.test(input)) return [];
  const parts = input.split(/\s+/);
  if (parts.length === 1) return computerCommands.filter(name => name.startsWith(input)).map(name => name + ' ');
  const word = parts.pop();
  const slash = word.lastIndexOf('/');
  const prefix = slash < 0 ? '' : word.slice(0, slash + 1);
  const fragment = word.slice(slash + 1);
  const fs = filesystem(state.home, state.drafts);
  return children(resolvePath(prefix || '.', state.cwd), fs).filter(entry => entry.name.startsWith(fragment)).map(entry => {
    const path = prefix + entry.name + (entry.directory ? '/' : '');
    return [...parts, /\s/.test(path) ? JSON.stringify(path) : path].join(' ');
  });
}
