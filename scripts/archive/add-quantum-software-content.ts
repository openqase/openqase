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

// Content for quantum software platforms
const quantumSoftwareContent: Record<string, { 
  content: string; 
  vendor: string;
  programming_languages?: string[];
  license_type?: string;
}> = {
  'qiskit': {
    vendor: 'IBM',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `Qiskit is IBM's comprehensive open-source quantum computing software development kit, serving as one of the most widely adopted quantum programming frameworks in the world. First released in 2017, Qiskit has evolved into a complete ecosystem for quantum computing, providing tools for everything from circuit construction to advanced error mitigation and application development.

Qiskit's architecture is modular and extensible, consisting of several components: Terra for circuit construction and compilation, Aer for high-performance simulation, Ignis for noise characterization and error mitigation, and Nature for quantum chemistry and physics applications. The framework is built on Python, leveraging its extensive scientific computing ecosystem while providing intuitive abstractions for quantum programming. Qiskit's design philosophy emphasizes both accessibility for beginners and flexibility for advanced researchers.

As an open-source project with Apache 2.0 licensing, Qiskit has fostered a vibrant global community of contributors and users. IBM actively maintains the framework while encouraging community contributions, resulting in rapid feature development and extensive documentation. The Qiskit Textbook, community tutorials, and certification programs have made it a standard educational tool for quantum computing. Regular Qiskit Global Summer Schools and hackathons further strengthen the community ecosystem.

Key features that distinguish Qiskit include its comprehensive pulse-level control for quantum operations, advanced transpilation capabilities that optimize circuits for specific hardware, built-in error mitigation techniques like zero-noise extrapolation, and seamless integration with IBM Quantum hardware and simulators. The framework supports multiple quantum hardware backends through a unified interface, enabling code portability across different quantum systems. Recent additions include Qiskit Runtime for optimized execution of variational algorithms and Qiskit Machine Learning for quantum ML applications.

Qiskit's position in the quantum ecosystem is foundational, serving as both a research platform and a pathway to practical quantum applications. Its extensive use in academic research, with thousands of papers citing Qiskit, demonstrates its scientific impact. Corporate adoption for proof-of-concept projects validates its readiness for commercial exploration. As quantum computing matures, Qiskit continues to evolve, incorporating new algorithms, improving performance, and expanding its application libraries to meet the needs of an growing quantum developer community.`
  },

  'cirq': {
    vendor: 'Google',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `Cirq is Google's open-source quantum computing framework, designed specifically for creating, editing, and invoking Noisy Intermediate Scale Quantum (NISQ) circuits. Released in 2018, Cirq reflects Google's approach to quantum computing, emphasizing fine-grained control over quantum operations and optimization for near-term quantum hardware, particularly Google's own quantum processors.

The framework's architecture prioritizes flexibility and hardware awareness, allowing researchers to specify quantum operations at multiple levels of abstraction. Cirq provides native support for Google's quantum hardware topology, enabling efficient circuit compilation for processors like Sycamore. The framework includes sophisticated tools for circuit optimization, noise modeling, and simulation, making it particularly valuable for researchers working on quantum algorithms for NISQ devices. Cirq's design philosophy centers on giving users precise control over quantum operations while maintaining code readability.

Cirq's open-source nature under the Apache 2.0 license has attracted contributions from researchers worldwide, though the community is smaller than some other frameworks. Google maintains active development, regularly adding features based on internal research needs and community feedback. The framework benefits from Google's quantum computing expertise, with features often reflecting cutting-edge research from Google Quantum AI. Documentation includes detailed tutorials and examples, though it tends to assume more quantum computing knowledge than some competing frameworks.

Distinctive features of Cirq include its moment-based circuit model that naturally represents parallel quantum operations, sophisticated noise models that accurately reflect real quantum hardware behavior, and native integration with Google Cloud Platform for accessing Google's quantum processors. The framework excels at representing complex quantum operations like controlled rotations and multi-qubit gates. Cirq also provides powerful simulation capabilities, including wave function and density matrix simulators optimized for different circuit types.

Within the quantum software ecosystem, Cirq occupies a unique position as Google's primary interface to its quantum hardware while remaining hardware-agnostic enough for general use. Its influence on quantum algorithm development is significant, particularly for variational algorithms and quantum simulation. Researchers appreciate Cirq's flexibility and powerful features, though its learning curve can be steeper than more abstracted frameworks. As Google advances toward fault-tolerant quantum computing, Cirq continues to evolve, incorporating new capabilities for error correction and larger-scale quantum algorithms.`
  },

  'pennylane': {
    vendor: 'Xanadu',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `PennyLane is Xanadu's groundbreaking open-source software framework for quantum machine learning, quantum computing, and quantum chemistry. Launched in 2018, PennyLane has pioneered the integration of quantum computing with machine learning, introducing concepts like quantum differentiable programming and making quantum circuits trainable using standard machine learning tools.

The framework's revolutionary architecture treats quantum circuits as differentiable programs, enabling automatic differentiation through quantum operations. This approach allows quantum circuits to be trained using gradient-based optimization, similar to neural networks. PennyLane's device-agnostic design supports quantum hardware from multiple vendors including IBM, Google, Rigetti, and IonQ, as well as various simulators. The framework seamlessly integrates with popular machine learning libraries like TensorFlow, PyTorch, and JAX, enabling hybrid quantum-classical models.

PennyLane's open-source development under Apache 2.0 has created an enthusiastic community focused on quantum machine learning. Xanadu actively maintains the core framework while encouraging contributions, resulting in rapid expansion of functionality. The project's documentation is exceptional, featuring interactive tutorials, detailed API references, and a quantum machine learning course. The PennyLane blog and demos showcase cutting-edge applications, making complex concepts accessible to newcomers while providing depth for researchers.

Key features that set PennyLane apart include its automatic differentiation engine for quantum circuits, extensive library of quantum machine learning algorithms and templates, built-in quantum chemistry functionality through PennyLane-QChem, and support for photonic quantum computing through integration with Xanadu's Strawberry Fields. The framework's optimizer library includes quantum-aware optimization methods, and its measurement system supports various quantum observables. Recent additions include support for quantum natural gradient descent and quantum kernel methods.

PennyLane's ecosystem position is unique as the leading framework for quantum machine learning, bridging quantum computing and AI communities. Its influence extends beyond software to shaping how researchers approach quantum algorithms, emphasizing trainability and gradients. Academic adoption is strong, with numerous papers using PennyLane for quantum machine learning research. As quantum hardware improves, PennyLane's approach to quantum programming as differentiable computing positions it to play a crucial role in practical quantum applications, particularly in optimization and machine learning domains.`
  },

  'amazon-braket': {
    vendor: 'Amazon Web Services',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `Amazon Braket SDK is AWS's comprehensive quantum computing development toolkit, providing a unified interface to multiple quantum computing technologies through the cloud. Launched in 2020 alongside the Amazon Braket service, the SDK exemplifies AWS's approach to quantum computing: providing customers with choice and flexibility while leveraging cloud infrastructure for seamless scaling and integration.

The SDK's architecture reflects AWS's cloud-first philosophy, designed to work seamlessly with the broader AWS ecosystem. It provides a consistent interface for accessing quantum computers from IonQ, Rigetti, Oxford Quantum Circuits, and QuEra, as well as quantum annealers from D-Wave. The framework abstracts hardware differences while allowing hardware-specific optimizations when needed. Local simulation capabilities enable development and testing without consuming quantum device time, while integration with AWS services like S3 and CloudWatch enables enterprise-grade quantum workflows.

As an open-source project under Apache 2.0, the Braket SDK benefits from AWS's extensive resources and growing community contributions. Amazon maintains active development, regularly adding support for new quantum devices and features. The documentation follows AWS standards, providing comprehensive guides, API references, and example notebooks. The SDK's design prioritizes ease of use for cloud developers, making quantum computing accessible to those familiar with AWS but new to quantum programming.

Distinctive features of the Braket SDK include its hybrid job functionality for combining classical and quantum computation, native support for pulse-level control on supported devices, and cost tracking and management tools integrated with AWS billing. The SDK provides both abstract gate-based programming and analog Hamiltonian simulation for compatible hardware. Advanced features include parametric compilation for variational algorithms and automatic error mitigation on select devices. The framework also supports quantum annealing problem formulation for D-Wave systems.

Within the quantum software ecosystem, Amazon Braket SDK serves as a crucial enabler of quantum cloud computing, making diverse quantum technologies accessible through a unified platform. Its vendor-neutral approach allows users to experiment with different quantum computing paradigms without lock-in. The SDK's integration with AWS's massive cloud infrastructure positions it uniquely for hybrid quantum-classical applications at scale. As quantum computing matures toward practical applications, the Braket SDK's cloud-native design and multi-vendor support make it an important tool for enterprises exploring quantum computing.`
  },

  'microsoft-azure-quantum': {
    vendor: 'Microsoft',
    programming_languages: ['Q#', 'Python'],
    license_type: 'MIT',
    content: `Microsoft Azure Quantum's software stack, anchored by the Q# programming language and Quantum Development Kit (QDK), represents a comprehensive approach to quantum software development. First released in 2017, Q# was designed from the ground up as a domain-specific language for quantum computing, emphasizing algorithm expressiveness, hardware independence, and future scalability to fault-tolerant quantum computers.

Q# and the QDK's architecture reflects Microsoft's vision of quantum computing as a scalable, fault-tolerant technology. Q# is a strongly-typed, imperative language with quantum-specific features like qubit management, quantum control flow, and automatic adjoint generation. The QDK provides development tools including Visual Studio and VS Code extensions, quantum simulators ranging from full state to resource estimators, and libraries for quantum algorithms, chemistry, and machine learning. The stack integrates seamlessly with Azure Quantum cloud services, providing access to diverse quantum hardware.

Microsoft's open-source approach under MIT licensing has fostered a growing developer community around Q# and Azure Quantum. The company actively develops the core tools while encouraging community contributions, particularly to algorithm libraries. Documentation is extensive, including conceptual guides, API references, and the Quantum Development Kit samples repository. Microsoft Learn provides structured learning paths for quantum development, from basics to advanced topics. The Q# community, while smaller than Python-based frameworks, includes dedicated researchers and developers.

Key features distinguishing the Azure Quantum stack include Q#'s unique language features designed for quantum algorithm expression, resource estimation tools for predicting quantum computer requirements, integration with classical .NET languages for hybrid applications, and automatic compilation to different quantum hardware architectures. The quantum chemistry library provides state-of-the-art algorithms for molecular simulation. Recent additions include improved Python interoperability and Azure Quantum notebooks for cloud-based development.

Azure Quantum's position in the ecosystem is unique as both a programming language (Q#) and comprehensive development platform. Its emphasis on future fault-tolerant quantum computing influences algorithm development toward scalable solutions. The platform's cloud integration and enterprise features appeal to organizations planning long-term quantum strategies. As Microsoft advances its topological qubit program, the Azure Quantum stack is positioned to bridge current NISQ algorithms with future fault-tolerant quantum applications, making it a strategic choice for forward-looking quantum development.`
  },

  'pyquil': {
    vendor: 'Rigetti Computing',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `PyQuil is Rigetti Computing's Python library for quantum programming, providing a powerful and intuitive interface to Rigetti's quantum computers and the Quil quantum instruction language. First released in 2016, PyQuil was one of the earliest quantum programming frameworks, establishing many conventions that influenced subsequent quantum software development.

PyQuil's architecture centers around Quil (Quantum Instruction Language), a low-level quantum assembly language that provides fine-grained control over quantum operations. The framework offers Pythonic abstractions over Quil while maintaining the ability to drop down to assembly-level control when needed. PyQuil integrates tightly with Rigetti's Quantum Cloud Services (QCS), providing low-latency access to Rigetti's quantum processors. The framework includes a quantum virtual machine (QVM) for simulation and a optimizing compiler that targets Rigetti's hardware topology.

As an open-source project under Apache 2.0, PyQuil benefits from Rigetti's commitment to open quantum software development. The company actively maintains the framework while welcoming community contributions. Documentation includes comprehensive guides, API references, and example programs. The Forest SDK, which includes PyQuil, provides additional tools for quantum development. PyQuil's community includes researchers and developers who appreciate its balance of high-level abstractions and low-level control.

Distinctive features of PyQuil include its Quil language for precise quantum control, parametric compilation for efficient variational algorithms, native noise modeling based on Rigetti hardware characteristics, and shared memory for classical-quantum interaction in hybrid algorithms. The framework provides advanced features like compiler directives for optimization control and support for analog control through Quil-T. Recent developments include improved error mitigation techniques and enhanced support for pulse-level control.

Within the quantum software ecosystem, PyQuil occupies an important position as one of the pioneering frameworks that demonstrated practical quantum programming. Its influence on quantum software architecture is significant, particularly the concept of quantum assembly languages. PyQuil's tight integration with Rigetti hardware makes it the optimal choice for leveraging Rigetti's quantum computers. As Rigetti advances toward larger quantum processors and quantum advantage applications, PyQuil continues to evolve, incorporating lessons learned from real quantum hardware operation while maintaining its philosophy of providing both power and accessibility.`
  },

  'd-wave-ocean-sdk': {
    vendor: 'D-Wave Systems',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `D-Wave Ocean SDK is a comprehensive suite of open-source Python tools for solving optimization problems on D-Wave's quantum annealing systems. As the primary interface to the world's first commercially available quantum computers, Ocean has evolved since its release to provide sophisticated tools for formulating, solving, and analyzing quadratic unconstrained binary optimization (QUBO) problems and Ising models.

The SDK's architecture reflects the unique nature of quantum annealing, differing fundamentally from gate-based quantum computing frameworks. Ocean provides multiple abstraction levels: low-level interfaces for direct quantum processor access, mid-level tools for problem embedding and parameter tuning, and high-level solvers that automatically handle problem decomposition and embedding. The framework includes classical solvers for testing and hybrid quantum-classical solvers that partition problems between classical and quantum resources. This layered approach makes quantum annealing accessible while providing experts with fine control.

Ocean's open-source development under Apache 2.0 has created a specialized community focused on optimization applications. D-Wave actively maintains the core SDK while encouraging contributions, particularly to problem formulation tools and industry-specific applications. Documentation is extensive, covering both theoretical foundations of quantum annealing and practical programming guides. The D-Wave Learning platform provides interactive tutorials and real-world examples. The Ocean community includes researchers and practitioners from operations research, machine learning, and various industries.

Key features of Ocean SDK include problem formulation tools that translate high-level problems to QUBO format, embedding algorithms that map logical problems to physical quantum topology, classical and quantum-classical hybrid solvers for problems of varying sizes, and performance analysis tools for solution quality assessment. The SDK provides specialized libraries for common optimization patterns like constraint satisfaction, graph problems, and machine learning. Recent additions include improved hybrid solvers and tools for quantum-classical decomposition.

Ocean SDK's ecosystem position is unique as the primary interface to quantum annealing technology, which has found practical applications years before gate-based quantum advantage. Its focus on optimization problems appeals to industries with complex scheduling, routing, and resource allocation challenges. The SDK's maturity, with years of production use, provides stability that newer frameworks lack. As D-Wave expands into gate-based quantum computing while advancing annealing technology, Ocean SDK continues to evolve, bridging practical optimization applications with emerging quantum computing paradigms.`
  },

  'tket': {
    vendor: 'Quantinuum',
    programming_languages: ['Python', 'C++'],
    license_type: 'Apache 2.0',
    content: `TKET (pronounced "ticket") is Quantinuum's advanced quantum compiler and optimization framework, representing one of the most sophisticated quantum software compilation tools available. Originally developed by Cambridge Quantum Computing before the merger with Honeywell Quantum Solutions, TKET has become a crucial component in the quantum software stack, optimizing quantum circuits for execution on various quantum hardware platforms.

TKET's architecture embodies deep compiler design principles adapted for quantum computing's unique challenges. The framework performs advanced circuit optimization using ZX-calculus and other mathematical techniques, reducing circuit depth and gate count while preserving quantum computation semantics. TKET's retargetable design supports multiple quantum hardware backends, automatically adapting circuits to different qubit topologies and gate sets. The compiler includes sophisticated noise-aware optimization that considers hardware error characteristics when optimizing circuits.

As an open-source project under Apache 2.0, TKET has attracted a community of quantum algorithm developers and researchers interested in circuit optimization. Quantinuum actively develops the core compiler while encouraging contributions, particularly to backend integrations and optimization passes. Documentation includes detailed technical guides explaining optimization techniques and API references for both Python (pytket) and C++ interfaces. The framework's theoretical foundations are well-documented in academic papers, making it valuable for research.

Distinctive features of TKET include its mathematically rigorous optimization using ZX-calculus, support for multiple quantum computing platforms through a unified interface, and advanced qubit routing algorithms for limited connectivity hardware. The compiler provides circuit analysis tools for resource estimation and verification. TKET's optimization passes can significantly reduce circuit depth, crucial for NISQ-era quantum computers. Recent developments include enhanced support for mid-circuit measurements and improved optimization for variational algorithms.

Within the quantum software ecosystem, TKET serves a critical role as a vendor-neutral compiler that improves quantum algorithm execution across different platforms. Its sophisticated optimization capabilities often yield significant performance improvements, making quantum algorithms more practical on current hardware. TKET's influence extends beyond compilation to quantum algorithm design, as developers increasingly consider compiler capabilities when designing algorithms. As quantum hardware scales toward fault tolerance, TKET's role in efficiently mapping logical quantum circuits to physical hardware becomes increasingly vital for practical quantum computing.`
  },

  'tensorflow-quantum': {
    vendor: 'Google',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `TensorFlow Quantum (TFQ) is Google's quantum machine learning library that brings quantum computing capabilities to TensorFlow's ecosystem. Released in 2020, TFQ represents a collaboration between Google Research, X, and external contributors, designed to make quantum machine learning accessible to the vast TensorFlow community while providing researchers with tools for exploring quantum-classical hybrid algorithms.

TFQ's architecture seamlessly integrates with TensorFlow's computation graph model, treating quantum circuits as differentiable operations within larger machine learning models. The library provides quantum layers that can be combined with classical neural network layers, enabling true hybrid quantum-classical models. TFQ uses Cirq for quantum circuit construction and simulation, while leveraging TensorFlow's automatic differentiation for training quantum parameters. This design allows quantum circuits to be trained using standard TensorFlow optimizers and integrated into existing machine learning pipelines.

As an open-source project under Apache 2.0, TensorFlow Quantum benefits from both Google's resources and the broader TensorFlow community. Google maintains active development, focusing on performance optimization and new quantum machine learning primitives. Documentation follows TensorFlow standards, providing tutorials, guides, and API references. The library includes numerous examples demonstrating quantum machine learning applications, from quantum neural networks to quantum reinforcement learning.

Key features of TensorFlow Quantum include quantum circuit layers that integrate with Keras models, automatic differentiation through quantum circuits for gradient-based training, and high-performance quantum circuit simulation optimized for machine learning workloads. The library provides tools for quantum data encoding and feature maps, quantum kernel methods, and variational quantum algorithms. TFQ supports both state vector and sampling-based training, with batch processing for efficient computation. Recent additions include improved support for noise models and quantum natural gradients.

TensorFlow Quantum's position in the ecosystem bridges the quantum computing and machine learning communities, making quantum machine learning accessible to millions of TensorFlow users. Its integration with the broader TensorFlow ecosystem enables sophisticated applications combining classical deep learning with quantum processing. TFQ has accelerated research in quantum machine learning, with numerous papers exploring novel architectures and applications. As quantum hardware improves, TensorFlow Quantum's established integration with production machine learning infrastructure positions it to enable practical quantum machine learning applications at scale.`
  },

  'qiskit-nature': {
    vendor: 'IBM',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `Qiskit Nature is IBM's specialized quantum computing framework for quantum chemistry and physics applications, providing state-of-the-art algorithms for molecular simulation and materials science. Part of the broader Qiskit ecosystem, Nature evolved from Qiskit Aqua to become a dedicated library for natural science applications, offering both near-term variational algorithms and fault-tolerant quantum algorithms for chemical simulation.

The framework's architecture provides comprehensive tools for quantum chemistry workflows, from molecular structure input to property calculation. Qiskit Nature integrates with classical quantum chemistry packages like PySCF and Gaussian, enabling seamless transition from classical to quantum calculations. The library implements various quantum algorithms including Variational Quantum Eigensolver (VQE), Quantum Phase Estimation, and excited state algorithms. Problem formulation tools automatically convert chemical problems into qubit operators, handling complex transformations like Jordan-Wigner and Bravyi-Kitaev.

As part of Qiskit's open-source ecosystem under Apache 2.0, Nature benefits from active development by IBM Research and community contributions. The library is maintained by quantum chemistry experts who ensure algorithmic correctness and efficiency. Documentation includes theoretical background on quantum chemistry algorithms, practical tutorials for molecular simulation, and comprehensive API references. The Qiskit Textbook includes dedicated sections on quantum chemistry applications, making the field accessible to quantum computing newcomers.

Distinctive features of Qiskit Nature include its comprehensive molecular and solid-state Hamiltonians, support for various fermion-to-qubit mappings optimized for different problems, and built-in Active Space selection for reducing problem complexity. The library provides tools for computing various molecular properties including dipole moments and transition amplitudes. Nature implements state-of-the-art error mitigation techniques crucial for chemistry applications on NISQ devices. Recent developments include improved support for periodic systems and enhanced excited state algorithms.

Within the quantum software ecosystem, Qiskit Nature serves as a crucial bridge between quantum computing and computational chemistry communities. Its comprehensive feature set and integration with established chemistry software make it a standard tool for quantum chemistry research. Academic and industrial researchers use Nature for drug discovery, catalyst design, and materials science applications. As quantum hardware advances toward chemical accuracy, Qiskit Nature's robust algorithmic foundation and continuous development position it to enable breakthrough applications in chemistry and materials science.`
  },

  'openfermion': {
    vendor: 'Google',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `OpenFermion is Google's open-source library for quantum simulation of fermionic systems, particularly quantum chemistry and condensed matter physics. Launched in 2017 as one of the first specialized quantum chemistry libraries, OpenFermion has become a foundational tool in quantum computational chemistry, providing essential algorithms and utilities for simulating electrons in molecules and materials.

The library's architecture focuses on the fundamental task of translating fermionic problems into qubit representations suitable for quantum computers. OpenFermion provides tools for generating molecular Hamiltonians from various sources, implementing fermion-to-qubit transformations like Jordan-Wigner and Bravyi-Kitaev, and optimizing resulting qubit operators. The framework is intentionally hardware-agnostic, producing outputs compatible with various quantum programming frameworks including Cirq, Qiskit, and PySCF. This interoperability has made OpenFermion a common foundation for quantum chemistry applications.

OpenFermion's development as an open-source project under Apache 2.0 has fostered a collaborative community of quantum chemistry and physics researchers. Google maintains core development while accepting significant community contributions, particularly for new algorithms and chemical systems. Documentation includes detailed mathematical descriptions of implemented algorithms, tutorials for common chemistry simulations, and comprehensive API documentation. The project's academic focus is evident in its extensive citations in quantum chemistry literature.

Key features of OpenFermion include comprehensive tools for molecular integral generation and manipulation, efficient implementations of fermion-to-qubit mappings with symmetry considerations, and algorithms for Hamiltonian simulation including Trotter-Suzuki decompositions. The library provides utilities for working with fermionic operators and their algebra, tools for reducing qubit requirements through symmetries and active space approximations, and interfaces to classical quantum chemistry packages. Recent additions include improved support for periodic systems and relativistic effects.

OpenFermion's position in the quantum ecosystem is foundational for quantum chemistry applications, serving as a building block for higher-level frameworks. Its influence on quantum algorithm development for chemistry is significant, with many papers using OpenFermion for prototyping and benchmarking. The library's focus on mathematical rigor and algorithmic efficiency has set standards for quantum chemistry software. As quantum computers approach chemical accuracy, OpenFermion's comprehensive toolkit for fermionic simulation remains essential for developing and implementing quantum chemistry algorithms.`
  },

  'pulser': {
    vendor: 'Pasqal',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `Pulser is Pasqal's open-source framework for programming neutral atom quantum computers, providing an intuitive interface for designing and simulating analog quantum processing protocols. Released in 2020, Pulser addresses the unique programming needs of neutral atom platforms, where qubits are individual atoms trapped in optical tweezers and controlled by laser pulses, enabling both digital and analog quantum computation.

Pulser's architecture reflects the physics of neutral atom quantum computing, providing abstractions that map directly to experimental controls. The framework allows users to define atomic arrays in arbitrary geometries, specify time-dependent pulse sequences for quantum evolution, and simulate the resulting quantum dynamics. Pulser handles the complex physics of Rydberg atom interactions, making it accessible to users without deep atomic physics knowledge. The library includes both emulator backends for classical simulation and interfaces to Pasqal's quantum processors.

As an open-source project under Apache 2.0, Pulser has attracted interest from researchers exploring neutral atom quantum computing. Pasqal actively develops the framework while encouraging community contributions, particularly for new pulse sequences and applications. Documentation includes tutorials covering basic concepts of neutral atom quantum computing, examples of common quantum algorithms and simulations, and detailed API references. Pulser Studio provides a visual interface for designing pulse sequences, making the platform accessible to newcomers.

Distinctive features of Pulser include its ability to specify arbitrary atomic arrangements for problem encoding, sophisticated pulse sequence design tools with multiple addressing modes, and built-in physics simulation of Rydberg atom dynamics. The framework provides tools for quantum optimization protocols like Quantum Approximate Optimization Algorithm (QAOA) adapted for analog quantum processing. Pulser includes noise models specific to neutral atom systems and supports both analog Hamiltonian evolution and digital gate implementations. Recent developments include improved simulation performance and enhanced support for variational algorithms.

Within the quantum software ecosystem, Pulser occupies a unique niche as the primary framework for neutral atom quantum programming. Its focus on analog quantum processing provides an alternative paradigm to gate-based quantum computing, particularly suited for optimization problems with geometric structure. Pulser has enabled research in quantum simulation of many-body physics and combinatorial optimization. As neutral atom platforms scale to thousands of qubits, Pulser's role in making this technology accessible becomes increasingly important for quantum algorithm development and applications.`
  },

  'strawberry-fields': {
    vendor: 'Xanadu',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `Strawberry Fields is Xanadu's quantum programming framework for photonic quantum computing, providing tools for designing and simulating continuous-variable (CV) quantum circuits. Released in 2018, Strawberry Fields pioneered software development for photonic quantum computers, where quantum information is encoded in the continuous properties of light such as amplitude and phase rather than discrete qubit states.

The framework's architecture accommodates the unique features of photonic quantum computing, providing operations native to optical systems like squeezing, displacement, and beam splitting. Strawberry Fields uses a quantum circuit model adapted for continuous variables, with gates representing optical transformations. The library includes multiple simulator backends optimized for different types of photonic circuits, from Gaussian states to full Fock basis simulations. Integration with Xanadu's photonic quantum hardware enables execution of programs on real quantum devices.

Strawberry Fields' open-source development under Apache 2.0 has created a specialized community interested in photonic quantum computing. Xanadu maintains active development while welcoming contributions, particularly for new applications and protocols. Documentation is comprehensive, covering both theoretical foundations of CV quantum computing and practical programming guides. The framework includes numerous examples demonstrating applications from quantum machine learning to graph optimization problems suited to photonic hardware.

Key features of Strawberry Fields include native photonic operations like squeezing, displacement, and interferometry, multiple simulation backends optimized for different circuit classes, and tools for Gaussian boson sampling and other photonic protocols. The framework provides quantum machine learning capabilities through integration with PennyLane, support for both discrete and continuous-variable measurements, and optimization tools for circuit parameters. Recent additions include improved support for time-domain multiplexing and enhanced simulation capabilities for larger photonic circuits.

Strawberry Fields' position in the quantum ecosystem is unique as the primary framework for continuous-variable quantum computing. Its influence extends beyond software to shaping how researchers approach photonic quantum algorithms. The framework has enabled research in quantum machine learning with continuous variables, quantum simulation of vibronic spectra, and graph optimization problems. As photonic quantum computers scale and find applications in quantum networking and communication, Strawberry Fields' role as the gateway to photonic quantum programming becomes increasingly significant.`
  },

  'quantum-development-kit-qdk': {
    vendor: 'Microsoft',
    programming_languages: ['Q#', 'Python', 'C#'],
    license_type: 'MIT',
    content: `The Quantum Development Kit (QDK) is Microsoft's comprehensive toolkit for quantum programming, centered around the Q# programming language and providing everything needed to develop quantum applications. First released in 2017, the QDK represents Microsoft's vision of quantum computing as a scalable technology requiring purpose-built development tools, distinguishing itself through its focus on future fault-tolerant quantum computing.

The QDK's architecture encompasses multiple components working together to provide a complete quantum development experience. At its core is Q#, a domain-specific language designed for expressing quantum algorithms with features like automatic adjoint generation and quantum-specific type systems. The kit includes quantum simulators ranging from full state vector to resource estimators, development tools for Visual Studio and VS Code, and libraries for quantum algorithms, chemistry, and machine learning. Integration with Azure Quantum provides cloud access to diverse quantum hardware while maintaining local development capabilities.

Microsoft's commitment to open-source development under MIT license has fostered a growing ecosystem around the QDK. The company actively develops core components while encouraging community contributions to libraries and samples. Documentation is extensive, including conceptual guides to quantum computing, Q# language references, and library documentation. Microsoft Learn provides structured quantum development courses, while the Q# blog shares insights from Microsoft's quantum research team.

Distinctive features of the QDK include resource estimation tools predicting requirements for large-scale quantum algorithms, integration with .NET ecosystem enabling hybrid classical-quantum applications, and automatic generation of adjoint and controlled operations from base implementations. The kit provides sophisticated debugging tools for quantum programs, chemistry libraries implementing state-of-the-art quantum algorithms, and machine learning libraries for quantum classification and clustering. Recent enhancements include improved Python interoperability and support for quantum intermediate representation (QIR).

The QDK's ecosystem position is unique as both a development environment and a bridge to Microsoft's quantum cloud services. Its emphasis on fault-tolerant quantum computing influences developers to think beyond NISQ limitations. The kit's comprehensive tooling and enterprise integration features appeal to organizations planning long-term quantum strategies. As Microsoft advances its topological qubit program, the QDK is positioned to enable the transition from current experimental quantum programming to future production quantum applications.`
  },

  'nvidia-cuquantum-sdk': {
    vendor: 'NVIDIA',
    programming_languages: ['Python', 'C++'],
    license_type: 'Proprietary',
    content: `NVIDIA cuQuantum SDK is a high-performance library suite for accelerating quantum circuit simulation on NVIDIA GPUs, representing the convergence of classical HPC and quantum computing. Released in 2021, cuQuantum leverages NVIDIA's GPU expertise to provide unprecedented simulation capabilities, enabling researchers to simulate larger quantum circuits than previously possible on classical hardware.

cuQuantum's architecture maximizes GPU utilization through optimized CUDA kernels for quantum operations, efficient memory management for large state vectors, and multi-GPU scaling for distributed simulation. The SDK includes cuStateVec for state vector simulation, cuTensorNet for tensor network methods, and integration layers for popular quantum frameworks. By utilizing tensor cores and advanced GPU features, cuQuantum achieves orders of magnitude speedup over CPU-based simulators for many quantum circuits.

While proprietary, NVIDIA provides cuQuantum free for research and development, fostering adoption in the quantum community. The company actively develops the SDK based on feedback from quantum researchers and framework developers. Documentation includes performance guides, integration examples, and best practices for GPU-accelerated quantum simulation. NVIDIA's quantum team engages with the community through conferences and collaborations, sharing optimization techniques and benchmarks.

Key features of cuQuantum include state vector simulators supporting up to 40 qubits on a single DGX system, tensor network contractors enabling simulation of deeper circuits with more qubits, and optimized implementations of common quantum gates and operations. The SDK provides multi-GPU support for distributed quantum simulation, integration APIs for frameworks like Qiskit, Cirq, and PennyLane, and tools for quantum circuit optimization and analysis. Recent developments include improved tensor network algorithms and support for approximate simulation methods.

Within the quantum ecosystem, cuQuantum serves a critical role in extending the reach of classical quantum simulation, essential for algorithm development and verification. Its performance enables researchers to prototype quantum algorithms for larger problems, validate quantum hardware results, and explore the boundary between classical and quantum computation. As quantum hardware scales, cuQuantum's role in verification and benchmarking becomes increasingly important. The SDK's integration with quantum frameworks ensures GPU acceleration benefits the entire quantum community, making it an essential tool for quantum research and development.`
  },

  'classiq-platform': {
    vendor: 'Classiq',
    programming_languages: ['Python'],
    license_type: 'Proprietary',
    content: `The Classiq Platform represents a paradigm shift in quantum software development, providing the first quantum algorithm design platform that automatically synthesizes quantum circuits from high-level functional models. Launched in 2020, Classiq addresses the complexity barrier in quantum programming by allowing developers to specify what they want to compute rather than how to construct quantum circuits, similar to how high-level programming languages abstract assembly code.

Classiq's architecture employs sophisticated synthesis algorithms that translate functional specifications into optimized quantum circuits. The platform uses constraint-based optimization to generate circuits that meet specified requirements for depth, gate count, and hardware topology. This approach dramatically reduces the expertise required for quantum programming while often producing more efficient circuits than manual construction. The platform includes a modeling language for quantum algorithms, synthesis engine, and optimization tools that work together to automate quantum software development.

As a proprietary platform, Classiq maintains tight control over its core technology while providing extensive interfaces for integration. The company actively develops the platform based on customer needs and research advances. Documentation includes comprehensive guides for quantum algorithm modeling, tutorials for various application domains, and detailed API references. Classiq provides extensive customer support and training, helping organizations adopt quantum computing without deep quantum expertise.

Distinctive features of the Classiq Platform include automatic quantum circuit synthesis from high-level specifications, hardware-aware optimization adapting circuits to specific quantum computers, and built-in implementations of common quantum algorithms and subroutines. The platform provides visualization tools for understanding generated circuits, integration with major quantum cloud providers and frameworks, and support for both NISQ and fault-tolerant algorithm development. Recent additions include improved synthesis algorithms and domain-specific libraries for finance and chemistry.

Classiq's position in the quantum ecosystem is unique as an abstraction layer above traditional quantum programming frameworks. Its approach to quantum algorithm design as a synthesis problem rather than programming challenge could democratize quantum computing by making it accessible to domain experts without quantum physics knowledge. Enterprise adoption is growing as organizations recognize the platform's ability to accelerate quantum application development. As quantum computing matures, Classiq's high-level approach may become essential for managing the complexity of large-scale quantum algorithms.`
  },

  'qc-ware-forge': {
    vendor: 'QC Ware',
    programming_languages: ['Python'],
    license_type: 'Proprietary',
    content: `QC Ware Forge is an enterprise quantum computing platform that provides turnkey quantum algorithms for optimization, machine learning, and simulation. Designed for data scientists and analysts without quantum expertise, Forge abstracts the complexity of quantum programming while providing access to multiple quantum hardware backends and powerful classical simulators optimized for near-term quantum algorithms.

Forge's architecture focuses on delivering quantum algorithms as high-level functions that integrate with existing data science workflows. The platform automatically handles quantum circuit construction, optimization, and execution across different hardware backends. Forge includes proprietary algorithms developed by QC Ware's research team, including quantum machine learning methods and optimization solvers. The platform's cloud-based design enables scalable execution while maintaining enterprise security and compliance requirements.

As a proprietary platform, QC Ware maintains full control over Forge's development, focusing on customer-driven features and performance optimization. The company provides extensive support including training, consultation, and custom algorithm development. Documentation includes practical guides for applying quantum algorithms to business problems, case studies from various industries, and detailed API documentation. QC Ware's team of quantum algorithm experts ensures the platform incorporates latest research advances.

Key features of Forge include pre-built quantum algorithms for common business applications, automatic selection of optimal quantum or classical solvers, and support for multiple quantum hardware providers through a unified interface. The platform provides data integration tools for enterprise systems, performance benchmarking and comparison with classical methods, and collaborative features for team-based quantum project development. Recent enhancements include improved quantum machine learning algorithms and expanded optimization problem types.

Within the quantum ecosystem, Forge serves as a bridge between quantum computing research and practical business applications. Its focus on accessibility without sacrificing capability makes it valuable for enterprises exploring quantum computing. The platform's algorithm library, developed through extensive research and customer engagements, provides proven solutions for real-world problems. As quantum hardware improves, Forge's abstraction layer and algorithm expertise position it to deliver quantum advantage to enterprises without requiring internal quantum expertise.`
  },

  '1qbit-platform': {
    vendor: '1QBit',
    programming_languages: ['Python'],
    license_type: 'Proprietary',
    content: `The 1QBit Platform is a comprehensive quantum-ready software platform that provides advanced algorithms and applications spanning quantum computing, quantum-inspired classical computing, and machine learning. Since 2012, 1QBit has developed this platform to bridge the gap between current quantum hardware limitations and practical business applications, offering solutions that work today while preparing for tomorrow's quantum advantage.

The platform's architecture embodies 1QBit's hardware-agnostic philosophy, providing algorithms that can run on various quantum processors, quantum annealers, and classical HPC systems. This flexibility ensures applications remain valuable regardless of which quantum technology ultimately succeeds. The platform includes specialized solvers for optimization, simulation, and machine learning, with intelligent routing to appropriate hardware based on problem characteristics. 1QBit's algorithms often combine quantum and classical processing for optimal performance.

As a proprietary platform developed through extensive research and customer engagements, 1QBit maintains strict quality control while collaborating with hardware partners and customers. The company provides comprehensive support including problem formulation assistance, custom algorithm development, and performance optimization. Documentation focuses on practical applications rather than quantum mechanics, making the platform accessible to domain experts. 1QBit's research team continuously updates algorithms based on latest advances and hardware improvements.

Distinctive features include QEMIST for quantum-enhanced molecular simulation, advanced portfolio optimization for financial applications, and machine learning tools leveraging quantum-inspired algorithms. The platform provides problem decomposition tools for handling large-scale optimization, benchmarking frameworks comparing quantum and classical performance, and APIs supporting integration with enterprise systems. Recent developments include enhanced drug discovery capabilities and improved quantum machine learning algorithms.

1QBit's platform occupies a unique position as one of the most mature quantum software platforms, with years of development and real-world deployment. Its focus on near-term applications while building toward quantum advantage has influenced how the industry approaches quantum software. The platform's success in delivering value with current technology while preparing for future quantum computers makes it a strategic choice for organizations seeking practical quantum computing benefits. As quantum hardware matures, 1QBit's extensive algorithm library and application expertise position it to enable widespread quantum adoption.`
  },

  'bloqade': {
    vendor: 'QuEra Computing',
    programming_languages: ['Julia'],
    license_type: 'Apache 2.0',
    content: `Bloqade is QuEra Computing's open-source software package for quantum simulation and computation with neutral atom arrays. Written in Julia for high performance, Bloqade provides tools for programming QuEra's Aquila quantum computer and simulating neutral atom dynamics, making Rydberg atom quantum computing accessible to researchers and developers.

Bloqade's architecture leverages Julia's scientific computing capabilities to efficiently simulate the complex dynamics of interacting Rydberg atoms. The framework provides intuitive abstractions for defining atomic geometries, specifying time-dependent Hamiltonian evolution, and analyzing quantum states. Bloqade handles the physics of Rydberg blockade and long-range interactions, enabling users to focus on algorithm design rather than atomic physics details. The package includes both exact and approximate simulation methods scalable to different system sizes.

As an open-source project under Apache 2.0, Bloqade benefits from QuEra's quantum expertise and the Julia scientific computing community. QuEra actively develops the package while encouraging contributions, particularly for new algorithms and applications. Documentation includes tutorials on neutral atom quantum computing, examples of optimization and simulation protocols, and comprehensive API references. The Julia ecosystem integration provides access to powerful scientific computing tools.

Key features of Bloqade include flexible specification of atomic positions in 1D, 2D, and 3D arrays, time-dependent Hamiltonian programming with multiple pulse channels, and efficient simulation using various methods from exact diagonalization to mean-field. The framework provides tools for quantum optimization including QAOA implementations, visualization of atomic configurations and quantum dynamics, and integration with QuEra's Aquila hardware through cloud access. Recent additions include improved simulation performance and enhanced support for variational algorithms.

Within the quantum software ecosystem, Bloqade represents the growing importance of analog quantum computing paradigms. Its focus on neutral atom platforms provides access to a rapidly advancing quantum technology with unique scaling advantages. The framework's Julia implementation offers performance benefits for numerical simulation while maintaining ease of use. As neutral atom quantum computers scale to thousands of atoms, Bloqade's role in algorithm development and education becomes increasingly significant for the quantum community.`
  },

  'forest-sdk': {
    vendor: 'Rigetti Computing',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `Forest SDK is Rigetti Computing's comprehensive quantum development platform, encompassing PyQuil for quantum programming, the Quil compiler for circuit optimization, and the Quantum Virtual Machine (QVM) for simulation. First released in 2017, Forest established many conventions in quantum software development and remains one of the most complete quantum development environments, particularly optimized for Rigetti's quantum processors.

Forest's architecture provides an integrated quantum development experience from algorithm design to hardware execution. The SDK includes PyQuil for high-level quantum programming in Python, quilc compiler for optimizing quantum circuits, QVM for noiseless and noisy simulation, and integration with Rigetti's Quantum Cloud Services. The platform's design emphasizes both ease of use for quantum algorithm development and low-level control for optimization. Forest's tools work together seamlessly while remaining modular for specialized use cases.

As an open-source project under Apache 2.0, Forest has fostered a community of quantum developers and researchers. Rigetti maintains active development of core components while welcoming community contributions. Documentation is comprehensive, including conceptual guides, tutorials, and detailed API references. The Forest community has produced numerous examples and applications, from quantum machine learning to quantum chemistry. Rigetti's commitment to open development has influenced broader quantum software practices.

Distinctive features of Forest include the Quil quantum instruction language for precise control, parametric compilation for efficient variational algorithms, and realistic noise models based on Rigetti hardware characterization. The SDK provides shared memory for classical-quantum interaction, advanced compiler directives for optimization control, and support for pulse-level control through Quil-T. Recent developments include improved error mitigation techniques and enhanced support for multi-chip quantum processors.

Forest SDK's position in the quantum ecosystem reflects Rigetti's integrated approach to quantum computing. As one of the early comprehensive quantum development platforms, Forest influenced subsequent framework design. Its tight integration with Rigetti hardware makes it optimal for leveraging Rigetti's quantum computers, while its open-source nature ensures broad applicability. As Rigetti advances toward quantum advantage applications, Forest continues evolving, incorporating lessons from real quantum hardware operation while maintaining accessibility for quantum developers.`
  },

  'qibo': {
    vendor: 'Qilimanjaro/TII',
    programming_languages: ['Python'],
    license_type: 'Apache 2.0',
    content: `Qibo is an open-source quantum computing framework designed for quantum simulation and hardware control, developed through collaboration between several European institutions including Qilimanjaro and the Technology Innovation Institute. Emphasizing performance and hardware abstraction, Qibo provides a full-stack quantum computing framework from high-level algorithm implementation to low-level hardware control.

Qibo's architecture prioritizes modularity and performance, with backends ranging from numpy-based simulation to GPU acceleration and quantum hardware. The framework provides a clean API for quantum circuit construction while maintaining flexibility for advanced use cases. Qibo includes Qibolab for quantum hardware control, Qibocal for calibration, and Qibosoq for pulse sequence generation. This comprehensive approach makes Qibo suitable for both algorithm development and experimental quantum physics research.

As an open-source project under Apache 2.0, Qibo benefits from collaborative development across multiple European quantum initiatives. The development team maintains active progress on core features while welcoming contributions. Documentation includes theoretical background, practical tutorials, and comprehensive API references. Qibo's European focus has created a community particularly strong in quantum annealing and analog quantum simulation applications.

Key features of Qibo include multiple simulation backends with automatic selection based on circuit characteristics, hardware control layers for real quantum devices, and calibration and characterization tools for quantum processors. The framework provides quantum machine learning capabilities, support for variational and annealing algorithms, and integration with European quantum computing infrastructure. Recent developments include improved GPU acceleration and enhanced support for quantum optimal control.

Within the quantum ecosystem, Qibo represents European efforts to develop sovereign quantum computing capabilities. Its comprehensive approach from algorithms to hardware control makes it valuable for quantum computing research and development. The framework's emphasis on performance and hardware integration appeals to researchers working closely with quantum hardware. As European quantum initiatives advance, Qibo's role in providing open-source tools for the complete quantum stack becomes increasingly important for the region's quantum sovereignty.`
  },

  'inquanto': {
    vendor: 'Quantinuum',
    programming_languages: ['Python'],
    license_type: 'Proprietary',
    content: `InQuanto is Quantinuum's comprehensive platform for quantum computational chemistry, providing state-of-the-art algorithms and workflows for molecular simulation on quantum computers. Built on Quantinuum's deep expertise in both quantum computing and quantum chemistry software, InQuanto represents one of the most advanced platforms for applying quantum computing to chemical and materials science problems.

InQuanto's architecture integrates seamlessly with established computational chemistry workflows while providing access to cutting-edge quantum algorithms. The platform handles the complete pipeline from molecular structure input to property calculation, automatically selecting appropriate quantum algorithms and hardware backends. InQuanto leverages TKET for circuit optimization, ensuring efficient execution on various quantum hardware platforms. The framework includes proprietary algorithms developed by Quantinuum's research team for improved accuracy and efficiency.

As a proprietary platform, InQuanto benefits from Quantinuum's integrated hardware-software approach and extensive chemistry expertise. The company provides comprehensive support including training, consultation, and custom development for specific chemistry applications. Documentation covers both theoretical foundations and practical applications, with case studies from pharmaceutical and materials companies. InQuanto's development is driven by real-world chemistry requirements and validated through extensive benchmarking.

Distinctive features include advanced embedding techniques for treating large molecular systems, state-of-the-art quantum algorithms for ground and excited states, and automatic selection of optimal fermion-to-qubit mappings. The platform provides integration with classical quantum chemistry packages, built-in error mitigation optimized for chemistry applications, and support for both NISQ and fault-tolerant algorithms. Recent enhancements include improved treatment of strongly correlated systems and expanded capabilities for periodic materials.

InQuanto's position in the quantum ecosystem reflects Quantinuum's leadership in quantum computational chemistry. Its comprehensive features and proven accuracy make it a preferred choice for pharmaceutical and materials companies exploring quantum computing. The platform's ability to deliver meaningful results on current quantum hardware while preparing for fault-tolerant systems makes it strategically valuable. As quantum computers approach chemical accuracy, InQuanto's sophisticated algorithms and chemistry expertise position it to enable breakthrough applications in drug discovery and materials design.`
  },

  'xanadu-cloud': {
    vendor: 'Xanadu',
    programming_languages: ['Python'],
    license_type: 'Proprietary',
    content: `Xanadu Cloud is a quantum computing cloud platform that provides access to Xanadu's photonic quantum computers and advanced simulation capabilities. Launched alongside Xanadu's Borealis processor, the platform represents a unique offering in quantum cloud services, focusing on photonic quantum computing and its distinctive advantages for certain computational tasks.

The platform's architecture leverages Xanadu's expertise in photonic quantum computing to provide specialized services for problems suited to this paradigm. Xanadu Cloud offers access to Borealis for Gaussian boson sampling and related algorithms, high-performance simulators for photonic circuits, and integration with PennyLane for quantum machine learning. The platform handles job scheduling, resource allocation, and result retrieval, providing a seamless experience for running quantum programs on photonic hardware.

While the cloud service is proprietary, Xanadu maintains open development of supporting tools like Strawberry Fields and PennyLane. The company actively engages with users to improve the platform based on research needs and application requirements. Documentation includes guides for using photonic quantum computers, tutorials on applications suited to photonic hardware, and best practices for achieving optimal performance. Xanadu provides support for researchers exploring photonic quantum computing applications.

Key features of Xanadu Cloud include access to Borealis with its 216 squeezed-state qubits, specialized algorithms for graph optimization and quantum chemistry, and high-performance simulation of Gaussian states and boson sampling. The platform provides integration with machine learning workflows through PennyLane, automatic queuing and resource management, and tools for analyzing and visualizing results. Recent additions include improved job scheduling algorithms and expanded simulation capabilities.

Within the quantum cloud ecosystem, Xanadu Cloud occupies a unique position as the primary platform for photonic quantum computing. Its focus on continuous-variable quantum computing provides capabilities distinct from qubit-based platforms. The service has enabled research in quantum advantage demonstrations, graph optimization problems, and quantum machine learning with photonic hardware. As photonic quantum computers scale and find applications in networking and sensing, Xanadu Cloud's role as the gateway to this technology becomes increasingly significant.`
  },

  'quantum-cloud-services-qcs-platform': {
    vendor: 'Rigetti Computing',
    programming_languages: ['Python'],
    license_type: 'Proprietary',
    content: `Rigetti Quantum Cloud Services (QCS) is a comprehensive quantum computing platform that provides direct, low-latency access to Rigetti's quantum processors and classical computing resources. Distinguished by its unique architecture that co-locates classical and quantum computing resources, QCS enables tight integration between classical and quantum processing, essential for hybrid algorithms and real-time quantum applications.

QCS's architecture reflects Rigetti's vision of quantum-classical computing integration. The platform provides dedicated classical compute resources alongside quantum processors, enabling rapid iteration in variational algorithms. Users can reserve quantum processor time for exclusive access, ensuring consistent performance for time-sensitive applications. The platform includes Rigetti's compiler for circuit optimization, quantum virtual machine for development, and comprehensive monitoring and debugging tools. This integrated approach minimizes latency between classical and quantum operations.

As Rigetti's proprietary cloud platform, QCS receives continuous updates based on hardware improvements and customer needs. The company provides extensive documentation covering platform capabilities, best practices for hybrid algorithms, and optimization techniques. Rigetti offers dedicated support for QCS users, including consultation on algorithm implementation and performance optimization. The platform's design prioritizes researcher and developer needs identified through extensive user engagement.

Distinctive features of QCS include exclusive quantum processor reservations for dedicated access, co-located classical compute for minimal latency in hybrid algorithms, and live pulse-level control for advanced quantum operations. The platform provides real-time compiler with hardware-specific optimizations, integrated development environment with Forest SDK, and detailed performance metrics and calibration data. Recent enhancements include support for Rigetti's multi-chip processors and improved error mitigation capabilities.

QCS's position in the quantum cloud landscape emphasizes the importance of classical-quantum integration. Its architecture has influenced thinking about hybrid quantum computing requirements. The platform's low-latency access and dedicated resources make it particularly valuable for variational quantum algorithms and quantum machine learning applications. As Rigetti advances toward quantum advantage demonstrations, QCS's integrated architecture positions it to support the complex hybrid algorithms expected to deliver near-term quantum value.`
  },

  'ibm-quantum-experience': {
    vendor: 'IBM',
    programming_languages: ['Python', 'OpenQASM'],
    license_type: 'Free/Premium',
    content: `IBM Quantum Experience is the world's first cloud-based quantum computing platform, launched in 2016 to provide public access to real quantum computers. This pioneering platform democratized quantum computing by allowing anyone to run quantum circuits on actual quantum hardware, fundamentally changing how quantum computing research and education are conducted globally.

The platform's architecture provides multiple interfaces for quantum programming, from a visual circuit composer for beginners to Qiskit integration for advanced users. IBM Quantum Experience offers access to a fleet of quantum processors with varying capabilities, from 5-qubit educational systems to advanced processors with over 100 qubits. The platform includes quantum simulators, educational resources through the Qiskit Textbook, and community features for sharing circuits and results. This comprehensive approach serves users from curious beginners to professional researchers.

IBM Quantum Experience operates on a freemium model, providing free access to selected quantum processors while offering premium access through IBM Quantum Network partnerships. IBM continuously expands the platform with new processors, features, and educational content. Documentation is extensive, covering quantum computing basics, platform usage, and advanced topics. The platform has fostered a global community of over 400,000 users who have run billions of quantum circuits.

Key features include the Circuit Composer for visual quantum programming, integration with Qiskit for programmatic access, and fair-share queue system for managing hardware access. The platform provides real-time calibration data for quantum processors, quantum volume and other performance metrics, and collaborative features for sharing quantum circuits. Recent additions include Qiskit Runtime for optimized algorithm execution and enhanced visualization tools for quantum states and results.

IBM Quantum Experience's ecosystem impact cannot be overstated—it created the quantum cloud computing paradigm and established standards followed by subsequent platforms. Its educational impact through free hardware access has trained a generation of quantum programmers. The platform's continuous operation since 2016 provides unmatched stability and reliability. As IBM advances toward quantum advantage, the Quantum Experience platform remains central to their strategy of making quantum computing accessible and practical for solving real-world problems.`
  },

  'd-wave-leap': {
    vendor: 'D-Wave Systems',
    programming_languages: ['Python'],
    license_type: 'Subscription',
    content: `D-Wave Leap is a quantum cloud service providing real-time access to D-Wave's quantum annealing systems and hybrid solvers, representing the first commercial quantum computing cloud platform. Since its launch in 2018, Leap has enabled thousands of developers and researchers to solve complex optimization problems using quantum annealing, demonstrating practical applications years before gate-based quantum advantage.

Leap's architecture reflects D-Wave's focus on making quantum annealing accessible for practical problem-solving. The platform provides immediate access to D-Wave's latest quantum processors including the Advantage system with over 5,000 qubits, hybrid solvers that partition problems between classical and quantum resources, and an integrated development environment with Ocean SDK. The service includes problem submission and queuing, automatic problem embedding onto quantum hardware, and comprehensive usage tracking and analytics. This design prioritizes ease of use while maintaining flexibility for advanced optimization.

D-Wave offers Leap through subscription models tailored for different user needs, from individual developers to enterprise customers. The platform receives regular updates including new solver capabilities and improved hybrid algorithms. Documentation covers both quantum annealing theory and practical application development. D-Wave provides extensive support including training programs, application development assistance, and a community forum for users to share experiences and solutions.

Distinctive features of Leap include access to the world's largest quantum computers by qubit count, hybrid solvers that can handle problems with millions of variables, and real-time quantum computing with minimal queue times. The platform provides built-in examples for common optimization patterns, performance comparison tools between quantum and classical solvers, and integration with popular data science tools. Recent enhancements include improved hybrid solver performance and expanded problem types supported.

Within the quantum cloud ecosystem, Leap holds a unique position as the platform for quantum annealing, a paradigm that has found practical applications in logistics, finance, and machine learning. Its maturity, with years of production use, provides stability that newer platforms lack. The service's focus on optimization problems appeals to industries with immediate needs rather than future promises. As D-Wave expands into gate-based quantum computing while advancing annealing technology, Leap continues evolving to bridge near-term applications with future quantum capabilities.`
  },

  'quantinuum-nexus': {
    vendor: 'Quantinuum',
    programming_languages: ['Python'],
    license_type: 'Enterprise',
    content: `Quantinuum Nexus is an integrated quantum computing platform that combines Quantinuum's trapped-ion quantum computers, advanced software tools, and application libraries into a unified enterprise solution. Launched following the merger of Honeywell Quantum Solutions and Cambridge Quantum Computing, Nexus represents one of the most comprehensive quantum computing platforms, offering both world-class hardware and sophisticated software capabilities.

Nexus's architecture integrates Quantinuum's complete quantum stack, from hardware access to application development. The platform provides access to Quantinuum's H-Series quantum computers with record quantum volumes, TKET compiler for optimal circuit compilation across different backends, and specialized applications including InQuanto for chemistry and lambeq for natural language processing. The platform includes enterprise features like user management, resource allocation, and security controls. This integrated approach ensures optimal performance while maintaining enterprise-grade reliability.

As Quantinuum's enterprise platform, Nexus receives continuous updates leveraging the company's integrated hardware-software development. Quantinuum provides comprehensive support including training, consultation, and custom application development. Documentation covers the complete platform from hardware specifications to application tutorials. The company works closely with enterprise customers to ensure Nexus meets their specific requirements for security, compliance, and integration.

Key features of Nexus include access to quantum computers with highest proven quantum volumes, integrated software stack optimized for Quantinuum hardware, and enterprise-grade security and access controls. The platform provides application libraries for chemistry, cryptography, and machine learning, advanced error mitigation and correction capabilities, and seamless integration with existing enterprise IT infrastructure. Recent additions include enhanced quantum natural language processing capabilities and improved quantum chemistry algorithms.

Nexus's position in the quantum ecosystem reflects Quantinuum's unique integration of hardware and software excellence. The platform's comprehensive capabilities from hardware to applications make it attractive for enterprises seeking a complete quantum solution. Its proven performance on real applications, particularly in chemistry and cryptography, demonstrates practical value beyond research. As Quantinuum advances toward fault-tolerant quantum computing, Nexus is positioned to deliver the first commercially valuable quantum applications while maintaining enterprise requirements.`
  }
};

// Function to update software with content
async function updateQuantumSoftware() {
  console.log('Starting to update quantum software with content...');

  for (const [slug, data] of Object.entries(quantumSoftwareContent)) {
    try {
      const updateData: any = { 
        main_content: data.content,
        vendor: data.vendor,
        updated_at: new Date().toISOString()
      };
      
      // Add optional fields if they exist
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
        console.log(`✓ Updated content for ${slug} (${data.vendor})`);
      }
    } catch (error) {
      console.error(`Failed to update ${slug}:`, error);
    }
  }

  console.log('Completed updating quantum software!');
}

// Run the update
updateQuantumSoftware().catch(console.error);