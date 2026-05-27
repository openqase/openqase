◇ injected env (13) from .env.local // tip: ◈ encrypted .env [www.dotenvx.com]
# Schema Cross-Check — 2026-05-27

**Supabase types regenerated:** yes (+63 / -145 lines)
**Unapplied migrations:** skipped — `supabase` not in PATH, used `npx supabase`; `db diff` check commented out for this one-time A0 run
**Script version:** scripts/schema-crosscheck.ts @ c057ada

## algorithms (table: `algorithms`)

| Field | Engine type | DB type | Status |
|-------|------------|---------|--------|
| id | text | string | ✅ |
| published | boolean | boolean | ✅ |
| created_at | text | string | ✅ |
| updated_at | text | string | ✅ |
| name | text | string | ✅ |
| slug | slug | string | ✅ |
| description | textarea | string | ✅ |
| main_content | markdown | string | ✅ |
| use_cases | textarea | string[] | ⚠️ |
| steps | markdown | string | ✅ |
| academic_references | markdown | string | ✅ |
| quantum_advantage | textarea | string | ✅ |
| deleted_at | ~ | string | ~ |
| deleted_by | ~ | string | ~ |
| is_system_record | ~ | boolean | ~ |
| published_at | ~ | string | ~ |
| ts_content | ~ | unknown | ~ |

**Relationships:**

| Junction table | foreignKey | targetKey | Status | Detail |
|---------------|-----------|----------|--------|--------|
| algorithm_industry_relations | algorithm_id | industry_id | ✅ |  |
| algorithm_case_study_relations | algorithm_id | case_study_id | ✅ |  |
| persona_algorithm_relations | algorithm_id | persona_id | ✅ |  |

## blog-posts (table: `blog_posts`)

| Field | Engine type | DB type | Status |
|-------|------------|---------|--------|
| id | text | string | ✅ |
| published | boolean | boolean | ✅ |
| created_at | text | string | ✅ |
| updated_at | text | string | ✅ |
| title | text | string | ✅ |
| slug | slug | string | ✅ |
| description | textarea | string | ✅ |
| content | markdown | string | ✅ |
| author | text | string | ✅ |
| category | text | string | ✅ |
| featured_image | url | string | ⚠️ |
| featured | boolean | boolean | ✅ |
| published_at | text | string | ✅ |
| deleted_at | ~ | string | ~ |
| deleted_by | ~ | string | ~ |
| tags | ~ | string[] | ~ |
| ts_content | ~ | unknown | ~ |

**Relationships:**

| Junction table | foreignKey | targetKey | Status | Detail |
|---------------|-----------|----------|--------|--------|
| blog_post_relations | blog_post_id | related_blog_post_id | ✅ |  |

## case-studies (table: `case_studies`)

| Field | Engine type | DB type | Status |
|-------|------------|---------|--------|
| id | text | string | ✅ |
| published | boolean | boolean | ✅ |
| created_at | text | string | ✅ |
| updated_at | text | string | ✅ |
| title | text | string | ✅ |
| slug | slug | string | ✅ |
| description | textarea | string | ✅ |
| main_content | markdown | string | ✅ |
| featured | boolean | boolean | ✅ |
| academic_references | markdown | string | ✅ |
| resource_links | textarea | Json | ⚠️ |
| year | number | number | ✅ |
| algorithms | ~ | string[] | ~ |
| deleted_at | ~ | string | ~ |
| deleted_by | ~ | string | ~ |
| import_batch_id | ~ | string | ~ |
| import_batch_name | ~ | string | ~ |
| import_source | ~ | string | ~ |
| import_timestamp | ~ | string | ~ |
| original_qookie_id | ~ | string | ~ |
| original_qookie_slug | ~ | string | ~ |
| partner_companies | ~ | string[] | ~ |
| published_at | ~ | string | ~ |
| quantum_companies | ~ | string[] | ~ |
| quantum_hardware | ~ | string[] | ~ |
| quantum_software | ~ | string[] | ~ |

**Relationships:**

