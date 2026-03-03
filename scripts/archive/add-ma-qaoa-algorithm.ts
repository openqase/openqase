/**
 * Script to add Multi-Angle Quantum Approximate Optimization Algorithm (MA-QAOA)
 * to the algorithms table
 *
 * Run with: npx tsx scripts/add-ma-qaoa-algorithm.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const algorithm = {
  name: 'Multi-Angle Quantum Approximate Optimization Algorithm (MA-QAOA)',
  slug: 'ma-qaoa',
  description: 'A variant of the Quantum Approximate Optimization Algorithm (QAOA) that uses multiple independent parameters per quantum gate, enabling shallower circuits and improved approximation ratios for optimization problems on near-term quantum devices.',
  main_content: `## Overview

The Multi-Angle Quantum Approximate Optimization Algorithm (MA-QAOA) represents a significant advancement over the standard QAOA by introducing finer-grained control over quantum circuit parameters. While traditional QAOA uses a single parameter to control entire blocks of gates (mixer or Hamiltonian blocks), MA-QAOA assigns a unique parameter to each quantum gate. This seemingly simple change leads to profound improvements in both circuit depth and solution quality.

The algorithm was specifically designed to overcome limitations of near-term quantum devices, particularly ion-trap quantum processing units (QPUs), which benefit from reduced two-qubit gate counts and shallower circuit depths.

## Key Features

### Reduced Circuit Depth

One of MA-QAOA's most significant advantages is its ability to achieve comparable or superior results with dramatically fewer circuit layers:

- **One MA-QAOA layer ≈ Three traditional QAOA layers** for MaxCut problems
- Enables execution on noisy intermediate-scale quantum (NISQ) devices with limited coherence times
- Many optimized parameters converge to zero, allowing removal of associated gates for further simplification

### Improved Approximation Ratio

Empirical studies demonstrate substantial performance improvements:

- **33% increase in approximation ratio** for an infinite family of MaxCut instances compared to standard QAOA
- Superior performance on graphs with 50-100 vertices at equivalent circuit depths
- More efficient exploration of the solution space through independent parameter control

### Efficient Parameter Optimization

Despite the increased number of parameters:

- Good parameters can be found in **polynomial time** using classical optimization
- Parameter optimization remains tractable even as problem size grows
- Standard gradient-based methods work effectively

## Technical Details

### Algorithm Structure

MA-QAOA modifies the standard QAOA ansatz by replacing global parameters with gate-specific parameters:

**Standard QAOA:** Uses parameters (γ, β) to control entire layers

**MA-QAOA:** Uses independent parameters for each gate operation, with each gate having its own angle θᵢ, allowing fine-grained control.

### Parameter Space

- **Classical parameters:** Scales with number of gates in the circuit
- **Quantum operations:** Each gate independently optimized
- **Optimization landscape:** Generally smooth and amenable to gradient descent

### Circuit Optimization

The algorithm includes a post-optimization simplification phase:

1. Optimize all parameters using classical optimization (e.g., gradient descent, COBYLA)
2. Identify parameters that converge to zero or near-zero values
3. Remove corresponding quantum gates from the circuit
4. Results in even shallower final circuits

## Applications

### Combinatorial Optimization

MA-QAOA excels at solving hard optimization problems:

- **MaxCut Problems:** Finding maximum cuts in graphs
- **Graph Coloring:** Partitioning vertices with minimal edge conflicts
- **Constraint Satisfaction:** Problems with complex inequality constraints

### Aircraft Loading Optimization

A notable real-world application demonstrated on IonQ hardware:

- **Problem:** Optimize cargo distribution for aircraft weight and balance
- **Hardware:** IonQ Aria and Forte quantum processors
- **Problem sizes:** 12 to 28 qubits
- **Results:** Optimal solutions found for all instances tested
- **Innovation:** Novel cost function handles inequality constraints without slack variables

### Near-Term Quantum Advantage

The algorithm specifically targets problems where:

- Quantum devices have limited qubit counts (10-100 qubits)
- Circuit depth is constrained by decoherence
- Two-qubit gate fidelity limits overall performance

## Performance Characteristics

### Complexity

- **Classical optimization:** Polynomial time for parameter finding
- **Quantum execution:** Scales with problem size and desired approximation ratio
- **Circuit depth:** O(p) where p is number of layers (typically 1-3 for MA-QAOA vs 3-9 for QAOA)

### Hardware Requirements

- **Qubit count:** Scales with problem size (typically 10-100 qubits for NISQ applications)
- **Gate fidelity:** Benefits significantly from high-fidelity two-qubit gates
- **Coherence time:** Reduced requirements due to shallower circuits
- **Connectivity:** Works with both all-to-all and limited connectivity topologies

### Scalability

- Demonstrated on problems up to 100 vertices
- Expected to scale to larger problems as quantum hardware improves
- Robust across varying initial conditions and constraint formulations

## Comparison to Standard QAOA

| Feature | Standard QAOA | MA-QAOA |
|---------|---------------|---------|
| **Parameters per layer** | 2 (γ, β) | O(number of gates) |
| **Circuit depth** | Deeper (3-9 layers typical) | Shallower (1-3 layers typical) |
| **Approximation ratio** | Baseline | +33% for MaxCut |
| **Parameter optimization** | Faster (fewer parameters) | Slower but still polynomial |
| **NISQ suitability** | Good | Excellent |
| **Gate count** | Higher | Lower (after optimization) |

## Industry Adoption

### IonQ

- Successfully demonstrated on **Aria** and **Forte** trapped-ion systems
- Aircraft loading optimization achieving optimal solutions
- Problem sizes: 12-28 qubits

### Research Applications

- Graph optimization problems
- Logistics and scheduling
- Constraint satisfaction problems
- Computational chemistry (molecular optimization)

## Related Algorithms

- **QAOA (Quantum Approximate Optimization Algorithm):** The foundation algorithm
- **VQE (Variational Quantum Eigensolver):** Shares variational approach
- **ADAPT-VQE:** Similar adaptive parameter selection strategy
- **Quantum Annealing:** Alternative approach to optimization problems

## Academic References

- **Original paper:** Herrman, R., et al. "Multi-angle Quantum Approximate Optimization Algorithm." [arXiv:2109.11455](https://arxiv.org/abs/2109.11455) (2021)
- **Aircraft loading application:** "Quantum Computing for Optimizing Aircraft Loading." [arXiv:2504.01567](https://arxiv.org/abs/2504.01567) (2025)
- **Tutorial:** Cerezo, M., et al. "Variational Quantum Algorithms." Nature Reviews Physics 3, 625-644 (2021)

## Future Directions

- **Automated parameter initialization:** Learning good starting parameters from problem structure
- **Hybrid classical-quantum optimization:** Better integration of classical preprocessing
- **Hardware-aware compilation:** Tailoring circuits to specific quantum processors
- **Application expansion:** Extending to broader classes of optimization problems

## Implementation Resources

While MA-QAOA is a cutting-edge technique, implementations exist in:

- Research codebases (typically Python with Qiskit, Cirq, or other quantum frameworks)
- IonQ's custom implementations for their hardware
- Academic research groups specializing in variational quantum algorithms

The algorithm represents an important step toward practical quantum advantage for optimization problems on near-term quantum devices.`,
  published: true,
  year: 2021, // Year of original publication
};

async function main() {
  console.log('🚀 Adding MA-QAOA algorithm to database...\n');

  // Check if algorithm already exists
  const { data: existing, error: checkError } = await supabase
    .from('algorithms')
    .select('id, name, slug')
    .eq('slug', algorithm.slug)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('❌ Error checking for existing algorithm:', checkError);
    process.exit(1);
  }

  if (existing) {
    console.log(`⚠️  Algorithm already exists: ${existing.name} (${existing.slug})`);
    console.log(`   ID: ${existing.id}`);
    console.log('\nUpdate it manually in the admin interface if needed.');
    process.exit(0);
  }

  // Insert the algorithm
  const { data, error } = await supabase
    .from('algorithms')
    .insert([algorithm])
    .select()
    .single();

  if (error) {
    console.error('❌ Error inserting algorithm:', error);
    process.exit(1);
  }

  console.log('✅ Successfully added algorithm:');
  console.log(`   Name: ${data.name}`);
  console.log(`   Slug: ${data.slug}`);
  console.log(`   ID: ${data.id}`);
  console.log(`   Published: ${data.published}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Link this algorithm to relevant case studies in the admin interface');
  console.log('   2. Verify the content displays correctly at /algorithm/ma-qaoa');
  console.log('   3. Add any missing relationships (quantum companies, hardware, software)');
}

main()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
