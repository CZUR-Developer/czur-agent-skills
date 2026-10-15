import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSkill, SKILLS, validateSkills } from "../scripts/check.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = [];
afterEach(() =>
  temporary
    .splice(0)
    .forEach((path) => rmSync(path, { recursive: true, force: true })),
);
function fixture() {
  const path = mkdtempSync(join(tmpdir(), "czur-skills-test-"));
  temporary.push(path);
  cpSync(join(root, "skills"), join(path, "skills"), { recursive: true });
  return path;
}
function change(path, update) {
  const file = join(path, "skills", SKILLS[0], "SKILL.md");
  writeFileSync(file, update(readFileSync(file, "utf8")));
}

test("validates all maintained Skills and their JSON examples and resources", () => {
  assert.equal(validateSkills(root), 6);
});
test("rejects missing metadata and directory/name mismatches", () => {
  const path = fixture();
  change(path, (s) => s.replace(/  author:.*\n/, ""));
  assert.throws(() => validateSkills(path), /metadata.author/);
  cpSync(join(root, "skills"), join(path, "skills"), { recursive: true });
  change(path, (s) => s.replace(`name: '${SKILLS[0]}'`, "name: 'other'"));
  assert.throws(() => validateSkills(path), /mismatch/);
});
test("rejects duplicate fields and unsupported frontmatter", () => {
  const source = readFileSync(
    join(root, "skills", SKILLS[0], "SKILL.md"),
    "utf8",
  );
  assert.throws(
    () =>
      parseSkill(
        source.replace("metadata:", "description: duplicate\nmetadata:"),
      ),
    /Duplicate/,
  );
  assert.throws(
    () => parseSkill(source.replace("metadata:", "other: value\nmetadata:")),
    /root field/,
  );
  assert.throws(() => parseSkill("not a Skill"), /frontmatter/);
});
test("rejects missing and escaping local references", () => {
  const path = fixture();
  const reference = join(
    path,
    "skills",
    "czur-export-pdf",
    "references",
    "image-pdf.json",
  );
  rmSync(reference);
  assert.throws(() => validateSkills(path), /ENOENT/);
  writeFileSync(reference, "{}");
  change(path, (s) => `${s}\n[bad](references/../../outside.txt)\n`);
  assert.throws(() => validateSkills(path), /Escaping/);
});
test("rejects malformed resource JSON and example JSON", () => {
  const path = fixture();
  writeFileSync(
    join(path, "skills", "czur-export-pdf", "references", "image-pdf.json"),
    "{",
  );
  assert.throws(() => validateSkills(path), SyntaxError);
  cpSync(join(root, "skills"), join(path, "skills"), { recursive: true });
  change(path, (s) => `${s}\n\`\`\`json\n{\n\`\`\`\n`);
  assert.throws(() => validateSkills(path), SyntaxError);
});
test("rejects hidden resources and unexpected Skill directories", () => {
  const path = fixture();
  const hidden = join(path, "skills", SKILLS[0], ".env");
  writeFileSync(hidden, "not a secret");
  assert.throws(() => validateSkills(path), /Unsafe/);
  rmSync(hidden);
  writeFileSync(join(path, "skills", "unexpected.txt"), "unexpected");
  assert.throws(() => validateSkills(path), /six published/);
});
test(
  "rejects symlink resources",
  { skip: process.platform === "win32" },
  () => {
    const path = fixture();
    symlinkSync(
      join(root, "LICENSE"),
      join(path, "skills", SKILLS[0], "linked.txt"),
    );
    assert.throws(() => validateSkills(path), /Symbolic link/);
  },
);
