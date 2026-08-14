import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Get database URL from .env
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL\s*=\s*(.+)/);
if (!match) {
  console.error('��❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: match[1].trim(),
  ssl: { rejectUnauthorized: false },
  max: 2,
  connectionTimeoutMillis: 15000,
});

async function seedEsicCategories() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create esic_categories table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS esic_categories (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        parent_id INTEGER,
        level INTEGER NOT NULL,
        description TEXT,
        tax_applicable BOOLEAN DEFAULT true,
        vat_rate NUMERIC DEFAULT 0.15,
        vat_exempt BOOLEAN DEFAULT false,
        withholding_applicable BOOLEAN DEFAULT false,
        withholding_rate NUMERIC DEFAULT 0,
        excise_applicable BOOLEAN DEFAULT false,
        excise_rate NUMERIC DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert ESIC categories based on ISIC Rev 4 adapted for Ethiopia
    const categories = [
      // Section A: Agriculture, Forestry and Fishing
      { code: 'A01', name: 'Growing of non-perennial crops', parent_id: null, level: 1, description: 'Agricultural crops', tax_applicable: true, vat_rate: 0.15 },
      { code: 'A02', name: 'Growing of perennial crops', parent_id: null, level: 1, description: 'Perennial crops', tax_applicable: true, vat_rate: 0.15 },
      { code: 'A03', name: 'Animal production', parent_id: null, level: 1, description: 'Livestock and animal products', tax_applicable: true, vat_rate: 0.15 },
      { code: 'A05', name: 'Forestry and logging', parent_id: null, level: 1, description: 'Forestry activities', tax_applicable: true, vat_rate: 0.15 },
      { code: 'A06', name: 'Fishing and aquaculture', parent_id: null, level: 1, description: 'Fishing and fish farming', tax_applicable: true, vat_rate: 0.15 },
      
      // Section B: Mining and Quarrying
      { code: 'B06', name: 'Extraction of crude petroleum', parent_id: null, level: 1, description: 'Petroleum extraction', tax_applicable: true, vat_rate: 0.15, excise_applicable: true, excise_rate: 0.05 },
      { code: 'B07', name: 'Mining of metal ores', parent_id: null, level: 1, description: 'Metal ore mining', tax_applicable: true, vat_rate: 0.15, excise_applicable: true, excise_rate: 0.03 },
      { code: 'B08', name: 'Quarrying of stone, sand and clay', parent_id: null, level: 1, description: 'Stone and mineral extraction', tax_applicable: true, vat_rate: 0.15 },
      
      // Section C: Manufacturing
      { code: 'C10', name: 'Manufacture of food products', parent_id: null, level: 1, description: 'Food processing', tax_applicable: true, vat_rate: 0.15 },
      { code: 'C11', name: 'Manufacture of beverages', parent_id: null, level: 1, description: 'Beverage production', tax_applicable: true, vat_rate: 0.15 },
      { code: 'C12', name: 'Manufacture of tobacco products', parent_id: null, level: 1, description: 'Tobacco manufacturing', tax_applicable: true, vat_rate: 0.15, excise_applicable: true, excise_rate: 0.10 },
      { code: 'C13', name: 'Manufacture of textiles', parent_id: null, level: 1, description: 'Textile manufacturing', tax_applicable: true, vat_rate: 0.15 },
      { code: 'C14', name: 'Manufacture of wearing apparel', parent_id: null, level: 1, description: 'Apparel manufacturing', tax_applicable: true, vat_rate: 0.15 },
      { code: 'C15', name: 'Manufacture of leather and related products', parent_id: null, level: 1, description: 'Leather goods manufacturing', tax_applicable: true, vat_rate: 0.15 },
      { code: 'C16', name: 'Manufacture of wood and paper products', parent_id: null, level: 1, description: 'Wood and paper products', tax_applicable: true, vat_rate: 0.15 },
      { code: 'C17', name: 'Manufacture of chemicals', parent_id: null, level: 1, description: 'Chemical manufacturing', tax_applicable: true, vat_rate: 0.15 },
      { code: 'C18', name: 'Manufacture of pharmaceuticals', parent_id: null, level: 1, description: 'Pharmaceutical production', tax_applicable: true, vat_rate: 0.15 },
      { code: 'C19', name: 'Manufacture of rubber and plastics products', parent_id: null, level: 1, description: 'Rubber and plastic manufacturing', tax_applicable: true, vat_rate: 0.15 },
      { code: 'C20', name: 'Manufacture of basic metals', parent_id: null, level: 1, description: 'Metal manufacturing', tax_applicable: true, vat_rate: 0.15, excise_applicable: true, excise_rate: 0.02 },
      { code: 'C21', name: 'Manufacture of computer and electronic products', parent_id: null, level: 1, description: 'Electronic manufacturing', tax_applicable: true, vat_rate: 0.15 },
      { code: 'C22', name: 'Manufacture of electrical equipment', parent_id: null, level: 1, description: 'Electrical equipment manufacturing', tax_applicable: true, vat_rate: 0.15 },
      { code: 'C23', name: 'Manufacture of machinery and equipment', parent_id: null, level: 1, description: 'Machinery manufacturing', tax_applicable: true, vat_rate: 0.15 },
      { code: 'C24', name: 'Manufacture of furniture', parent_id: null, level: 1, description: 'Furniture manufacturing', tax_applicable: true, vat_rate: 0.15 },
      
      // Section D: Electricity, Gas, Steam and Air Conditioning Supply
      { code: 'D35', name: 'Electric power generation', parent_id: null, level: 1, description: 'Electricity supply', tax_applicable: true, vat_rate: 0.15 },
      
      // Section E: Water Supply; Sewerage, Waste Management and Remediation Activities
      { code: 'E36', name: 'Water collection, treatment and supply', parent_id: null, level: 1, description: 'Water supply', tax_applicable: true, vat_rate: 0.15 },
      { code: 'E37', name: 'Sewerage', parent_id: null, level: 1, description: 'Sewerage services', tax_applicable: true, vat_rate: 0.15 },
      { code: 'E38', name: 'Waste collection and disposal', parent_id: null, level: 1, description: 'Waste management', tax_applicable: true, vat_rate: 0.15 },
      
      // Section F: Construction
      { code: 'F41', name: 'Construction of buildings', parent_id: null, level: 1, description: 'Building construction', tax_applicable: true, vat_rate: 0.15 },
      { code: 'F42', name: 'Civil engineering', parent_id: null, level: 1, description: 'Infrastructure construction', tax_applicable: true, vat_rate: 0.15 },
      
      // Section G: Wholesale and Retail Trade; Repair of Motor Vehicles and Motorcycles
      { code: 'G45', name: 'Wholesale of motor vehicles', parent_id: null, level: 1, description: 'Motor vehicle wholesale', tax_applicable: true, vat_rate: 0.15 },
      { code: 'G46', name: 'Wholesale of food, beverages and tobacco', parent_id: null, level: 1, description: 'Food wholesale', tax_applicable: true, vat_rate: 0.15 },
      { code: 'G47', name: 'Wholesale of other goods', parent_id: null, level: 1, description: 'Other wholesale trade', tax_applicable: true, vat_rate: 0.15 },
      
      // Section H: Transportation and Storage
      { code: 'H49', name: 'Transport via railways', parent_id: null, level: 1, description: 'Rail transport', tax_applicable: true, vat_rate: 0.15 },
      
      // Section I: Accommodation and Food Service Activities
      { code: 'I55', name: 'Hotels and similar accommodation', parent_id: null, level: 1, description: 'Accommodation services', tax_applicable: true, vat_rate: 0.15 },
      
      // Section J: Information and Communication
      { code: 'J61', name: 'Computer programming', parent_id: null, level: 1, description: 'Software development', tax_applicable: true, vat_rate: 0.15 },
      
      // Section K: Financial and Insurance Activities
      { code: 'K64', name: 'Financial intermediation', parent_id: null, level: 1, description: 'Banking services', tax_applicable: false },
      
      // Section M: Professional, Scientific and Technical Activities
      { code: 'M69', name: 'Management consultancy', parent_id: null, level: 1, description: 'Management consulting', tax_applicable: true, vat_rate: 0.15 },
      
      // Section N: Administrative and Support Service Activities
      { code: 'N82', name: 'Business support services', parent_id: null, level: 1, description: 'Business support', tax_applicable: true, vat_rate: 0.15 },
      
      // Section O: Public Administration and Defence; Compulsory Social Security
      { code: 'O84', name: 'Public administration', parent_id: null, level: 1, description: 'Government administration', tax_applicable: false },
      
      // Section P: Education
      { code: 'P85', name: 'Higher education', parent_id: null, level: 1, description: 'University education', tax_applicable: false },
      
      // Section Q: Human Health and Social Work Activities
      { code: 'Q86', name: 'Hospital activities', parent_id: null, level: 1, description: 'Hospital services', tax_applicable: false },
      
      // Section R: Arts, Entertainment and Recreation
      { code: 'R90', name: 'Sports and recreation activities', parent_id: null, level: 1, description: 'Recreation services', tax_applicable: true, vat_rate: 0.15 },
      
      // Section S: Other Service Activities
      { code: 'S90', name: 'Other personal services', parent_id: null, level: 1, description: 'Personal services', tax_applicable: true, vat_rate: 0.15 },
      
      // Section U: Activities of Extraterritorial Organizations and Bodies
      { code: 'U99', name: 'Extraterritorial organizations', parent_id: null, level: 1, description: 'International organizations', tax_applicable: false }
    ];
    
    // Insert or update categories
    for (const cat of categories) {
      await client.query(
        `INSERT INTO esic_categories (
          code, name, parent_id, level, description, 
          tax_applicable, vat_rate, vat_exempt, withholding_applicable, 
          withholding_rate, excise_applicable, excise_rate, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          parent_id = EXCLUDED.parent_id,
          level = EXCLUDED.level,
          description = EXCLUDED.description,
          tax_applicable = EXCLUDED.tax_applicable,
          vat_rate = EXCLUDED.vat_rate,
          vat_exempt = EXCLUDED.vat_exempt,
          withholding_applicable = EXCLUDED.withholding_applicable,
          withholding_rate = EXCLUDED.withholding_rate,
          excise_applicable = EXCLUDED.excise_applicable,
          excise_rate = EXCLUDED.excise_rate,
          active = EXCLUDED.active,
          updated_at = CURRENT_TIMESTAMP`,
        [
          cat.code,
          cat.name,
          cat.parent_id,
          cat.level,
          cat.description,
          cat.tax_applicable,
          cat.vat_rate,
          cat.vat_exempt ? 'true' : 'false',
          cat.withholding_applicable ? 'true' : 'false',
          cat.withholding_rate,
          cat.excise_applicable ? 'true' : 'false',
          cat.excise_rate,
          cat.active ? 'true' : 'false'
        ]
      );
    }
    
    console.log('��✅ ESIC categories seeded/updated successfully');
    
    // Commit the transaction
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('��❌ Error seeding ESIC categories:', e.message);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

seedEsicCategories().catch(e => {
  console.error('��❌ Seed script failed:', e.message);
  process.exit(1);
});
