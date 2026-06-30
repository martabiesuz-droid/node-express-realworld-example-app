# Definition of Done (DoD)

An issue is considered **Done** when all of the following are true:

- [ ] All acceptance criteria listed in the issue are met
- [ ] Code builds and all tests pass locally (`npm test`)
- [ ] CI pipeline is green on the pull request
- [ ] Any new behavior is covered by automated tests (unit and/or integration, as applicable)
- [ ] No new linter errors or unaddressed static analysis issues were introduced
- [ ] Scope decisions (what was done, what was deliberately left out, and why) are documented either in the commit message or as a comment on the issue
- [ ] The commit message references the issue number (`Closes #N`)
- [ ] Changes are pushed to the dedicated branch and a pull request is open for review
- [ ] Temporary or diagnostic files (logs, scratch scripts) are removed before the final commit

If a criterion cannot be met, the issue is not closed — it stays open with a comment explaining what is pending and why.
