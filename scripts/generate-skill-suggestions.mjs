import { readFile, writeFile } from "node:fs/promises";

const outputPath = "src/lib/skillSuggestions.ts";
const sources = [
  { path: "data/onet/software_skills.csv", column: 2 },
  { path: "data/onet/essential_skills.csv", column: 3 },
  { path: "data/onet/transferable_skills.csv", column: 3 },
];

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += character;
    }
  }

  cells.push(cell);
  return cells;
}

const curatedSource = await readFile("src/lib/curatedSkillSuggestions.ts", "utf8");
const curatedSkills = [...curatedSource.matchAll(/"([^"\\]+)"/g)].map(
  ([, skill]) => skill,
);
const skills = new Set(curatedSkills);

for (const { path, column } of sources) {
  const csv = await readFile(path, "utf8");
  for (const line of csv.split(/\r?\n/).slice(1)) {
    if (!line) continue;
    const skill = parseCsvLine(line)[column]?.trim();
    if (skill) skills.add(skill);
  }
}

const suggestions = [...skills].sort((first, second) => first.localeCompare(second));
const source = `// Generated from O*NET software, essential, and transferable skill data.\n// Run: npm run generate:skills\nexport const SKILL_SUGGESTIONS: string[] = ${JSON.stringify(suggestions, null, 2)};\n`;

await writeFile(outputPath, source);
console.log(`Generated ${suggestions.length} unique skill suggestions.`);
