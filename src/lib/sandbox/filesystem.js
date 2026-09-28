import { projects } from '../../data/projects.js';
import { learningTopics } from '../../data/learning.js';
import { templates } from '../../data/sandbox.js';

export function learningNote(topic) {
  return `${topic.name} / ${topic.status || 'Learning'}\n\n${topic.description}\n\nCurrently learning\n${topic.topics.map(item => `• ${item}`).join('\n')}\n\nWorking toward\n${topic.next}`;
}

export const files = new Map([
  ['/about.txt', "I'm Jose, a front-end developer in Monterrey. I build interfaces for businesses with very different worlds: comedy, real estate, logistics, fitness, and more. I'm interested in the details that make each one feel like itself."],
  ...projects.map(project => [`/projects/${project.slug}.txt`, `${project.name}\n${project.category} / ${project.status === 'live' ? 'Live' : 'In progress'}\n\n${project.blurb}\n\nBuilt with: ${project.tags.join(', ')}`]),
  ...learningTopics.map(topic => [`/learning/${topic.name.toLowerCase()}.txt`, learningNote(topic)]),
  ...Object.entries(templates).flatMap(([key, template]) => [
    [`/experiments/${key}/index.html`, template.html],
    [`/experiments/${key}/style.css`, template.css],
  ]),
]);

export const directories = new Set(['/']);
for (const path of files.keys()) {
  const parts = path.split('/').slice(1, -1);
  parts.forEach((_, index) => directories.add('/' + parts.slice(0, index + 1).join('/')));
}

export function normalizePath(path, cwd = '/') {
  const parts = path.startsWith('/') || path.startsWith('~') ? [] : cwd.split('/').filter(Boolean);
  for (const part of path.replace(/^~(?=\/|$)/, '').split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  return '/' + parts.join('/');
}

export function listDirectory(path) {
  const prefix = path === '/' ? '/' : path + '/';
  const entries = new Set();
  for (const file of files.keys()) {
    if (!file.startsWith(prefix)) continue;
    const rest = file.slice(prefix.length).split('/');
    entries.add(rest[0] + (rest.length > 1 ? '/' : ''));
  }
  return [...entries].sort().join('\n');
}
