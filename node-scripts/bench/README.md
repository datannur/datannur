# Boot-performance bench scripts

Tools to measure and diagnose app boot performance on large catalogs. Run from the repo root with `npm run node:ts <script>` (TypeScript via Node type stripping, like the other `node-scripts/`).

## Generate a synthetic large catalog

```sh
npm run node:ts node-scripts/bench/gen-big-db.ts 290   # ~290 "worlds" ≈ 6 000 datasets / 100k variables
```

Clones the demo db into `package/data/db-big/` (gitignored) by duplicating dataset/variable/enumeration/value/frequency rows with suffixed ids; shared tables (organization, folder, tag, concept…) stay unique. Env flags to null out features and isolate their cost: `NO_TAGS`, `NO_LINEAGE`, `NO_ENUM`, `NO_CONCEPTS`, `NO_DATES`, `LEVEL1_ONLY` (empties all dataset-internal tables).

Serve it with `DB=db-big npx vite --port 8099`.

## Measure boot timings

```sh
npm run node:ts node-scripts/bench/bench.ts http://localhost:8099/ [deadlineMs]
```

Prints the app's init log (`loadDbMs`, `processDbMs`, …), search init time, and JS heap usage.

## CPU profile of the boot

```sh
npm run node:ts node-scripts/bench/profile-boot.ts http://localhost:8099/
```

Arms the CDP profiler **before** navigation (the boot is one synchronous block, so CDP commands sent mid-boot are queued until it ends), waits for search init, prints the top functions. Line numbers are from the transformed modules (no sourcemap applied) — trust function names, not lines.

## Snapshot a db table (equivalence testing)

```sh
npm run node:ts node-scripts/bench/snapshot-table.ts http://localhost:8098/ before.json evolution
# ... apply a change ...
npm run node:ts node-scripts/bench/snapshot-table.ts http://localhost:8098/ after.json evolution
diff before.json after.json
```

Captures a normalized dump of any `db.tables.<name>` via the `db` console handle logged by `Main.svelte` — proves a processing refactor output-identical.
