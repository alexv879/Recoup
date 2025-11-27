# CLEANUP_PROPOSAL_2025-11-27

This PR proposes a safe removal of stale or ephemeral branches. It references `archive/branch-tips-2025-11-27/BRANCH_TIPS_2025-11-27.md` for the branch tip catalog.

## Why
- Reduce clutter and maintenance overhead by removing ephemeral `claude/*` branches and no-op branches like `_noop`. This makes the branch list easier to scan and promotes faster navigation.

## Proposed deletions (candidates)
- _noop — no differences from `main`.
- feat/landing-page-update-2025-11-27 — merged to `main` (safe to delete).
- claude/* branches — ephemeral feature branches (review their merge status first). Examples include:
  - claude/freelancer-revenue-saas-013NV8uMwoU5LnAPUaNWpxLU
  - claude/onboarding-ux-improvements-015X6WHYkfWx2GByAmEayVbu
  - claude/optimize-performance-monitoring-01Dj3...
  - claude/python-codebase-refactor-0143...
  - claude/security-audit-hardening-01GPLhvz...
  - claude/setup-cicd-testing-infrastructure-01XJE...
- Any `feat/*` branches already merged to `main`.

## Safety checks (mandatory before deleting any branch)
1. Verify there are no unique commits on the branch:
   - `git fetch origin && git log origin/main..origin/<branch>`
   - If there is output, do not delete the branch; instead, create an issue tracking the work.
2. If the branch has unmerged commits, contact the branch owner or preserve the branch.
3. Ensure `archive/branch-tips-2025-11-27` is kept in the repo for audit & recovery.

## Action Plan
1. Update this PR with the final list of branches to delete once reviewers confirm.
2. Merge PR to `main`. This PR is informational and doesn't change code.
3. After merge, the maintainer(s) can safely delete remote branches via GitHub UI or CLI:
   - `git push origin --delete <branch>`
4. Run CI & smoke tests using the `main` branch to validate everything is still passing.
5. If anything breaks, use branch SHAs from `archive/branch-tips-2025-11-27` to recover deleted branch heads.

## Notes
- Long-lived branches to keep: `main`, `golden`, `thirsty-sammet`.
- If there's any branch in `claude/*` that has critical unmerged work, it must be preserved and tracked with an issue.

---

This was drafted automatically to start the cleanup process. Please edit and expand the list with exact branch names and SHAs before proceeding.
