import { DangerConfig } from "../config";
import * as fs from "node:fs";
import * as path from "node:path";

declare const danger: any;
declare function fail(message: string): void;
declare function warn(message: string): void;
declare function message(message: string): void;

export async function checkPRHygiene(config: DangerConfig): Promise<void> {
  const pr = danger.github.pr;

  // 1. Check PR Title Format
  const titleRegex = new RegExp(config.ticketPattern);
  if (!titleRegex.test(pr.title)) {
    fail(
      `📝 **PR Title Check Failed:** The title \`"${pr.title}"\` does not match the required pattern.\n\n` +
      `Expected ticket ID prefix like \`[PROJ-123]\` or Conventional Commit format (e.g., \`feat: ...\`, \`fix: ...\`).`
    );
  }

  // 2. Check PR Description
  const description = (pr.body || "").trim();
  if (description.length < config.minDescriptionLength) {
    warn(
      `✍️ **PR Description is too short:** Current length is **${description.length}** characters. ` +
      `Please provide at least **${config.minDescriptionLength}** characters detailing context, testing done, and impact.`
    );
  }

  // 3. PR Diff Size Check (Lines & Files)
  const additions = pr.additions ?? 0;
  const deletions = pr.deletions ?? 0;
  const totalChangedLines = additions + deletions;
  const changedFilesCount = (danger.git.modified_files.length + danger.git.created_files.length + danger.git.deleted_files.length);

  message(`📊 **PR Size:** +${additions} / -${deletions} (${totalChangedLines} lines in ${changedFilesCount} files)`);

  if (totalChangedLines > config.maxChangedLines) {
    warn(
      `🐘 **Oversized Pull Request:** This PR changes **${totalChangedLines} lines**, exceeding the optimal limit of ${config.maxChangedLines} lines. ` +
      `Consider splitting into smaller, focused pull requests for faster review and safer deployment.`
    );
  }

  if (changedFilesCount > config.maxChangedFiles) {
    fail(
      `🚩 **Too many files changed:** This PR modifies **${changedFilesCount} files** (max: ${config.maxChangedFiles}). ` +
      `Please decompose this pull request.`
    );
  }

  // 4. Assignees Check
  if (!pr.assignee && (!pr.assignees || pr.assignees.length === 0)) {
    warn("👥 **No assignee assigned:** Please assign at least one person to this PR for ownership and accountability.");
  }

  // 5. Package Version vs Branch alignment (optional)
  if (config.enforcePackageVersion) {
    const pkgPath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        const branch = pr.head.ref;
        if (pkg.version && !branch.includes(pkg.version)) {
          fail(
            `🚨 **Branch Version Mismatch:** Source branch \`${branch}\` does not contain package version \`${pkg.version}\`.`
          );
        }
      } catch (e) {
        warn(`Could not verify package.json version alignment: ${(e as Error).message}`);
      }
    }
  }
}