| Junction table | foreignKey | targetKey | Status | Detail |
|---------------|-----------|----------|--------|--------|
| case_study_industry_relations | case_study_id | industry_id | ✅ |  |
| algorithm_case_study_relations | case_study_id | algorithm_id | ✅ |  |
| case_study_persona_relations | case_study_id | persona_id | ✅ |  |
| case_study_quantum_software_relations | case_study_id | quantum_software_id | ✅ |  |
| case_study_quantum_hardware_relations | case_study_id | quantum_hardware_id | ✅ |  |
| case_study_quantum_company_relations | case_study_id | quantum_company_id | ✅ |  |
| case_study_partner_company_relations | case_study_id | partner_company_id | ✅ |  |

## industries (table: `industries`)

| Field | Engine type | DB type | Status |
|-------|------------|---------|--------|
| id | text | string | ✅ |
| published | boolean | boolean | ✅ |
| created_at | text | string | ✅ |
| updated_at | text | string | ✅ |
| name | text | string | ✅ |
| slug | slug | string | ✅ |
| description | textarea | string | ✅ |
| main_content | markdown | string | ✅ |
| deleted_at | ~ | string | ~ |
| deleted_by | ~ | string | ~ |
| is_system_record | ~ | boolean | ~ |
| published_at | ~ | string | ~ |
| sector | ~ | string[] | ~ |
| ts_content | ~ | unknown | ~ |

**Relationships:**

| Junction table | foreignKey | targetKey | Status | Detail |
|---------------|-----------|----------|--------|--------|
| algorithm_industry_relations | industry_id | algorithm_id | ✅ |  |
| case_study_industry_relations | industry_id | case_study_id | ✅ |  |
| persona_industry_relations | industry_id | persona_id | ✅ |  |

## partner-companies (table: `partner_companies`)

| Field | Engine type | DB type | Status |
|-------|------------|---------|--------|
| id | text | string | ✅ |
| published | boolean | boolean | ✅ |
| created_at | text | string | ✅ |
| updated_at | text | string | ✅ |
| name | text | string | ✅ |
| slug | slug | string | ✅ |
| description | textarea | string | ✅ |
| main_content | markdown | string | ✅ |
| industry | text | string | ✅ |
| company_size | text | string | ✅ |
| headquarters | text | string | ✅ |
| partnership_type | text | string | ✅ |
| quantum_initiatives | textarea | string | ✅ |
| website_url | url | string | ⚠️ |
| linkedin_url | url | string | ⚠️ |
| deleted_at | ~ | string | ~ |
| deleted_by | ~ | string | ~ |
| is_system_record | ~ | boolean | ~ |
| published_at | ~ | string | ~ |
| ts_content | ~ | unknown | ~ |

**Relationships:**

| Junction table | foreignKey | targetKey | Status | Detail |
|---------------|-----------|----------|--------|--------|
| case_study_partner_company_relations | partner_company_id | case_study_id | ✅ |  |

## personas (table: `personas`)

| Field | Engine type | DB type | Status |
|-------|------------|---------|--------|
| id | text | string | ✅ |
| published | boolean | boolean | ✅ |
| created_at | text | string | ✅ |
| updated_at | text | string | ✅ |
| name | text | string | ✅ |
| slug | slug | string | ✅ |
| description | textarea | string | ✅ |
| main_content | markdown | string | ✅ |
| recommended_reading | textarea | string | ✅ |
| deleted_at | ~ | string | ~ |
| deleted_by | ~ | string | ~ |
| expertise | ~ | string[] | ~ |
| is_system_record | ~ | boolean | ~ |
| published_at | ~ | string | ~ |
| ts_content | ~ | unknown | ~ |

**Relationships:**

| Junction table | foreignKey | targetKey | Status | Detail |
|---------------|-----------|----------|--------|--------|
| persona_industry_relations | persona_id | industry_id | ✅ |  |
| persona_algorithm_relations | persona_id | algorithm_id | ✅ |  |
| case_study_persona_relations | persona_id | case_study_id | ✅ |  |

## quantum-companies (table: `quantum_companies`)

