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

// Content for additional quantum software platforms
const additionalSoftwareContent: Record<string, { 
  content: string; 
  vendor?: string;
  programming_languages?: string[];
  license_type?: string;
}> = {
  'q-programming-language': {
    vendor: 'Microsoft',
    programming_languages: ['Q#'],
    license_type: 'MIT',
    content: `Q# (Q-sharp) is Microsoft's domain-specific programming language for quantum computing, designed from the ground up to express quantum algorithms and quantum logic. As the centerpiece of Microsoft's Quantum Development Kit, Q# represents a paradigm shift from adapting classical languages to quantum computing toward a language specifically crafted for quantum programming concepts and patterns.

Q#'s language design philosophy emphasizes quantum algorithm expression, hardware independence, and scalability to future fault-tolerant quantum computers. Unlike quantum frameworks built on classical languages, Q# treats quantum operations as first-class language constructs. The language includes quantum-specific features like automatic adjoint and controlled operation generation, quantum data types, and built-in resource management for qubits. This design enables developers to focus on quantum algorithm logic rather than low-level quantum hardware details.

The language's type system ensures quantum program correctness through compile-time checks that prevent common quantum programming errors. Q# supports advanced quantum programming patterns including quantum oracles, variational algorithms, and quantum error correction. The language's integration with classical computation is seamless, allowing hybrid quantum-classical algorithms to be expressed naturally. Q#'s standard libraries include implementations of common quantum algorithms, arithmetic operations, and chemistry simulations.

Q#'s significance extends beyond syntax to its role in Microsoft's vision of quantum computing as a scalable, fault-tolerant technology. The language is designed to scale from current NISQ devices to future logical qubit computers with millions of qubits. Q#'s resource estimation capabilities allow developers to understand the requirements of quantum algorithms on future hardware. The language's hardware-agnostic design enables the same Q# program to run on different quantum processors through the Azure Quantum platform.

As quantum computing advances toward practical applications, Q#'s role in quantum software development continues to grow. Its emphasis on algorithm expressiveness and hardware independence positions it uniquely for the fault-tolerant quantum computing era. Q#'s integration with Azure Quantum and classical .NET languages provides a complete development experience that bridges current experimentation with future production quantum applications.`
  },

  'qadence': {
    vendor: 'Pasqal',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `Qadence is Pasqal's advanced quantum programming framework designed specifically for digital-analog quantum computing, representing the next generation of quantum software that bridges the gap between digital gate-based and analog quantum computing paradigms. Built to leverage the unique capabilities of neutral atom quantum computers, Qadence enables both precise digital control and continuous analog evolution in quantum algorithms.

The framework's architecture reflects the distinctive features of neutral atom quantum computing, where qubits can be arranged in arbitrary geometries and controlled through both discrete gates and continuous Hamiltonian evolution. Qadence provides high-level abstractions for programming quantum algorithms while maintaining access to low-level controls like pulse sequences and atomic arrangements. This dual-level approach enables unprecedented flexibility in quantum algorithm design and implementation.

Qadence excels in applications that benefit from the geometric flexibility of neutral atom systems. The framework includes built-in support for quantum optimization problems where the problem structure can be directly mapped to atomic arrangements, quantum simulation of many-body physics using analog evolution, and hybrid digital-analog algorithms that combine the precision of gates with the power of continuous evolution. These capabilities make Qadence particularly powerful for problems with inherent geometric or graph structure.

The framework's integration with Pasqal's quantum hardware ensures optimal performance on neutral atom systems while maintaining compatibility with other quantum platforms. Qadence includes sophisticated compilation tools that optimize quantum circuits for neutral atom architectures, taking advantage of features like long-range interactions and parallel gate operations. The framework also provides classical simulation capabilities for algorithm development and verification.

Qadence represents the evolution of quantum programming toward platform-aware software that leverages the unique advantages of specific quantum technologies. Its emphasis on digital-analog quantum computing reflects the growing recognition that different quantum platforms excel at different types of problems. As neutral atom quantum computers scale to thousands of qubits, Qadence's role in enabling large-scale quantum algorithms becomes increasingly important.`
  },

  'azure-quantums-chemistry-library': {
    vendor: 'Microsoft',
    programming_languages: ['Q#', 'Python'],
    license_type: 'MIT',
    content: `Azure Quantum's Chemistry Library represents Microsoft's specialized toolkit for quantum chemistry applications, providing state-of-the-art algorithms and tools for molecular simulation on quantum computers. Built on Q# and integrated with Azure Quantum, the library enables researchers to explore chemical systems that are computationally intractable for classical computers.

The library's architecture focuses on making quantum chemistry accessible to domain experts without requiring deep quantum programming knowledge. It provides high-level functions for molecular Hamiltonian generation, automatic problem decomposition for quantum hardware, and hybrid quantum-classical algorithms optimized for current NISQ devices. The library handles complex transformations between molecular representations and quantum circuits, enabling chemists to focus on scientific problems rather than quantum programming details.

Key features include implementations of Variational Quantum Eigensolver (VQE) algorithms optimized for molecular systems, quantum phase estimation for precise energy calculations, and advanced error mitigation techniques crucial for chemistry applications. The library provides tools for active space selection, symmetry reduction, and other approximations that make large molecular systems tractable on current quantum hardware. Integration with classical quantum chemistry packages enables seamless workflows from molecular structure to quantum computation.

The chemistry library's integration with Azure Quantum enables access to diverse quantum hardware through a unified interface, allowing researchers to compare results across different quantum technologies. The library includes benchmarking tools and performance optimization features that help identify the most suitable quantum hardware for specific chemistry problems. Resource estimation tools provide insights into the quantum computing requirements for practical chemistry applications.

Azure Quantum's Chemistry Library positions Microsoft at the forefront of quantum chemistry research, providing tools that bridge the gap between current quantum capabilities and future breakthroughs in drug discovery and materials science. Its focus on practical applications and integration with Microsoft's broader quantum ecosystem makes it a strategic platform for advancing quantum computing in chemistry and related fields.`
  },

  'ionq-quantum-cloud-platform': {
    vendor: 'IonQ',
    programming_languages: ['Python'],
    license_type: 'Proprietary',
    content: `IonQ's Quantum Cloud Platform provides enterprise-grade access to IonQ's trapped ion quantum computers, combining high-fidelity quantum hardware with cloud-native infrastructure for scalable quantum computing. The platform represents IonQ's vision of making quantum computing accessible, reliable, and practical for business applications.

The platform's architecture emphasizes reliability and performance, providing dedicated access to IonQ's quantum computers through enterprise-grade cloud infrastructure. Users can access both current systems like Aria and Forte as well as future quantum computers as they become available. The platform includes sophisticated job scheduling, priority queuing for premium customers, and detailed performance monitoring to ensure optimal quantum computing experiences.

Key features include native integration with major cloud platforms including AWS, Microsoft Azure, and Google Cloud, enabling quantum computing to be seamlessly incorporated into existing enterprise workflows. The platform provides REST APIs and SDKs for multiple programming languages, allowing integration with various software environments. Advanced features include circuit optimization for IonQ hardware, error mitigation tools, and hybrid quantum-classical computing capabilities.

IonQ's platform distinguishes itself through its focus on algorithmic qubits and quantum volume, metrics that account for both the quantity and quality of qubits. The platform provides transparent performance reporting and benchmarking tools that help users understand the capabilities and limitations of current quantum hardware. Educational resources and consulting services help enterprises identify appropriate quantum computing applications.

The IonQ Quantum Cloud Platform plays a crucial role in the commercial quantum computing ecosystem, providing one of the most accessible paths to high-quality quantum computing. Its integration with major cloud providers and focus on enterprise needs positions it as a key enabler of practical quantum computing applications. As IonQ scales its quantum computers to hundreds and thousands of qubits, the platform will serve as the primary interface for delivering quantum advantage to business customers.`
  },

  'qrypt-quantum-security-platform': {
    vendor: 'Qrypt',
    programming_languages: ['Python', 'C++'],
    license_type: 'Proprietary',
    content: `Qrypt's Quantum Security Platform provides comprehensive quantum-safe cryptographic solutions, addressing the urgent need for cryptographic systems that remain secure against both classical and quantum computer attacks. As quantum computers threaten current cryptographic standards, Qrypt's platform offers practical quantum-enhanced security for enterprises and governments.

The platform's architecture combines quantum random number generation with post-quantum cryptographic algorithms, providing multiple layers of quantum-resistant security. Qrypt's approach includes quantum-generated encryption keys that provide information-theoretic security, post-quantum cryptographic algorithms approved by standards bodies, and hybrid classical-quantum systems that provide security during the transition to quantum-safe cryptography.

Key capabilities include the generation of truly random encryption keys using quantum entropy sources, implementation of NIST-approved post-quantum cryptographic algorithms, and secure key distribution systems that protect against quantum attacks. The platform provides APIs for integrating quantum security into existing applications and infrastructure, making the transition to quantum-safe cryptography seamless for organizations.

Qrypt's platform addresses the critical timeline mismatch between quantum computer development and cryptographic system deployment. While large-scale quantum computers may still be years away, the long lifespan of many encrypted systems means that quantum-safe security must be implemented now. The platform provides practical solutions for this transition, including crypto-agility tools that enable rapid algorithm updates as standards evolve.

The Qrypt Quantum Security Platform represents a crucial component of the quantum computing ecosystem, addressing security challenges that arise as quantum technology advances. Its focus on practical quantum-safe solutions positions it as an essential tool for organizations preparing for the post-quantum cryptography era. As quantum computers advance toward cryptographically relevant scales, Qrypt's platform will play an increasingly important role in maintaining digital security.`
  },

  'quantum-origin': {
    vendor: 'Cambridge Quantum Computing',
    programming_languages: ['Python'],
    license_type: 'Proprietary',
    content: `Quantum Origin represents Cambridge Quantum Computing's quantum random number generation platform, providing cryptographically secure random numbers generated through quantum mechanical processes. The platform addresses a fundamental need in cybersecurity by ensuring that random numbers used in cryptographic applications are truly unpredictable and secure.

The platform leverages quantum mechanical processes to generate genuinely random numbers, unlike pseudorandom number generators that rely on deterministic algorithms. Quantum Origin uses quantum effects such as quantum tunneling and photon detection to create entropy that is fundamentally unpredictable, even with complete knowledge of the system state. This quantum-generated randomness provides information-theoretic security for cryptographic applications.

Key features include high-rate quantum random number generation suitable for enterprise applications, cryptographic testing and validation to ensure randomness quality, and secure delivery systems that protect random numbers from interception or manipulation. The platform provides both hardware devices for on-premises deployment and cloud-based services for applications requiring quantum randomness. Integration APIs enable seamless incorporation of quantum-generated random numbers into existing security systems.

Quantum Origin's significance extends beyond random number generation to its role in quantum-safe cryptography. As cryptographic systems transition to quantum-resistant algorithms, the quality of random numbers becomes increasingly important. The platform provides the high-entropy foundation needed for post-quantum cryptographic systems, ensuring security against both classical and quantum attacks.

The platform represents Cambridge Quantum Computing's expertise in applied quantum cryptography, demonstrating how current quantum technology can provide immediate security benefits. Its focus on practical deployment and enterprise integration makes quantum-generated randomness accessible to organizations seeking enhanced security. As quantum computing advances, Quantum Origin's role in providing quantum-enhanced security foundations becomes increasingly valuable.`
  },

  'pulser-studio': {
    vendor: 'Pasqal',
    programming_languages: ['Python'],
    license_type: 'Proprietary',
    content: `Pulser Studio is Pasqal's visual development environment for neutral atom quantum computing, providing an intuitive graphical interface for designing and simulating quantum algorithms on Rydberg atom arrays. The platform democratizes access to neutral atom quantum computing by making complex pulse sequence design accessible through visual programming tools.

The studio's architecture focuses on bridging the gap between theoretical quantum algorithm design and practical implementation on neutral atom hardware. Users can visually arrange atoms in arbitrary geometries, design time-dependent pulse sequences, and simulate quantum dynamics without requiring deep expertise in atomic physics. The platform automatically handles the complex physics of Rydberg interactions while providing users with intuitive controls for quantum algorithm development.

Key features include drag-and-drop atom arrangement tools for creating custom qubit geometries, visual pulse sequence editors for designing analog quantum evolution, and integrated simulation capabilities for testing algorithms before hardware execution. The platform provides real-time visualization of quantum states and dynamics, helping users understand how their algorithms perform. Advanced features include optimization tools for pulse sequences and automatic compilation for Pasqal's quantum hardware.

Pulser Studio's educational value is significant, making neutral atom quantum computing accessible to students and researchers new to the field. The visual approach helps users understand the unique features of neutral atom systems, including long-range interactions, flexible connectivity, and analog quantum simulation capabilities. The platform includes tutorials and examples that demonstrate common quantum algorithms adapted for neutral atom architectures.

The studio represents Pasqal's commitment to making quantum computing accessible to a broader community of users. Its visual programming approach could influence how quantum software development evolves, particularly for analog quantum computing paradigms. As neutral atom quantum computers scale to larger systems, Pulser Studio's role in enabling complex quantum algorithm design becomes increasingly important.`
  },

  'quanscient-qlbm-algorithm-suite': {
    vendor: 'Quanscient',
    programming_languages: ['Python'],
    license_type: 'Proprietary',
    content: `Quanscient's QLBM (Quantum Lattice Boltzmann Method) Algorithm Suite represents a breakthrough in quantum-accelerated computational fluid dynamics, combining the power of quantum computing with advanced simulation techniques. This specialized software package addresses one of the most computationally demanding areas of engineering simulation by leveraging quantum algorithms to solve fluid dynamics problems.

The QLBM algorithm suite fundamentally reimagines fluid dynamics simulation by encoding fluid behavior into quantum states and using quantum evolution to simulate complex flow patterns. This approach can potentially provide exponential speedups for certain types of fluid dynamics problems, particularly those involving complex boundary conditions and multi-phase flows. The quantum algorithms are designed to handle the nonlinear partial differential equations that govern fluid motion.

Key features include quantum algorithms optimized for lattice Boltzmann methods, hybrid quantum-classical solvers for current NISQ-era quantum computers, and specialized tools for encoding fluid dynamics problems into quantum circuits. The suite provides automatic problem decomposition and quantum circuit generation, making quantum fluid dynamics accessible to engineers without deep quantum computing expertise. Integration with classical CFD tools enables validation and hybrid computation approaches.

The algorithm suite targets complex engineering problems where classical simulation reaches computational limits, including turbulent flows in aerospace applications, multi-phase flows in chemical processing, and micro-scale fluid dynamics in semiconductor manufacturing. The quantum approach is particularly promising for problems with high-dimensional phase spaces and complex geometries that challenge classical methods.

Quanscient's QLBM suite represents the cutting edge of quantum-enhanced engineering simulation, demonstrating how quantum computing can revolutionize traditional computational engineering. As quantum computers scale and improve, this algorithm suite positions Quanscient at the forefront of the quantum advantage era in engineering simulation, potentially transforming how engineers design and optimize fluid systems.`
  },

  'ibm-quantum-platform': {
    vendor: 'IBM',
    programming_languages: ['Python', 'JavaScript'],
    license_type: 'Freemium',
    content: `IBM Quantum Platform represents IBM's comprehensive cloud-based quantum computing ecosystem, providing access to quantum hardware, simulators, and development tools through a unified web interface. As one of the first publicly accessible quantum computing platforms, it has democratized quantum computing education and research while advancing the field through widespread community engagement.

The platform architecture integrates quantum hardware access with classical computing resources, enabling hybrid quantum-classical algorithms essential for practical quantum computing. Users can access various IBM quantum processors ranging from small educational systems to large research-grade computers like Eagle and Osprey. The platform includes cloud-based quantum simulators capable of running quantum circuits classically for algorithm development and verification.

Key features include Qiskit integration for quantum program development, visual circuit composer for drag-and-drop quantum circuit design, and job queue management for fair access to quantum hardware. The platform provides real-time system status, error rates, and calibration data to help users select appropriate quantum processors for their applications. Educational resources include tutorials, textbooks, and certification programs that have trained thousands of quantum developers.

The IBM Quantum Platform has been instrumental in advancing quantum computing research and education globally. Academic institutions use the platform for quantum computing courses, researchers prototype quantum algorithms before implementing them on dedicated systems, and enterprises explore quantum applications through IBM's quantum network. The platform's community features enable collaboration and knowledge sharing among quantum researchers worldwide.

IBM Quantum Platform's impact extends beyond providing quantum computing access to fostering a global quantum computing community. Its open approach has accelerated quantum algorithm development and helped establish quantum computing as a viable technology field. As quantum computers scale toward practical applications, the platform continues to serve as the primary gateway for new users entering the quantum computing ecosystem.`
  },

  'pasqal-cloud-services-sdk': {
    vendor: 'Pasqal',
    programming_languages: ['Python'],
    license_type: 'Open Source',
    content: `Pasqal Cloud Services SDK provides comprehensive software tools for accessing and programming Pasqal's neutral atom quantum computers through cloud interfaces. The SDK bridges the unique features of neutral atom quantum computing with standard quantum programming practices, enabling developers to leverage the distinctive capabilities of Rydberg atom arrays for quantum applications.

The SDK architecture is designed around the unique features of neutral atom quantum computing, including programmable atomic geometries, analog quantum evolution, and digital-analog hybrid algorithms. Unlike SDKs for fixed-topology quantum computers, Pasqal's SDK enables dynamic reconfiguration of qubit arrangements and supports both gate-based digital operations and continuous analog evolution. This flexibility enables novel quantum algorithms that are difficult or impossible on other quantum computing platforms.

Key capabilities include tools for designing custom atomic arrangements optimized for specific problems, pulse sequence generation for analog quantum simulation, and hybrid digital-analog algorithm development. The SDK provides high-level abstractions for common quantum algorithms while maintaining access to low-level controls for advanced users. Integration with classical optimization libraries enables sophisticated hybrid quantum-classical algorithms particularly suited for optimization problems.

The SDK excels in applications that benefit from the geometric flexibility and analog capabilities of neutral atom systems. These include quantum optimization problems with graph structures that map naturally to atomic arrangements, quantum simulation of condensed matter systems using analog evolution, and machine learning applications that leverage the high connectivity of neutral atom systems. The SDK's support for both digital and analog quantum computing makes it uniquely versatile.

Pasqal Cloud Services SDK represents the evolution of quantum programming toward platform-aware software development. Its emphasis on leveraging the unique advantages of neutral atom quantum computing demonstrates how different quantum technologies require specialized software tools. As neutral atom quantum computers scale to thousands of qubits, the SDK's role in enabling large-scale quantum applications becomes increasingly important.`
  },

  'alphatensor-quantum': {
    vendor: 'DeepMind',
    programming_languages: ['Python'],
    license_type: 'Research',
    content: `AlphaTensor-Quantum represents DeepMind's extension of their groundbreaking AlphaTensor system to quantum computing, applying advanced AI techniques to discover optimal quantum algorithms and tensor decompositions. This research platform demonstrates how artificial intelligence can accelerate quantum algorithm development by automatically discovering efficient quantum circuits for complex mathematical operations.

The system builds on AlphaTensor's success in discovering novel algorithms for matrix multiplication by extending these techniques to quantum tensor operations. AlphaTensor-Quantum uses deep reinforcement learning to explore the space of possible quantum circuits and identify decompositions that minimize quantum resource requirements such as gate count, circuit depth, and qubit connectivity. This AI-driven approach can discover quantum algorithms that human researchers might not find.

Key innovations include automated discovery of quantum circuit decompositions for arbitrary tensor operations, optimization algorithms that account for quantum hardware constraints like limited connectivity and gate fidelities, and integration with quantum error correction requirements for fault-tolerant implementations. The system can generate quantum circuits optimized for specific quantum computing platforms, taking advantage of native gate sets and connectivity patterns.

AlphaTensor-Quantum addresses one of the fundamental challenges in quantum computing: translating mathematical operations into efficient quantum circuits. Traditional quantum algorithm development relies on human intuition and mathematical analysis, which can miss optimal solutions in the vast space of possible quantum circuits. The AI-driven approach can explore this space more systematically and discover surprising optimizations.

The research implications of AlphaTensor-Quantum extend beyond individual algorithm discovery to understanding fundamental limits of quantum computation. By systematically exploring quantum circuit spaces, the system can identify which operations benefit most from quantum speedups and guide the development of quantum applications. As quantum computers scale, AI-designed quantum algorithms could become essential for achieving practical quantum advantage.`
  },

  'honeywell-quantum-cloud-services': {
    vendor: 'Honeywell (now Quantinuum)',
    programming_languages: ['Python'],
    license_type: 'Commercial',
    content: `Honeywell Quantum Cloud Services (now part of Quantinuum's offerings) provided enterprise-grade cloud access to Honeywell's trapped ion quantum computers, representing one of the first commercial quantum computing services focused on high-fidelity quantum operations. The platform established many best practices for commercial quantum cloud services that continue to influence the industry.

The service architecture emphasized reliability, performance monitoring, and enterprise integration capabilities essential for business applications. Users could access Honeywell's H-Series trapped ion systems through dedicated cloud interfaces with priority queuing, detailed performance metrics, and guaranteed access levels. The platform included sophisticated error monitoring and quantum volume reporting to help users understand system capabilities and limitations.

Key features included native integration with hybrid quantum-classical workflows essential for near-term quantum applications, comprehensive quantum circuit optimization tools that leveraged the unique capabilities of trapped ion systems, and detailed quantum hardware characterization data for algorithm development. The service provided both API access for programmatic integration and graphical interfaces for interactive quantum algorithm development.

Honeywell Quantum Cloud Services pioneered several innovations in commercial quantum computing, including transparent quantum volume reporting that became an industry standard, mid-circuit measurement capabilities that enabled advanced quantum algorithms, and enterprise support services that helped businesses identify appropriate quantum applications. The platform's focus on quality over quantity influenced how the industry measures quantum computer performance.

The service's legacy continues through Quantinuum's integrated hardware-software platform, which builds on Honeywell's foundation while incorporating Cambridge Quantum Computing's software expertise. The emphasis on high-fidelity quantum operations and enterprise-grade service levels established by Honeywell's platform remains central to Quantinuum's commercial quantum computing offerings.`
  }
};

// Function to update software with content
async function updateAdditionalQuantumSoftware() {
  console.log('Starting to update additional quantum software with content...');

  for (const [slug, data] of Object.entries(additionalSoftwareContent)) {
    try {
      const updateData: any = { 
        main_content: data.content,
        updated_at: new Date().toISOString()
      };
      
      // Add optional fields if they exist
      if (data.vendor) {
        updateData.vendor = data.vendor;
      }
      if (data.programming_languages) {
        updateData.programming_languages = data.programming_languages;
      }
      if (data.license_type) {
        updateData.license_type = data.license_type;
      }

      const { error } = await supabase
        .from('quantum_software')
        .update(updateData)
        .eq('slug', slug);

      if (error) {
        console.error(`Error updating ${slug}:`, error);
      } else {
        console.log(`✓ Updated content for ${slug} (${data.vendor || 'N/A'})`);
      }
    } catch (error) {
      console.error(`Failed to update ${slug}:`, error);
    }
  }

  console.log('Completed updating additional quantum software!');
}

// Run the update
updateAdditionalQuantumSoftware().catch(console.error);