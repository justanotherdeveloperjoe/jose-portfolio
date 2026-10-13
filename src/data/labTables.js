import { projects } from './projects.js';
import { learningTopics } from './learning.js';

// The tables the SQL lab can query: my real Workbench projects, and what I'm learning right now.
// Built from the same data the rest of the site uses, so the answers are always true.
export const labTables = {
  projects: {
    columns: ['id', 'name', 'category', 'status'],
    rows: projects.map(project => ({ id: Number(project.num), name: project.name, category: project.category, status: project.status })),
  },
  skills: {
    columns: ['name', 'kind', 'status'],
    rows: learningTopics.map(topic => ({ name: topic.name, kind: topic.category, status: topic.status ?? 'Learning' })),
  },
};
