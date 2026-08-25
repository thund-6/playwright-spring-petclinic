# Petclinic e2e environment

Docker Compose environment for `spring-petclinic-rest` + `spring-petclinic-angular`,
plus a Playwright container for testing them together. This directory holds
the Playwright project itself; the compose stack lives at the repo root.

Nothing here is a real test suite yet - `tests/smoke.spec.ts` only proves the
wiring works. Add your own specs under `tests/`, page objects under `POMs/`,
reusable UI helpers under `components/`, request mocks under `mocks/`, and
shared helpers under `utils/`. Each has a matching path alias (`@tests/*`,
`@POMs/*`, `@components/*`, `@mocks/*`, `@utils/*`) configured in
`tsconfig.json`.

## One-time setup

```bash
cd /home/machador/git/playwright-spring-petclinic
cp .env.example .env
printf 'UID=%s\nGID=%s\n' "$(id -u)" "$(id -g)" >> .env
```

`.env` is gitignored (repo `.gitignore` matches `*.env`) and is only used to
keep files the Playwright container writes into `./playwright` (reports,
traces, screenshots) owned by you instead of root.

Optional but recommended, so you can open the app in your own browser and use
Playwright codegen against it (see "Manual exploration" below):

```bash
echo '127.0.0.1  angular rest postgres' | sudo tee -a /etc/hosts
```

Without this, `http://localhost:8080/petclinic/` renders in your host browser
but every list is empty - the SPA's API calls target the hostname `rest`,
which only resolves inside the compose network otherwise.

## Running the app stack

```bash
docker compose up -d --build postgres rest angular
```

- Angular UI: http://localhost:8080/petclinic/ (or http://angular:8080/petclinic/ with the /etc/hosts entry)
- REST API: http://localhost:9966/petclinic/api
- REST health: http://localhost:9966/petclinic/actuator/health
- Postgres: localhost:55432 (db/user/pass all `petclinic` by default)

`docker compose down` wipes the database (Postgres runs on tmpfs) - the next
`up` starts from a clean seed.

## Running the tests

```bash
docker compose run --rm tests
```

This builds the `tests` image (installs `playwright/package.json` into a named
volume) if needed, starts `postgres`/`rest`/`angular` if they aren't already
healthy, and runs `playwright test` inside the container.

Common variants:

```bash
# pass args through to `playwright test`
docker compose run --rm tests npx --no playwright test tests/smoke.spec.ts

# after editing playwright/package.json, update the volume without rebuilding
docker compose run --rm --no-deps tests npm install

# UI mode / trace viewer / HTML report need the port published
docker compose run --rm --service-ports tests npm run test:ui
docker compose run --rm --service-ports tests npm run report
```

Always use `npx --no` inside the container, not bare `npx` - if the
`node_modules` volume is ever empty, `npx` would try to network-install
`playwright` instead of failing fast with a clear error.

## Manual exploration / writing new tests

- **Codegen and headed/debug modes need a display and won't work in this
  container.** Run them on the host instead, against the published ports
  (works because of the `/etc/hosts` entry above):
  ```bash
  npx playwright@1.61.1 codegen http://angular:8080/petclinic/owners
  ```
- UI mode, `show-report`, and `show-trace` all work headless via
  `--host 0.0.0.0` (already wired into `npm run test:ui` / `npm run report`
  above) - open the forwarded port on the host.
- `resetDatabase()` in `utils/db.ts` truncates and reseeds every table from
  the submodule's own `db/postgres/data.sql`, mounted read-only at
  `/srv/seed`. It runs once via `global-setup.ts` before the whole suite
  starts (10 owners, 6 vets, 6 pet types, 3 specialties, 13 pets) - it is not
  meant to be called from individual tests anymore (see below).

## Constraints worth knowing before you scale this up

- **`fullyParallel: true`** in `playwright.config.ts`, with the seed loaded
  once via `global-setup.ts` rather than per-file/per-test. There is one
  shared Postgres and one shared REST instance behind every worker and
  browser project, so tests must not assume a pristine table: either stay
  read-only, or create/clean up your own rows instead of relying on
  `resetDatabase()` mid-run - calling it while other tests are still running
  would truncate data out from under them.
- **Changing `REST_API_URL` or `BASE_HREF`** in `.env` requires
  `docker compose build angular` - the Angular app's backend URL is baked in
  at build time, not read at runtime.
- **Changing `UID`/`GID`** requires `docker compose build tests` and
  `docker volume rm petclinic-e2e_tests-node-modules` - the named volume only
  picks up ownership when it's first created empty.
- Don't copy `spring-petclinic-angular/e2e/app.e2e-spec.ts` verbatim into
  `tests/` - it mocks the backend via
  `page.route('http://localhost:9966/petclinic/api/**', ...)`. Since this
  environment points the app at `http://rest:9966/...` instead, that pattern
  silently stops matching and the "mocked" test hits the real backend.
