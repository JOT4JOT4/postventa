import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'node:path';
import { databaseOptions } from './database-options';

export default new DataSource({
  ...databaseOptions(name => process.env[name]),
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
});
