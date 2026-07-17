import { readFile, writeFile } from "node:fs/promises";

const inputPath = process.argv[2] ?? "data/onet/work_activities.csv";
const outputPath = "src/lib/roleSuggestions.ts";

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

const csv = await readFile(inputPath, "utf8");
const titles = new Set();

for (const line of csv.split(/\r?\n/).slice(1)) {
  if (!line) continue;
  const title = parseCsvLine(line)[1]?.trim();
  if (title) titles.add(title);
}

const roles = [...titles].sort((first, second) => first.localeCompare(second));
const source = `// Generated from O*NET Work Activities data (${inputPath}).\n// Run: node scripts/generate-role-suggestions.mjs <path-to-work_activities.csv>\nexport const ROLE_SUGGESTIONS: string[] = ${JSON.stringify(roles, null, 2)};\n`;

await writeFile(outputPath, source);
console.log(`Generated ${roles.length} unique O*NET occupation titles.`);
