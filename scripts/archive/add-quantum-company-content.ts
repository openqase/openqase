import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase';

// Read from .env.local file directly since we're running as a script
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
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Content for quantum companies
const quantumCompanyContent: Record<string, string> = {
  'ibm': `IBM Quantum represents one of the most comprehensive quantum computing programs in the world, with roots stretching back to the earliest days of quantum computing research. Headquartered in Yorktown Heights, New York, IBM has established itself as a pioneer in making quantum computing accessible to researchers, developers, and businesses worldwide through its cloud-based quantum computing platform.

IBM's quantum approach centers on superconducting transmon qubits, a technology the company has refined over decades of research. Their quantum processors utilize Josephson junctions operating at near absolute zero temperatures, achieving increasingly sophisticated levels of quantum coherence and gate fidelity. The company's commitment to transparency in quantum development is evident through their regular publication of quantum volume benchmarks and the introduction of new metrics like Circuit Layer Operations Per Second (CLOPS) to measure quantum performance holistically.

Key achievements include the launch of the IBM Quantum Network in 2016, which now comprises over 200 members including Fortune 500 companies, academic institutions, and national laboratories. IBM made history by putting the first quantum computer on the cloud for public access, democratizing quantum computing research. Their roadmap achievements include the 433-qubit Osprey processor in 2022 and the 1,121-qubit Condor processor in 2023, demonstrating consistent progress toward utility-scale quantum computing.

IBM's current focus extends beyond hardware improvements to developing a complete quantum computing stack. This includes Qiskit, their open-source quantum software development kit, quantum error mitigation techniques, and the development of quantum-centric supercomputing architectures. The company is actively pursuing applications in drug discovery, materials science, and optimization problems, working closely with partners to identify quantum advantage use cases.

In the quantum computing landscape, IBM is distinguished by its commitment to building a quantum ecosystem rather than just quantum hardware. Their emphasis on education through the Qiskit Textbook, certification programs, and quantum challenges has created a global community of quantum developers. IBM's quantum network approach, combining cloud access with on-premises systems for select partners, positions them as a leader in making quantum computing practical for real-world applications.`,

  'google-quantum-ai': `Google Quantum AI, based in Santa Barbara, California, stands at the forefront of quantum computing innovation with a bold mission to build a useful, error-corrected quantum computer. The division has garnered worldwide attention for achieving quantum supremacy in 2019, marking a pivotal moment in the field's history that demonstrated quantum computers could outperform classical supercomputers on specific tasks.

Google's quantum computing strategy revolves around their Sycamore processors, which employ superconducting qubits arranged in a 2D grid architecture. Their approach emphasizes achieving quantum error correction at scale, viewing this as the essential breakthrough needed for practical quantum computing. The team has pioneered novel calibration techniques and quantum control methods that have significantly improved gate fidelities and reduced crosstalk between qubits, pushing the boundaries of what's possible with current quantum hardware.

Among Google's most notable achievements is the 2019 quantum supremacy experiment, where their 53-qubit Sycamore processor completed a specific sampling task in 200 seconds that would take classical supercomputers thousands of years. Beyond this milestone, Google has made significant contributions to quantum error correction, demonstrating surface code implementations and achieving logical qubit error rates below physical qubit error rates. Their open-source framework Cirq has become a cornerstone tool for quantum algorithm development.

Current research at Google Quantum AI focuses heavily on achieving practical quantum advantage in commercially relevant problems. The team is exploring applications in quantum simulation for materials science and chemistry, optimization problems relevant to machine learning, and the development of novel quantum algorithms. Their recent work on time crystals and quantum phase transitions demonstrates their commitment to advancing fundamental quantum science alongside practical applications.

Google's position in the quantum ecosystem is unique due to their combination of deep theoretical expertise, cutting-edge experimental capabilities, and integration with Google's broader AI and cloud infrastructure. Their publication record in top-tier journals, combined with their open approach to sharing research results, has established them as thought leaders in the field. The recent announcement of their quantum virtual machine and partnerships with pharmaceutical companies signals their transition from pure research toward practical quantum computing applications.`,

  'microsoft': `Microsoft's Azure Quantum division, headquartered in Redmond, Washington, represents a comprehensive and ambitious approach to quantum computing that spans from fundamental physics research to cloud-based quantum services. The company has taken a notably different path from competitors by pursuing topological qubits, a high-risk, high-reward strategy aimed at building more stable and scalable quantum computers from the ground up.

Microsoft's quantum strategy is built on the theoretical foundation of topological quantum computing, using anyons and Majorana zero modes to create qubits that are inherently protected from environmental noise. This approach, while more challenging to implement initially, promises to deliver qubits with error rates orders of magnitude lower than conventional approaches. The company has invested heavily in materials science and condensed matter physics research to realize this vision, working with exotic materials and novel fabrication techniques.

The company's achievements include the development of Azure Quantum, a comprehensive cloud platform that provides access to diverse quantum hardware from partners including IonQ, Quantinuum, and Rigetti. Microsoft has also created Q#, a domain-specific programming language for quantum computing, and the Quantum Development Kit, which enables developers to write quantum programs that can run on various quantum hardware platforms. Their recent breakthrough in creating and controlling Majorana zero modes represents a significant step toward topological quantum computing.

Microsoft's current focus encompasses both advancing their topological qubit program and expanding Azure Quantum's capabilities as a full-stack quantum cloud platform. They are actively developing quantum-inspired optimization algorithms that run on classical hardware but leverage quantum principles, providing near-term value to customers. The company is also investing heavily in quantum education and workforce development, offering comprehensive learning paths through Microsoft Learn and partnerships with universities worldwide.

In the broader quantum landscape, Microsoft stands out for its platform-agnostic approach through Azure Quantum, allowing customers to experiment with different quantum hardware technologies through a single interface. Their emphasis on building a scalable, fault-tolerant quantum computer from the start, rather than incrementally improving noisy intermediate-scale quantum (NISQ) devices, represents a bold long-term vision. Combined with their strength in classical computing, cloud infrastructure, and enterprise software, Microsoft is well-positioned to integrate quantum computing into practical business solutions.`,

  'amazon': `Amazon Web Services (AWS), through its Amazon Braket service launched from Seattle, Washington, has emerged as a major force in quantum computing by taking a unique marketplace approach. Rather than focusing solely on building their own quantum hardware, AWS has created a comprehensive quantum computing platform that provides customers with access to multiple quantum technologies while simultaneously pursuing internal quantum hardware development through the AWS Center for Quantum Computing at Caltech.

Amazon's quantum strategy is distinctly cloud-first, leveraging AWS's dominant position in cloud computing to make quantum computing accessible as a managed service. Through Amazon Braket, customers can access quantum computers from IonQ, Oxford Quantum Circuits, QuEra, and Rigetti, as well as quantum circuit simulators running on AWS classical infrastructure. This vendor-neutral approach allows users to experiment with different quantum computing paradigms, from gate-based to analog quantum computing, without committing to a single technology.

Key achievements include the establishment of the AWS Center for Quantum Computing in partnership with Caltech, focusing on building fault-tolerant quantum computers. Amazon has also launched the Amazon Quantum Solutions Lab, connecting customers with quantum computing experts to identify potential use cases. The integration of Amazon Braket with other AWS services like Amazon S3 and Amazon CloudWatch demonstrates their commitment to making quantum computing part of the broader cloud computing workflow.

Amazon's current focus spans three main areas: advancing their internal quantum hardware research on superconducting qubits, expanding the Braket ecosystem with new hardware partners and improved classical simulation capabilities, and working with enterprise customers to identify quantum-ready problems. They are particularly interested in optimization problems relevant to logistics and supply chain management, areas where Amazon has deep domain expertise. The company is also investing in quantum networking research, exploring quantum communication and distributed quantum computing.

Within the quantum ecosystem, Amazon's position is unique as the cloud provider offering the broadest selection of quantum hardware technologies through a single, unified platform. Their emphasis on hybrid classical-quantum algorithms and tight integration with existing cloud services makes them particularly attractive to enterprises looking to experiment with quantum computing without massive upfront investments. Amazon's approach of being both a platform provider and a quantum hardware researcher positions them to capture value across the entire quantum computing stack as the technology matures.`,

  'rigetti-computing': `Rigetti Computing, founded in 2013 and headquartered in Berkeley, California, has established itself as a full-stack quantum computing company, designing and manufacturing both quantum processors and the software to program them. As one of the first pure-play quantum computing startups, Rigetti has pioneered the integrated approach to quantum computing, controlling everything from chip fabrication to cloud services.

Rigetti's quantum approach centers on superconducting quantum processors manufactured in their own fab facility, one of the few dedicated quantum chip fabrication facilities in the world. Their gate-based quantum computers use a distinctive architecture that emphasizes speed and fidelity of quantum gate operations. The company has developed proprietary techniques for qubit control and readout, achieving some of the fastest gate times in the industry. Their modular approach to quantum processor design allows for rapid iteration and customization of quantum chips for specific applications.

Notable achievements include being the first quantum computing company to offer cloud access to quantum computers through their Quantum Cloud Services (QCS) platform, which provides low-latency access to quantum processors. Rigetti has also developed PyQuil and the Quil quantum instruction language, contributing significantly to quantum software standardization. Their recent multi-chip quantum processor architecture represents an innovative approach to scaling quantum computers beyond the limitations of single-chip designs.

Rigetti's current focus is on achieving quantum advantage in commercially relevant problems, particularly in finance, drug discovery, and machine learning applications. The company is actively developing hybrid classical-quantum algorithms optimized for near-term quantum devices. Their recent emphasis on improving quantum compiler technology and developing application-specific quantum processors demonstrates their commitment to making quantum computing practical for real-world use cases. Rigetti is also exploring quantum machine learning algorithms and their implementation on near-term quantum hardware.

In the quantum computing landscape, Rigetti occupies a unique position as one of the few companies with complete vertical integration, from chip fabrication to cloud services. Their focus on speed-to-market and rapid iteration has allowed them to quickly incorporate new insights into their quantum processors. The company's commitment to open-source software development and their collaborative approach with enterprises and research institutions has made them a key player in advancing practical quantum computing applications.`,

  'ionq': `IonQ, headquartered in College Park, Maryland, has distinguished itself in the quantum computing field by pursuing trapped ion technology, a fundamentally different approach from the superconducting qubits used by many competitors. Founded by pioneers in atomic physics and quantum information, IonQ has demonstrated that trapped ion systems can achieve exceptional qubit quality and all-to-all connectivity, key advantages for running complex quantum algorithms.

IonQ's quantum computing approach uses individual atoms as qubits, trapped and manipulated using electromagnetic fields and laser pulses. This technology offers several inherent advantages: qubits are identical atomic ions, eliminating manufacturing variability; room temperature operation outside the trap region, reducing infrastructure complexity; and full connectivity between qubits, enabling more efficient quantum circuits. Their architecture allows for high-fidelity gate operations and long coherence times, essential for running deeper quantum circuits.

Major achievements include becoming the first pure-play quantum computing company to go public, demonstrating market confidence in their technology. IonQ has achieved record-breaking quantum gate fidelities and has demonstrated quantum computers with algorithmic qubits that maintain coherence throughout complex calculations. Their systems have been integrated into major cloud platforms including AWS, Microsoft Azure, and Google Cloud, making trapped ion quantum computing widely accessible. The company has also demonstrated quantum advantage in certain optimization problems relevant to machine learning.

IonQ's current focus is on scaling their trapped ion systems while maintaining high fidelity, with a roadmap to networked quantum computers that could scale to thousands of qubits. They are actively developing error correction techniques optimized for trapped ion systems and exploring applications in drug discovery, financial modeling, and artificial intelligence. The company is also investing in miniaturization and modularization of their quantum systems, aiming to make them more practical for deployment outside specialized laboratory environments.

Within the quantum ecosystem, IonQ represents the leading commercial effort in trapped ion quantum computing, a technology many experts believe has the best path to fault-tolerant quantum computing. Their emphasis on algorithmic qubits—a metric that accounts for both quantity and quality of qubits—has influenced how the industry measures quantum computer performance. IonQ's partnerships with major pharmaceutical companies and financial institutions, combined with their accessible cloud platforms, position them as a bridge between quantum research and practical business applications.`,

  'd-wave': `D-Wave Systems, based in Burnaby, British Columbia, holds the distinction of being the first company to sell commercial quantum computers, pioneering quantum annealing technology since 1999. While others pursued gate-based quantum computing, D-Wave focused on quantum annealing, a specialized approach optimized for solving optimization problems that has found real-world applications years before general-purpose quantum computers.

D-Wave's quantum approach is fundamentally different from gate-based quantum computers, using quantum annealing to find optimal solutions to complex optimization problems. Their quantum processing units (QPUs) contain thousands of qubits arranged in a chimera or Pegasus topology, designed specifically for solving quadratic unconstrained binary optimization (QUBO) problems. This specialized architecture allows D-Wave systems to tackle real-world optimization challenges in logistics, finance, and machine learning with current technology.

Key achievements include delivering the first commercial quantum computer to Lockheed Martin in 2011 and subsequently installing systems at NASA, Google, and Los Alamos National Laboratory. D-Wave's Advantage system, with over 5,000 qubits, represents the largest programmable quantum computer available today. The company has demonstrated quantum speedup for certain optimization problems and has over 250 early applications developed by customers across industries. Their Leap quantum cloud service has enabled thousands of developers to access quantum computing resources.

D-Wave's current focus extends beyond quantum annealing to gate-based quantum computing, announcing plans for their first gate-model quantum computer. They continue to advance their annealing technology with improved connectivity and reduced noise, while developing hybrid solvers that combine classical and quantum processing. The company is particularly focused on demonstrating quantum advantage in practical business problems, working closely with customers in manufacturing, logistics, and financial services to develop production-ready quantum applications.

In the quantum computing landscape, D-Wave occupies a unique position as the company with the longest track record of commercial quantum computer deployments. Their focus on near-term applications and practical problem-solving has influenced how the industry thinks about quantum computing's path to commercialization. While quantum annealing is limited to specific problem types, D-Wave's success in finding real-world applications has validated the approach and demonstrated that quantum computing can deliver value before achieving fault tolerance.`,

  'quantinuum': `Quantinuum, formed in 2021 through the merger of Honeywell Quantum Solutions and Cambridge Quantum Computing, represents one of the most comprehensive quantum computing companies, combining world-class hardware with advanced quantum software capabilities. Headquartered in Colorado and Cambridge, UK, Quantinuum has quickly established itself as a leader in trapped ion quantum computing and quantum software applications.

Quantinuum's quantum approach builds on Honeywell's trapped ion technology, using ytterbium ions as qubits in their Quantum Charge Coupled Device (QCCD) architecture. This design allows for high-fidelity operations, mid-circuit measurement, and qubit reuse—capabilities that are essential for error correction and advanced quantum algorithms. Their H-Series quantum computers have consistently achieved industry-leading quantum volume scores, a metric that captures both the number and quality of qubits. The company's unique architecture enables features like conditional logic and real-time classical computation during quantum execution.

Notable achievements include reaching record quantum volume milestones, with their H1 system achieving a quantum volume of 524,288. Quantinuum has demonstrated real-time error correction, created exotic topological states of matter, and shown commercial quantum advantage in certain optimization problems. Their quantum software stack, including the TKET compiler and lambeq natural language processing toolkit, has become widely adopted in the quantum community. The merger itself was a landmark event, creating the largest integrated quantum computing company.

Quantinuum's current focus spans advancing their trapped ion hardware toward fault-tolerant quantum computing, developing quantum software for chemistry, drug discovery, and cybersecurity applications, and exploring quantum machine learning and natural language processing. They are actively working on demonstrating quantum advantage in commercially relevant problems, particularly in pharmaceutical development and materials science. The company is also developing quantum-enhanced cryptography solutions and exploring the intersection of quantum computing and artificial intelligence.

Within the quantum ecosystem, Quantinuum stands out for its end-to-end quantum computing capability, from hardware to applications. Their trapped ion technology is considered among the most promising paths to fault-tolerant quantum computing, while their software tools are hardware-agnostic and widely used across different quantum platforms. The company's strong presence in both quantum hardware and software, combined with deep domain expertise in chemistry and cryptography, positions them uniquely to deliver practical quantum computing solutions across multiple industries.`,

  'xanadu': `Xanadu, headquartered in Toronto, Canada, has carved out a distinctive niche in quantum computing by pursuing photonic quantum computing, using particles of light as qubits. Founded in 2016, the company has emerged as a leader in continuous-variable quantum computing and has made significant contributions to both quantum hardware and software development.

Xanadu's quantum approach is based on photonic qubits, which offer unique advantages including room-temperature operation, natural error resilience for certain types of noise, and the potential for networking quantum computers using existing fiber optic infrastructure. Their architecture uses squeezed light states and can operate in both discrete and continuous variable modes. The company has developed proprietary silicon photonic chips that integrate thousands of components, demonstrating a path toward scalable quantum computing using established semiconductor manufacturing techniques.

Major achievements include building Borealis, a 216-squeezed-state photonic quantum computer that demonstrated quantum computational advantage in 2022. Xanadu has also developed PennyLane, an open-source software library for quantum machine learning that has become one of the most popular quantum development frameworks. Their X-Series photonic chips represent breakthroughs in integrating quantum light sources, detectors, and circuits on a single chip. The company has also made significant theoretical contributions to quantum algorithms and quantum machine learning.

Xanadu's current focus is on developing fault-tolerant photonic quantum computers capable of running practical algorithms. They are advancing their photonic chip technology toward million-qubit systems and developing hybrid quantum-classical algorithms optimized for photonic hardware. The company is particularly interested in quantum chemistry, graph optimization problems, and quantum machine learning applications. Xanadu is also exploring distributed quantum computing, leveraging the natural networkability of photonic systems to connect multiple quantum processors.

In the quantum computing landscape, Xanadu represents the leading commercial effort in photonic quantum computing, a modality that many experts believe could be crucial for scaling quantum computers and creating quantum networks. Their emphasis on quantum machine learning and the success of PennyLane has made them influential in defining how quantum and classical machine learning will merge. The company's approach to building quantum computers using silicon photonics and existing semiconductor infrastructure offers a potentially faster path to large-scale quantum computing.`,

  'atom-computing': `Atom Computing, based in Berkeley, California, has emerged as a promising player in quantum computing by pioneering neutral atom quantum computing technology. Founded in 2018, the company has quickly advanced from stealth mode to demonstrating one of the highest qubit count quantum systems, using individual atoms trapped in optical tweezers as qubits.

Atom Computing's quantum approach uses neutral atoms, specifically strontium atoms, held in place by focused laser beams called optical tweezers. This technology offers several advantages: the ability to pack qubits densely in 2D and 3D arrays, long coherence times due to the atoms' neutral charge, and wireless control using laser pulses. Their architecture is highly scalable, as adding more qubits primarily requires additional laser control rather than complex wiring. The company's Phoenix system demonstrated over 100 qubits with plans for rapid scaling.

Key achievements include unveiling their first-generation quantum computer with 100 qubits in 2021, followed by announcing a second-generation system with over 1,000 qubits. Atom Computing has demonstrated exceptional coherence times exceeding one second, among the longest in the industry. The company has secured significant funding and partnerships with major enterprises to explore quantum computing applications. Their ability to rapidly scale qubit count while maintaining quality has garnered attention from the quantum community.

Atom Computing's current focus is on scaling their neutral atom platform to tens of thousands of qubits while developing error correction techniques optimized for their architecture. They are working on demonstrating quantum advantage in optimization and simulation problems relevant to drug discovery, financial modeling, and supply chain optimization. The company is also developing software tools and compilers specifically designed to leverage the unique capabilities of neutral atom systems, such as flexible qubit connectivity and mid-circuit measurement.

Within the quantum ecosystem, Atom Computing represents one of the most promising approaches to rapidly scaling quantum computers. Their neutral atom platform offers a compelling combination of scalability, long coherence times, and flexible connectivity that could accelerate the path to fault-tolerant quantum computing. The company's focus on enterprise applications and their ability to quickly iterate on hardware designs positions them as a potential leader in the race to deliver practical quantum computing solutions.`
};

// Function to update companies with content
async function updateQuantumCompanies() {
  console.log('Starting to update quantum companies with content...');

  for (const [slug, content] of Object.entries(quantumCompanyContent)) {
    try {
      const { data, error } = await supabase
        .from('quantum_companies')
        .update({ 
          main_content: content,
          updated_at: new Date().toISOString()
        })
        .eq('slug', slug);

      if (error) {
        console.error(`Error updating ${slug}:`, error);
      } else {
        console.log(`✓ Updated content for ${slug}`);
      }
    } catch (error) {
      console.error(`Failed to update ${slug}:`, error);
    }
  }

  console.log('Completed updating quantum companies!');
}

// Run the update
updateQuantumCompanies().catch(console.error);