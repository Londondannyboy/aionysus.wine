import { neon } from '@neondatabase/serverless';

// Lazy database connection - only created when needed at runtime
// This prevents the connection from being created during Next.js build
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sqlClient: any = null;

export function getSql() {
  if (!_sqlClient) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sqlClient = neon(databaseUrl);
  }
  return _sqlClient;
}

// ============================================
// PUPPY INSURANCE TYPE DEFINITIONS
// ============================================

export interface DogBreed {
  id: number;
  name: string;
  size: 'small' | 'medium' | 'large' | 'giant';
  risk_category: 'low' | 'medium' | 'high';
  avg_lifespan_years: number;
  common_health_issues: string[];
  base_premium_multiplier: number;
  image_url?: string;
  description?: string;
  temperament: string[];
  exercise_needs: 'low' | 'moderate' | 'high';
  grooming_needs: 'low' | 'moderate' | 'high';
}

export interface UserDog {
  id: number;
  user_id: string;
  name: string;
  breed_id?: number;
  breed_name: string;
  date_of_birth?: Date;
  age_years: number;
  weight_kg?: number;
  gender?: string;
  is_neutered: boolean;
  microchip_number?: string;
  has_preexisting_conditions: boolean;
  preexisting_conditions?: string[];
  photo_url?: string;
}

export interface InsurancePolicy {
  id: number;
  policy_number: string;
  user_id: string;
  dog_id: number;
  plan_type: 'basic' | 'standard' | 'premium' | 'comprehensive';
  monthly_premium: number;
  annual_coverage_limit: number;
  deductible: number;
  coverage_details: CoverageDetails;
  start_date: Date;
  end_date?: Date;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
}

export interface CoverageDetails {
  accident_coverage: boolean;
  illness_coverage: boolean;
  routine_care: boolean;
  dental_coverage: boolean;
  hereditary_conditions: boolean;
  prescription_meds: boolean;
  emergency_care: boolean;
  specialist_visits: boolean;
  alternative_therapies: boolean;
}

export interface PolicyQuote {
  id: number;
  user_id?: string;
  session_id?: string;
  dog_details: {
    breed: string;
    age: number;
    weight?: number;
    preexisting_conditions?: string[];
  };
  plan_type: string;
  quoted_premium: number;
  coverage_details: CoverageDetails;
  valid_until: Date;
}

export interface InsurancePlan {
  type: 'basic' | 'standard' | 'premium' | 'comprehensive';
  name: string;
  base_monthly_premium: number;
  annual_coverage_limit: number;
  deductible: number;
  coverage: CoverageDetails;
  features: string[];
}

// ============================================
// INSURANCE PLANS
// ============================================

