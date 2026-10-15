import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join, dirname, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const SKILLS = [
  "czur-runtime-onboarding",
  "czur-document-scan",
  "czur-document-process",
  "czur-image-color",
  "czur-file-ocr",
  "czur-export-pdf",
];
const FIELDS = [
  "display_name",
  "display_name_en",
  "description_zh",
  "description_en",
  "version",
  "author",
];
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Intentionally a single-line string subset, not a general YAML parser.
export function parseSkill(content) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(content);
  assert(match, "SKILL.md requires LF frontmatter delimiters");
  const data = { metadata: {} };
  let metadata = false;
  for (const line of match[1].split("\n")) {
    if (!line.trim()) continue;
    if (line === "metadata:") {
      assert(!metadata, "Duplicate metadata");
      metadata = true;
      continue;
    }
    const field = /^( {2})?([a-zA-Z_-]+): (.+)$/.exec(line);
    assert(field, `Unsupported Skill frontmatter: ${line}`);
    const nested = Boolean(field[1]);
    assert(
      nested === metadata,
      "Put name/description before metadata; use two-space metadata",
    );
    const target = nested ? data.metadata : data;
    const key = field[2];
    assert(
      nested || ["name", "description"].includes(key),
      `Unsupported root field: ${key}`,
    );
    assert(!Object.hasOwn(target, key), `Duplicate field: ${key}`);
    const raw = field[3];
    const singleQuoted = /^'(?:[^']|'')*'$/.test(raw);
    const value = raw.startsWith('"')
      ? JSON.parse(raw)
      : singleQuoted
        ? raw.slice(1, -1).replaceAll("''", "'")
        : raw;
    assert(
      typeof value === "string" && value.trim() && !/[\r\n]/.test(value),
      `Expected a nonempty single-line string: ${key}`,
    );
    if (!raw.startsWith('"') && !singleQuoted)
      assert(
        !/[:#[\]{}'"&*!|>]/.test(raw),
        `Quote this value as a JSON string: ${key}`,
      );
    Object.defineProperty(target, key, { value, enumerable: true });
  }
  assert(
    typeof data.name === "string" &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.name) &&
      data.name.length < 64,
    "Invalid skill name",
  );
  assert(typeof data.description === "string", "Missing description");
  for (const field of FIELDS)
    assert(data.metadata[field], `Missing metadata.${field}`);
  assert(
    /^\d+\.\d+\.\d+$/.test(data.metadata.version),
    "Invalid Skill version",
  );
  assert(match[2].trim(), "Missing Skill body");
  return { ...data, body: match[2] };
}

function files(directory, prefix = "") {
  assert(
    lstatSync(directory).isDirectory(),
    `Expected regular directory: ${directory}`,
  );
  return readdirSync(directory)
    .sort()
    .flatMap((name) => {
      assert(
        !name.startsWith(".") && !/[\\\x00-\x1f\x7f]/.test(name),
        `Unsafe file name: ${name}`,
      );
      const path = join(directory, name);
      const relative = prefix ? `${prefix}/${name}` : name;
      const stat = lstatSync(path);
      assert(!stat.isSymbolicLink(), `Symbolic link forbidden: ${relative}`);
      if (stat.isDirectory()) return files(path, relative);
      assert(stat.isFile(), `Expected regular file: ${relative}`);
      return [relative];
    });
}

export function validateSkills(
  root = fileURLToPath(new URL("../", import.meta.url)),
) {
  root = resolve(root);
  const base = join(root, "skills");
  assert(lstatSync(base).isDirectory(), "Expected regular skills directory");
  assert(
    JSON.stringify(readdirSync(base).sort()) ===
      JSON.stringify([...SKILLS].sort()),
    "Expected exactly the six published Skills",
  );
  for (const name of SKILLS) {
    const directory = join(base, name);
    const resources = files(directory);
    const skill = parseSkill(readFileSync(join(directory, "SKILL.md"), "utf8"));
    assert(skill.name === name, `Skill directory/name mismatch: ${name}`);
    for (const relative of resources) {
      const path = join(directory, relative);
      if (relative.endsWith(".json")) JSON.parse(readFileSync(path, "utf8"));
      if (!relative.endsWith(".md")) continue;
      const text = readFileSync(path, "utf8");
      for (const match of text.matchAll(/```json\n([\s\S]*?)\n```/g))
        JSON.parse(match[1]);
      for (const match of text.matchAll(
        /(?:\]\(|@)((?:references|scripts|assets|templates)\/[^\s)"#]+)(?:#[^\s)]*)?/g,
      )) {
        const target = resolve(dirname(path), match[1]);
        assert(
          !match[1].includes("\\") &&
            !match[1].split("/").includes("..") &&
            target.startsWith(`${directory}${sep}`),
          `Escaping resource: ${match[1]}`,
        );
        assert(
          lstatSync(target).isFile(),
          `Missing regular resource: ${target}`,
        );
      }
    }
  }
  return SKILLS.length;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    console.log(`${validateSkills()} Skills validated`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
