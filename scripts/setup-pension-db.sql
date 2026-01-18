-- Pension Quest Database Schema
-- Run this script in your Neon database to create the pension tables

-- Drop existing tables if they exist (careful in production!)
DROP TABLE IF EXISTS pension_funds CASCADE;
DROP TABLE IF EXISTS user_pension_selections CASCADE;
DROP TABLE IF EXISTS pension_recommendations CASCADE;
DROP TABLE IF EXISTS pension_schemes CASCADE;

-- Pension Schemes Table
CREATE TABLE pension_schemes (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(255),
  scheme_type VARCHAR(50),  -- workplace, sipp, personal, stakeholder
  annual_management_charge DECIMAL(5,3),  -- e.g., 0.750 for 0.75%
  platform_fee DECIMAL(5,3),
  min_contribution INTEGER,  -- minimum monthly contribution in GBP
  employer_match_percent DECIMAL(5,2),
  fund_options INTEGER,  -- number of funds available
  default_fund VARCHAR(255),
  sipp_available BOOLEAN DEFAULT false,
  drawdown_available BOOLEAN DEFAULT false,
  fca_regulated BOOLEAN DEFAULT true,
  performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 5),  -- 1-5 stars
  features TEXT[],
  suitable_for TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pension Funds Table
CREATE TABLE pension_funds (
  id SERIAL PRIMARY KEY,
  scheme_id INTEGER REFERENCES pension_schemes(id) ON DELETE CASCADE,
  fund_name VARCHAR(255) NOT NULL,
  fund_type VARCHAR(50),  -- equity, bond, mixed, property, cash
  risk_level INTEGER CHECK (risk_level BETWEEN 1 AND 7),  -- 1-7 (low to high)
  annual_return_1y DECIMAL(6,2),
  annual_return_5y DECIMAL(6,2),
  ongoing_charge DECIMAL(5,3),
  asset_allocation JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Pension Selections Table (for saved/tracked schemes)
CREATE TABLE user_pension_selections (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  scheme_id INTEGER REFERENCES pension_schemes(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, scheme_id)
);

-- Pension Recommendations Table (AI-generated)
CREATE TABLE pension_recommendations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  session_id VARCHAR(255) NOT NULL,
  scheme_ids INTEGER[],
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pension_schemes_type ON pension_schemes(scheme_type);
CREATE INDEX idx_pension_schemes_provider ON pension_schemes(provider);
CREATE INDEX idx_pension_schemes_rating ON pension_schemes(performance_rating DESC);
CREATE INDEX idx_pension_funds_scheme ON pension_funds(scheme_id);
CREATE INDEX idx_user_selections_user ON user_pension_selections(user_id);

-- =============================================
-- SEED DATA: Popular UK Pension Schemes
-- =============================================

-- Workplace Pensions (Auto-enrolment)
INSERT INTO pension_schemes (slug, name, provider, scheme_type, annual_management_charge, min_contribution, fund_options, default_fund, fca_regulated, performance_rating, features, suitable_for) VALUES
('nest', 'NEST', 'NEST Corporation', 'workplace', 0.300, 0, 10, 'NEST Retirement Date Fund', true, 4, ARRAY['Low fees', 'Government-backed', 'Flexible contributions', 'Auto-enrolment default'], ARRAY['Employees', 'Small businesses', 'First-time savers']),
('peoples-pension', 'The Peoples Pension', 'B&CE', 'workplace', 0.500, 0, 8, 'Global Investments (up to 85% shares)', true, 4, ARRAY['Low charges', 'Ethical options', 'Award-winning', 'No hidden fees'], ARRAY['Employees', 'Ethical investors', 'Hands-off savers']),
('now-pensions', 'NOW: Pensions', 'NOW: Pensions', 'workplace', 0.300, 0, 3, 'Diversified Growth Fund', true, 3, ARRAY['Simple choice', 'Low fees', 'Diversified default', 'Annual charge cap'], ARRAY['Employees', 'Small businesses', 'Simple choice seekers']),
('smart-pension', 'Smart Pension', 'Smart Pension', 'workplace', 0.300, 0, 7, 'Smart Retirement Fund', true, 4, ARRAY['Modern platform', 'App access', 'Low fees', 'Auto-enrolment focus'], ARRAY['Tech-savvy employees', 'Modern employers', 'App users']);

-- SIPPs (Self-Invested Personal Pensions)
INSERT INTO pension_schemes (slug, name, provider, scheme_type, annual_management_charge, platform_fee, min_contribution, fund_options, sipp_available, drawdown_available, fca_regulated, performance_rating, features, suitable_for) VALUES
('vanguard-sipp', 'Vanguard Personal Pension', 'Vanguard', 'sipp', 0.150, 0.000, 100, 80, true, true, true, 5, ARRAY['Lowest fees', 'Index funds', 'No platform fee', 'Simple investment'], ARRAY['DIY investors', 'Cost-conscious', 'Index fund believers', 'Beginners']),
('aj-bell', 'AJ Bell Youinvest', 'AJ Bell', 'sipp', 0.250, 0.000, 25, 2000, true, true, true, 4, ARRAY['Wide fund choice', 'Share dealing', 'Mobile app', 'Research tools'], ARRAY['Active investors', 'Share traders', 'Experienced investors']),
('hargreaves-lansdown', 'HL SIPP', 'Hargreaves Lansdown', 'sipp', 0.450, 0.000, 25, 3000, true, true, true, 4, ARRAY['Excellent service', 'Huge fund range', 'Research', 'Mobile app'], ARRAY['Service seekers', 'Active traders', 'Research lovers']),
('fidelity-sipp', 'Fidelity SIPP', 'Fidelity', 'sipp', 0.350, 0.000, 50, 3500, true, true, true, 4, ARRAY['Global funds', 'Good platform', 'Retirement tools', 'Award-winning'], ARRAY['Global investors', 'Retirement planners', 'Fund investors']),
('interactive-investor', 'ii SIPP', 'Interactive Investor', 'sipp', 0.000, 0.000, 25, 40000, true, true, true, 4, ARRAY['Flat fee', 'Huge range', 'International', 'Great for large pots'], ARRAY['Large pot holders', 'International investors', 'Frequent traders']);

-- Personal Pensions (Traditional providers)
INSERT INTO pension_schemes (slug, name, provider, scheme_type, annual_management_charge, min_contribution, fund_options, default_fund, sipp_available, drawdown_available, fca_regulated, performance_rating, features, suitable_for) VALUES
('aviva-personal', 'Aviva Personal Pension', 'Aviva', 'personal', 0.400, 50, 150, 'My Future Focus', false, true, true, 4, ARRAY['Trusted brand', 'Online tools', 'Wide choice', 'Advice available'], ARRAY['Self-employed', 'Those wanting advice', 'Traditional savers']),
('scottish-widows', 'Scottish Widows Personal Pension', 'Scottish Widows', 'personal', 0.500, 50, 100, 'Pension Portfolio', false, true, true, 3, ARRAY['Long history', 'Flexible', 'Good service', 'Wide availability'], ARRAY['Traditional savers', 'Long-term planners', 'Risk-averse']),
('legal-general', 'L&G Personal Pension', 'Legal & General', 'personal', 0.350, 50, 80, 'Multi-Asset Fund', false, true, true, 4, ARRAY['Low charges', 'Simple options', 'Strong track record', 'Reliable'], ARRAY['Cost-conscious', 'Simplicity seekers', 'Long-term savers']),
('standard-life', 'Standard Life Personal Pension', 'Standard Life', 'personal', 0.400, 100, 200, 'MyFolio', false, true, true, 4, ARRAY['Goal-based', 'Lifestyle funds', 'Good tools', 'Established provider'], ARRAY['Goal setters', 'Retirement planners', 'Those wanting guidance']);

-- Stakeholder Pensions
INSERT INTO pension_schemes (slug, name, provider, scheme_type, annual_management_charge, min_contribution, fund_options, default_fund, fca_regulated, performance_rating, features, suitable_for) VALUES
('aviva-stakeholder', 'Aviva Stakeholder Pension', 'Aviva', 'stakeholder', 1.000, 20, 10, 'Mixed Investment Fund', true, 3, ARRAY['Capped charges', 'Simple', 'Flexible payments', 'Transfer friendly'], ARRAY['Low earners', 'Irregular income', 'Basic savers']),
('lg-stakeholder', 'L&G Stakeholder Pension', 'Legal & General', 'stakeholder', 1.000, 20, 5, 'Default Fund', true, 3, ARRAY['Low minimum', 'Simple choice', 'Capped fees', 'Portable'], ARRAY['First-time savers', 'Low earners', 'Simple choice seekers']);

-- =============================================
-- SEED DATA: Sample Funds
-- =============================================

-- Vanguard Funds
INSERT INTO pension_funds (scheme_id, fund_name, fund_type, risk_level, annual_return_1y, annual_return_5y, ongoing_charge, asset_allocation) VALUES
((SELECT id FROM pension_schemes WHERE slug = 'vanguard-sipp'), 'Vanguard LifeStrategy 80% Equity', 'mixed', 5, 12.50, 9.20, 0.220, '{"equity": 80, "bonds": 20}'),
((SELECT id FROM pension_schemes WHERE slug = 'vanguard-sipp'), 'Vanguard LifeStrategy 60% Equity', 'mixed', 4, 9.80, 7.50, 0.220, '{"equity": 60, "bonds": 40}'),
((SELECT id FROM pension_schemes WHERE slug = 'vanguard-sipp'), 'Vanguard FTSE Global All Cap', 'equity', 6, 15.20, 11.30, 0.230, '{"equity": 100}'),
((SELECT id FROM pension_schemes WHERE slug = 'vanguard-sipp'), 'Vanguard UK Government Bond', 'bond', 2, -1.50, 1.20, 0.150, '{"bonds": 100}');

-- NEST Funds
INSERT INTO pension_funds (scheme_id, fund_name, fund_type, risk_level, annual_return_1y, annual_return_5y, ongoing_charge, asset_allocation) VALUES
((SELECT id FROM pension_schemes WHERE slug = 'nest'), 'NEST 2040 Retirement', 'mixed', 4, 8.50, 7.00, 0.300, '{"equity": 65, "bonds": 25, "other": 10}'),
((SELECT id FROM pension_schemes WHERE slug = 'nest'), 'NEST Ethical Fund', 'mixed', 4, 9.20, 7.80, 0.300, '{"equity": 60, "bonds": 30, "other": 10}'),
((SELECT id FROM pension_schemes WHERE slug = 'nest'), 'NEST Higher Risk Fund', 'equity', 6, 14.00, 10.50, 0.300, '{"equity": 85, "bonds": 10, "other": 5}'),
((SELECT id FROM pension_schemes WHERE slug = 'nest'), 'NEST Lower Risk Fund', 'mixed', 2, 3.50, 3.00, 0.300, '{"equity": 20, "bonds": 70, "cash": 10}');

-- HL Funds
INSERT INTO pension_funds (scheme_id, fund_name, fund_type, risk_level, annual_return_1y, annual_return_5y, ongoing_charge, asset_allocation) VALUES
((SELECT id FROM pension_schemes WHERE slug = 'hargreaves-lansdown'), 'HL Multi-Manager Income', 'mixed', 4, 7.80, 6.20, 0.590, '{"equity": 50, "bonds": 40, "other": 10}'),
((SELECT id FROM pension_schemes WHERE slug = 'hargreaves-lansdown'), 'HL Multi-Manager Balanced', 'mixed', 4, 9.50, 7.80, 0.590, '{"equity": 60, "bonds": 30, "other": 10}'),
((SELECT id FROM pension_schemes WHERE slug = 'hargreaves-lansdown'), 'HL Select UK Growth', 'equity', 5, 11.20, 8.90, 0.750, '{"equity": 100}');

-- Verify data
SELECT COUNT(*) as scheme_count FROM pension_schemes;
SELECT COUNT(*) as fund_count FROM pension_funds;

-- Show schemes summary
SELECT name, provider, scheme_type, annual_management_charge as amc, performance_rating as rating
FROM pension_schemes
ORDER BY scheme_type, performance_rating DESC;
