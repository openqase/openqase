#!/usr/bin/env tsx

/**
 * Populate missing industries and personas from entity mapping file
 */

import fs from 'fs';
import entityMapping from './entity-mapping.json';

function generateEntitiesSQL() {
  // Generate SQL for industries
  const industriesSql = Object.entries(entityMapping.industries).map(([name, slug]) => 
    `('${name.replace(/'/g, "''")}', '${slug}', NOW(), NOW())`
  ).join(',\n    ');

  // Generate SQL for personas  
  const personasSql = Object.entries(entityMapping.personas).map(([name, slug]) => 
    `('${name.replace(/'/g, "''")}', '${slug}', NOW(), NOW())`
  ).join(',\n    ');

  const sql = `-- Insert Industries
INSERT INTO industries (name, slug, created_at, updated_at) VALUES
    ${industriesSql};

-- Insert Personas
INSERT INTO personas (name, slug, created_at, updated_at) VALUES
    ${personasSql};
`;

  console.log(sql);
  return sql;
}

if (require.main === module) {
  generateEntitiesSQL();
}