export const INSURANCE_PLANS: InsurancePlan[] = [
  {
    type: 'basic',
    name: 'Puppy Basic',
    base_monthly_premium: 15,
    annual_coverage_limit: 5000,
    deductible: 250,
    coverage: {
      accident_coverage: true,
      illness_coverage: false,
      routine_care: false,
      dental_coverage: false,
      hereditary_conditions: false,
      prescription_meds: false,
      emergency_care: true,
      specialist_visits: false,
      alternative_therapies: false,
    },
    features: [
      'Accident coverage up to $5,000/year',
      'Emergency vet visits',
      '24/7 Pet Helpline',
    ],
  },
  {
    type: 'standard',
    name: 'Puppy Standard',
    base_monthly_premium: 35,
    annual_coverage_limit: 10000,
    deductible: 200,
    coverage: {
      accident_coverage: true,
      illness_coverage: true,
      routine_care: false,
      dental_coverage: false,
      hereditary_conditions: false,
      prescription_meds: true,
      emergency_care: true,
      specialist_visits: true,
      alternative_therapies: false,
    },
    features: [
      'Accident & illness coverage up to $10,000/year',
      'Prescription medications',
      'Specialist consultations',
      'Emergency vet visits',
      '24/7 Pet Helpline',
    ],
  },
  {
    type: 'premium',
    name: 'Puppy Premium',
    base_monthly_premium: 55,
    annual_coverage_limit: 20000,
    deductible: 100,
    coverage: {
      accident_coverage: true,
      illness_coverage: true,
      routine_care: true,
      dental_coverage: true,
      hereditary_conditions: true,
      prescription_meds: true,
      emergency_care: true,
      specialist_visits: true,
      alternative_therapies: false,
    },
    features: [
      'Accident & illness coverage up to $20,000/year',
      'Routine care & wellness visits',
      'Dental care included',
      'Hereditary condition coverage',
      'Prescription medications',
      'Specialist consultations',
      'Low $100 deductible',
      '24/7 Pet Helpline',
    ],
  },
  {
    type: 'comprehensive',
    name: 'Puppy Comprehensive',
    base_monthly_premium: 85,
    annual_coverage_limit: 50000,
    deductible: 0,
    coverage: {
      accident_coverage: true,
      illness_coverage: true,
      routine_care: true,
      dental_coverage: true,
      hereditary_conditions: true,
      prescription_meds: true,
      emergency_care: true,
      specialist_visits: true,
      alternative_therapies: true,
    },
    features: [
      'Unlimited accident & illness coverage (up to $50,000/year)',
      'ZERO deductible',
      'All routine & wellness care',
      'Full dental coverage',
      'Hereditary & chronic conditions',
      'Alternative therapies (acupuncture, hydrotherapy)',
      'Behavioral therapy',
      'Lost pet advertising & reward',
      'Travel coverage',
      'Priority claims processing',
    ],
  },
];

// ============================================
// DATABASE QUERIES
// ============================================

// Get all dog breeds
export async function getAllBreeds(): Promise<DogBreed[]> {
  try {
    const result = await getSql()`
      SELECT * FROM dog_breeds ORDER BY name
    `;
    return result as DogBreed[];
  } catch (error) {
    console.error('Error fetching breeds:', error);
    return [];
  }
}

// Get breed by name (fuzzy match)
export async function getBreedByName(name: string): Promise<DogBreed | null> {
  try {
    const result = await getSql()`
      SELECT * FROM dog_breeds
      WHERE LOWER(name) = LOWER(${name})
      OR LOWER(name) LIKE LOWER(${'%' + name + '%'})
      ORDER BY
        CASE WHEN LOWER(name) = LOWER(${name}) THEN 0 ELSE 1 END
      LIMIT 1
    `;
    return result[0] as DogBreed || null;
  } catch (error) {
    console.error('Error fetching breed:', error);
    return null;
  }
}

// Search breeds
export async function searchBreeds(query: string): Promise<DogBreed[]> {
  try {
    const result = await getSql()`
      SELECT * FROM dog_breeds
      WHERE LOWER(name) LIKE LOWER(${'%' + query + '%'})
      ORDER BY name
      LIMIT 5
    `;
    return result as DogBreed[];
  } catch (error) {
    console.error('Error searching breeds:', error);
    return [];
  }
}

// Get breed by ID
export async function getBreedById(id: number): Promise<DogBreed | null> {
  try {
    const result = await getSql()`
      SELECT * FROM dog_breeds WHERE id = ${id}
    `;
    return result[0] as DogBreed || null;
  } catch (error) {
    console.error('Error fetching breed by ID:', error);
    return null;
  }
}

// Calculate insurance quote
export function calculateQuote(
  breed: DogBreed,
  ageYears: number,
  planType: InsurancePlan['type'],
  hasPreexistingConditions: boolean = false
): { monthlyPremium: number; annualPremium: number; plan: InsurancePlan } {
  const plan = INSURANCE_PLANS.find(p => p.type === planType) || INSURANCE_PLANS[1];

  let premium = plan.base_monthly_premium;

  // Apply breed risk multiplier
  premium *= breed.base_premium_multiplier;

  // Age adjustments
  if (ageYears < 1) {
    premium *= 1.1; // Puppies have more accidents
  } else if (ageYears >= 7) {
    premium *= 1.3; // Senior dogs have more health issues
  } else if (ageYears >= 10) {
    premium *= 1.5;
  }

  // Preexisting conditions surcharge (only for certain plans)
  if (hasPreexistingConditions && (planType === 'premium' || planType === 'comprehensive')) {
    premium *= 1.25;
  }

  const monthlyPremium = Math.round(premium * 100) / 100;
  const annualPremium = Math.round(monthlyPremium * 12 * 100) / 100;

  return { monthlyPremium, annualPremium, plan };
}

