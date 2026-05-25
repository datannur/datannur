# Contributing to datannur

- [Getting Started](#getting-started)
  - [Standard Workflow](#standard-workflow)
  - [Quick Workflow (WIP branches)](#quick-workflow-wip-branches)
  - [Git Setup (Optional)](#git-setup-optional)
- [Development Scripts](#development-scripts)
  - [Core Development](#core-development)
  - [Quality Checks](#quality-checks)
- [Guidelines](#guidelines)
  - [Pull Requests](#pull-requests)
  - [Tests & Quality](#tests--quality)
  - [Documentation](#documentation)
- [Project Architecture](#project-architecture)
  - [Tech Stack](#tech-stack)
  - [Key Directories](#key-directories)
- [Releases & Maintenance](#releases--maintenance)
  - [Release Process](#release-process)
  - [Maintainer Commands](#maintainer-commands)
  - [Branch Cleanup](#branch-cleanup)
- [Support](#support)

## Getting Started

### Standard Workflow

1. Fork the repository and create a branch:

   ```bash
   git checkout -b add-feature-x
   npm ci
   npx playwright install  # Install browsers for UI tests
   ```

   > **Requires Node.js >= 22.6.0**

2. Develop and test:

   ```bash
   npm run dev    # Start development server
   npm run test   # Run tests before pushing
   ```

3. Submit your changes:

   ```bash
   git add .
   git commit -m "add dataset filter logic"
   git push origin add-feature-x
   ```

4. Open a Pull Request to `main` - ensure CI passes

### Quick Workflow (WIP branches)

For faster iterations, you can optionally install the WIP alias:

```bash
# Optional one-time setup
git config --global alias.wip '!f(){ n=${1:-wip-$(date +%Y%m%d-%H%M%S)}; git switch -c "$n"; }; f'
```

Then for each change:

```bash
git checkout main
git pull
git wip add-feature-x       # creates branch add-feature-x
# First time only: npm ci && npx playwright install
# ... commits ...
git push -u origin HEAD
# Open PR → CI → squash merge → delete branch
```

Without the alias, simply use: `git checkout -b add-feature-x`

### Git Setup (Optional)

For better branch management, you can optionally configure these Git aliases:

```bash
# One-time setup for automatic branch pruning
git config --global fetch.prune true

# Add cleanup alias for merged branches
# Add cleanup alias for squash merged branches
git config --global alias.cleanup '!f(){ current=$(git branch --show-current); if [ "$current" != "main" ] && [ "$current" != "master" ]; then git checkout main && git pull --ff-only && git branch -D "$current"; else git checkout main && git pull --ff-only; fi; }; f'
```

Then use `git cleanup` to automatically switch to main, pull changes, and delete the current branch.

## Development Scripts

### Core Development

| Command           | Purpose                     |
| ----------------- | --------------------------- |
| `npm run dev`     | Development server          |
| `npm run build`   | Build for production        |
| `npm run preview` | Open built app (file://)    |
| `npm run serve`   | Serve built app (localhost) |

### Quality Checks

| Command                         | Purpose                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `npm run test`                  | Run the standard unit/UI test suite                            |
| `npm run test:runtime`          | Run runtime-mode tests: file, dev links, Apache root/subfolder |
| `npm run test:dev-links`        | Verify Vite dev clean URL navigation                           |
| `npm run test:apache`           | Build static pages and test Apache/PHP root deployment         |
| `npm run test:apache:subfolder` | Build static pages and test Apache/PHP `/datannur/` deployment |
| `npm run lint`                  | ESLint code analysis                                           |
| `npm run type-check`            | TypeScript type checking                                       |
| `npm run format`                | Format code with Prettier                                      |
| `npm run check`                 | All quality checks (formatting, linting, types)                |
| `npm run verify`                | Complete verification (check + test)                           |

### Runtime & URL Testing

datannur supports several runtime modes, and URL/path changes must keep all of them working:

- `file://`: direct `dist/index.html` opening with hash routes, covered by `npm run test:ui`
- Vite dev server: clean URL navigation under `npm run dev`, covered by `npm run test:dev-links`
- Apache root: clean URLs, static-page fallback, PHP REST API, and PHP LLM endpoints, covered by `npm run test:apache`
- Apache subfolder: the same behavior under an alias such as `/datannur/`, covered by `npm run test:apache:subfolder`
- Local Python app: `localhost` app port uses the Python LLM proxy, while Apache localhost uses PHP endpoints

The Apache tests use Docker with the `php:8.3-apache` image to simulate shared hosting with PHP, `.htaccess`, clean URLs, API routes, and LLM routes. They require Docker or OrbStack to be available locally. Use `npm run serve:apache` for manual testing of the generated `dist/` package in the same Apache/PHP environment.

When changing routing, links, asset paths, `.htaccess`, static generation, API paths, or LLM proxy selection, run at least:

```bash
npm run check
npm run test:ui
npm run test:dev-links
npm run test:apache
npm run test:apache:subfolder
```

### Documentation Site

| Command                | Purpose                               |
| ---------------------- | ------------------------------------- |
| `npm run docs:dev`     | VitePress dev server                  |
| `npm run docs:build`   | Build docs site                       |
| `npm run docs:preview` | Preview built docs                    |
| `npm run docs:deploy`  | Deploy docs to docs.datannur.com/app/ |

### API & Schema Tools

| Command                                | Purpose                                 |
| -------------------------------------- | --------------------------------------- |
| `python3 package/datannur.py validate` | Validate all schemas and data files     |
| `python3 package/datannur.py openapi`  | Generate catalog-specific OpenAPI files |
| `python3 package/datannur.py api`      | Start the local Python REST API server  |

## Guidelines

### Pull Requests

Keep PRs focused - one feature, one bug fix, or one refactor. Avoid mixing stylistic changes with functional ones.

### Tests & Quality

**Before submitting a PR:**

- Run `npm run verify` (complete verification: formatting, linting, types, and tests)
- For routing, path, API, LLM, Apache, or static-generation changes, also run `npm run test:runtime`
- Or run individual checks:
  - `npm run check` (formatting, linting, type checking)
  - `npm run test` (unit and UI tests)

**Quality standards:**

- **Zero console errors** in browser (verified by `ui.test.ts`)
- **Clean build**: `npm run build` must pass
- **Code formatting**: Use `npm run format` to auto-format

### Documentation

User-facing documentation lives in `docs/` (VitePress) and is published to [docs.datannur.com/app](https://docs.datannur.com/app/). Update the relevant page in `docs/` when adding or changing user-visible features. See [`docs:dev`, `docs:build`, `docs:deploy`](./package.json) scripts.

## Project Architecture

### Tech Stack

- **Frontend**: Svelte 5 + TypeScript + Vite
- **Database**: [Jsonjsdb](https://github.com/datannur/jsonjsdb) (client-side JSONJS)
- **UI**: DataTables, Bulma (subset), Font Awesome
- **Search**: FlexSearch
- **Router**: Navigo

### Key Directories

- `src/page/` - Main application pages (auto-generates router)
- `src/component/` - Reusable components by data type (dataset, folder, tag...)
- `src/datatable/` - DataTables integration
- `src/frame/` - UI framework (Header, Footer, Router)
- `package/` - Runtime package source mirroring the distributed layout
- `package/app/` - App-owned runtime files copied into `dist/app/`
- `package/data/` - User data copied into `dist/data/`
- `package/data/db/` - Database files (.json.js format)
- `package/app/schemas/` - JSON schemas for data validation
- `package/app/api/` - Web API endpoints and adapters
- `package/app/scripts/python/` - Utility scripts (deploy, static generation, local services)

### API Architecture

datannur provides two API implementations accessing the same JSON database:

**Raw API:**

- Direct file access to `/data/db/*.json` files
- No server-side processing required
- OpenAPI spec: `package/data/api/openapi-raw.json`

**RESTful API:**

- Query-based with filtering, pagination, sorting
- Two implementations:
  - `package/app/api/rest/` - PHP 7.4+ REST adapter (production-ready)
  - `package/app/scripts/python/api_server.py` - Python 3.9+ local development server
- OpenAPI spec: `package/data/api/openapi.json`

**Configuration:**

- Local server ports in `package/data/localhost-ports.config.json`:
  - `appPort`: Local static app server used by `start_app.py`
  - `llmProxyPort`: Local Python LLM proxy port
  - `apiPort`: Optional local REST API dev server port

**Schema-driven:**

- OpenAPI specs are generated for the current catalog instance from `package/data/db` and official schemas in `package/app/schemas/`
- Run `python3 package/datannur.py validate` to validate schemas and data
- Run `python3 package/datannur.py openapi` to regenerate catalog-specific OpenAPI specs in `package/data/api`
- Run `python3 package/datannur.py api` to start the local REST API server

## Releases & Maintenance

### Release Process

1. Create a release branch:

   ```bash
   git checkout main && git pull
   git checkout -b release/v0.X.Y
   ```

2. Update version and changelog:

   ```bash
   # Edit package.json and CHANGELOG.md
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to 0.X.Y"
   git push -u origin release/v0.X.Y
   ```

3. Open PR → merge → automatic release:

   ```bash
   # After PR is merged, GitHub Actions automatically:
   # - Detects version change in package.json
   # - Creates git tag (v0.X.Y)
   # - Builds and packages the app
   # - Creates GitHub release with changelog
   ```

### Maintainer Commands

| Command                 | Purpose                              |
| ----------------------- | ------------------------------------ |
| `npm run static-make`   | Build + generate SEO pages           |
| `npm run deploy`        | Deploy to remote server              |
| `npm run static-deploy` | Build, generate SEO pages and deploy |

### Branch Cleanup

After PR merge, use the Git cleanup alias (see [Git Setup](#git-setup-optional)):

```bash
git cleanup  # Switches to main, pulls changes, deletes current branch
```

## Support

- **CI**: Tests run on PRs and `main` pushes
- **Deploy**: GitHub Pages auto-deploys on `main`
- **Releases**: Auto-triggered on `main` pushes when version changes
- **Pre-releases**: Auto-updated on every `main` push (for development testing)

**Bug Reports**: Provide clear title, steps to reproduce, expected vs actual behavior, screenshots if UI-related.
