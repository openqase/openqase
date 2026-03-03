import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Content for quantum hardware systems
const quantumHardwareContent: Record<string, { 
  content: string; 
  vendor: string;
  technology_type: string;
  qubit_count: number;
}> = {
  'ibm-eagle': {
    vendor: 'IBM',
    technology_type: 'Superconducting',
    qubit_count: 127,
    content: `IBM Eagle represents a significant milestone in IBM's quantum computing roadmap, featuring 127 superconducting qubits arranged in a heavy-hexagonal lattice topology. Announced in 2021, Eagle was IBM's first quantum processor to surpass 100 qubits, demonstrating the company's ability to scale quantum systems while maintaining quality and connectivity.

The Eagle processor employs IBM's advanced superconducting transmon qubit technology, operating at temperatures near absolute zero in dilution refrigerators. Its heavy-hexagonal lattice design optimizes qubit connectivity while minimizing crosstalk, enabling more efficient implementation of quantum algorithms. The processor features improved coherence times and gate fidelities compared to earlier generations, crucial for running deeper quantum circuits required for practical applications.

Eagle's architecture introduces several technical innovations that enable its scale. The processor uses multi-level wiring to provide signals and controls to qubits while protecting them from interference. Through-silicon vias and multi-layer lithography allow for the high density of components needed for 127 qubits. The design also incorporates advanced error mitigation techniques that improve the quality of quantum computations despite the inherent noise in current quantum systems.

The current status of IBM Eagle includes availability through IBM Quantum Network and IBM Cloud, enabling researchers and developers worldwide to access this powerful quantum processor. The system has been used for various applications including quantum simulation, optimization problems, and machine learning experiments. IBM has demonstrated that Eagle can execute quantum circuits that are challenging for classical simulation, marking progress toward quantum advantage.

Eagle's applications span multiple domains where its 127 qubits provide advantages over smaller processors. In quantum chemistry, Eagle enables simulation of larger molecular systems relevant to drug discovery and materials science. For optimization problems, the increased qubit count allows encoding more complex problem instances. In machine learning, Eagle can handle larger feature spaces and datasets. Looking forward, IBM continues to refine Eagle's performance while using insights from its operation to develop even more powerful quantum processors like Condor and Flamingo.`
  },

  'ibm-falcon': {
    vendor: 'IBM',
    technology_type: 'Superconducting',
    qubit_count: 27,
    content: `IBM Falcon represents a pivotal generation in IBM's quantum processor family, featuring 27 superconducting qubits in an innovative layout that balances connectivity with coherence. First deployed in 2019, Falcon processors have become workhorses of IBM's quantum cloud services, providing reliable performance for quantum algorithm development and research.

The Falcon processor utilizes IBM's proven transmon qubit technology with a unique topology that provides improved connectivity compared to earlier linear designs. Each qubit in the Falcon architecture can connect to multiple neighbors, enabling more efficient implementation of two-qubit gates and reducing the circuit depth needed for quantum algorithms. This connectivity pattern was carefully optimized through extensive simulation to minimize crosstalk while maximizing algorithmic efficiency.

Falcon's technical specifications reflect IBM's focus on quality over pure qubit count. The processor achieves median two-qubit gate errors below 1% and coherence times exceeding 100 microseconds, enabling execution of quantum circuits with hundreds of gates. The system includes dedicated readout resonators for each qubit, allowing simultaneous measurement of all qubits with high fidelity. Falcon also implements IBM's pulse-level control, giving researchers fine-grained access to quantum operations.

Currently, multiple Falcon processors are available through IBM Quantum services, making them among the most accessible quantum processors for researchers worldwide. These systems have been extensively used for quantum algorithm development, with thousands of research papers citing results from Falcon processors. The reliability and consistency of Falcon systems have made them preferred platforms for quantum education and training programs globally.

Falcon's applications demonstrate the value of well-engineered medium-scale quantum processors. In quantum chemistry, Falcon has been used to simulate molecular ground states and dynamics. For optimization, its connectivity enables efficient implementation of variational quantum algorithms. In quantum machine learning, Falcon processors have demonstrated quantum kernel methods and feature mapping. The processor continues to serve as a testbed for developing error mitigation techniques and quantum algorithms optimized for near-term quantum hardware.`
  },

  'google-sycamore': {
    vendor: 'Google',
    technology_type: 'Superconducting',
    qubit_count: 70,
    content: `Google Sycamore represents a landmark achievement in quantum computing history, being the processor that first demonstrated quantum supremacy in 2019. With its 53-70 operational qubits (depending on configuration) arranged in a 2D grid, Sycamore completed a specific sampling task in 200 seconds that would take classical supercomputers thousands of years, marking a pivotal moment in the field.

Sycamore's architecture employs Google's superconducting qubit technology with a distinctive 2D grid topology that enables nearest-neighbor coupling. The processor uses tunable couplers between qubits, allowing dynamic control of qubit interactions during computation. This design philosophy prioritizes fast, high-fidelity gates over long-range connectivity, enabling Sycamore to achieve two-qubit gate times of just 12 nanoseconds with fidelities exceeding 99.5%.

The processor's technical innovations include Google's proprietary fabrication techniques that ensure high uniformity across qubits, crucial for scaling to larger systems. Sycamore implements sophisticated calibration routines that continuously optimize gate parameters to maintain performance. The system also features advanced readout techniques that achieve measurement fidelities above 99%, essential for discriminating quantum states accurately.

Sycamore's current status includes continued operation at Google's quantum AI campus in Santa Barbara, where it serves as a platform for advancing quantum algorithms and applications. While not publicly accessible like some competitors' systems, Sycamore continues to be used for groundbreaking research, including demonstrations of time crystals and quantum error correction. Google has also used Sycamore to explore practical applications in quantum simulation and optimization.

The applications of Sycamore extend beyond its historic supremacy demonstration. In condensed matter physics, Sycamore has simulated exotic phases of matter impossible to study classically. For quantum chemistry, it has modeled molecular dynamics and chemical reactions. In optimization, Sycamore has explored quantum approximate optimization algorithms for combinatorial problems. Google continues to use insights from Sycamore to develop next-generation processors aimed at achieving practical quantum advantage in commercially relevant problems.`
  },

  'd-wave-advantage': {
    vendor: 'D-Wave Systems',
    technology_type: 'Quantum Annealing',
    qubit_count: 5760,
    content: `D-Wave Advantage represents the current pinnacle of quantum annealing technology, featuring over 5,000 qubits in a Pegasus topology that provides unprecedented connectivity for solving optimization problems. Launched in 2020, Advantage demonstrates D-Wave's unique approach to quantum computing, focusing on quantum annealing rather than gate-based quantum computation.

The Advantage system's Pegasus architecture connects each qubit to 15 others, a significant improvement over earlier chimera topologies. This enhanced connectivity allows for more efficient embedding of optimization problems, reducing the overhead typically required to map problems onto the quantum processor. The system operates at temperatures below 15 millikelvin, where quantum effects dominate thermal fluctuations, enabling quantum tunneling through energy barriers during the annealing process.

Technically, Advantage implements several innovations that improve solution quality and speed. The processor features lower noise, longer coherence times, and improved qubit yield compared to previous generations. Advanced flux bias control allows precise tuning of the energy landscape during annealing. The system also includes sophisticated error correction techniques specific to quantum annealing, including spin reversal transforms and multiple sampling strategies.

Currently, D-Wave Advantage is accessible through D-Wave's Leap quantum cloud service, making it one of the most accessible quantum computers for solving real-world optimization problems. The system processes millions of problems monthly from users across industries. Advantage has demonstrated quantum speedup for certain optimization problems and has been used in production applications by companies in logistics, finance, and manufacturing.

Advantage's applications focus on complex optimization challenges across industries. In logistics, it optimizes routing and scheduling for delivery services and airlines. For financial services, Advantage handles portfolio optimization and risk analysis. In manufacturing, it solves production scheduling and resource allocation problems. The system excels at quadratic unconstrained binary optimization (QUBO) problems and has been used for machine learning applications including feature selection and training of quantum Boltzmann machines.`
  },

  'ionq-forte': {
    vendor: 'IonQ',
    technology_type: 'Trapped Ion',
    qubit_count: 32,
    content: `IonQ Forte represents the latest generation of IonQ's trapped ion quantum computers, featuring 32 qubits with exceptional fidelity and all-to-all connectivity. Announced in 2022, Forte demonstrates the advantages of trapped ion technology, including identical qubits, long coherence times, and flexible quantum operations that make it ideal for running complex quantum algorithms.

Forte's architecture uses individual ytterbium ions as qubits, confined in a linear Paul trap and manipulated using precisely controlled laser pulses. This approach provides several inherent advantages: qubits are identical atoms, eliminating manufacturing variability; the system operates at room temperature outside the trap region; and any qubit can directly interact with any other qubit, enabling efficient circuit compilation. Forte achieves gate fidelities exceeding 99.8% for single-qubit gates and 99% for two-qubit gates.

The system incorporates IonQ's advanced optical and control systems, including acousto-optic modulators for individual qubit addressing and sophisticated error suppression techniques. Forte features improved vibration isolation and thermal management, enhancing stability and reducing error rates. The processor also implements mid-circuit measurement and conditional logic, capabilities essential for error correction and advanced quantum algorithms.

Forte is currently available through major cloud platforms including AWS, Microsoft Azure, and Google Cloud, making trapped ion quantum computing widely accessible. The system has achieved an algorithmic qubit count of 29, meaning 29 qubits can be used reliably throughout algorithm execution. This metric, which accounts for both quantity and quality of qubits, demonstrates Forte's ability to run meaningful quantum applications.

Applications of IonQ Forte span multiple domains that benefit from its high fidelity and connectivity. In quantum chemistry, Forte simulates molecular systems for drug discovery with higher accuracy than possible on noisier platforms. For machine learning, its all-to-all connectivity enables efficient implementation of quantum neural networks. In optimization, Forte can encode problems more naturally without the embedding overhead required by limited connectivity architectures. The system has been used by pharmaceutical companies for drug discovery and financial institutions for portfolio optimization.`
  },

  'quantinuum-h1': {
    vendor: 'Quantinuum',
    technology_type: 'Trapped Ion',
    qubit_count: 56,
    content: `Quantinuum H1 represents the flagship quantum computer from Quantinuum (formed by merging Honeywell Quantum Solutions and Cambridge Quantum Computing), featuring up to 56 trapped ion qubits in a quantum charge-coupled device (QCCD) architecture. The H1 system has achieved record-breaking quantum volume measurements, demonstrating that quality matters as much as quantity in quantum computing.

The H1 processor employs ytterbium ions in a QCCD architecture that allows ions to be physically transported between different zones for storage, manipulation, and readout. This unique design enables capabilities not possible in fixed-topology systems, including mid-circuit measurement, qubit reuse, and conditional quantum operations. The system achieves exceptional gate fidelities, with two-qubit gates exceeding 99.8% fidelity, contributing to its record quantum volume of over 524,288.

Technical innovations in the H1 include advanced ion transport mechanisms that move qubits without losing quantum information, sophisticated laser control systems for precise quantum operations, and real-time classical computation integrated with quantum execution. The system implements native two-qubit gates between arbitrary pairs of qubits, eliminating swap overhead common in limited-connectivity architectures. H1 also features comprehensive error detection and mitigation capabilities.

Currently, the H1 system is accessible through Quantinuum's cloud platform and has been used for groundbreaking demonstrations including real-time error correction, creation of non-Abelian anyons, and quantum natural language processing. The system's high fidelity and unique capabilities have made it a preferred platform for research requiring the highest quality quantum operations. Commercial customers use H1 for applications in pharmaceuticals, finance, and cybersecurity.

H1's applications leverage its exceptional quality and unique architectural features. In quantum error correction research, H1 has demonstrated logical qubits with lower error rates than physical qubits. For quantum chemistry, the system's high fidelity enables accurate simulation of molecular systems relevant to drug discovery. In cryptography, H1 has been used to demonstrate quantum random number generation and quantum key distribution protocols. The system's ability to perform mid-circuit measurements makes it ideal for variational quantum algorithms and quantum machine learning applications.`
  },

  'rigetti-aspen': {
    vendor: 'Rigetti Computing',
    technology_type: 'Superconducting',
    qubit_count: 80,
    content: `Rigetti Aspen represents Rigetti Computing's flagship quantum processor series, featuring up to 80 superconducting qubits in a scalable architecture designed for practical quantum applications. The Aspen series demonstrates Rigetti's integrated approach to quantum computing, combining custom chip fabrication with sophisticated software tools for quantum development.

Aspen processors utilize Rigetti's proprietary superconducting qubit technology manufactured in their dedicated fab facility, one of the few commercial quantum chip fabrication facilities worldwide. The architecture emphasizes fast gate operations and modular design, allowing for rapid iteration and customization. Aspen's octagonal unit cell topology provides a balance between connectivity and isolation, reducing crosstalk while enabling efficient quantum algorithms.

The processor incorporates several technical advances including parametrically activated two-qubit gates that achieve high fidelity with minimal crosstalk, active reset capabilities that reduce circuit execution time, and advanced packaging techniques that minimize environmental noise. Aspen processors feature some of the fastest gate times in the industry, with two-qubit gates completing in under 200 nanoseconds, enabling deeper circuits before decoherence.

Currently, Aspen processors are accessible through Rigetti's Quantum Cloud Services (QCS), providing low-latency access to quantum hardware. The system is integrated with Rigetti's software stack including PyQuil and the Quil quantum instruction language. Aspen has been used for various applications including drug discovery collaborations with pharmaceutical companies and optimization problems in finance and logistics.

Aspen's applications benefit from its speed and integration with classical computing resources. In variational quantum algorithms, Aspen's fast gates enable more iterations within coherence times, improving optimization convergence. For quantum machine learning, the processor has demonstrated quantum feature mapping and kernel methods. In quantum simulation, Aspen has modeled condensed matter systems and molecular dynamics. Rigetti continues to refine Aspen while developing next-generation multi-chip quantum processors that scale beyond single-chip limitations.`
  },

  'xanadu-borealis': {
    vendor: 'Xanadu',
    technology_type: 'Photonic',
    qubit_count: 216,
    content: `Xanadu Borealis represents a breakthrough in photonic quantum computing, featuring 216 squeezed-state qubits that demonstrated quantum computational advantage in 2022. As one of the largest photonic quantum computers, Borealis showcases the unique advantages of using light for quantum computation, including room-temperature operation and natural connectivity for certain algorithms.

Borealis employs time-domain multiplexing where qubits are encoded in sequential pulses of squeezed light traveling through a network of beam splitters and delay lines. This architecture allows for a large number of qubits without the scaling challenges of spatial approaches. The system uses advanced silicon photonic chips for generating, manipulating, and detecting quantum states of light, leveraging mature semiconductor fabrication technology.

Technical innovations in Borealis include high-efficiency squeezed light sources that generate quantum states with low noise, programmable interferometer networks that implement quantum gates, and superconducting nanowire single-photon detectors for high-fidelity measurement. The system achieves impressive specifications including squeezing levels exceeding 10 dB and detector efficiencies above 90%, crucial for demonstrating quantum advantage.

Borealis is currently accessible through Xanadu Cloud, making large-scale photonic quantum computing available to researchers worldwide. The system has been used to demonstrate Gaussian boson sampling at scales intractable for classical computers, validating photonic approaches to quantum advantage. Researchers have explored applications in graph optimization, molecular simulation, and quantum machine learning on the platform.

Applications of Borealis leverage the unique properties of photonic quantum computing. In graph theory, Borealis excels at problems naturally mapped to boson sampling, including finding dense subgraphs and calculating hafnians. For quantum chemistry, the system simulates vibronic spectra of molecules, important for understanding photochemical processes. In machine learning, Borealis has demonstrated quantum advantages in certain kernel methods. The platform continues to evolve with improvements in programmability and the development of fault-tolerant photonic quantum computing architectures.`
  },

  'quera-aquila': {
    vendor: 'QuEra Computing',
    technology_type: 'Neutral Atom',
    qubit_count: 256,
    content: `QuEra Aquila represents a leading neutral atom quantum computer, featuring up to 256 qubits arranged in programmable arrays. Available through Amazon Braket since 2022, Aquila demonstrates the rapid progress in neutral atom quantum computing, offering unique capabilities for analog quantum simulation and optimization problems with geometric constraints.

Aquila uses individual rubidium atoms trapped by optical tweezers in programmable 2D arrays. This architecture allows users to arrange atoms in arbitrary patterns, directly encoding problem geometry into the hardware. The system operates as an analog quantum simulator, where the Rydberg blockade mechanism creates natural interactions between atoms, making it particularly well-suited for solving maximum independent set problems and simulating quantum many-body physics.

The processor's technical specifications include the ability to position atoms with sub-micrometer precision, coherence times exceeding several microseconds, and global control of quantum evolution through laser parameters. Aquila implements analog Hamiltonian evolution rather than discrete gates, allowing continuous-time quantum computation. The system can also operate in a digital mode, implementing universal quantum gates through careful control of Rydberg interactions.

Currently accessible through AWS Braket, Aquila provides researchers and developers with access to one of the largest publicly available quantum processors. The system has been used for various research applications, demonstrating quantum simulation capabilities that are challenging for classical computers. QuEra continues to enhance Aquila's capabilities, working toward fault-tolerant quantum computation with neutral atoms.

Aquila's applications leverage its unique analog computing capabilities and geometric flexibility. In optimization, the system naturally solves maximum independent set problems relevant to network design and resource allocation. For quantum simulation, Aquila studies phase transitions and quantum dynamics in many-body systems. In drug discovery, researchers use Aquila to model protein folding and molecular interactions. The platform has also demonstrated machine learning applications including quantum reservoir computing and optimization of neural network architectures.`
  },

  'ibm-condor': {
    vendor: 'IBM',
    technology_type: 'Superconducting',
    qubit_count: 1121,
    content: `IBM Condor represents a major milestone in quantum computing scalability, featuring 1,121 superconducting qubits in a single processor. Announced in 2023, Condor demonstrates IBM's ability to scale quantum systems beyond 1,000 qubits while maintaining the control and quality necessary for quantum computation, marking progress toward utility-scale quantum computing.

Condor employs IBM's advanced superconducting transmon qubit technology arranged in a heavy-hexagonal lattice that has proven successful in smaller processors. The architecture required breakthrough innovations in chip design, including novel cross-resonance gate implementations that maintain high fidelity at scale, advanced packaging techniques to route thousands of control signals, and sophisticated calibration procedures to optimize performance across all qubits.

Technical achievements in Condor include maintaining median two-qubit gate errors comparable to smaller processors despite the increased scale, implementing parallel gate operations to reduce circuit execution time, and developing scalable error mitigation techniques essential for useful computation. The processor demonstrates that the engineering challenges of thousand-qubit systems can be overcome, paving the way for even larger quantum computers.

While Condor serves primarily as a development platform for IBM's quantum roadmap rather than a production system, it provides crucial insights for building utility-scale quantum computers. The processor validates architectural choices and engineering solutions that will be refined in future systems. IBM uses Condor to explore the boundaries of classical simulation and identify applications where large qubit counts provide advantages.

Condor's significance lies not just in its size but in what it represents for the future of quantum computing. The processor demonstrates that quantum systems can scale to sizes where classical simulation becomes impractical, opening possibilities for quantum advantage in real-world applications. Research with Condor focuses on understanding how to leverage thousand-qubit systems effectively, developing algorithms that can utilize large numbers of noisy qubits, and identifying the path toward error-corrected quantum computation at scale.`
  },

  'atom-computing-phoenix': {
    vendor: 'Atom Computing',
    technology_type: 'Neutral Atom',
    qubit_count: 100,
    content: `Atom Computing Phoenix represents the company's first-generation neutral atom quantum computer, featuring 100 qubits with exceptional coherence times exceeding one second. Unveiled in 2021, Phoenix demonstrates the potential of neutral atom technology for building scalable quantum computers with naturally long-lived qubits.

Phoenix uses strontium atoms individually trapped in a 2D array of optical tweezers created by focused laser beams. This approach provides several advantages: neutral atoms are naturally identical, eliminating qubit variability; the atoms can be packed densely in regular arrays; and wireless control via laser pulses simplifies scaling. Phoenix achieves coherence times among the longest in the industry, crucial for running deep quantum circuits.

The system's technical innovations include precise optical tweezer arrays that trap and manipulate individual atoms, advanced imaging systems that track atom positions in real-time, and sophisticated laser control for implementing quantum gates. Phoenix uses nuclear spins of strontium-87 atoms as qubits, providing natural isolation from environmental noise. The architecture supports mid-circuit measurement and qubit reuse, important for error correction.

Phoenix serves as Atom Computing's development platform as they work toward larger commercial systems. The company has announced plans for second-generation systems with over 1,000 qubits, building on lessons learned from Phoenix. The long coherence times demonstrated by Phoenix validate neutral atom approaches for fault-tolerant quantum computing.

Applications being explored on Phoenix leverage its long coherence times and scalable architecture. In quantum simulation, the system models many-body quantum systems relevant to materials science. For optimization problems, Phoenix's regular array structure naturally maps to grid-based problems. In quantum error correction research, the long coherence times enable testing of error correction codes. Atom Computing continues developing Phoenix technology toward commercial quantum computing applications in pharmaceuticals, finance, and logistics.`
  },

  'pasqal-fresnel': {
    vendor: 'Pasqal',
    technology_type: 'Neutral Atom',
    qubit_count: 100,
    content: `Pasqal Fresnel represents the company's commercial neutral atom quantum processor, featuring up to 100 qubits arranged in flexible 2D and 3D configurations. Named after the French physicist Augustin-Jean Fresnel, this processor exemplifies Pasqal's approach to quantum computing using arrays of neutral atoms for both analog and digital quantum computation.

Fresnel employs rubidium atoms trapped in optical tweezers with the unique ability to arrange atoms in arbitrary geometries. This flexibility allows direct encoding of problem structure into hardware, particularly advantageous for optimization problems with geometric constraints. The system can operate in analog mode, simulating continuous quantum evolution, or digital mode, implementing discrete quantum gates through Rydberg interactions.

Technical features of Fresnel include precise atom positioning with sub-micrometer accuracy, coherent control of Rydberg states for implementing quantum operations, and the ability to create three-dimensional qubit arrangements. The processor achieves strong interactions between atoms separated by several micrometers through Rydberg blockade, enabling implementation of multi-qubit gates. Fresnel also supports parameter sweeps and variational algorithms through rapid reconfiguration.

Currently, Fresnel processors are being deployed to customers through Pasqal's cloud platform and on-premises installations. The system has been used by enterprises including BMW, BASF, and EDF for proof-of-concept projects. Pasqal continues to enhance Fresnel's capabilities while developing next-generation processors with increased qubit counts and improved gate fidelities.

Fresnel's applications capitalize on its geometric flexibility and analog computing capabilities. In quantum simulation, the processor models magnetic materials and strongly correlated systems. For optimization, Fresnel solves graph problems where the atomic arrangement represents the problem structure. In machine learning, the system implements quantum graph neural networks. Industrial applications include optimizing smart charging schedules for electric vehicles and simulating new materials for batteries and catalysts.`
  }
};

// Function to update hardware with content
async function updateQuantumHardware() {
  console.log('Starting to update quantum hardware with content...');

  for (const [slug, data] of Object.entries(quantumHardwareContent)) {
    try {
      const { error } = await supabase
        .from('quantum_hardware')
        .update({ 
          main_content: data.content,
          vendor: data.vendor,
          technology_type: data.technology_type,
          qubit_count: data.qubit_count,
          updated_at: new Date().toISOString()
        })
        .eq('slug', slug);

      if (error) {
        console.error(`Error updating ${slug}:`, error);
      } else {
        console.log(`✓ Updated content for ${slug} (${data.vendor} - ${data.technology_type})`);
      }
    } catch (error) {
      console.error(`Failed to update ${slug}:`, error);
    }
  }

  console.log('Completed updating quantum hardware!');
}

// Run the update
updateQuantumHardware().catch(console.error);