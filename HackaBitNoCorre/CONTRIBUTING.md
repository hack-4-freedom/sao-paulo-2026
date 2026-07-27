# Contributing to SATQUEST

First off, thanks for taking the time to contribute! 🎉

The following guidelines ensure a smooth contribution process for everyone.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Set up** your `.env` file (see [Installation](./docs/installation.md))
5. **Run** the dev server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names prefixed by type:

- `feat/add-leaderboard` — new feature
- `fix/signup-error` — bug fix
- `docs/update-readme` — documentation
- `refactor/auth-context` — refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description

feat(auth): add Google OAuth login
fix(wallet): correct balance display after send
docs(api): update RPC documentation
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

### Pull Requests

1. **Create a branch** from `main`
2. **Make your changes** — keep them focused and atomic
3. **Test locally** — ensure `npm run build` passes with no errors
4. **Open a PR** using the [PR template](./.github/PULL_REQUEST_TEMPLATE.md)
5. **Link issues** that your PR addresses
6. **Request review** from a maintainer

### Code Style

- **TypeScript** everywhere — no `any` types
- **Functional components** with hooks for React
- **CSS variables** for theming — no hardcoded colors
- **8px spacing system** — use Tailwind's spacing scale
- **No comments** unless the "why" is non-obvious
- **Match existing conventions** — look at neighboring files

### Database Changes

If your change involves the database:

1. **Create a migration** in `supabase/migrations/` with format:
   `YYYYMMDDHHMMSS_NNNN_description.sql`
2. **Enable RLS** on any new table
3. **Write 4 policies** (SELECT, INSERT, UPDATE, DELETE) — never `FOR ALL`
4. **Test** the migration on a fresh database
5. **Document** the schema change in `docs/database.md`

### What We Look For in Reviews

- **Correctness**: Does the code do what it claims?
- **Security**: Are there RLS gaps, injection vectors, or data leaks?
- **Performance**: Are there N+1 queries or unnecessary re-renders?
- **Accessibility**: Are interactive elements keyboard-navigable?
- **Consistency**: Does the code match existing patterns?

## Reporting Bugs

Use the [Bug Report template](./.github/ISSUE_TEMPLATE/bug_report.md) and
include:

- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser and OS

## Suggesting Features

Use the [Feature Request template](./.github/ISSUE_TEMPLATE/feature_request.md)
and describe:

- The problem you're solving
- Your proposed solution
- Alternatives you've considered

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).
