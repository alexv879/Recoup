# AUTOMATED_CLEANUP_RECOMMENDATIONS_2025-11-27

This is an automated recommendations summary prepared by the agent for `cleanup/branch-prune-2025-11-27`.

Summary of findings vs `main` (automated):

## Recommended Safe Deletions (HEAD found in `main` history):
- `claude/analyze-recoup-codebase-01Urk27z5zhC6wv6riGPwKnU` — 32ea62877c9075b1 — "MAJOR FEATURE: Making Tax Digital (MTD) Compliance Implementation"
- `claude/freelancer-revenue-saas-013NV8uMwoU5LnAPUaNWpxLU` — 40a78c8519fdff42 — "docs: Add final deployment guide"
- `claude/setup-recoup-foundation-012HsJJGbWAR4s676wEJ4n7h` — 43312e7f874f63f7 — "feat: implement ML payment prediction and AI message generation systems"
- `feat/landing-page-update-2025-11-27` — 7853e539cd75ceda — (merged earlier)

*These branches appear to have their HEAD commits included in the `main` commit history snapshot. They are safe to delete provided no other in-progress/owner work remains.*

## Archive-only / Needs Owner Confirmation (DO NOT delete yet):
These `claude/*` branches did not have their HEAD commit visible in the scanned `main` history snapshot.
Contact owners and confirm before deleting.

- `claude/add-comprehensive-docs-01CFftYW8tPXESbtbNnbRA9C` — 2b153fa56f993ff0b — "Update README with comprehensive documentation links"
- `claude/admin-dashboard-monitoring-01WyuDEFsxBbVGoXGn7NkrES` — d4376127caa04c8e — "Add comprehensive admin dashboard and operational monitoring system"
- `claude/analyze-codebase-012Ubvu4t55AVHuyW8uPnb13` — c59d795f83a1e8e3 — "docs: Add comprehensive session completion summary"
- `claude/onboarding-ux-improvements-015X6WHYkfWx2GByAmEayVbu` — 0c12f022d4d7f0b9 — onboarding UX updates
- `claude/optimize-performance-monitoring-01Dj3wWujQuceEiz4diA762Y` — 3a0e54cc7f3c4dfa — performance monitoring updates
- `claude/optimize-performance-monitoring-01535TUGrWyrbTQYuDtGFgVd` — cc0c3c31add6dd23 — performance monitoring updates
- `claude/python-codebase-refactor-0143XBWhC5GVrTborhVS9gbB` — df19f6cf95ef1ec3 — Python refactor
- `claude/security-audit-hardening-01GPLhvzHg111XsBoS2cSAbD` — 63044c7220768c48 — security audit & hardening
- `claude/setup-cicd-testing-infrastructure-01XJEzKrQoCfBQ8KX1JzQowB` — 741e4617a43debb5 — setup CI/CD & testing infra
- `claude/uk-legal-compliance-01BaYzf93UPwgyZ3NDNMH91b` — 723a7b376cd248da — UK legal compliance

## Suggested Actions before deletion
1. For each branch in the "archive-only" list, open the branch and run locally:

```powershell
# Fetch full branch list
git fetch origin
# Checkout the branch
git checkout -b <branch> origin/<branch>
# Compare with main to confirm unique commits
git log origin/main..HEAD --oneline
```

2. For archival for any branch with unique work:
   - Create a snapshot branch from the branch head if desired:

```powershell
git checkout -b archived/<branch>-snapshot
git push origin archived/<branch>-snapshot
```

3. After owner confirmation, delete branches that are merged into `main`.
   - Delete locally and remote branch

```powershell
# delete remote branch
git push origin --delete <branch>
# delete local branch
git branch -D <branch>
```

4. For branches needing investigation, we recommend adding them to the cleanup issue (#2) and tag the owner for confirmation.

## Additional Notes
- This analysis uses an automated snapshot comparing HEAD SHAs against the `main` commit list returned by the API during the scan. In some cases the merge was done via `golden`, or a branch was merged with different commit SHAs (rebased/cherry-picked), so double check history using git locally before deletion.
- Please ensure CI and quick smoke tests run post-deletion.

---

Automated by agent on 2025-11-27 — please review & confirm before performing any deletions.
