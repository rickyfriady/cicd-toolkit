import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

interface CommitInfo {
  hash: string;
  shortHash: string;
  subject: string;
  author: string;
  type: string;
  scope?: string;
  description: string;
  isBreaking: boolean;
}

function runGit(cmd: string): string {
  try {
    return execSync(`git ${cmd}`, { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function getLatestTag(): string {
  const tag = runGit("describe --tags --abbrev=0 2>/dev/null");
  return tag || "v1.0.0";
}

function parseCommits(range: string): CommitInfo[] {
  const log = runGit(`log ${range} --pretty=format:"%H|%h|%an|%s" 2>/dev/null`);
  if (!log) return [];

  const lines = log.split("\n").filter((l) => l.trim().length > 0);
  const commits: CommitInfo[] = [];

  for (const line of lines) {
    const [hash, shortHash, author, ...subjectParts] = line.split("|");
    const subject = subjectParts.join("|");

    const convRegex = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
    const match = subject.match(convRegex);

    if (match) {
      const [, type, scope, exclamation, description] = match;
      commits.push({
        hash,
        shortHash,
        subject,
        author,
        type: type.toLowerCase(),
        scope,
        description,
        isBreaking: Boolean(exclamation) || subject.includes("BREAKING CHANGE"),
      });
    } else {
      commits.push({
        hash,
        shortHash,
        subject,
        author,
        type: "other",
        description: subject,
        isBreaking: subject.includes("BREAKING CHANGE"),
      });
    }
  }

  return commits;
}

export function computeNextRelease(options: { dryRun?: boolean; forceBump?: "patch" | "minor" | "major" } = {}) {
  const latestTag = getLatestTag();
  console.log(`📌 Latest detected release tag: ${latestTag}`);

  const range = `${latestTag}..HEAD`;
  let commits = parseCommits(range);

  if (commits.length === 0) {
    console.log(`ℹ️ No commits found between ${latestTag} and HEAD. Checking recent 10 commits for bootstrapping.`);
    commits = parseCommits("-n 10");
  }

  console.log(`🔍 Scanned ${commits.length} commit(s) for semantic versioning.`);

  let bump: "none" | "patch" | "minor" | "major" = options.forceBump || "none";

  if (!options.forceBump) {
    for (const c of commits) {
      if (c.isBreaking) {
        bump = "major";
        break;
      } else if (c.type === "feat") {
        if (bump !== "major") bump = "minor";
      } else if (["fix", "perf", "refactor"].includes(c.type)) {
        if (bump === "none") bump = "patch";
      }
    }
  }

  const rawVersion = latestTag.replace(/^v/, "");
  const [majorStr, minorStr, patchStr] = rawVersion.split(".");
  let major = parseInt(majorStr, 10) || 1;
  let minor = parseInt(minorStr, 10) || 0;
  let patch = parseInt(patchStr, 10) || 0;

  if (bump === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bump === "minor") {
    minor += 1;
    patch = 0;
  } else if (bump === "patch") {
    patch += 1;
  }

  const nextVersion = `${major}.${minor}.${patch}`;
  const nextTag = `v${nextVersion}`;

  console.log(`🚀 Version calculation result: ${latestTag} -> ${nextTag} (Bump: ${bump})`);

  // Generate Categorized Changelog Content
  const features = commits.filter((c) => c.type === "feat");
  const fixes = commits.filter((c) => c.type === "fix");
  const perfs = commits.filter((c) => c.type === "perf");
  const refactors = commits.filter((c) => c.type === "refactor");
  const breakings = commits.filter((c) => c.isBreaking);
  const docs = commits.filter((c) => c.type === "docs");

  const today = new Date().toISOString().split("T")[0];
  const notesSections: string[] = [`## [${nextVersion}] - ${today}`, ""];

  if (breakings.length > 0) {
    notesSections.push("### 💥 Breaking Changes");
    for (const c of breakings) {
      notesSections.push(`- ${c.description} ([${c.shortHash}](https://github.com/rickyfriady/cicd-toolkit/commit/${c.hash})) - @${c.author}`);
    }
    notesSections.push("");
  }

  if (features.length > 0) {
    notesSections.push("### ✨ Features & Enhancements");
    for (const c of features) {
      const scope = c.scope ? `**${c.scope}**: ` : "";
      notesSections.push(`- ${scope}${c.description} ([${c.shortHash}](https://github.com/rickyfriady/cicd-toolkit/commit/${c.hash})) - @${c.author}`);
    }
    notesSections.push("");
  }

  if (fixes.length > 0) {
    notesSections.push("### 🐛 Bug Fixes");
    for (const c of fixes) {
      const scope = c.scope ? `**${c.scope}**: ` : "";
      notesSections.push(`- ${scope}${c.description} ([${c.shortHash}](https://github.com/rickyfriady/cicd-toolkit/commit/${c.hash})) - @${c.author}`);
    }
    notesSections.push("");
  }

  if (perfs.length > 0) {
    notesSections.push("### ⚡ Performance Improvements");
    for (const c of perfs) {
      notesSections.push(`- ${c.description} ([${c.shortHash}](https://github.com/rickyfriady/cicd-toolkit/commit/${c.hash})) - @${c.author}`);
    }
    notesSections.push("");
  }

  if (refactors.length > 0) {
    notesSections.push("### ♻️ Code Refactoring");
    for (const c of refactors) {
      notesSections.push(`- ${c.description} ([${c.shortHash}](https://github.com/rickyfriady/cicd-toolkit/commit/${c.hash})) - @${c.author}`);
    }
    notesSections.push("");
  }

  if (docs.length > 0) {
    notesSections.push("### 📝 Documentation");
    for (const c of docs) {
      notesSections.push(`- ${c.description} ([${c.shortHash}](https://github.com/rickyfriady/cicd-toolkit/commit/${c.hash})) - @${c.author}`);
    }
    notesSections.push("");
  }

  const releaseNotes = notesSections.join("\n");

  if (options.dryRun) {
    console.log("\n--- [DRY RUN] Generated Release Notes ---\n");
    console.log(releaseNotes);
    return { nextVersion, nextTag, bump, releaseNotes, released: bump !== "none" };
  }

  // Write or prepend to CHANGELOG.md
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  let existingContent = "";
  if (fs.existsSync(changelogPath)) {
    existingContent = fs.readFileSync(changelogPath, "utf-8");
  } else {
    existingContent = "# Changelog\n\nAll notable changes to this project are documented in this file.\n\n";
  }

  // Prepend after header
  const headerMatch = existingContent.match(/^# Changelog[^\n]*\n+/);
  let updatedChangelog = "";
  if (headerMatch) {
    const header = headerMatch[0];
    const rest = existingContent.slice(header.length);
    updatedChangelog = `${header}${releaseNotes}\n${rest}`;
  } else {
    updatedChangelog = `# Changelog\n\n${releaseNotes}\n${existingContent}`;
  }

  fs.writeFileSync(changelogPath, updatedChangelog, "utf-8");
  console.log(`✅ Updated ${changelogPath}`);

  // Update package.json version
  const pkgPath = path.join(process.cwd(), "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    pkg.version = nextVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
    console.log(`✅ Updated ${pkgPath} version to ${nextVersion}`);
  }

  // Export to GITHUB_OUTPUT if running in GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_release=${bump !== "none"}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${nextVersion}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `tag=${nextTag}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `bump_type=${bump}\n`);
  }

  // Also write release-notes.md for GitHub Release body
  const notesPath = path.join(process.cwd(), "RELEASE_NOTES.tmp.md");
  fs.writeFileSync(notesPath, releaseNotes, "utf-8");
  console.log(`✅ Wrote release notes to ${notesPath}`);

  return { nextVersion, nextTag, bump, releaseNotes, released: bump !== "none" };
}

if (process.argv[1]?.endsWith("semantic-release.ts") || process.argv[1]?.endsWith("semantic-release.js")) {
  const isDryRun = process.argv.includes("--dry-run");
  const forceBumpArg = process.argv.find((a) => a.startsWith("--bump="));
  const forceBump = forceBumpArg ? (forceBumpArg.split("=")[1] as any) : undefined;
  computeNextRelease({ dryRun: isDryRun, forceBump });
}
