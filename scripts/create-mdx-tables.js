/**
 * Create MDX Content Tables for Phase 6
 *
 * Creates:
 * - page_contexts: Page context for voice agent awareness
 * - topic_clusters: Content organization into clusters
 *
 * Run with: node scripts/create-mdx-tables.js
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}
loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function createTables() {
  console.log('Creating MDX content tables...\n');

  // Create topic_clusters table
  console.log('Creating topic_clusters table...');
  await sql`
    CREATE TABLE IF NOT EXISTS topic_clusters (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      display_name VARCHAR(200) NOT NULL,
      hub_page_slug VARCHAR(255),
      description TEXT,
      spoke_pages TEXT[],
      keywords TEXT[],
      priority INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓ topic_clusters table created\n');

  // Create page_contexts table
  console.log('Creating page_contexts table...');
  await sql`
    CREATE TABLE IF NOT EXISTS page_contexts (
      id SERIAL PRIMARY KEY,
      page_slug VARCHAR(255) UNIQUE NOT NULL,
      page_title TEXT NOT NULL,
      page_type VARCHAR(50) NOT NULL,
      topic_cluster VARCHAR(100) REFERENCES topic_clusters(name),
      voice_context TEXT,
      available_sections TEXT[],
      related_tools TEXT[],
      keywords TEXT[],
      destination_slug VARCHAR(100),
      hero_variant VARCHAR(50) DEFAULT 'guide',
      hero_title TEXT,
      hero_subtitle TEXT,
      hero_image TEXT,
      hero_gradient TEXT,
      content_summary TEXT,
      meta_title TEXT,
      meta_description TEXT,
      priority INTEGER DEFAULT 0,
      is_published BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓ page_contexts table created\n');

  // Create index for faster lookups
  console.log('Creating indexes...');
  await sql`CREATE INDEX IF NOT EXISTS idx_page_contexts_slug ON page_contexts(page_slug)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_page_contexts_cluster ON page_contexts(topic_cluster)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_page_contexts_type ON page_contexts(page_type)`;
  console.log('✓ Indexes created\n');

  console.log('All tables created successfully!');
}

async function verifyTables() {
  console.log('\nVerifying tables...');

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('page_contexts', 'topic_clusters')
    ORDER BY table_name
  `;

  console.log('Tables found:');
  tables.forEach(t => console.log(`  - ${t.table_name}`));
}

async function main() {
  try {
    await createTables();
    await verifyTables();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
