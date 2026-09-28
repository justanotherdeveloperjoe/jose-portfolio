import assert from 'node:assert/strict';
import { appendCommand, executeCommand, limits, parseCommand } from '../src/lib/sandbox/commands.js';
import { directories, files, normalizePath } from '../src/lib/sandbox/filesystem.js';
import { projects } from '../src/data/projects.js';
import { learningTopics } from '../src/data/learning.js';

assert.deepEqual(parseCommand('  cat "learning/react.txt" '), ['cat', 'learning/react.txt']);
assert.deepEqual(parseCommand("cat 'about.txt'"), ['cat', 'about.txt']);
assert.match(executeCommand('cat "unfinished').text, /quotation/);
assert.match(executeCommand('x'.repeat(513)).text, /512/);
assert.equal(normalizePath('../../../../about.txt', '/learning'), '/about.txt');
assert.equal(normalizePath('./../projects//', '/learning'), '/projects');
assert.equal(normalizePath('~/learning', '/projects'), '/learning');
assert.equal(executeCommand('cd learning').cwd, '/learning');
assert.equal(executeCommand('cd', '/learning').cwd, '/');
assert.equal(executeCommand('cd /about.txt').cwd, undefined);
assert.match(executeCommand('ls').text, /projects\//);
assert.equal(executeCommand('ls /about.txt').text, 'about.txt');
assert.match(executeCommand('cat react.txt', '/learning').text, /Currently learning/);
assert.match(executeCommand('cat /learning').text, /folder/);
assert.match(executeCommand('cat nowhere').text, /No file/);
assert.match(executeCommand('cat __proto__').text, /No file/);
assert.equal(executeCommand('edit __proto__').action, undefined);
assert.equal(executeCommand('open constructor').action, undefined);
assert.equal(executeCommand('theme cream').action.theme, 'cream');
assert.equal(executeCommand('theme blue').action, undefined);
assert.equal(executeCommand('edit').action.example, 'button');
assert.equal(executeCommand('edit postcard').action.example, 'postcard');
assert.equal(executeCommand('play invaders').action.type, 'arcade');
assert.match(executeCommand('ls | cat').text, /one argument/);
assert.match(executeCommand('sudo').text, /Unknown command/);
assert.match(executeCommand('open logistics').text, /AFH/);
for (const project of projects) {
  const result = executeCommand(`open ${project.slug}`);
  assert.match(result.text, new RegExp(project.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(files.has(`/projects/${project.slug}.txt`));
  assert.equal(result.links.some(link => link.href.startsWith('http')), project.status === 'live' && Boolean(project.url));
}
for (const topic of learningTopics) {
  assert.ok(executeCommand(`learn ${topic.name.toLowerCase()}`).text.includes(topic.next));
}
assert.ok(directories.has('/experiments/postcard'));
let state = { cwd: '/', history: [], output: [] };
for (let index = 0; index < 230; index++) state = appendCommand(state, `cat ${index}`, { text: 'x'.repeat(7000) });
assert.equal(state.history.length, limits.history);
assert.equal(state.output.length, limits.output);
assert.equal(state.output[0].text.length, limits.entry);
assert.equal(appendCommand(state, 'clear', executeCommand('clear')).output.length, 0);
assert.equal(appendCommand(state, 'cd /learning', executeCommand('cd /learning')).cwd, '/learning');
console.log('Sandbox commands, paths, aliases, shared content, prototype names, history and output bounds: PASS');
