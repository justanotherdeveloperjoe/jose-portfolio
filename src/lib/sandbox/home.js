import { files as systemFiles, directories as systemDirectories, normalizePath } from './filesystem.js';

export const HOME = '/home/guest';
export const STORAGE_KEY = 'jose-studio-computer-v1';
export const MAX_FILE = 20 * 1024;
const MAX_TOTAL = 128 * 1024;
const reserved = ['projects', 'learning', 'experiments', 'about.txt'];
export const bytes = value => new TextEncoder().encode(value).length;

export function freshHome() {
  return { files: [
    [HOME + '/hello.js', 'const languages = ["JavaScript", "React", "SQL", "Python", "AWS"];\nconsole.log("Hello from your little computer.");\nconsole.log(languages.map(name => "Learning " + name).join("\\n"));'],
    [HOME + '/readme.txt', 'Welcome to your workspace.\n\nTry this:\n  mkdir ideas\n  echo "My next experiment" > ideas/notes.txt\n  cat ideas/notes.txt\n  edit hello.js\n  run hello.js\n\nYour files save in this browser. Use download <file> to keep a copy.\nPortfolio folders are read-only. Type help for commands.'],
  ], dirs: [HOME] };
}

export function writable(path) {
  if (!path.startsWith(HOME + '/')) return false;
  const first = path.slice(HOME.length + 1).split('/')[0];
  return !reserved.includes(first) && path.length <= 220 && !/[\x00-\x1f\\]/.test(path);
}

export function validateHome(home) {
  if (!home || !Array.isArray(home.files) || !Array.isArray(home.dirs) || home.files.length + home.dirs.length > 100) throw new Error('Workspace limit: 100 files and folders.');
  let total = 0;
  const seen = new Set();
  for (const entry of home.files) {
    if (!Array.isArray(entry) || entry.length !== 2 || entry.some(value => typeof value !== 'string')) throw new Error('Invalid saved file.');
    const [path, content] = entry;
    if (!writable(path) || normalizePath(path) !== path || seen.has(path)) throw new Error('Invalid file path.');
    seen.add(path);
    const size = bytes(content); total += size;
    if (size > MAX_FILE) throw new Error('Each file can hold up to 20 KB.');
  }
  for (const path of home.dirs) {
    if (typeof path !== 'string' || (path !== HOME && !writable(path)) || normalizePath(path) !== path || seen.has(path)) throw new Error('Invalid folder path.');
    seen.add(path);
  }
  const dirs = new Set(home.dirs);
  if (!dirs.has(HOME)) throw new Error('Missing home folder.');
  for (const path of seen) if (path !== HOME && !dirs.has(path.slice(0, path.lastIndexOf('/')))) throw new Error('Parent folder does not exist.');
  if (total > MAX_TOTAL) throw new Error('Workspace full: download a file or remove one to free space.');
  return home;
}

export function readHome(storage) {
  try {
    const saved = storage.getItem(STORAGE_KEY);
    return { home: saved ? validateHome(JSON.parse(saved)) : freshHome(), persistence: 'local' };
  } catch { return { home: freshHome(), persistence: 'session' }; }
}

export function filesystem(home = freshHome(), drafts) {
  const files = new Map(systemFiles);
  const dirs = new Set([...systemDirectories, '/home', HOME]);
  for (const [path, content] of systemFiles) files.set(HOME + path, content);
  for (const path of systemDirectories) if (path !== '/') dirs.add(HOME + path);
  for (const [name, draft] of Object.entries(drafts || {})) {
    for (const [file, content] of [['index.html', draft.html], ['style.css', draft.css]]) {
      files.set(`/experiments/${name}/${file}`, content);
      files.set(`${HOME}/experiments/${name}/${file}`, content);
    }
  }
  for (const [path, content] of home.files) files.set(path, content);
  for (const path of home.dirs) dirs.add(path);
  return { files, dirs };
}

export function saveFile(home, path, content) {
  if (!writable(path)) throw new Error('Read-only location. Save your files inside ~ (your home folder).');
  if (home.dirs.includes(path)) throw new Error('That path is a folder.');
  const files = new Map(home.files); files.set(path, content);
  return validateHome({ ...home, files: [...files] });
}

export function resolvePath(value = '', cwd = HOME) {
  return normalizePath(value === '~' || value.startsWith('~/') ? HOME + value.slice(1) : value, cwd);
}
export const displayPath = path => path === HOME || path.startsWith(HOME + '/') ? '~' + path.slice(HOME.length) : path;

export function children(path, fs) {
  const prefix = path === '/' ? '/' : path + '/';
  return [...fs.dirs, ...fs.files.keys()].filter(item => item.startsWith(prefix) && item !== path && !item.slice(prefix.length).includes('/')).sort().map(item => ({ name: item.slice(prefix.length), directory: fs.dirs.has(item) }));
}
