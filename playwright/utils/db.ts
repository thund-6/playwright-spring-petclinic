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

// RESTART IDENTITY matters, not just tidies up: data.sql inserts guarded on
// explicit ids, so a replay against non-reset sequences puts rows at the
// wrong ids and breaks FK links (e.g. GET /owners/1 404s).
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
