import { createClient } from '@supabase/supabase-js';

// Use environment variables - defaults to local Supabase for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface QuantumCompany {
  id: string;
  name: string;
  slug: string;
}

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  main_content: string | null;
}

// Keywords to match for each company
const companyKeywords: Record<string, string[]> = {
  '1QBit': ['1qbit', '1-qbit'],
  'IBM': ['ibm'],
  'IBM Quantum': ['ibm quantum'],
  'Google Quantum AI': ['google', 'google quantum'],
  'D-Wave': ['d-wave', 'dwave'],
  'IonQ': ['ionq'],
  'Rigetti Computing': ['rigetti'],
  'Microsoft': ['microsoft', 'azure quantum'],
  'Amazon': ['amazon', 'aws', 'braket'],
  'Honeywell Quantum Solutions': ['honeywell'],
  'Quantinuum': ['quantinuum'],
  'Pasqal': ['pasqal'],
  'Xanadu': ['xanadu'],
  'Classiq': ['classiq'],
  'QC Ware': ['qc ware', 'qcware'],
  'Zapata': ['zapata'],
  'Zapata Computing': ['zapata computing'],
  'Cambridge Quantum Computing': ['cambridge quantum', 'cqc'],
  'Haiqu': ['haiqu'],
  'QuEra': ['quera'],
  'Nord Quantique': ['nord quantique'],
  'Quantum Brilliance': ['quantum brilliance'],
  'SandboxAQ': ['sandboxaq', 'sandbox aq'],
  'Qilimanjaro': ['qilimanjaro'],
  'Q-CTRL': ['q-ctrl', 'qctrl'],
  'ATOS': ['atos'],
  'Qrypt': ['qrypt'],
  // New companies
  'IQM Quantum Computers': ['iqm'],
  'Atom Computing': ['atom computing'],
  'Alibaba Quantum Computing Lab': ['alibaba'],
  'Intel': ['intel'],
  'Fujitsu': ['fujitsu'],
  'PsiQuantum': ['psiquantum'],
  'ID Quantique': ['id quantique'],
  'LightSolver': ['lightsolver'],
  'Nu Quantum': ['nu quantum'],
  'Oxford Ionics': ['oxford ionics'],
  'Silicon Quantum Computing': ['silicon quantum computing', 'sqc'],
  'HQS Quantum Simulations': ['hqs'],
  'QuantX Labs': ['quantx'],
  'Eviden': ['eviden'],
  'Quanscient': ['quanscient'],
};

async function matchCompanies() {
  // Get quantum companies
  const { data: companies, error: companyError } = await supabase
    .from('quantum_companies')
    .select('id, name, slug');

  if (companyError || !companies) {
    console.error('Error fetching companies:', companyError);
    return;
  }

  // Get draft case studies without quantum company relations
  const { data: drafts, error: draftError } = await supabase
    .from('case_studies')
    .select('id, title, slug, main_content')
    .eq('published', false)
    .is('deleted_at', null);

  if (draftError || !drafts) {
    console.error('Error fetching drafts:', draftError);
    return;
  }

  // Get existing relations
  const { data: existingRelations } = await supabase
    .from('case_study_quantum_company_relations')
    .select('case_study_id');

  const hasRelation = new Set(existingRelations?.map(r => r.case_study_id) || []);

  // Filter to drafts without quantum company relations
  const draftsWithoutQC = drafts.filter(d => !hasRelation.has(d.id));

  console.log(`\n=== MATCHING QUANTUM COMPANIES TO ${draftsWithoutQC.length} DRAFTS ===\n`);

  const matches: { caseStudyId: string; caseStudyTitle: string; companyId: string; companyName: string; matchType: string }[] = [];

  for (const draft of draftsWithoutQC) {
    const titleLower = draft.title.toLowerCase();
    const contentLower = (draft.main_content || '').toLowerCase();

    for (const company of companies) {
      const keywords = companyKeywords[company.name] || [company.name.toLowerCase()];

      for (const keyword of keywords) {
        // Check if keyword appears in title (stronger match)
        if (titleLower.includes(keyword)) {
          matches.push({
            caseStudyId: draft.id,
            caseStudyTitle: draft.title,
            companyId: company.id,
            companyName: company.name,
            matchType: 'title'
          });
          break;
        }
      }
    }
  }

  // Group by case study
  const matchesByCaseStudy = new Map<string, typeof matches>();
  for (const match of matches) {
    const existing = matchesByCaseStudy.get(match.caseStudyId) || [];
    existing.push(match);
    matchesByCaseStudy.set(match.caseStudyId, existing);
  }

  console.log('Matches found:\n');

  let totalMatches = 0;
  for (const [caseStudyId, caseMatches] of matchesByCaseStudy) {
    const title = caseMatches[0].caseStudyTitle;
    const companies = caseMatches.map(m => m.companyName).join(', ');
    console.log(`${title}`);
    console.log(`  -> ${companies}`);
    console.log('');
    totalMatches++;
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Drafts matched: ${totalMatches}/${draftsWithoutQC.length}`);
  console.log(`Drafts still unmatched: ${draftsWithoutQC.length - totalMatches}`);

  // Show unmatched drafts
  const matchedIds = new Set(matches.map(m => m.caseStudyId));
  const unmatched = draftsWithoutQC.filter(d => !matchedIds.has(d.id));

  if (unmatched.length > 0) {
    console.log('\n=== UNMATCHED DRAFTS ===');
    unmatched.forEach(d => {
      console.log(`- ${d.title}`);
    });
  }

  // Generate SQL to insert relations
  if (matches.length > 0) {
    console.log('\n=== SQL TO INSERT RELATIONS ===\n');
    console.log('INSERT INTO case_study_quantum_company_relations (case_study_id, quantum_company_id) VALUES');

    const uniqueMatches = new Map<string, { csId: string; qcId: string }>();
    for (const m of matches) {
      const key = `${m.caseStudyId}-${m.companyId}`;
      uniqueMatches.set(key, { csId: m.caseStudyId, qcId: m.companyId });
    }

    const values = Array.from(uniqueMatches.values())
      .map(m => `  ('${m.csId}', '${m.qcId}')`)
      .join(',\n');

    console.log(values + ';');
  }
}

matchCompanies();
