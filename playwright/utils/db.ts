import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

const SEED_DIR = process.env.SEED_SQL_DIR ?? '/srv/seed';

// Every table in spring-petclinic-rest/src/main/resources/db/postgres/schema.sql,
// listed so FK constraints (vet_specialties -> vets/specialties,
// pets -> owners/types, visits -> pets) are respected during TRUNCATE.
const TABLES = [
  'vet_specialties',
  'visits',
  'pets',
  'owners',
  'types',
  'specialties',
  'vets',
  'roles',
  'users',
];

/**
 * Restores the canonical seed data (10 owners, 6 vets, 6 pet types,
 * 3 specialties, 13 pets, ...), so each test can start from a known state.
 *
 * RESTART IDENTITY is required for correctness, not just tidiness:
 * data.sql guards its inserts on explicit ids
 * (`... WHERE NOT EXISTS (SELECT * FROM vets WHERE id = 1)`), and
 * vet_specialties inserts explicit id pairs. Without resetting the identity
 * sequences, a replay against non-empty sequences re-inserts every row at a
 * fresh id, so e.g. GET /petclinic/api/owners/1 404s and vet<->specialty
 * links point at the wrong rows.
 *
 * Safe to do behind the running app's back: the REST service has no
 * @Cacheable / @EnableCaching / Hibernate second-level cache, so there is
 * nothing to invalidate.
 */
export async function resetDatabase(): Promise<void> {
  const client = new Client(); // reads PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE
  await client.connect();
  try {
    await client.query(`TRUNCATE TABLE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);
    // pg's simple query protocol runs a multi-statement string as one
    // implicit transaction, so the whole seed file replays in a single round trip.
    const dataSql = readFileSync(join(SEED_DIR, 'data.sql'), 'utf8');
    await client.query(dataSql);
  } finally {
    await client.end();
  }
}
