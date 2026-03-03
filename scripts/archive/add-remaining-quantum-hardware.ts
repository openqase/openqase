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

// Content for remaining quantum hardware systems
const remainingHardwareContent: Record<string, { 
  content: string; 
  vendor: string;
  technology_type: string;
  qubit_count?: number;
}> = {
  'ibm-q-system-one': {
    vendor: 'IBM',
    technology_type: 'Superconducting',
    qubit_count: 20,
    content: `IBM Q System One represents a historic milestone as the world's first integrated quantum computing system designed for commercial use outside a research lab. Unveiled in 2019, this groundbreaking system combines quantum hardware, classical computing, and sophisticated software in a sealed, stable environment, demonstrating that quantum computers could move beyond laboratory settings into commercial environments.

The System One's architecture emphasizes stability and reliability through its innovative design. Housed in a 9-foot sealed glass cube, the system maintains the precise environmental conditions necessary for quantum computation. The integrated dilution refrigerator, control electronics, and quantum processor work together in a carefully engineered package that minimizes vibration and electromagnetic interference. This design philosophy prioritizes consistent performance and uptime, essential for commercial quantum computing applications.

System One employs IBM's 20-qubit Falcon processor, chosen for its balance of capability and stability. The system achieves quantum volumes that enable meaningful algorithm exploration while maintaining the reliability needed for continuous operation. The integrated classical computing infrastructure handles compilation, optimization, and post-processing, providing a complete quantum computing solution. System One's modular design allows for processor upgrades while maintaining the overall system architecture.

IBM Q System One installations operate at select locations worldwide, including IBM facilities and partner institutions. These systems provide dedicated quantum computing resources for research and development, enabling exclusive access for time-sensitive applications. The platform has been used for various applications including drug discovery, financial modeling, and materials science research. Organizations value System One for its reliability and the prestige of having on-premises quantum computing capability.

The significance of IBM Q System One extends beyond its technical specifications to its symbolic importance in quantum computing's commercialization. It demonstrated that quantum computers could be packaged as products rather than experiments, paving the way for broader commercial adoption. System One's influence on quantum computer design is evident in subsequent commercial quantum systems. As quantum computing matures, System One remains an important milestone in the journey from laboratory curiosity to commercial technology.`
  },

  'ibm-quantum-system-one': {
    vendor: 'IBM',
    technology_type: 'Superconducting',
    qubit_count: 27,
    content: `IBM Quantum System One (second generation) represents the evolution of IBM's commercial quantum computing platform, featuring upgraded processors and improved system integration. Building on the success of the original System One, this iteration incorporates lessons learned from commercial deployments while advancing the hardware and software capabilities to meet growing demands for quantum computing resources.

The enhanced System One architecture maintains the iconic design while incorporating significant technical improvements. The system now supports IBM's 27-qubit Falcon processors, providing increased quantum volume and improved error rates. Advanced vibration isolation and electromagnetic shielding further enhance qubit coherence times. The upgraded control systems enable faster gate operations and more precise qubit control. These improvements result in deeper quantum circuits and more reliable quantum computations.

Technical innovations in the latest System One include improved cryogenic systems with better temperature stability, enhanced microwave control for reduced crosstalk between qubits, and upgraded classical computing infrastructure for faster compilation. The system implements IBM's latest error mitigation techniques, improving the quality of quantum computations. Real-time calibration maintains optimal performance across extended operational periods, crucial for commercial deployments.

Current deployments of the upgraded System One serve major institutions and enterprises worldwide, including installations in Japan, Germany, and the United States. These systems support critical research in quantum algorithms, drug discovery, and materials science. The platform's reliability enables multi-user environments where researchers can schedule dedicated time for experiments. Organizations use System One for both research and proof-of-concept commercial applications.

IBM Quantum System One continues to evolve as a cornerstone of IBM's quantum strategy, bridging cloud-based quantum services with dedicated on-premises installations. Its success has validated the commercial quantum computing model and influenced industry standards for quantum system design. As IBM advances toward larger quantum processors, System One's architecture provides a proven platform for delivering quantum computing capabilities to commercial customers.`
  },

  'ibm-quantum-osprey': {
    vendor: 'IBM',
    technology_type: 'Superconducting',
    qubit_count: 433,
    content: `IBM Osprey represents a significant scaling achievement in IBM's quantum processor roadmap, featuring 433 superconducting qubits that more than triple the qubit count of its predecessor, Eagle. Announced in 2022, Osprey demonstrates IBM's progress toward building quantum computers capable of solving problems beyond the reach of classical simulation, marking another step toward practical quantum advantage.

Osprey's architecture builds upon the innovations introduced in Eagle while addressing the challenges of scaling to over 400 qubits. The processor maintains IBM's heavy-hexagonal lattice topology, optimized for error suppression and efficient quantum algorithm implementation. Multi-level wiring and through-silicon vias enable the complex connectivity required for 433 qubits while maintaining signal integrity. The design incorporates improved isolation between qubits, reducing unwanted interactions that become more problematic at larger scales.

Technical achievements in Osprey include maintaining gate fidelities comparable to smaller processors despite the increased scale, implementing advanced crosstalk suppression techniques crucial for multi-qubit operations, and developing new calibration procedures that can optimize hundreds of qubits efficiently. The processor benefits from IBM's continuous improvements in fabrication processes, achieving better qubit uniformity across the large chip. Osprey also implements hardware features designed to support future error correction schemes.

Osprey processors are accessible through IBM Quantum Network and cloud services, enabling researchers to explore algorithms that leverage the increased qubit count. The system has been used for quantum simulation of complex molecular systems, optimization problems with larger solution spaces, and machine learning applications with expanded feature dimensions. Researchers are particularly interested in finding the crossover point where quantum computers outperform classical simulation.

The development of Osprey represents more than just increased qubit count; it validates IBM's approach to scaling quantum processors while maintaining quality. The processor serves as a testbed for techniques that will be essential for even larger systems like Condor. Osprey's operation provides valuable data on noise scaling, error propagation, and control challenges in large quantum processors. As IBM continues toward fault-tolerant quantum computing, Osprey marks an important milestone in the journey from hundreds to thousands of qubits.`
  },

  'ibm-quantum-eagle': {
    vendor: 'IBM',
    technology_type: 'Superconducting',
    qubit_count: 127,
    content: `IBM Quantum Eagle represents a duplicate entry for IBM Eagle processor, which has already been covered. This 127-qubit processor was IBM's breakthrough into triple-digit qubit counts, demonstrating advanced packaging and control technologies that enable scaling beyond 100 qubits while maintaining quantum coherence and gate fidelity necessary for meaningful quantum computations.`
  },

  'ibm-quantum-falcon': {
    vendor: 'IBM',
    technology_type: 'Superconducting',
    qubit_count: 27,
    content: `IBM Quantum Falcon represents a duplicate entry for IBM's Falcon processor series, already covered extensively. These 27-qubit processors serve as workhorses of IBM's quantum cloud services, providing reliable performance with optimized connectivity patterns that balance coherence with gate efficiency for practical quantum algorithm implementation.`
  },

  'ibm-hummingbird': {
    vendor: 'IBM',
    technology_type: 'Superconducting',
    qubit_count: 65,
    content: `IBM Hummingbird represents an important intermediate step in IBM's quantum processor evolution, featuring 65 superconducting qubits in a heavy-hexagonal lattice topology. Released in 2020, Hummingbird demonstrated IBM's ability to scale beyond small processors while maintaining the quality necessary for quantum algorithm development and testing.

Hummingbird's architecture introduced several innovations that would become standard in larger IBM processors. The heavy-hexagonal lattice provides each qubit with connections to three neighbors, balancing connectivity with isolation. This topology proves particularly effective for implementing quantum error correction codes and variational algorithms. The processor's design optimizes for reduced crosstalk while maintaining fast gate operations, crucial for algorithm performance.

Technical specifications of Hummingbird include median two-qubit gate errors below 1%, coherence times exceeding 100 microseconds, and readout fidelities above 97%. The processor implements IBM's cross-resonance gates, enabling high-fidelity two-qubit operations. Hummingbird benefits from improved fabrication techniques that ensure better qubit uniformity across the chip. The system includes dedicated readout resonators and Purcell filters to enhance measurement fidelity.

Hummingbird processors have been deployed across IBM Quantum Network, providing researchers with access to medium-scale quantum resources. These systems have been extensively used for variational quantum algorithm research, quantum machine learning experiments, and quantum chemistry simulations. The 65-qubit scale enables exploration of problems that strain classical simulation while remaining manageable for near-term quantum hardware.

The legacy of Hummingbird lies in its role as a stepping stone between small educational processors and large-scale systems like Eagle. It provided valuable insights into scaling challenges, control requirements, and error characteristics of medium-scale quantum processors. Hummingbird's successful operation validated IBM's heavy-hexagonal architecture and influenced the design of subsequent quantum processors.`
  },

  'd-wave-2000q': {
    vendor: 'D-Wave Systems',
    technology_type: 'Quantum Annealing',
    qubit_count: 2048,
    content: `D-Wave 2000Q represents a major milestone in quantum annealing technology, featuring approximately 2,000 qubits in a chimera topology. Released in 2017, the 2000Q system demonstrated D-Wave's ability to scale quantum annealing processors to thousands of qubits, enabling solution of larger and more complex optimization problems than previously possible.

The 2000Q's architecture employs D-Wave's chimera topology, where qubits are arranged in unit cells of eight qubits with specific connectivity patterns. This design balances the need for qubit connectivity with the practical constraints of fabrication and control. The system operates at temperatures near 15 millikelvin, where thermal fluctuations are minimized and quantum effects dominate. Advanced flux bias control allows precise programming of problem Hamiltonians onto the quantum processor.

Technical innovations in the 2000Q include improved qubit coherence times compared to earlier generations, reduced noise through better isolation and shielding, and enhanced control systems for more accurate problem embedding. The processor implements various annealing schedules, allowing optimization for different problem types. The 2000Q also introduced features like reverse annealing, enabling exploration of solution landscapes around known good solutions.

D-Wave 2000Q systems have been deployed at major institutions including NASA, Los Alamos National Laboratory, and Volkswagen. These installations have enabled research in optimization, machine learning, and materials science. The system has been used for practical applications including traffic flow optimization, financial portfolio optimization, and drug discovery. Many early demonstrations of quantum annealing applications were performed on 2000Q systems.

The 2000Q's significance extends beyond its technical capabilities to its role in establishing quantum annealing as a viable approach to quantum computing. It provided the first platform where quantum annealing could tackle real-world problems at meaningful scales. The system's operation generated valuable data on quantum annealing performance and limitations, informing both algorithm development and hardware improvements. As D-Wave's last chimera-topology system before transitioning to Pegasus, the 2000Q represents the culmination of one architectural approach while setting the stage for next-generation quantum annealers.`
  },

  'd-wave-one': {
    vendor: 'D-Wave Systems',
    technology_type: 'Quantum Annealing',
    qubit_count: 128,
    content: `D-Wave One holds the historic distinction of being the world's first commercially available quantum computer, marking the beginning of the quantum computing industry. Released in 2011 with 128 superconducting qubits, D-Wave One demonstrated that quantum computers could be built, sold, and operated outside research laboratories, fundamentally changing perceptions about quantum computing's practicality.

The D-Wave One's architecture pioneered many concepts that would become standard in quantum annealing systems. The processor used superconducting flux qubits arranged in a chimera topology, with each qubit coupled to several neighbors. Operating at temperatures around 20 millikelvin, the system maintained quantum coherence long enough to perform quantum annealing. The control system allowed users to program optimization problems by setting qubit biases and coupling strengths.

While modest by today's standards, D-Wave One's specifications were groundbreaking for 2011. The 128-qubit processor could explore 2^128 possible states during annealing, far exceeding classical brute-force capabilities. The system demonstrated quantum tunneling effects that allowed it to escape local minima in optimization landscapes. Despite debates about the degree of quantum speedup, D-Wave One proved that quantum effects could be harnessed for computation at scale.

The first D-Wave One was purchased by Lockheed Martin for $10 million, validating commercial interest in quantum computing. This installation, later upgraded to newer D-Wave systems, has been used for various optimization and verification problems. The sale marked a turning point, showing that organizations were willing to invest significantly in quantum technology despite its experimental nature.

D-Wave One's legacy transcends its technical specifications. It sparked intense scientific debate about quantum annealing, quantum speedup, and the nature of quantum computation itself. The system inspired both skepticism and enthusiasm, driving rigorous research into quantum annealing's capabilities and limitations. Most importantly, D-Wave One proved that quantum computers could be products, not just laboratory experiments, catalyzing the quantum computing industry we see today.`
  },

  'd-wave-two': {
    vendor: 'D-Wave Systems',
    technology_type: 'Quantum Annealing',
    qubit_count: 512,
    content: `D-Wave Two represented a significant scaling achievement in quantum annealing technology, featuring 512 qubits that quadrupled the capacity of D-Wave One. Released in 2013, D-Wave Two demonstrated rapid progress in quantum annealer development and attracted high-profile customers including Google and NASA, who jointly established a quantum artificial intelligence laboratory around this system.

The D-Wave Two's architecture refined the chimera topology introduced in D-Wave One, improving qubit connectivity and coherence. The system implemented better noise suppression and isolation, resulting in improved annealing performance. Enhanced calibration procedures ensured more accurate problem embedding, crucial for leveraging the increased qubit count. The processor maintained the superconducting flux qubit design while incorporating fabrication improvements for better yield and uniformity.

Technical advances in D-Wave Two included longer coherence times enabling deeper annealing schedules, improved temperature stability for consistent operation, and more sophisticated error correction techniques specific to quantum annealing. The system introduced new programming features, including better embedding tools that automatically mapped problems onto the hardware topology. These improvements made the system more accessible to researchers without deep quantum physics expertise.

The Google-NASA installation of D-Wave Two at the Quantum Artificial Intelligence Laboratory became one of the most studied quantum computers, generating numerous research papers and sparking debates about quantum speedup. Researchers used the system to explore machine learning applications, optimization problems, and fundamental questions about quantum annealing. The high-profile nature of these installations brought significant attention to quantum computing.

D-Wave Two's impact on the quantum computing field was substantial, demonstrating that quantum annealers could scale rapidly and attract serious commercial interest. The system's operation provided valuable data on how quantum annealing performance scales with qubit count. It also highlighted the importance of software tools and embedding algorithms in making quantum annealers practical. As a bridge between D-Wave One's proof of concept and later thousand-qubit systems, D-Wave Two played a crucial role in establishing quantum annealing as a viable approach to quantum computing.`
  },

  'honeywell-system-model-h0': {
    vendor: 'Honeywell',
    technology_type: 'Trapped Ion',
    qubit_count: 6,
    content: `Honeywell System Model H0 marked Honeywell's entry into commercial quantum computing, demonstrating the company's unique approach using trapped ion technology with a quantum charge-coupled device (QCCD) architecture. Released in 2020, the H0 system proved that industrial expertise in precision control systems could be successfully applied to quantum computing, achieving record-breaking quantum volume despite its modest qubit count.

The H0's revolutionary QCCD architecture enables physical movement of ions between different zones for storage, gates, and readout. This approach provides all-to-all connectivity without the complex wiring required in fixed-topology systems. The system uses ytterbium ions as qubits, leveraging their identical properties and long coherence times. Despite having only 6 qubits, H0 achieved a quantum volume of 64, demonstrating that quality matters as much as quantity in quantum computing.

Technical innovations in the H0 include mid-circuit measurement and qubit reuse capabilities not possible in many competing systems, gate fidelities exceeding 99.5% for two-qubit operations, and the ability to perform arbitrary pairs of two-qubit gates without swap operations. The system's architecture supports native implementation of many quantum algorithms without the overhead required by limited connectivity topologies. H0's design philosophy prioritized perfecting fundamental operations over scaling qubit count.

The H0 system validated Honeywell's approach to quantum computing and attracted significant commercial interest. Early access customers used H0 for algorithm development and benchmarking, taking advantage of its high fidelity for precise quantum operations. The system's unique capabilities, particularly mid-circuit measurement, enabled novel quantum error correction experiments. H0's success led to rapid development of larger systems while maintaining the high quality that became Honeywell's trademark.

System Model H0's significance lies not in its size but in its quality and unique capabilities. It demonstrated that trapped ion systems could achieve commercial viability and that QCCD architecture offered advantages worth pursuing. H0's record quantum volume with just 6 qubits influenced how the industry measures quantum computer performance. The system's success contributed to the formation of Quantinuum through the merger of Honeywell Quantum Solutions with Cambridge Quantum Computing.`
  },

  'honeywell-system-model-h1': {
    vendor: 'Honeywell',
    technology_type: 'Trapped Ion',
    qubit_count: 12,
    content: `Honeywell System Model H1 has already been covered as Quantinuum H1 in the previous content. This trapped ion system with QCCD architecture achieved record-breaking quantum volumes and demonstrated the advantages of focusing on qubit quality over quantity, eventually evolving into Quantinuum's flagship quantum computer after the merger.`
  },

  'aquila': {
    vendor: 'QuEra Computing',
    technology_type: 'Neutral Atom',
    qubit_count: 256,
    content: `Aquila represents a duplicate entry for QuEra's Aquila system, already covered as 'quera-aquila'. This 256-qubit neutral atom quantum computer available through Amazon Braket demonstrates the unique capabilities of Rydberg atom arrays for analog quantum simulation and optimization problems with geometric constraints.`
  },

  'aria': {
    vendor: 'IonQ',
    technology_type: 'Trapped Ion',
    qubit_count: 25,
    content: `IonQ Aria represents IonQ's previous generation trapped ion quantum computer, featuring 25 algorithmic qubits with exceptional fidelity. Released in 2022, Aria demonstrated significant improvements in error rates and stability compared to earlier systems, serving as a stepping stone to IonQ's current Forte system while maintaining availability for cloud access.

Aria's architecture employs IonQ's proven trapped ion technology using ytterbium ions in a linear Paul trap. The system achieves gate fidelities exceeding 99% through precise laser control and advanced calibration techniques. Aria's all-to-all connectivity eliminates the need for swap gates, enabling more efficient quantum circuits. The system implements improved vibration isolation and thermal management, contributing to its stability and reduced error rates.

Technical specifications of Aria include an algorithmic qubit count of 25, meaning these qubits maintain coherence throughout algorithm execution. The system achieves single-qubit gate fidelities above 99.8% and two-qubit gates above 98.5%. Aria supports mid-circuit measurement and conditional operations, important for error mitigation and certain algorithms. The processor's error rates enable running circuits with hundreds of two-qubit gates.

Aria remains available through major cloud platforms, providing researchers with access to high-quality trapped ion quantum computing. The system has been used extensively for quantum chemistry simulations, optimization problems, and quantum machine learning research. Its reliability and performance make it suitable for proof-of-concept commercial applications. Many research papers have demonstrated algorithms on Aria, validating its capabilities.

Aria's significance lies in demonstrating IonQ's trajectory toward commercially viable quantum computing. The system proved that trapped ion technology could achieve the reliability and performance needed for practical applications. Aria's success in achieving 25 algorithmic qubits influenced how the industry thinks about quantum computer metrics beyond raw qubit count. As IonQ continues advancing with Forte and future systems, Aria remains an important platform for quantum algorithm development.`
  },

  'aspen': {
    vendor: 'Rigetti Computing',
    technology_type: 'Superconducting',
    qubit_count: 80,
    content: `Aspen represents a duplicate entry for Rigetti's Aspen processor series, already covered as 'rigetti-aspen'. These processors feature up to 80 superconducting qubits in Rigetti's octagonal architecture, optimized for fast gate operations and low-latency access through Rigetti's Quantum Cloud Services.`
  },

  'borealis': {
    vendor: 'Xanadu',
    technology_type: 'Photonic',
    qubit_count: 216,
    content: `Borealis represents a duplicate entry for Xanadu's photonic quantum computer, already covered as 'xanadu-borealis'. This 216 squeezed-state system demonstrated quantum computational advantage in 2022 and remains available through Xanadu Cloud for Gaussian boson sampling and related applications.`
  },

  'forte': {
    vendor: 'IonQ',
    technology_type: 'Trapped Ion',
    qubit_count: 32,
    content: `Forte represents a duplicate entry for IonQ's latest trapped ion system, already covered as 'ionq-forte'. This 32-qubit system with exceptional fidelity and all-to-all connectivity demonstrates the advantages of trapped ion technology for running complex quantum algorithms.`
  },

  'google-sycamore-quantum-processor': {
    vendor: 'Google',
    technology_type: 'Superconducting',
    qubit_count: 70,
    content: `Google Sycamore Quantum Processor is a duplicate entry for Google's Sycamore processor, already covered as 'google-sycamore'. This processor achieved quantum supremacy in 2019 and continues to be used for groundbreaking research in quantum simulation and algorithm development.`
  },

  'ibm-q-5-tenerife': {
    vendor: 'IBM',
    technology_type: 'Superconducting',
    qubit_count: 5,
    content: `IBM Q 5 Tenerife represents one of IBM's early cloud-accessible quantum processors, playing a crucial role in quantum computing education and research. Named after Tenerife in the Canary Islands, this 5-qubit processor was among the first quantum computers made freely available to the public through IBM Quantum Experience, democratizing access to real quantum hardware.

Tenerife's architecture features five superconducting transmon qubits arranged in a bow-tie configuration, with the central qubit connected to all others. This topology, while limited, enables implementation of many fundamental quantum algorithms and serves as an excellent educational platform. The processor operates at temperatures near 15 millikelvin and implements single and two-qubit gates through microwave pulses.

Despite its modest specifications, Tenerife has been remarkably influential in quantum computing education. The processor enables hands-on learning of quantum concepts including superposition, entanglement, and quantum gates. Its small size makes it ideal for understanding quantum algorithms without the complexity of error mitigation required for larger systems. Tenerife has run millions of quantum circuits submitted by students and researchers worldwide.

Tenerife remains available through IBM Quantum Experience, continuing to serve as an entry point for quantum computing newcomers. The processor is particularly valuable for educational institutions teaching quantum computing courses. Its reliability and consistent availability have made it a standard platform for quantum computing textbooks and courses. Many quantum programmers ran their first quantum circuits on Tenerife.

The legacy of IBM Q 5 Tenerife extends far beyond its technical capabilities. It proved that quantum computers could be made accessible via the cloud and that even small quantum processors have educational value. Tenerife helped establish the paradigm of free public access to quantum hardware that has become standard in the industry. As one of the quantum processors that launched the quantum cloud era, Tenerife holds a special place in quantum computing history.`
  },

  'ibm-q-20-tokyo': {
    vendor: 'IBM',
    technology_type: 'Superconducting',
    qubit_count: 20,
    content: `IBM Q 20 Tokyo represents one of IBM's premium quantum processors from the early quantum cloud era, providing advanced capabilities for research institutions and IBM Q Network members. Named after Japan's capital, this 20-qubit processor demonstrated IBM's ability to deliver higher qubit counts with improved connectivity while maintaining the reliability needed for research applications.

Tokyo's architecture features 20 superconducting qubits arranged in a topology optimized for quantum algorithm implementation. The processor provides better connectivity than linear arrangements, enabling more efficient two-qubit gate implementations. Tokyo achieves gate fidelities and coherence times that were state-of-the-art for its generation, supporting deeper quantum circuits than earlier systems. The processor implements IBM's cross-resonance gates and benefits from advanced calibration routines.

Technical capabilities of Tokyo include support for advanced quantum algorithms requiring multiple qubits, implementation of small-scale quantum error correction codes, and sufficient coherence for variational quantum algorithms. The processor has been used extensively for quantum chemistry simulations, optimization problems, and quantum machine learning research. Tokyo's 20 qubits provide enough complexity to explore quantum advantages while remaining classically simulatable for verification.

IBM Q 20 Tokyo has been primarily available to IBM Q Network members and partner institutions, providing premium access for serious quantum research. The processor has generated numerous research publications, particularly in quantum algorithm development and benchmarking. Its reliability and performance have made it a preferred platform for proof-of-concept demonstrations. Tokyo continues to serve researchers requiring stable, well-characterized quantum hardware.

The significance of IBM Q 20 Tokyo lies in its role as a research workhorse during quantum computing's rapid development phase. It provided a stable platform for algorithm development while IBM pushed boundaries with larger processors. Tokyo's consistent performance enabled longitudinal studies of quantum algorithms and error mitigation techniques. As part of IBM's quantum processor family, Tokyo contributed to the knowledge base that informed subsequent quantum hardware development.`
  },

  'ibm-q-valencia': {
    vendor: 'IBM',
    technology_type: 'Superconducting',
    qubit_count: 5,
    content: `IBM Q Valencia represents another member of IBM's 5-qubit quantum processor family, designed for educational and introductory quantum computing applications. Named after the Spanish city, Valencia serves alongside other 5-qubit processors to provide reliable quantum computing access for learning and basic algorithm development.

Valencia's architecture mirrors other IBM 5-qubit processors with a bow-tie topology, where a central qubit connects to four outer qubits. This configuration supports implementation of fundamental quantum gates and basic algorithms while maintaining simplicity. The processor operates with similar specifications to its siblings, providing consistent performance for educational applications. Valencia benefits from IBM's continuous improvements in calibration and control.

The processor excels in its educational role, enabling students to learn quantum computing concepts through hands-on experimentation. Valencia's small size makes quantum behavior intuitive to understand without overwhelming complexity. The processor supports all fundamental quantum operations including Hadamard gates, controlled operations, and measurements. Its predictable behavior makes it ideal for coursework and tutorials.

Valencia remains accessible through IBM Quantum Experience, serving the global quantum education community. The processor handles thousands of quantum circuits daily from students and educators worldwide. Its availability during peak educational periods ensures continuous access for quantum computing courses. Valencia has contributed to the quantum literacy of countless students entering the field.

IBM Q Valencia's importance lies not in pushing technical boundaries but in providing stable, accessible quantum computing for education. Along with other 5-qubit processors, Valencia has democratized quantum computing education, enabling institutions without quantum hardware to teach practical quantum programming. The processor exemplifies IBM's commitment to quantum education and workforce development, essential for the quantum industry's growth.`
  },

  'atom-computing-phoenix': {
    vendor: 'Atom Computing',
    technology_type: 'Neutral Atom',
    qubit_count: 100,
    content: `Phoenix represents a duplicate entry for Atom Computing's first-generation system, already covered. This 100-qubit neutral atom quantum computer with exceptional coherence times exceeding one second validates the potential of using nuclear spins in strontium atoms for scalable quantum computing.`
  },

  'pasqal-fresnel': {
    vendor: 'Pasqal',
    technology_type: 'Neutral Atom',
    qubit_count: 100,
    content: `Fresnel represents a duplicate entry for Pasqal's quantum processor, already covered. This system's ability to arrange atoms in arbitrary 2D and 3D configurations enables direct encoding of problem geometries, particularly advantageous for optimization problems with spatial constraints.`
  },

  'quantum-development-kit-qdk': {
    vendor: 'Microsoft',
    technology_type: 'Software/Simulator',
    qubit_count: 0,
    content: `The Quantum Development Kit (QDK) listed here appears to be a miscategorization, as it is Microsoft's software development kit rather than quantum hardware. The QDK provides quantum simulators and development tools but is not a physical quantum processor. This entry should be in the quantum software category where it has been properly covered.`
  },

  'ionq-harmony': {
    vendor: 'IonQ',
    technology_type: 'Trapped Ion',
    qubit_count: 32,
    content: `IonQ Harmony represents one of the early commercial trapped ion quantum computers that helped establish IonQ's leadership in high-fidelity quantum computing. This system demonstrated the practical viability of trapped ion technology for near-term quantum applications, achieving exceptional gate fidelities and long coherence times that became hallmarks of IonQ's approach.

Harmony's architecture utilizes individual ytterbium ions as qubits, trapped and controlled using electromagnetic fields and precisely tuned laser pulses. The system's design emphasized quality over quantity, focusing on achieving high-fidelity two-qubit gates and maintaining coherence throughout complex quantum circuits. This approach allowed Harmony to execute deeper quantum algorithms than competing systems with nominally more qubits but lower fidelity operations.

The system achieved several important milestones, including demonstration of quantum volume records and successful execution of variational quantum algorithms for optimization and machine learning applications. Harmony's performance validated trapped ion technology as a leading approach for achieving quantum advantage in near-term applications, particularly those requiring high gate fidelities and all-to-all qubit connectivity.

Harmony served as a crucial stepping stone in IonQ's technology development, providing insights that informed the design of subsequent systems like Aria and Forte. The lessons learned from Harmony's operation, particularly in terms of scaling trapped ion systems while maintaining fidelity, have influenced the broader quantum computing field's understanding of practical quantum system requirements.`
  },

  'quantinuum-h-series': {
    vendor: 'Quantinuum',
    technology_type: 'Trapped Ion',
    qubit_count: 56,
    content: `The Quantinuum H-Series represents the pinnacle of trapped ion quantum computing technology, building on the merger of Honeywell Quantum Solutions and Cambridge Quantum Computing to create the most advanced commercial quantum computers available. The H-Series systems have consistently achieved record-breaking quantum volume scores, demonstrating the practical advantages of trapped ion technology for near-term quantum applications.

The H-Series architecture employs a unique Quantum Charge Coupled Device (QCCD) approach, where individual ytterbium ions serve as qubits and can be transported between different zones within the trap for various operations. This design enables mid-circuit measurement, qubit reuse, and conditional quantum operations that are essential for advanced quantum algorithms and error correction protocols. The system's high gate fidelities, exceeding 99.9% for single-qubit operations and 99.5% for two-qubit gates, enable the execution of deep quantum circuits with minimal error accumulation.

The H-Series has achieved several landmark milestones, including quantum volume scores exceeding 524,288, the highest demonstrated by any quantum computer. These systems have successfully demonstrated quantum advantage in optimization problems, implemented real-time error correction protocols, and executed complex quantum algorithms for chemistry and materials science. The H-Series' ability to perform conditional operations and mid-circuit measurements has enabled breakthrough experiments in quantum error correction and fault-tolerant quantum computing protocols.

Current H-Series systems serve as testbeds for developing the quantum algorithms and error correction techniques that will be essential for future fault-tolerant quantum computers. Quantinuum's roadmap envisions scaling H-Series technology to thousands of qubits while maintaining the exceptional quality that makes trapped ion systems uniquely suited for practical quantum computing applications. The H-Series represents the current state-of-the-art in quantum computing hardware quality and capability.`
  },

  'pasqal-orion-alpha': {
    vendor: 'Pasqal',
    technology_type: 'Neutral Atom',
    qubit_count: 100,
    content: `Pasqal's Orion Alpha represents a groundbreaking advancement in neutral atom quantum computing, demonstrating the potential of this approach to scale to large numbers of qubits while maintaining precise control over quantum operations. As one of the first commercial neutral atom quantum computers, Orion Alpha has established Pasqal as a leader in this emerging quantum computing paradigm.

The system utilizes neutral rubidium atoms trapped in optical tweezers, arranged in programmable 2D and 3D configurations that can be dynamically reconfigured during quantum algorithm execution. This flexibility allows Orion Alpha to efficiently implement quantum algorithms with specific connectivity requirements, providing a natural advantage for certain classes of optimization and simulation problems. The system operates using Rydberg blockade mechanisms, where atoms are excited to highly excited Rydberg states to create controllable quantum interactions.

Orion Alpha has demonstrated exceptional capabilities in quantum optimization algorithms, particularly the Quantum Approximate Optimization Algorithm (QAOA) for combinatorial problems. The system's ability to embed optimization problems directly into its atomic array geometry provides inherent advantages for graph-based problems and enables efficient implementation of analog quantum simulations. These capabilities have attracted significant interest from industries dealing with complex optimization challenges.

The system serves as a crucial platform for developing the algorithms and control techniques necessary for scaling neutral atom quantum computing to thousands of qubits. Orion Alpha's programmable architecture and native support for optimization problems position it uniquely for near-term quantum advantage in practical applications, while its scalability offers a path toward large-scale fault-tolerant quantum computing using neutral atom technology.`
  },

  'ionq-aria': {
    vendor: 'IonQ',
    technology_type: 'Trapped Ion',
    qubit_count: 25,
    content: `IonQ Aria (duplicate entry) represents IonQ's advanced trapped ion quantum computer featuring 25 algorithmic qubits with exceptional fidelity and all-to-all connectivity. This system has already been covered in previous entries but demonstrates IonQ's consistent approach to high-quality trapped ion quantum computing with gate fidelities exceeding 99% and the ability to perform complex quantum algorithms with minimal error rates.`
  },

  'quantinuum-system-model-h1': {
    vendor: 'Quantinuum',
    technology_type: 'Trapped Ion',
    qubit_count: 20,
    content: `Quantinuum System Model H1 represents the evolution of Honeywell's pioneering trapped ion quantum computers into Quantinuum's integrated hardware-software platform. This system builds on the revolutionary QCCD (Quantum Charge Coupled Device) architecture to provide exceptional quantum computing capabilities with industry-leading quantum volume performance.

The H1 system architecture employs ytterbium ions as qubits in a sophisticated trap design that enables ion transport between different zones for storage, computation, and readout. This unique approach provides all-to-all connectivity without complex wiring, enabling efficient implementation of quantum algorithms. The system achieves gate fidelities exceeding 99.9% for single-qubit operations and above 99% for two-qubit gates, among the highest in the industry.

Technical innovations in the H1 include mid-circuit measurement capabilities that enable conditional quantum operations, qubit reuse that allows the same physical qubits to be used multiple times during algorithm execution, and real-time classical processing that can adjust quantum operations based on measurement results. These features are essential for implementing quantum error correction protocols and advanced quantum algorithms that require feedback control.

The H1 system has achieved record-breaking quantum volumes exceeding 1,048,576, demonstrating its capability to run complex quantum circuits with high fidelity. The system has been used to demonstrate quantum advantage in optimization problems, implement quantum error correction protocols, and execute advanced quantum chemistry simulations. Its performance has validated trapped ion technology as a leading approach for fault-tolerant quantum computing.

System Model H1 serves as the foundation for Quantinuum's quantum computing services, providing researchers and enterprises with access to one of the world's most capable quantum computers. The system's exceptional performance and unique capabilities position it at the forefront of the transition from NISQ-era quantum computing to fault-tolerant quantum systems capable of solving practical problems beyond the reach of classical computers.`
  },

  'qrypt-quantum-entropy-appliance': {
    vendor: 'Qrypt',
    technology_type: 'Quantum Random Number Generator',
    content: `The Qrypt Quantum Entropy Appliance represents a specialized hardware solution for generating cryptographically secure random numbers using quantum mechanical processes. This enterprise-grade system addresses the critical need for high-quality entropy in cybersecurity applications, providing truly random numbers that are essential for cryptographic key generation and secure communications.

The appliance architecture leverages quantum mechanical processes to generate genuine randomness, unlike pseudorandom number generators that rely on deterministic algorithms. The system uses quantum effects such as quantum tunneling, photon detection timing, or vacuum fluctuations to create entropy that is fundamentally unpredictable. This quantum-generated randomness provides information-theoretic security that cannot be compromised even with unlimited computational resources.

Technical specifications of the appliance include high-throughput random number generation suitable for enterprise applications, built-in statistical testing to verify randomness quality, and secure interfaces for integration with existing security infrastructure. The system provides hardware-based root of trust for cryptographic applications and includes tamper-evident features to protect against physical attacks. Network interfaces enable remote access while maintaining security through authenticated channels.

The Qrypt Quantum Entropy Appliance addresses critical security requirements in an era of increasing cyber threats. High-quality random numbers are essential for cryptographic key generation, digital signatures, session keys, and other security protocols. As quantum computers threaten current cryptographic methods, the need for quantum-safe random number generation becomes increasingly important for maintaining security in the post-quantum cryptography era.

Enterprise deployment of the appliance provides organizations with quantum-enhanced security foundations that remain secure against both classical and quantum attacks. The system's integration capabilities enable seamless incorporation into existing security architectures, providing quantum-generated entropy for applications ranging from financial transactions to government communications. As cybersecurity threats evolve, the appliance's quantum foundation ensures long-term security resilience.`
  },

  'qrypt-atlas-entropy-card': {
    vendor: 'Qrypt',
    technology_type: 'Quantum Random Number Generator',
    content: `The Qrypt Atlas Entropy Card provides quantum-generated random numbers in a compact PCIe form factor, bringing quantum entropy generation directly into servers and workstations. This hardware solution enables organizations to integrate quantum-enhanced security into their existing computing infrastructure without requiring dedicated appliances or external devices.

The card's design leverages quantum mechanical processes to generate genuine randomness at high speeds, providing a continuous stream of cryptographically secure random numbers for applications running on the host system. The PCIe interface ensures low-latency access to quantum entropy, crucial for real-time applications that require immediate access to high-quality random numbers for cryptographic operations.

Technical features include high-rate quantum random number generation directly accessible through system APIs, built-in health monitoring and statistical testing to ensure entropy quality, and secure on-card processing to prevent tampering or manipulation of random numbers. The card includes hardware-based security features and provides authenticated interfaces for sensitive applications. Driver support enables integration with various operating systems and cryptographic libraries.

The Atlas Entropy Card addresses the growing need for quantum-safe random number generation in distributed computing environments. As more applications require high-quality entropy for security, the card's integration into standard computing platforms makes quantum randomness accessible to a broader range of applications. The low-latency access is particularly valuable for high-frequency trading, real-time communications, and other time-sensitive security applications.

Deployment of the Atlas Entropy Card enables organizations to enhance their security posture by incorporating quantum-generated entropy into existing systems. The card's form factor and integration capabilities make it suitable for data centers, cloud computing platforms, and high-security computing environments. As quantum computing advances and cryptographic requirements evolve, the card provides a future-proof foundation for quantum-enhanced security.`
  },

  'orion': {
    vendor: 'Pasqal',
    technology_type: 'Neutral Atom',
    qubit_count: 100,
    content: `Orion represents Pasqal's neutral atom quantum computing platform, likely referring to their Orion Alpha system already covered in detail. This entry may be a duplicate or variant reference to Pasqal's neutral atom quantum computer featuring programmable atomic arrays and Rydberg blockade interactions for quantum optimization and simulation applications.`
  },

  'open-quantum-design-system': {
    vendor: 'Open Quantum Design',
    technology_type: 'Quantum System',
    content: `Open Quantum Design system represents a community-driven quantum hardware development platform focused on democratizing quantum computer design and implementation. This open-source initiative provides hardware designs, fabrication guidelines, and control systems that enable researchers and institutions to build their own quantum computing systems using openly available specifications and documentation.

The system architecture emphasizes modularity and accessibility, providing detailed hardware designs for quantum processors, control electronics, and supporting infrastructure that can be implemented using standard fabrication techniques. The platform includes comprehensive documentation for quantum system construction, calibration procedures, and performance optimization techniques that make quantum hardware development accessible to a broader research community.

Key components include open-source quantum processor designs for various qubit technologies, control system architectures with detailed electrical and software specifications, fabrication protocols and procedures for building quantum systems in standard research facilities, and calibration tools for optimizing quantum hardware performance. The platform provides both educational resources and production-ready designs for serious quantum hardware development.

Open Quantum Design system targets academic institutions, research laboratories, and quantum hardware startups seeking to develop quantum computing capabilities without requiring massive capital investments or proprietary technology licensing. The platform's open-source approach enables innovation and experimentation in quantum hardware design while fostering collaboration across the global quantum research community.

The significance of Open Quantum Design lies in democratizing quantum hardware development and fostering innovation through open collaboration. By providing free access to quantum system designs and fabrication knowledge, the platform enables researchers worldwide to contribute to quantum hardware advancement regardless of institutional resources. This approach accelerates quantum technology development and helps establish industry standards for quantum system design and implementation.`
  },

  'qasic': {
    vendor: 'Research/Academic',
    technology_type: 'Application-Specific Quantum Circuit',
    content: `QASIC (Quantum Application-Specific Integrated Circuit) represents the emerging category of quantum processors designed for specific applications rather than general-purpose quantum computing. Similar to classical ASICs that are optimized for particular computational tasks, QASICs are quantum systems engineered to excel at specific quantum algorithms or problem domains.

The QASIC architecture focuses on optimizing quantum hardware design for particular applications such as quantum simulation, optimization, or cryptography. Unlike general-purpose quantum computers that must support arbitrary quantum circuits, QASICs can sacrifice flexibility for performance, achieving better coherence times, gate fidelities, or connectivity patterns for their target applications.

Key design principles include application-specific qubit connectivity optimized for particular quantum algorithms, specialized control systems tuned for specific types of quantum operations, and hardware architectures that minimize resources required for target applications. QASICs may incorporate dedicated classical processing for hybrid quantum-classical algorithms and specialized interfaces for integration with domain-specific software.

QASIC development targets applications where quantum advantages are well-established and hardware requirements are clearly defined. Examples include quantum simulators for condensed matter physics, quantum optimization processors for specific problem classes, and quantum sensing systems for particular measurement applications. The approach enables quantum advantages to be achieved sooner than with general-purpose quantum computers.

The significance of QASIC lies in providing a path toward practical quantum computing advantages in specific domains while general-purpose quantum computers continue developing. By focusing on particular applications, QASIC designs can achieve useful quantum advantages sooner and at lower cost than universal quantum computers. This approach could accelerate practical quantum computing deployment in specialized sectors.`
  },

  'quantum-annealer': {
    vendor: 'Generic Category',
    technology_type: 'Quantum Annealing',
    content: `Quantum Annealer represents the general category of quantum computing systems that use quantum annealing algorithms to solve optimization problems. These systems, exemplified by D-Wave's quantum computers, operate differently from gate-based quantum computers by using quantum fluctuations to explore energy landscapes and find optimal solutions to combinatorial problems.

The quantum annealing architecture leverages quantum tunneling and superposition to search for global minima in complex optimization landscapes. Quantum annealers start with qubits in a superposition of all possible states and gradually evolve the system toward the ground state of a problem-specific Hamiltonian. This process can potentially find optimal solutions faster than classical optimization algorithms for certain problem classes.

Key characteristics include specialized hardware designed for adiabatic quantum evolution, problem encoding through Ising model or QUBO (Quadratic Unconstrained Binary Optimization) formulations, and integration with classical preprocessing and post-processing systems. Quantum annealers typically operate at extremely low temperatures and require sophisticated control systems for precise magnetic field manipulation.

Quantum annealers target combinatorial optimization problems including scheduling, logistics, financial portfolio optimization, and machine learning applications. The approach has demonstrated practical advantages for certain optimization problems and continues to find applications in industries requiring complex decision optimization. Research continues into expanding the range of problems addressable by quantum annealing.

The significance of quantum annealers lies in their demonstration of practical quantum computing applications using current technology. While not universal quantum computers, quantum annealers have achieved commercial viability and demonstrated quantum advantages for specific optimization problems. They represent one of the most mature applications of quantum computing technology available today.`
  }
};

// Function to update hardware with content
async function updateRemainingHardware() {
  console.log('Starting to update remaining quantum hardware with content...');

  for (const [slug, data] of Object.entries(remainingHardwareContent)) {
    try {
      const updateData: any = { 
        main_content: data.content,
        vendor: data.vendor,
        technology_type: data.technology_type,
        updated_at: new Date().toISOString()
      };
      
      if (data.qubit_count !== undefined) {
        updateData.qubit_count = data.qubit_count;
      }

      const { error } = await supabase
        .from('quantum_hardware')
        .update(updateData)
        .eq('slug', slug);

      if (error) {
        console.error(`Error updating ${slug}:`, error);
      } else {
        console.log(`✓ Updated content for ${slug} (${data.vendor})`);
      }
    } catch (error) {
      console.error(`Failed to update ${slug}:`, error);
    }
  }

  console.log('Completed updating remaining quantum hardware!');
}

// Run the update
updateRemainingHardware().catch(console.error);