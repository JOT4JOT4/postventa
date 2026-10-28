import { BackfillInitialHistory1793088000000 } from '../../src/database/migrations/1793088000000-BackfillInitialHistory';
import { DataSource } from 'typeorm';
import { RequestEntity } from '../../src/requests/request.entity';
import { RequestItemEntity } from '../../src/requests/request-item.entity';
import { RequestRegistrationEntity } from '../../src/requests/request-registration.entity';
import { CaseResolutionEntity } from '../../src/cases/case-resolution.entity';
import { CaseHistoryEntity } from '../../src/cases/case-history.entity';
import { CreateRequests1792800000000 } from '../../src/database/migrations/1792800000000-CreateRequests';
import { AlignRegistrationSchema1792886400000 } from '../../src/database/migrations/1792886400000-AlignRegistrationSchema';
import { AddCaseManagement1793000000000 } from '../../src/database/migrations/1793000000000-AddCaseManagement';

export const databaseSuite = process.env.POSTVENTA_TEST_DATABASE_URL ? describe : describe.skip;

export async function openTestDatabase(prefix: string): Promise<DataSource> {
  const url = process.env.POSTVENTA_TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith('_test')) {
    throw new Error('Utiliza exclusivamente una base cuyo nombre termine en _test.');
  }
  const schema = `${prefix}_${Date.now()}`;
  const db = new DataSource({
    type: 'postgres', url, schema, synchronize: false,
    entities: [RequestEntity, RequestRegistrationEntity, RequestItemEntity, CaseResolutionEntity, CaseHistoryEntity],
    migrations: [CreateRequests1792800000000, AlignRegistrationSchema1792886400000, AddCaseManagement1793000000000, BackfillInitialHistory1793088000000],
    extra: { options: `-c search_path=${schema}` },
  });
  await db.initialize();
  await db.query(`CREATE SCHEMA "${schema}"`);
  return db;
}

export async function closeTestDatabase(db?: DataSource): Promise<void> {
  if (db?.isInitialized && db.options.type === 'postgres') {
    await db.query(`DROP SCHEMA "${db.options.schema}" CASCADE`);
    await db.destroy();
  }
}
