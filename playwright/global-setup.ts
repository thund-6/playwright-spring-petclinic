import { resetDatabase } from '@utils/db';

export default async function globalSetup() {
  await resetDatabase();
}
