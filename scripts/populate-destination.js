/**
 * Populate Destination Data
 *
 * Generic script to populate topic cluster and page contexts for any destination.
 *
 * Usage: node scripts/populate-destination.js <country>
 * Example: node scripts/populate-destination.js cyprus
 *
 * Data files should be in: scripts/data/<country>.js
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment
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

// Get country from command line
const country = process.argv[2];
if (!country) {
  console.error('Usage: node scripts/populate-destination.js <country>');
  console.error('Example: node scripts/populate-destination.js cyprus');
  process.exit(1);
}

// Load country data
const dataPath = path.join(__dirname, 'data', `${country}.js`);
if (!fs.existsSync(dataPath)) {
  console.error(`ERROR: Data file not found: ${dataPath}`);
  console.error(`Create the file first: scripts/data/${country}.js`);
  process.exit(1);
}

const countryData = require(dataPath);

async function populateCluster(cluster) {
  console.log(`Creating topic cluster: ${cluster.name}...\n`);

  try {
    const existing = await sql`
      SELECT id FROM topic_clusters WHERE name = ${cluster.name}
    `;

    if (existing.length > 0) {
      await sql`
        UPDATE topic_clusters SET
          display_name = ${cluster.display_name},
          hub_page_slug = ${cluster.hub_page_slug},
          description = ${cluster.description},
          spoke_pages = ${cluster.spoke_pages},
          keywords = ${cluster.keywords},
          priority = ${cluster.priority},
          updated_at = NOW()
        WHERE name = ${cluster.name}
      `;
      console.log(`✓ Updated cluster: ${cluster.name}`);
    } else {
      await sql`
        INSERT INTO topic_clusters (name, display_name, hub_page_slug, description, spoke_pages, keywords, priority)
        VALUES (${cluster.name}, ${cluster.display_name}, ${cluster.hub_page_slug}, ${cluster.description}, ${cluster.spoke_pages}, ${cluster.keywords}, ${cluster.priority})
      `;
      console.log(`✓ Added cluster: ${cluster.name}`);
    }
  } catch (error) {
    console.error(`✗ Error with cluster:`, error.message);
    throw error;
  }
}

async function populatePages(pages, clusterName) {
  console.log(`\nCreating page contexts...\n`);

  for (const page of pages) {
    try {
      // Set topic_cluster from the cluster name
      page.topic_cluster = clusterName;

      const existing = await sql`
        SELECT id FROM page_contexts WHERE page_slug = ${page.page_slug}
      `;

      if (existing.length > 0) {
        await sql`
          UPDATE page_contexts SET
            page_title = ${page.page_title},
            page_type = ${page.page_type},
            topic_cluster = ${page.topic_cluster},
            voice_context = ${page.voice_context},
            available_sections = ${page.available_sections},
            related_tools = ${page.related_tools},
            keywords = ${page.keywords},
            destination_slug = ${page.destination_slug || null},
            hero_variant = ${page.hero_variant || 'guide'},
            hero_title = ${page.hero_title || null},
            hero_subtitle = ${page.hero_subtitle || null},
            hero_image = ${page.hero_image || null},
            hero_gradient = ${page.hero_gradient || null},
            meta_title = ${page.meta_title || null},
            meta_description = ${page.meta_description || null},
            content_summary = ${page.content_summary || null},
            priority = ${page.priority || 0},
            updated_at = NOW()
          WHERE page_slug = ${page.page_slug}
        `;
        console.log(`✓ Updated: ${page.page_slug}`);
      } else {
        await sql`
          INSERT INTO page_contexts (
            page_slug, page_title, page_type, topic_cluster, voice_context,
            available_sections, related_tools, keywords, destination_slug,
            hero_variant, hero_title, hero_subtitle, hero_image, hero_gradient,
            meta_title, meta_description, content_summary, priority
          )
          VALUES (
            ${page.page_slug}, ${page.page_title}, ${page.page_type}, ${page.topic_cluster}, ${page.voice_context},
            ${page.available_sections}, ${page.related_tools}, ${page.keywords}, ${page.destination_slug || null},
            ${page.hero_variant || 'guide'}, ${page.hero_title || null}, ${page.hero_subtitle || null},
            ${page.hero_image || null}, ${page.hero_gradient || null},
            ${page.meta_title || null}, ${page.meta_description || null}, ${page.content_summary || null},
            ${page.priority || 0}
          )
        `;
        console.log(`✓ Added: ${page.page_slug}`);
      }
    } catch (error) {
      console.error(`✗ Error with ${page.page_slug}:`, error.message);
    }
  }
}

async function showSummary(clusterName) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`SUMMARY: ${clusterName.toUpperCase()}`);
  console.log(`${'='.repeat(50)}\n`);

  const cluster = await sql`SELECT * FROM topic_clusters WHERE name = ${clusterName}`;
  if (cluster.length > 0) {
    console.log('Topic Cluster:', cluster[0].display_name);
    console.log('  Hub:', cluster[0].hub_page_slug);
    console.log('  Spokes:', cluster[0].spoke_pages.length, 'pages');
    console.log('  Keywords:', cluster[0].keywords.length, 'keywords');
  }

  console.log('\nPage Contexts:');
  const pages = await sql`
    SELECT page_slug, page_type, hero_variant, priority
    FROM page_contexts
    WHERE topic_cluster = ${clusterName}
    ORDER BY priority DESC
  `;
  pages.forEach(p => console.log(`  [${p.priority}] ${p.page_slug} (${p.page_type})`));

  console.log(`\nTotal: ${pages.length} pages in ${clusterName} cluster`);
}

async function main() {
  console.log(`\nPopulating destination: ${country.toUpperCase()}\n`);
  console.log(`Data file: scripts/data/${country}.js\n`);
  console.log('-'.repeat(50));

  try {
    await populateCluster(countryData.cluster);
    await populatePages(countryData.pages, countryData.cluster.name);
    await showSummary(countryData.cluster.name);
    console.log('\nDone!');
  } catch (error) {
    console.error('\nFailed:', error.message);
    process.exit(1);
  }
}

main();
