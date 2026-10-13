import { projects } from './projects.js';

// Self-contained examples generated from the same project list as the portfolio.
export const jsExampleData = { projects: projects.map(({ name, category, status }) => ({ name, category, status })) };
export const jsExamples = {
  Projects: `// data.projects comes from this portfolio.
const projects = data.projects;

// Change "live" to "soon" to find work in progress.
const visible = projects.filter(project => project.status === "live");
console.log(visible.map(project => project.name));
console.log(visible.length + " matching projects");`,
  'Form check': `// Example enquiry data. Nothing is sent.
const enquiry = { name: "Ana", email: "ana@example.com", message: "A website for my cafe." };
const errors = [];

if (!enquiry.name.trim()) errors.push("Add your name.");
if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(enquiry.email)) errors.push("Check your email.");
if (enquiry.message.trim().length < 10) errors.push("Tell me a little more.");

console.log(errors.length ? errors : "Ready to send — demo only.");`,
  Async: `// A local stand-in for loading website content.
const shouldFail = false; // Try true.
const loadProjects = async () => {
  await new Promise(done => setTimeout(done, 400));
  if (shouldFail) throw new Error("Could not load projects. Try again.");
  return data.projects;
};

console.log("Loading projects…");
try {
  const projects = await loadProjects();
  console.log(projects.length + " projects ready.");
} catch (error) {
  console.warn(error.message);
}`,
  Errors: `// Missing content should have a useful fallback.
const response = '{ "title": null }';
try {
  const page = JSON.parse(response);
  console.log(page.title ?? "Untitled project");
} catch (error) {
  console.warn("Couldn't read that:", error.name);
}
console.log("The rest of the page can still work.");`,
  'Endless loop': `// This never ends on its own.
// It runs off the page, so the lab just stops it.
let laps = 0;
while (true) laps++;`,
};

export const jsExampleNotes = {
  Projects: 'Filter the project data used by this portfolio. Try changing the status from live to soon.',
  'Form check': 'Validate an enquiry before sending it. Try an empty name or an incomplete email.',
  Async: 'Handle loading and failure. Change shouldFail to true to see the recovery path.',
  Errors: 'Handle missing content gracefully. Try malformed JSON to trigger the fallback.',
  'Endless loop': 'Keep the interface responsive even when code fails to finish. This worker stops after two seconds.',
};
