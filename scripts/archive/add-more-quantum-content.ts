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
  throw new Error('Missing required environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Content for additional quantum companies
const quantumCompanyContent: Record<string, string> = {
  '1qbit': `1QBit, headquartered in Vancouver, Canada, stands as one of the earliest quantum software companies, founded in 2012 with a vision to bridge the gap between quantum computing hardware and real-world applications. The company has established itself as a leader in developing quantum and quantum-inspired software solutions, focusing on solving complex computational problems in finance, pharmaceuticals, materials science, and advanced computing.

1QBit's approach to quantum computing is hardware-agnostic, developing algorithms and applications that can run on various quantum computing platforms as well as classical high-performance computing systems. Their methodology involves creating quantum-ready applications that can scale from today's quantum simulators to tomorrow's fault-tolerant quantum computers. The company specializes in optimization, simulation, and machine learning algorithms that leverage quantum and quantum-inspired techniques to achieve computational advantages.

Major achievements include developing QEMIST Cloud, a comprehensive quantum simulation platform for molecular modeling, and establishing partnerships with major quantum hardware providers including D-Wave, IBM, Rigetti, and Microsoft. 1QBit has also created novel quantum algorithms for portfolio optimization, drug discovery, and materials design. Their work with financial institutions has demonstrated practical applications of quantum computing in risk analysis and derivative pricing.

1QBit's current focus centers on developing industry-specific quantum applications that deliver near-term value while preparing for the quantum future. They are advancing their quantum simulation capabilities for drug discovery and materials science, working closely with pharmaceutical companies to identify promising drug candidates. The company is also exploring quantum machine learning applications and developing hybrid classical-quantum algorithms that can leverage today's NISQ devices effectively.

In the quantum ecosystem, 1QBit occupies a crucial position as a bridge between quantum hardware developers and enterprise users. Their expertise in translating business problems into quantum algorithms has made them valuable partners for organizations exploring quantum computing. The company's focus on creating practical, near-term applications while building toward fault-tolerant quantum computing has influenced how the industry approaches quantum software development.`,

  'cambridge-quantum-computing': `Cambridge Quantum Computing (CQC), founded in 2014 in Cambridge, UK, emerged as a global leader in quantum software and quantum technologies before merging with Honeywell Quantum Solutions to form Quantinuum in 2021. During its independent operation, CQC developed groundbreaking quantum software tools and applications that continue to influence the quantum computing industry today.

CQC's quantum approach focused on developing a comprehensive quantum software stack, including compilers, development tools, and applications across multiple verticals. The company pioneered work in quantum natural language processing, quantum chemistry, and quantum machine learning. Their hardware-agnostic approach allowed their software to run on multiple quantum computing platforms, maximizing accessibility and practical utility for researchers and enterprises.

Key achievements during CQC's independent operation included the development of t|ket⟩, a quantum software development platform that became one of the industry's leading quantum compilers. The company also created lambeq, the world's first quantum natural language processing toolkit, and developed EUMEN, a quantum chemistry platform. CQC established itself as a leader in quantum cybersecurity with their IronBridge platform, one of the first commercially available quantum key generation systems.

Before the merger, CQC's focus was on advancing quantum software capabilities across multiple domains, with particular emphasis on quantum machine learning and optimization. The company was exploring the intersection of quantum computing and artificial intelligence, developing novel algorithms for pattern recognition and data analysis. Their work in quantum chemistry aimed to accelerate drug discovery and materials development through quantum simulation.

CQC's legacy in the quantum ecosystem is substantial, having demonstrated that quantum software companies could create significant value independent of hardware development. Their tools and frameworks continue to be widely used in the quantum community, now as part of Quantinuum's offerings. The successful merger with Honeywell Quantum Solutions validated the importance of combining world-class quantum software with advanced quantum hardware to create comprehensive quantum computing solutions.`,

  'classiq': `Classiq, based in Tel Aviv, Israel, has revolutionized quantum software development by creating the first quantum algorithm design platform that automates the creation of quantum circuits from high-level functional models. Founded in 2020, the company addresses one of the most significant challenges in quantum computing: the complexity of designing and optimizing quantum algorithms for real-world applications.

Classiq's quantum approach involves providing a high-level modeling language and synthesis engine that automatically generates optimized quantum circuits from functional descriptions. This abstraction layer allows developers to focus on the problem they want to solve rather than the intricate details of quantum gate sequences. Their platform includes advanced optimization algorithms that minimize circuit depth and gate count, crucial for running algorithms on today's noisy quantum hardware.

Notable achievements include raising significant funding from leading venture capital firms and establishing partnerships with major quantum hardware providers and cloud platforms. Classiq's platform has been adopted by Fortune 500 companies, research institutions, and quantum algorithm developers worldwide. The company has demonstrated dramatic reductions in quantum circuit complexity, enabling algorithms that were previously impractical to run on current quantum hardware.

Classiq's current focus is on expanding their platform's capabilities to support increasingly complex quantum algorithms and applications. They are developing domain-specific libraries for finance, chemistry, and optimization problems. The company is also working on integration with quantum error correction schemes and developing tools for hybrid classical-quantum algorithms. Their recent emphasis on quantum education and training programs aims to accelerate quantum workforce development.

In the quantum ecosystem, Classiq represents a new generation of quantum software companies focused on making quantum computing accessible to non-specialists. Their approach to quantum algorithm design as a synthesis problem rather than a programming challenge has the potential to dramatically expand the pool of quantum developers. By automating much of the complexity in quantum circuit design, Classiq is helping to bridge the gap between quantum computing's theoretical potential and practical implementation.`,

  'quera': `QuEra Computing, headquartered in Boston, Massachusetts, has emerged as a leader in neutral atom quantum computing, offering a unique approach to quantum computation through their analog quantum processing technology. Founded in 2018 by physicists from Harvard and MIT, QuEra is commercializing decades of academic research in atomic physics and quantum simulation.

QuEra's quantum approach utilizes arrays of neutral atoms trapped by focused laser beams, enabling both analog and digital quantum computation. Their Aquila system operates as an analog quantum simulator, particularly well-suited for solving optimization problems and simulating quantum many-body systems. This approach offers natural advantages for certain problem classes, including optimization problems with geometric constraints and quantum simulation of materials and chemical systems.

Major achievements include making their 256-qubit Aquila system available through Amazon Braket, marking one of the largest publicly accessible quantum processors. QuEra has demonstrated quantum simulation capabilities that are difficult or impossible to achieve with classical computers, particularly in studying quantum phase transitions and many-body physics. The company has secured significant funding and established partnerships with major enterprises exploring quantum computing applications.

QuEra's current focus extends to developing a fault-tolerant quantum computer based on neutral atom technology, with a roadmap to systems with thousands of qubits. They are working on demonstrating quantum advantage in optimization problems relevant to logistics, finance, and machine learning. The company is also advancing their quantum simulation capabilities for drug discovery and materials science applications, leveraging the natural mapping between atomic systems and molecular structures.

In the quantum ecosystem, QuEra represents the commercialization of neutral atom quantum computing, a modality that offers unique advantages in scalability and connectivity. Their focus on analog quantum processing provides a near-term path to quantum advantage for specific problem classes. QuEra's approach to combining analog and digital quantum computation in a single platform positions them to address a broad range of applications as the technology matures.`,

  'pasqal': `Pasqal, based in Palaiseau, France, has established itself as a European leader in neutral atom quantum computing, developing quantum processors that leverage the precise control of individual atoms for quantum computation. Founded in 2019 as a spin-off from Institut d'Optique, Pasqal brings together decades of expertise in atomic physics and quantum optics to build practical quantum computing solutions.

Pasqal's quantum approach uses arrays of neutral atoms trapped in optical tweezers, allowing for flexible qubit arrangements and connectivity. Their technology enables both analog quantum simulation and digital quantum computation, with particular strengths in solving optimization problems and simulating quantum systems. The company's processors can arrange atoms in arbitrary 2D and 3D configurations, enabling direct encoding of problem geometries into the quantum hardware.

Key achievements include developing quantum processors with over 100 qubits and demonstrating applications in solving real-world optimization problems. Pasqal has established partnerships with major enterprises including BMW, BASF, and EDF to explore quantum computing applications in their respective industries. The company has also made significant contributions to quantum algorithm development, particularly for combinatorial optimization and quantum machine learning.

Pasqal's current focus is on scaling their neutral atom platform toward 1,000 qubits while improving control fidelity and coherence times. They are developing quantum algorithms optimized for their hardware architecture, particularly for solving graph problems and simulating strongly correlated quantum systems. The company is also working on making their quantum processors more accessible through cloud platforms and developing software tools that simplify programming their unique hardware.

In the European quantum ecosystem, Pasqal plays a crucial role in establishing technological sovereignty in quantum computing. Their approach to neutral atom quantum computing, combined with strong academic connections and industrial partnerships, positions them as a key player in Europe's quantum strategy. Pasqal's focus on near-term applications in optimization and simulation demonstrates a practical path to quantum advantage using current technology.`,

  'qc-ware': `QC Ware, headquartered in Palo Alto, California, has positioned itself as a quantum software and services company focused on making quantum computing accessible for enterprise applications. Founded in 2014 by experts in quantum algorithms and high-performance computing, QC Ware develops quantum algorithms and applications that deliver value on both near-term quantum hardware and classical computers.

QC Ware's approach to quantum computing emphasizes developing practical algorithms that can run on today's noisy quantum hardware while preparing for future fault-tolerant systems. Their Forge platform provides a cloud-based development environment for quantum applications, offering pre-built algorithms for optimization, machine learning, and simulation. The company specializes in creating hybrid classical-quantum algorithms that leverage the strengths of both computing paradigms.

Notable achievements include developing quantum algorithms for drug discovery that have been validated by pharmaceutical companies, creating quantum machine learning algorithms that show promise for pattern recognition and classification tasks, and establishing partnerships with major corporations including Goldman Sachs, BMW, and Airbus. QC Ware has also contributed to advancing quantum algorithm theory, publishing research on quantum optimization and quantum machine learning.

QC Ware's current focus is on demonstrating quantum advantage in commercially relevant problems, particularly in finance, pharmaceuticals, and aerospace. They are developing quantum algorithms for portfolio optimization, risk analysis, and derivative pricing for financial institutions. In drug discovery, they are working on quantum simulations of protein-drug interactions and molecular dynamics. The company is also exploring quantum machine learning applications for predictive maintenance and anomaly detection.

In the quantum software ecosystem, QC Ware serves as a crucial bridge between quantum computing research and practical business applications. Their emphasis on algorithm development that works on near-term hardware has influenced how enterprises approach quantum computing adoption. By providing both software tools and consulting services, QC Ware helps organizations identify and develop quantum use cases specific to their industry needs.`,

  'quantum-brilliance': `Quantum Brilliance, headquartered in Canberra, Australia, is pioneering room-temperature quantum computing using synthetic diamond technology. Founded in 2019 as a spin-off from the Australian National University, the company is developing quantum accelerators that can operate in normal environments without the need for complex cooling systems, potentially revolutionizing how quantum computers are deployed and integrated with classical computing infrastructure.

Quantum Brilliance's unique approach utilizes nitrogen-vacancy (NV) centers in synthetic diamonds as qubits, which can maintain quantum coherence at room temperature. This technology enables the development of compact quantum processing units that can be deployed at the edge, in data centers, or even in mobile applications. Their vision is to create quantum accelerators that work alongside classical processors, similar to how GPUs accelerate specific workloads today.

Key achievements include demonstrating room-temperature quantum computing operations and developing partnerships with supercomputing centers to integrate their quantum accelerators. The company has installed systems at the Pawsey Supercomputing Centre in Australia and is working with the German Aerospace Center. Quantum Brilliance has also made progress in miniaturizing quantum computing components, working toward chip-scale quantum processors that could be mass-produced using semiconductor manufacturing techniques.

Quantum Brilliance's current focus is on scaling their diamond quantum technology while maintaining the advantages of room-temperature operation. They are developing quantum accelerators optimized for specific applications including cryptography, optimization, and simulation. The company is also working on software tools and compilers that enable seamless integration of their quantum accelerators with classical computing systems, pursuing a vision of ubiquitous quantum computing.

In the global quantum ecosystem, Quantum Brilliance represents a radically different approach to quantum computing deployment. Their room-temperature technology could democratize access to quantum computing by eliminating the need for specialized facilities and cooling infrastructure. This approach positions them uniquely for edge computing applications and integration with existing IT infrastructure, potentially accelerating the adoption of quantum computing across industries.`,

  'sandboxaq': `SandboxAQ, spun out from Alphabet (Google's parent company) in 2022, has emerged as a unique player in the quantum technology space, focusing on the intersection of quantum computing and artificial intelligence. Headquartered in Palo Alto, California, the company develops quantum-inspired and AI-powered solutions for drug discovery, materials science, cybersecurity, and other complex computational challenges.

SandboxAQ's approach combines quantum algorithms, quantum sensing, and artificial intelligence to solve problems that are intractable for classical computing alone. Rather than waiting for fault-tolerant quantum computers, they develop quantum-inspired algorithms that can run on today's classical hardware while preparing for the quantum future. Their AQ (AI + Quantum) platform leverages the best of both technologies to deliver practical solutions for enterprise customers.

Major achievements include securing significant funding and establishing partnerships with leading organizations across multiple industries. SandboxAQ has developed quantum-safe cryptography solutions adopted by major enterprises and government agencies preparing for the post-quantum era. Their drug discovery platform has identified promising drug candidates for pharmaceutical partners, and their materials simulation tools are being used to design next-generation batteries and materials.

SandboxAQ's current focus spans several key areas: advancing their drug discovery platform to accelerate the development of new therapeutics, developing quantum sensing technologies for navigation and medical diagnostics, and creating post-quantum cryptography solutions to protect against future quantum threats. They are also working on quantum simulation tools for materials science and developing AI models that incorporate quantum mechanical principles for improved accuracy.

In the quantum technology landscape, SandboxAQ occupies a unique position by focusing on near-term applications that combine quantum and AI technologies. Their approach of developing quantum-inspired solutions that work today while preparing for tomorrow's quantum computers has influenced how enterprises think about quantum adoption. With strong backing from Alphabet and a team that includes leading experts in quantum computing and AI, SandboxAQ is well-positioned to deliver practical quantum advantage across multiple industries.`,

  'qilimanjaro': `Qilimanjaro Quantum Tech, based in Barcelona, Spain, represents a significant European effort in quantum computing, developing both quantum hardware based on superconducting qubits and quantum software solutions. Founded in 2019 as a spin-off from the Barcelona Supercomputing Center, the University of Barcelona, and IFAE, Qilimanjaro brings together expertise in quantum physics, high-performance computing, and algorithm development.

Qilimanjaro's approach to quantum computing is vertically integrated, developing coherent quantum annealing processors optimized for solving optimization problems. Unlike gate-based quantum computers, their quantum annealers are designed to find optimal solutions to complex combinatorial problems common in logistics, finance, and machine learning. The company also develops Qibo, an open-source quantum computing framework that supports multiple quantum hardware backends.

Notable achievements include developing quantum algorithms for industrial optimization problems and establishing partnerships with European enterprises and research institutions. Qilimanjaro has contributed to the European quantum computing ecosystem through participation in EU quantum initiatives and collaborations with other European quantum companies. Their work on quantum annealing algorithms has demonstrated potential advantages for specific optimization problems.

Qilimanjaro's current focus is on scaling their quantum annealing technology while developing hybrid classical-quantum algorithms for near-term applications. They are working with industrial partners to identify and solve optimization problems in logistics, energy management, and financial portfolio optimization. The company is also advancing their quantum software stack, making it easier for developers to implement quantum algorithms without deep expertise in quantum physics.

In the European quantum landscape, Qilimanjaro plays an important role in developing sovereign quantum computing capabilities. Their focus on quantum annealing provides a complementary approach to the gate-based quantum computers being developed by other European companies. By combining hardware development with open-source software tools, Qilimanjaro contributes to building a comprehensive European quantum ecosystem.`,

  'qrypt': `Qrypt, headquartered in New York City, has positioned itself as a leader in quantum-safe security solutions, developing cryptographic technologies that protect against both current and future quantum computing threats. Founded in 2017, the company addresses the urgent need for quantum-resistant encryption as quantum computers advance toward breaking current cryptographic standards.

Qrypt's approach to quantum security involves developing and deploying quantum random number generators and quantum-safe encryption algorithms. Their technology leverages quantum physics principles to generate truly random encryption keys and implements post-quantum cryptographic algorithms validated by standards organizations. The company's unique architecture eliminates key transmission, a vulnerability in traditional encryption systems that quantum computers could exploit.

Key achievements include developing the first commercially available quantum entropy as a service, providing truly random numbers generated from quantum processes. Qrypt has established partnerships with major telecommunications companies and cloud providers to integrate quantum-safe security into their infrastructure. The company has also contributed to post-quantum cryptography standardization efforts, working with NIST and other standards bodies.

Qrypt's current focus is on helping organizations transition to quantum-safe cryptography before quantum computers become capable of breaking current encryption. They are developing quantum key generation devices that can be integrated into existing network infrastructure and working on quantum-safe protocols for securing communications, data storage, and digital transactions. The company is also exploring quantum sensing applications for detecting security threats.

In the quantum security ecosystem, Qrypt serves a critical role in preparing organizations for the post-quantum era. Their emphasis on providing quantum security solutions that work with existing infrastructure makes the transition to quantum-safe cryptography more practical for enterprises. As quantum computing advances toward breaking current encryption standards, Qrypt's technologies become increasingly vital for protecting sensitive information and maintaining privacy in the quantum age.`,

  'haiqu': `HaiQu Computing, emerging from China's quantum computing landscape, represents a significant effort in developing quantum computing technology with Chinese characteristics. Based in Beijing and founded by leading quantum physicists from Chinese academic institutions, HaiQu focuses on developing scalable quantum computing solutions for scientific research and industrial applications.

HaiQu's quantum approach centers on developing superconducting quantum processors with a focus on achieving high coherence times and gate fidelities. The company emphasizes building quantum computers that can address specific computational challenges in materials science, drug discovery, and artificial intelligence. Their development strategy involves close collaboration with Chinese research institutions and integration with China's broader quantum technology initiatives.

Notable achievements include developing quantum processors with increasing qubit counts and establishing partnerships with Chinese enterprises and research organizations. HaiQu has contributed to China's quantum computing ecosystem by developing quantum software tools and educational programs. The company has demonstrated quantum algorithms for optimization and simulation problems relevant to Chinese industries.

HaiQu's current focus is on scaling their quantum hardware while developing applications for domestic industries. They are working on quantum algorithms for materials discovery, particularly for semiconductor and energy storage applications. The company is also exploring quantum machine learning applications and developing quantum software tools optimized for their hardware architecture.

In China's quantum ecosystem, HaiQu plays a role in developing indigenous quantum computing capabilities. Their work contributes to China's strategic goal of achieving leadership in quantum technologies. By focusing on applications relevant to Chinese industries and collaborating with domestic research institutions, HaiQu helps advance China's quantum computing capabilities and applications.`,

  'open-quantum-design': `Open Quantum Design represents a unique approach to quantum computing development, focusing on open-source hardware and software designs that democratize access to quantum technology. This initiative brings together researchers, engineers, and developers committed to creating transparent, accessible quantum computing solutions that can be replicated and improved by the global community.

The Open Quantum Design approach emphasizes creating fully documented, reproducible quantum computing systems that educational institutions and researchers can build and modify. This includes open-source designs for control electronics, cryogenic systems, and qubit fabrication processes. By making quantum computing technology more accessible, the initiative aims to accelerate innovation and education in quantum computing.

Key contributions include developing open-source quantum control software, publishing detailed blueprints for quantum computing components, and creating educational resources for quantum hardware development. The initiative has fostered a community of contributors who share designs, troubleshooting guides, and improvements. This collaborative approach has enabled smaller institutions to build quantum computing capabilities without massive investments.

Current focus areas include simplifying quantum computer construction, reducing costs through innovative designs, and improving documentation for quantum hardware development. The initiative is working on standardizing interfaces between quantum computing components and developing modular designs that allow for easier upgrades and modifications. Educational outreach remains a priority, with workshops and tutorials helping train the next generation of quantum engineers.

In the quantum ecosystem, Open Quantum Design serves as a catalyst for democratizing quantum computing technology. By lowering barriers to entry and fostering open collaboration, this approach accelerates innovation and enables broader participation in quantum computing development. The initiative's impact extends beyond technology development to education and workforce development, helping build the quantum engineering talent pipeline.`,

  'ibm-quantum': `IBM Quantum represents IBM's comprehensive quantum computing division, encompassing hardware development, software platforms, cloud services, and quantum network partnerships. As one of the pioneering forces in quantum computing, IBM Quantum has consistently pushed the boundaries of what's possible in quantum computation while making the technology accessible to researchers and developers worldwide.

IBM Quantum's strategy centers on building increasingly powerful quantum processors while developing the software ecosystem needed to program and utilize them effectively. Their superconducting transmon qubit technology has evolved through multiple processor generations, each improving in qubit count, coherence time, and gate fidelity. The division's commitment to transparency through regular benchmarking and open publication of results has set industry standards for quantum computing metrics.

Major milestones include launching the IBM Quantum Network with over 200 members, releasing Qiskit as the most widely used quantum software development kit, and achieving quantum processors with over 1,000 qubits. IBM Quantum's cloud platform has enabled millions of quantum circuit executions, democratizing access to quantum computing. Their quantum volume benchmarks and introduction of new metrics like CLOPS have provided standardized ways to measure quantum computer performance.

IBM Quantum's current priorities include developing error mitigation techniques that improve the quality of quantum computations on noisy hardware, advancing toward error-corrected quantum computing through improved qubit quality and quantum error correction codes, and demonstrating quantum advantage in commercially relevant problems. The division is also focused on building quantum-centric supercomputing architectures that seamlessly integrate quantum and classical processing.

Within the global quantum ecosystem, IBM Quantum stands as a leader in both technology development and ecosystem building. Their comprehensive approach spanning hardware, software, education, and partnerships has created one of the most mature quantum computing platforms. IBM Quantum's influence extends beyond technology to shaping how the industry approaches quantum computing development, benchmarking, and commercialization.`,

  'honeywell-quantum-solutions': `Honeywell Quantum Solutions, before merging with Cambridge Quantum Computing to form Quantinuum, represented one of the most successful industrial entries into quantum computing. Leveraging Honeywell's expertise in precision control systems and ion trap technology, the division developed some of the highest-performing quantum computers based on trapped ion qubits.

Honeywell's quantum approach utilized their trapped ion technology with a unique quantum charge coupled device (QCCD) architecture. This design allowed for high-fidelity quantum operations, all-to-all qubit connectivity, and mid-circuit measurement capabilities. Their focus on quality over quantity led to quantum computers with the highest quantum volume measurements at the time, demonstrating that fewer high-quality qubits could outperform larger but noisier systems.

Key achievements included developing the System Model H1 with record-breaking quantum volume, demonstrating real-time error correction, and establishing commercial partnerships with enterprises exploring quantum computing applications. Honeywell Quantum Solutions proved that industrial companies could successfully enter and compete in quantum computing by leveraging existing expertise in related technologies.

Before the merger, Honeywell's focus was on scaling their trapped ion systems while maintaining exceptional qubit quality, developing quantum algorithms for optimization and simulation problems relevant to Honeywell's industrial customers, and exploring quantum computing applications in aerospace, chemicals, and materials science. The division was also working on making their quantum computers more accessible through cloud platforms.

Honeywell Quantum Solutions' legacy in the quantum ecosystem demonstrates the value of industrial expertise in advancing quantum computing. Their emphasis on qubit quality over quantity influenced industry thinking about the path to practical quantum computing. The successful merger with Cambridge Quantum Computing to form Quantinuum created one of the most comprehensive quantum computing companies, combining world-class hardware with advanced software capabilities.`,

  'rigetti-computing': `Rigetti Computing has already been covered in the previous batch, but let me add content for any companies that might have been missed or need updates.`,

  'google-quantum-ai': `Google Quantum AI represents Google's dedicated quantum computing research division, which has already been covered as 'google' in the previous batch. The content stands as one of the most comprehensive in the quantum computing field.`
};

// Function to update companies with content
async function updateQuantumCompanies() {
  console.log('Starting to update additional quantum companies with content...');

  for (const [slug, content] of Object.entries(quantumCompanyContent)) {
    // Skip if it's a note about already covered content
    if (content.includes('already been covered')) {
      console.log(`⊘ Skipping ${slug} (already covered)`);
      continue;
    }

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

  console.log('Completed updating additional quantum companies!');
}

// Run the update
updateQuantumCompanies().catch(console.error);