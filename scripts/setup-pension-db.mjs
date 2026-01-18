// Setup pension database tables and seed data
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pjnG2MDqirC5@ep-tiny-wildflower-abug2uqw-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

async function setup() {
  console.log('Setting up pension database...\n');

  // Drop existing tables
  console.log('Dropping existing tables...');
  await sql`DROP TABLE IF EXISTS pension_funds CASCADE`;
  await sql`DROP TABLE IF EXISTS user_pension_selections CASCADE`;
  await sql`DROP TABLE IF EXISTS pension_recommendations CASCADE`;
  await sql`DROP TABLE IF EXISTS pension_schemes CASCADE`;

  // Create pension_schemes table
  console.log('Creating pension_schemes table...');
  await sql`
    CREATE TABLE pension_schemes (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE,
      name VARCHAR(255) NOT NULL,
      provider VARCHAR(255),
      scheme_type VARCHAR(50),
      annual_management_charge DECIMAL(5,3),
      platform_fee DECIMAL(5,3),
      min_contribution INTEGER,
      employer_match_percent DECIMAL(5,2),
      fund_options INTEGER,
      default_fund VARCHAR(255),
      sipp_available BOOLEAN DEFAULT false,
      drawdown_available BOOLEAN DEFAULT false,
      fca_regulated BOOLEAN DEFAULT true,
      performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 5),
      features TEXT[],
      suitable_for TEXT[],
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create pension_funds table
  console.log('Creating pension_funds table...');
  await sql`
    CREATE TABLE pension_funds (
      id SERIAL PRIMARY KEY,
      scheme_id INTEGER REFERENCES pension_schemes(id) ON DELETE CASCADE,
      fund_name VARCHAR(255) NOT NULL,
      fund_type VARCHAR(50),
      risk_level INTEGER CHECK (risk_level BETWEEN 1 AND 7),
      annual_return_1y DECIMAL(6,2),
      annual_return_5y DECIMAL(6,2),
      ongoing_charge DECIMAL(5,3),
      asset_allocation JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create user_pension_selections table
  console.log('Creating user_pension_selections table...');
  await sql`
    CREATE TABLE user_pension_selections (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      scheme_id INTEGER REFERENCES pension_schemes(id) ON DELETE CASCADE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, scheme_id)
    )
  `;

  // Create pension_recommendations table
  console.log('Creating pension_recommendations table...');
  await sql`
    CREATE TABLE pension_recommendations (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255),
      session_id VARCHAR(255) NOT NULL,
      scheme_ids INTEGER[],
      context JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create indexes
  console.log('Creating indexes...');
  await sql`CREATE INDEX idx_pension_schemes_type ON pension_schemes(scheme_type)`;
  await sql`CREATE INDEX idx_pension_schemes_provider ON pension_schemes(provider)`;
  await sql`CREATE INDEX idx_pension_schemes_rating ON pension_schemes(performance_rating DESC)`;
  await sql`CREATE INDEX idx_pension_funds_scheme ON pension_funds(scheme_id)`;
  await sql`CREATE INDEX idx_user_selections_user ON user_pension_selections(user_id)`;

  // Seed workplace pensions
  console.log('\nSeeding workplace pensions...');
  await sql`
    INSERT INTO pension_schemes (slug, name, provider, scheme_type, annual_management_charge, min_contribution, fund_options, default_fund, fca_regulated, performance_rating, features, suitable_for) VALUES
    ('nest', 'NEST', 'NEST Corporation', 'workplace', 0.300, 0, 10, 'NEST Retirement Date Fund', true, 4, ARRAY['Low fees', 'Government-backed', 'Flexible contributions', 'Auto-enrolment default'], ARRAY['Employees', 'Small businesses', 'First-time savers']),
    ('peoples-pension', 'The People''s Pension', 'B&CE', 'workplace', 0.500, 0, 8, 'Global Investments (up to 85% shares)', true, 4, ARRAY['Low charges', 'Ethical options', 'Award-winning', 'No hidden fees'], ARRAY['Employees', 'Ethical investors', 'Hands-off savers']),
    ('now-pensions', 'NOW: Pensions', 'NOW: Pensions', 'workplace', 0.300, 0, 3, 'Diversified Growth Fund', true, 3, ARRAY['Simple choice', 'Low fees', 'Diversified default', 'Annual charge cap'], ARRAY['Employees', 'Small businesses', 'Simple choice seekers']),
    ('smart-pension', 'Smart Pension', 'Smart Pension', 'workplace', 0.300, 0, 7, 'Smart Retirement Fund', true, 4, ARRAY['Modern platform', 'App access', 'Low fees', 'Auto-enrolment focus'], ARRAY['Tech-savvy employees', 'Modern employers', 'App users'])
  `;

  // Seed SIPPs
  console.log('Seeding SIPPs...');
  await sql`
    INSERT INTO pension_schemes (slug, name, provider, scheme_type, annual_management_charge, platform_fee, min_contribution, fund_options, sipp_available, drawdown_available, fca_regulated, performance_rating, features, suitable_for) VALUES
    ('vanguard-sipp', 'Vanguard Personal Pension', 'Vanguard', 'sipp', 0.150, 0.000, 100, 80, true, true, true, 5, ARRAY['Lowest fees', 'Index funds', 'No platform fee', 'Simple investment'], ARRAY['DIY investors', 'Cost-conscious', 'Index fund believers', 'Beginners']),
    ('aj-bell', 'AJ Bell Youinvest', 'AJ Bell', 'sipp', 0.250, 0.000, 25, 2000, true, true, true, 4, ARRAY['Wide fund choice', 'Share dealing', 'Mobile app', 'Research tools'], ARRAY['Active investors', 'Share traders', 'Experienced investors']),
    ('hargreaves-lansdown', 'HL SIPP', 'Hargreaves Lansdown', 'sipp', 0.450, 0.000, 25, 3000, true, true, true, 4, ARRAY['Excellent service', 'Huge fund range', 'Research', 'Mobile app'], ARRAY['Service seekers', 'Active traders', 'Research lovers']),
    ('fidelity-sipp', 'Fidelity SIPP', 'Fidelity', 'sipp', 0.350, 0.000, 50, 3500, true, true, true, 4, ARRAY['Global funds', 'Good platform', 'Retirement tools', 'Award-winning'], ARRAY['Global investors', 'Retirement planners', 'Fund investors']),
    ('interactive-investor', 'ii SIPP', 'Interactive Investor', 'sipp', 0.000, 0.000, 25, 40000, true, true, true, 4, ARRAY['Flat fee', 'Huge range', 'International', 'Great for large pots'], ARRAY['Large pot holders', 'International investors', 'Frequent traders'])
  `;

  // Seed personal pensions
  console.log('Seeding personal pensions...');
  await sql`
    INSERT INTO pension_schemes (slug, name, provider, scheme_type, annual_management_charge, min_contribution, fund_options, default_fund, sipp_available, drawdown_available, fca_regulated, performance_rating, features, suitable_for) VALUES
    ('aviva-personal', 'Aviva Personal Pension', 'Aviva', 'personal', 0.400, 50, 150, 'My Future Focus', false, true, true, 4, ARRAY['Trusted brand', 'Online tools', 'Wide choice', 'Advice available'], ARRAY['Self-employed', 'Those wanting advice', 'Traditional savers']),
    ('scottish-widows', 'Scottish Widows Personal Pension', 'Scottish Widows', 'personal', 0.500, 50, 100, 'Pension Portfolio', false, true, true, 3, ARRAY['Long history', 'Flexible', 'Good service', 'Wide availability'], ARRAY['Traditional savers', 'Long-term planners', 'Risk-averse']),
    ('legal-general', 'L&G Personal Pension', 'Legal & General', 'personal', 0.350, 50, 80, 'Multi-Asset Fund', false, true, true, 4, ARRAY['Low charges', 'Simple options', 'Strong track record', 'Reliable'], ARRAY['Cost-conscious', 'Simplicity seekers', 'Long-term savers']),
    ('standard-life', 'Standard Life Personal Pension', 'Standard Life', 'personal', 0.400, 100, 200, 'MyFolio', false, true, true, 4, ARRAY['Goal-based', 'Lifestyle funds', 'Good tools', 'Established provider'], ARRAY['Goal setters', 'Retirement planners', 'Those wanting guidance'])
  `;

  // Seed stakeholder pensions
  console.log('Seeding stakeholder pensions...');
  await sql`
    INSERT INTO pension_schemes (slug, name, provider, scheme_type, annual_management_charge, min_contribution, fund_options, default_fund, fca_regulated, performance_rating, features, suitable_for) VALUES
    ('aviva-stakeholder', 'Aviva Stakeholder Pension', 'Aviva', 'stakeholder', 1.000, 20, 10, 'Mixed Investment Fund', true, 3, ARRAY['Capped charges', 'Simple', 'Flexible payments', 'Transfer friendly'], ARRAY['Low earners', 'Irregular income', 'Basic savers']),
    ('lg-stakeholder', 'L&G Stakeholder Pension', 'Legal & General', 'stakeholder', 1.000, 20, 5, 'Default Fund', true, 3, ARRAY['Low minimum', 'Simple choice', 'Capped fees', 'Portable'], ARRAY['First-time savers', 'Low earners', 'Simple choice seekers'])
  `;

  // Seed some funds
  console.log('Seeding pension funds...');

  // Get Vanguard scheme ID
  const vanguard = await sql`SELECT id FROM pension_schemes WHERE slug = 'vanguard-sipp'`;
  if (vanguard.length > 0) {
    await sql`
      INSERT INTO pension_funds (scheme_id, fund_name, fund_type, risk_level, annual_return_1y, annual_return_5y, ongoing_charge, asset_allocation) VALUES
      (${vanguard[0].id}, 'Vanguard LifeStrategy 80% Equity', 'mixed', 5, 12.50, 9.20, 0.220, '{"equity": 80, "bonds": 20}'),
      (${vanguard[0].id}, 'Vanguard LifeStrategy 60% Equity', 'mixed', 4, 9.80, 7.50, 0.220, '{"equity": 60, "bonds": 40}'),
      (${vanguard[0].id}, 'Vanguard FTSE Global All Cap', 'equity', 6, 15.20, 11.30, 0.230, '{"equity": 100}'),
      (${vanguard[0].id}, 'Vanguard UK Government Bond', 'bond', 2, -1.50, 1.20, 0.150, '{"bonds": 100}')
    `;
  }

  // Get NEST scheme ID
  const nest = await sql`SELECT id FROM pension_schemes WHERE slug = 'nest'`;
  if (nest.length > 0) {
    await sql`
      INSERT INTO pension_funds (scheme_id, fund_name, fund_type, risk_level, annual_return_1y, annual_return_5y, ongoing_charge, asset_allocation) VALUES
      (${nest[0].id}, 'NEST 2040 Retirement', 'mixed', 4, 8.50, 7.00, 0.300, '{"equity": 65, "bonds": 25, "other": 10}'),
      (${nest[0].id}, 'NEST Ethical Fund', 'mixed', 4, 9.20, 7.80, 0.300, '{"equity": 60, "bonds": 30, "other": 10}'),
      (${nest[0].id}, 'NEST Higher Risk Fund', 'equity', 6, 14.00, 10.50, 0.300, '{"equity": 85, "bonds": 10, "other": 5}'),
      (${nest[0].id}, 'NEST Lower Risk Fund', 'mixed', 2, 3.50, 3.00, 0.300, '{"equity": 20, "bonds": 70, "cash": 10}')
    `;
  }

  // Verify
  const schemeCount = await sql`SELECT COUNT(*) as count FROM pension_schemes`;
  const fundCount = await sql`SELECT COUNT(*) as count FROM pension_funds`;

  console.log(`\n✅ Database setup complete!`);
  console.log(`   - ${schemeCount[0].count} pension schemes created`);
  console.log(`   - ${fundCount[0].count} pension funds created`);

  // List schemes
  const schemes = await sql`SELECT name, provider, scheme_type, annual_management_charge as amc, performance_rating as rating FROM pension_schemes ORDER BY scheme_type, name`;
  console.log('\nPension Schemes:');
  schemes.forEach(s => {
    console.log(`  ${s.scheme_type.padEnd(12)} | ${s.name.padEnd(35)} | AMC: ${(s.amc || 0).toFixed(2)}% | Rating: ${'★'.repeat(s.rating || 0)}`);
  });
}

setup().catch(console.error);
