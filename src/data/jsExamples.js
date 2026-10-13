// Starting points for the JavaScript lab. Visitors can edit any of them; they really run.
export const jsExamples = {
  Arrays: `const ideas = ["learn", "build", "improve"];

const loud = ideas.map(idea => idea.toUpperCase());
console.log(loud);

const longer = ideas.filter(idea => idea.length > 5);
console.log(longer, \`\${longer.length} of \${ideas.length}\`);`,
  Objects: `const project = { name: "Smashouse", category: "Restaurant", status: "live" };

const { name, ...details } = project;
console.log(name);
console.log(details);
console.log({ ...project, status: "redesign" });`,
  Async: `const wait = ms => new Promise(done => setTimeout(done, ms));

console.log("Loading…");
await wait(400);
console.log("Ready, 400 ms later.");`,
  Errors: `try {
  JSON.parse("{ not quite json }");
} catch (error) {
  console.warn("Couldn't read that:", error.name);
}

console.log("Still running.");`,
  'Endless loop': `// This never ends on its own.
// It runs off the page, so the lab just stops it.
let laps = 0;
while (true) laps++;`,
};
