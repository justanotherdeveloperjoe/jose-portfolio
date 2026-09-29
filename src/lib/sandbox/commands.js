import { projects } from '../../data/projects.js';
import { learningTopics } from '../../data/learning.js';
import { aliases, help, templates } from '../../data/sandbox.js';
import { directories, files, learningNote, listDirectory, normalizePath } from './filesystem.js';
import { computerCommand } from './computer.js';
import { filesystem, resolvePath, writable } from './home.js';

export const limits = { command: 512, history: 100, output: 200, entry: 6000 };

export function parseCommand(input) {
  if (input.length > limits.command) throw new Error('Keep commands under 512 characters.');
  const tokens = [];
  let token = '', quote = '', started = false;
  for (const char of input.trim()) {
    if (quote) {
      if (char === quote) quote = ''; else token += char;
    } else if (char === '"' || char === "'") { quote = char; started = true; }
    else if (char === '>') {
      if (started) tokens.push(token);
      token = ''; started = false;
      if (tokens.at(-1) === '\u0000>') tokens[tokens.length - 1] = '\u0000>>';
      else tokens.push('\u0000>');
    }
    else if (/\s/.test(char)) { if (started) tokens.push(token); token = ''; started = false; }
    else { token += char; started = true; }
  }
  if (quote) throw new Error('Close the quotation mark, then try again.');
  if (started) tokens.push(token);
  return tokens;
}

export function executeCommand(input, cwd = '/', state) {
  try {
    if (state && /^\s*js\s+/.test(input) && input.length <= limits.command) return computerCommand('js', [], { ...state, cwd }, input);
    const [command, ...args] = parseCommand(input);
    if (!command) return { text: '' };
    if (state) {
      const result = computerCommand(command.toLowerCase(), args, { ...state, cwd }, input);
      if (result) return result;
      if (command === 'edit' && args.length === 1 && !Object.hasOwn(templates, args[0])) {
        const path = resolvePath(args[0], cwd);
        const fs = filesystem(state.home, state.drafts);
        if (fs.dirs.has(path)) throw new Error('That is a folder. Choose a file to edit.');
        if (!fs.files.has(path) && !writable(path)) throw new Error('Create files inside your home folder.');
        return { text: '', action: { type: 'file', path, content: fs.files.get(path) || '', readOnly: !writable(path) } };
      }
    }
    if (args.length > 1) return { text: 'Try one argument at a time. Type help for examples.' };
    const arg = args[0];
    const path = normalizePath(arg || '', cwd);
    const needsArg = () => ({ text: `Add a name after ${command}. Type help for examples.` });
    switch (command.toLowerCase()) {
      case 'help': return { text: help };
      case 'pwd': return { text: cwd };
      case 'clear': return { text: '', clear: true };
      case 'ls': return { text: directories.has(path) ? listDirectory(path) : files.has(path) ? path.split('/').pop() : `No folder here: ${path}` };
      case 'cd': {
        const destination = arg ? path : '/';
        return directories.has(destination) ? { text: '', cwd: destination } : { text: `No folder here: ${destination}` };
      }
      case 'cat': return !arg ? needsArg() : { text: files.get(path) ?? (directories.has(path) ? 'That is a folder. Try ls to look inside.' : `No file here: ${path}`) };
      case 'learn': {
        if (!arg) return { text: 'Currently learning\n\n' + learningTopics.map(topic => `${topic.name} / ${topic.status || 'Learning'}`).join('\n') + '\n\nTry learn react.', links: [{ label: 'Visit the learning cards ↗', href: '#learning' }] };
        const topic = learningTopics.find(item => item.name.toLowerCase() === arg.toLowerCase());
        return { text: topic ? learningNote(topic) : 'Try javascript, react, sql, python, or aws.', ...(topic ? { links: [{ label: `Visit ${topic.name} ↗`, href: `#learning-${topic.theme}-title` }] } : {}) };
      }
      case 'open': {
        if (!arg) return needsArg();
        const slug = aliases.get(arg.toLowerCase()) || arg.toLowerCase();
        const project = projects.find(item => item.slug === slug || item.id === slug);
        if (!project) return { text: 'Project not found. Try ls /projects or open logistics.' };
        const anchor = ['p05', 'p06', 'p07'].includes(project.id) ? `#${project.id}` : '#work';
        return { text: `${project.name}\n${project.blurb}`, links: [{ label: 'View in selected work ↗', href: anchor }, ...(project.status === 'live' && project.url ? [{ label: 'Visit website ↗', href: project.url }] : [])], action: { type: 'navigate', target: anchor } };
      }
      case 'edit': return !arg || Object.hasOwn(templates, arg) ? { text: 'Make it your own. Run preview when you are ready.', action: { type: 'edit', example: arg || 'button' } } : { text: 'Try edit button, edit card, or edit postcard.' };
      case 'theme': return ['cream', 'charcoal'].includes(arg) ? { text: `A little change of atmosphere: ${arg}.`, action: { type: 'theme', theme: arg } } : { text: 'Try theme cream or theme charcoal.' };
      case 'play': return arg === 'invaders' ? { text: 'Your ship is waiting. Start or resume a round in the arcade.', action: { type: 'arcade' } } : { text: 'Try play invaders.' };
      default: return { text: `Unknown command: ${command}. Try help to see what you can do.` };
    }
  } catch (error) { return { text: error.message, error: true }; }
}

export function appendCommand(state, command, result) {
  return {
    ...state,
    cwd: result.cwd ?? state.cwd,
    ...(result.home ? { home: result.home } : {}),
    history: [...state.history, command.slice(0, limits.command)].slice(-limits.history),
    output: result.clear ? [] : [...state.output, { command: command.slice(0, limits.command), cwd: state.cwd, text: result.text.slice(0, limits.entry), links: result.links, listing: result.listing, error: result.error }].slice(-limits.output),
  };
}