// Save a quote
export async function saveQuote(
  quote: Omit<PolicyQuote, 'id'>
): Promise<number | null> {
  try {
    const result = await getSql()`
      INSERT INTO policy_quotes (user_id, session_id, dog_details, plan_type, quoted_premium, coverage_details, valid_until)
      VALUES (${quote.user_id || null}, ${quote.session_id || null}, ${JSON.stringify(quote.dog_details)}, ${quote.plan_type}, ${quote.quoted_premium}, ${JSON.stringify(quote.coverage_details)}, ${quote.valid_until.toISOString()})
      RETURNING id
    `;
    return result[0]?.id || null;
  } catch (error) {
    console.error('Error saving quote:', error);
    return null;
  }
}

// Get user's dogs
export async function getUserDogs(userId: string): Promise<UserDog[]> {
  try {
    const result = await getSql()`
      SELECT * FROM user_dogs WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
    return result as UserDog[];
  } catch (error) {
    console.error('Error fetching user dogs:', error);
    return [];
  }
}

// Add a dog for user
export async function addUserDog(dog: Omit<UserDog, 'id'>): Promise<number | null> {
  try {
    const result = await getSql()`
      INSERT INTO user_dogs (user_id, name, breed_id, breed_name, date_of_birth, age_years, weight_kg, gender, is_neutered, microchip_number, has_preexisting_conditions, preexisting_conditions, photo_url)
      VALUES (${dog.user_id}, ${dog.name}, ${dog.breed_id || null}, ${dog.breed_name}, ${dog.date_of_birth?.toISOString() || null}, ${dog.age_years}, ${dog.weight_kg || null}, ${dog.gender || null}, ${dog.is_neutered}, ${dog.microchip_number || null}, ${dog.has_preexisting_conditions}, ${dog.preexisting_conditions || []}, ${dog.photo_url || null})
      RETURNING id
    `;
    return result[0]?.id || null;
  } catch (error) {
    console.error('Error adding user dog:', error);
    return null;
  }
}

// Get user's policies
export async function getUserPolicies(userId: string): Promise<InsurancePolicy[]> {
  try {
    const result = await getSql()`
      SELECT p.*, d.name as dog_name, d.breed_name
      FROM insurance_policies p
      LEFT JOIN user_dogs d ON p.dog_id = d.id
      WHERE p.user_id = ${userId}
      ORDER BY p.created_at DESC
    `;
    return result as InsurancePolicy[];
  } catch (error) {
    console.error('Error fetching user policies:', error);
    return [];
  }
}

// Create a policy from a quote
export async function createPolicy(
  userId: string,
  dogId: number,
  quoteId: number,
  planType: InsurancePlan['type']
): Promise<string | null> {
  try {
    const plan = INSURANCE_PLANS.find(p => p.type === planType);
    if (!plan) return null;

    const policyNumber = `PUP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    await getSql()`
      INSERT INTO insurance_policies (policy_number, user_id, dog_id, plan_type, monthly_premium, annual_coverage_limit, deductible, coverage_details, start_date, end_date, status)
      VALUES (${policyNumber}, ${userId}, ${dogId}, ${planType}, ${plan.base_monthly_premium}, ${plan.annual_coverage_limit}, ${plan.deductible}, ${JSON.stringify(plan.coverage)}, ${startDate.toISOString()}, ${endDate.toISOString()}, 'active')
    `;

    // Mark quote as converted
    await getSql()`
      UPDATE policy_quotes SET converted_to_policy_id = (SELECT id FROM insurance_policies WHERE policy_number = ${policyNumber})
      WHERE id = ${quoteId}
    `;

    return policyNumber;
  } catch (error) {
    console.error('Error creating policy:', error);
    return null;
  }
}
