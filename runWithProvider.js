const dotenv = require('dotenv');
const { execSync } = require('child_process');
const { existsSync } = require('fs');

dotenv.config();

let { DATABASE_PROVIDER } = process.env;
DATABASE_PROVIDER = (DATABASE_PROVIDER || '').trim(); // normalize whitespace
const databaseProviderDefault = DATABASE_PROVIDER !== '' ? DATABASE_PROVIDER : 'postgresql';

if (process.env.DATABASE_URL && (!process.env.DATABASE_CONNECTION_URI || process.env.DATABASE_CONNECTION_URI === '')) {
  process.env.DATABASE_CONNECTION_URI = process.env.DATABASE_URL;
}

if (process.env.DATABASE_CONNECTION_URI && (!process.env.DATABASE_URL || process.env.DATABASE_URL === '')) {
  process.env.DATABASE_URL = process.env.DATABASE_CONNECTION_URI;
}

if (process.env.DATABASE_CONNECTION_URI) {
  // Direct connection URL for migrations should not use pooler host or pooler params
  let uri = process.env.DATABASE_CONNECTION_URI.replace(/-pooler\./g, '.');
  uri = uri.replace(/([?&])(connection_limit|pool_timeout)=[^&]*&?/g, '$1').replace(/[?&]$/, '');
  process.env.DATABASE_CONNECTION_URI = uri;
}

if (!process.env.DATABASE_PROVIDER || DATABASE_PROVIDER === '') {
  console.warn(`DATABASE_PROVIDER is not set or is empty; using default: ${databaseProviderDefault}`);
}

// Função para determinar qual pasta de migrations usar
// Função para determinar qual pasta de migrations usar
function getMigrationsFolder(provider) {
  switch (provider) {
    case 'psql_bouncer':
      return 'postgresql-migrations'; // psql_bouncer usa as migrations do postgresql
    default:
      return `${provider}-migrations`;
  }
}

const migrationsFolder = getMigrationsFolder(databaseProviderDefault);

let command = process.argv
  .slice(2)
  .join(' ')
  .replace(/DATABASE_PROVIDER/g, databaseProviderDefault);

// Substituir referências à pasta de migrations pela pasta correta
const migrationsPattern = new RegExp(`${databaseProviderDefault}-migrations`, 'g');
command = command.replace(migrationsPattern, migrationsFolder);

if (command.includes('rmdir') && existsSync('prisma\\migrations')) {
  try {
    execSync('rmdir /S /Q prisma\\migrations', { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error removing directory: prisma\\migrations`);
    process.exit(1);
  }
} else if (command.includes('rmdir')) {
  console.warn(`Directory 'prisma\\migrations' does not exist, skipping removal.`);
}

try {
  execSync(command, { stdio: 'inherit', env: process.env });
} catch (error) {
  console.error(`Error executing command: ${command}`);
  process.exit(1);
}