| Field | Engine type | DB type | Status |
|-------|------------|---------|--------|
| id | text | string | ✅ |
| published | boolean | boolean | ✅ |
| created_at | text | string | ✅ |
| updated_at | text | string | ✅ |
| name | text | string | ✅ |
| slug | slug | string | ✅ |
| description | textarea | string | ✅ |
| main_content | markdown | string | ✅ |
| company_type | text | string | ✅ |
| founded_year | number | number | ✅ |
| headquarters | text | string | ✅ |
| website_url | url | string | ⚠️ |
| linkedin_url | url | string | ⚠️ |
| deleted_at | ~ | string | ~ |
| deleted_by | ~ | string | ~ |
| funding_stage | ~ | string | ~ |
| is_system_record | ~ | boolean | ~ |
| key_partnerships | ~ | string[] | ~ |
| key_products | ~ | string[] | ~ |
| published_at | ~ | string | ~ |
| ts_content | ~ | unknown | ~ |

**Relationships:**

| Junction table | foreignKey | targetKey | Status | Detail |
|---------------|-----------|----------|--------|--------|
| case_study_quantum_company_relations | quantum_company_id | case_study_id | ✅ |  |

## quantum-hardware (table: `quantum_hardware`)

| Field | Engine type | DB type | Status |
|-------|------------|---------|--------|
| id | text | string | ✅ |
| published | boolean | boolean | ✅ |
| created_at | text | string | ✅ |
| updated_at | text | string | ✅ |
| name | text | string | ✅ |
| slug | slug | string | ✅ |
| description | textarea | string | ✅ |
| main_content | markdown | string | ✅ |
| vendor | text | string | ✅ |
| technology_type | text | string | ✅ |
| qubit_count | number | number | ✅ |
| connectivity | text | string | ✅ |
| gate_fidelity | number | number | ✅ |
| coherence_time | text | string | ✅ |
| availability | text | string | ✅ |
| documentation_url | url | string | ⚠️ |
| website_url | url | string | ⚠️ |
| access_model | ~ | string | ~ |
| deleted_at | ~ | string | ~ |
| deleted_by | ~ | string | ~ |
| is_system_record | ~ | boolean | ~ |
| published_at | ~ | string | ~ |
| ts_content | ~ | unknown | ~ |

**Relationships:**

| Junction table | foreignKey | targetKey | Status | Detail |
|---------------|-----------|----------|--------|--------|
| case_study_quantum_hardware_relations | quantum_hardware_id | case_study_id | ✅ |  |

## quantum-software (table: `quantum_software`)

| Field | Engine type | DB type | Status |
|-------|------------|---------|--------|
| id | text | string | ✅ |
| published | boolean | boolean | ✅ |
| created_at | text | string | ✅ |
| updated_at | text | string | ✅ |
| name | text | string | ✅ |
| slug | slug | string | ✅ |
| description | textarea | string | ✅ |
| main_content | markdown | string | ✅ |
| vendor | text | string | ✅ |
| license_type | text | string | ✅ |
| documentation_url | url | string | ⚠️ |
| github_url | url | string | ⚠️ |
| website_url | url | string | ⚠️ |
| pricing_model | text | string | ✅ |
| deleted_at | ~ | string | ~ |
| deleted_by | ~ | string | ~ |
| is_system_record | ~ | boolean | ~ |
| programming_languages | ~ | string[] | ~ |
| published_at | ~ | string | ~ |
| supported_hardware | ~ | string[] | ~ |
| ts_content | ~ | unknown | ~ |

**Relationships:**

| Junction table | foreignKey | targetKey | Status | Detail |
|---------------|-----------|----------|--------|--------|
| case_study_quantum_software_relations | quantum_software_id | case_study_id | ✅ |  |

## Summary

- ✅ Matches: 101
- ❌ Missing from DB: 0 (key: 0, non-key: 12)
- ⚠️ Type mismatches: 12
- ~ Extra DB columns (informational): 61
- ❌ Junction table failures: 0

**Gate result:** FAIL
**Reason:** 12 non-key mismatches exceeds threshold of 3
