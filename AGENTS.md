## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 6. Happy + Unhappy Paths

**Every function handles both success and failure. No silent drops.**

- Never leave error responses vague — always return actionable messages.
- Validate inputs at the boundary (controllers/DTOs), not deep in services.
- Test both paths: what happens when it works, and what happens when it doesn't.
- For external calls (email, redis, DB), handle timeouts, connection failures, and unexpected responses.
- Never catch errors and return `null` or `undefined` — throw or return a typed error.

Ask yourself: "What breaks first, and does the caller know why?" If no, handle it.

## 5. Git Workflow — Branch from dev, PR to dev, merge to main

**Branch off `dev`, PR targets `dev`, squash-merge `dev` to `main` for releases.**

- All feature/fix branches branch off `dev` (not `main`).
- Branch naming: `feat/slice-name` or `fix/slice-name`.
- Commit messages: conventional commits — `feat:`, `fix:`, `chore:`, `test:`, `refactor:`.
- PR title: match the commit message scope, concise and descriptive.
- PR description: explain what changed, why, and what to test.
- PRs target `dev`. After testing on `dev`, merge `dev` into `main`.
- Never merge your own PR — wait for review or explicit approval.
- CI must pass before merge.
- Android APK builds are triggered automatically on push to `main` only.

## 8. CI/CD — Android Build & Release

**Push to `main` triggers an automated Android APK build via EAS Build.**

- Workflow: `.github/workflows/android-build.yml`
- Builds the APK via `eas build --platform android --profile production`
- Publishes the APK as a GitHub Release on the repo
- Requires the `EXPO_TOKEN` secret to be set in GitHub repo settings
  - Generate at https://expo.dev/accounts/{username}/settings/access-tokens
  - Add as a repository secret named `EXPO_TOKEN`

## 7. Code Quality Rules

- **Read files in full** before making wide-ranging changes. Never edit blind.
- **No `any`** unless absolutely necessary. Prefer `unknown` and narrow with type guards.
- **Inline single-line helpers** that have only one call site. No unnecessary abstractions.
- **Check `node_modules`** for external API types before writing manual interfaces.
- **No inline imports.** All imports go at the top of the file.
- **Never remove or downgrade code** to fix type errors from outdated dependencies. Fix the types.
- **Use only erasable TypeScript syntax.** No parameter properties, `enum`, `namespace`, `import =`, or `export =`.
- **Always ask before removing** code that appears intentional.
- **Do not preserve backward compatibility** unless explicitly asked.
- **Never hardcode key checks.** Add new keys to `DEFAULT_*_KEYBINDINGS` constants.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
