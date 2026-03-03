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

// Content for partner companies
const partnerCompanyContent: Record<string, { content: string; industry: string }> = {
  'goldman-sachs': {
    industry: 'Financial Services',
    content: `Goldman Sachs, one of the world's leading investment banking and financial services firms, has emerged as a pioneer in exploring quantum computing applications for finance. Headquartered in New York City with global operations spanning major financial centers, the firm recognizes quantum computing as a transformative technology that could revolutionize financial modeling, risk analysis, and trading strategies.

The financial services industry faces computational challenges that push the limits of classical computing, particularly in areas like portfolio optimization, derivative pricing, and risk management. These problems often involve analyzing vast amounts of market data, simulating complex scenarios, and optimizing across thousands of variables simultaneously. Goldman Sachs sees quantum computing as a potential solution to these computational bottlenecks, offering exponential speedups for certain classes of financial problems that are critical to modern banking and investment management.

Goldman Sachs' quantum initiatives span multiple areas of research and development. The firm has established dedicated quantum research teams, partnered with leading quantum computing companies including IBM, IonQ, and QC Ware, and actively participates in quantum computing consortiums. Their research focuses on developing quantum algorithms for Monte Carlo simulations, portfolio optimization, and machine learning applications in finance. The firm has published research on quantum algorithms for derivative pricing and has demonstrated proof-of-concept implementations on current quantum hardware.

The firm's early adoption of quantum computing is driven by the competitive advantage it could provide in financial markets. Even marginal improvements in risk modeling or portfolio optimization could translate to significant financial gains. Goldman Sachs is investing in quantum computing now to build internal expertise, develop proprietary quantum algorithms, and position itself to leverage quantum advantage as the technology matures. Their approach combines near-term exploration of quantum-inspired algorithms on classical hardware with long-term preparation for fault-tolerant quantum computers.

Looking forward, Goldman Sachs envisions quantum computing transforming multiple aspects of financial services. This includes real-time risk analysis across complex portfolios, optimization of trading strategies across global markets, enhanced fraud detection through quantum machine learning, and more accurate pricing of exotic derivatives. The firm's strategic investment in quantum computing reflects its commitment to maintaining technological leadership in the rapidly evolving financial services industry.`
  },

  'jp-morgan': {
    industry: 'Financial Services',
    content: `J.P. Morgan Chase, America's largest bank and a global leader in financial services, has positioned itself at the forefront of quantum computing adoption in the banking sector. With operations in over 100 countries and assets exceeding $3 trillion, J.P. Morgan recognizes that quantum computing could fundamentally transform how financial institutions operate, from risk management to customer service.

The banking industry's computational needs have grown exponentially with the increasing complexity of financial products, regulatory requirements, and the volume of transactions processed daily. Traditional computing struggles with optimization problems involving thousands of variables, real-time fraud detection across millions of transactions, and comprehensive risk assessment across diverse portfolios. J.P. Morgan views quantum computing as essential for maintaining competitiveness in an industry where computational advantage directly translates to business success.

J.P. Morgan's quantum computing initiatives are comprehensive and multi-faceted. The bank has established the J.P. Morgan Chase Center for Quantum Computing in partnership with IBM, providing access to IBM's quantum computers and collaborative research opportunities. Their quantum research team has published groundbreaking work on quantum algorithms for portfolio optimization, option pricing, and risk analysis. The bank has also partnered with quantum software companies like QC Ware and Quantinuum to explore near-term applications of quantum computing in finance.

The bank's early investment in quantum computing stems from both opportunity and necessity. On the opportunity side, quantum computing could enable new financial products and services that are computationally infeasible today. On the necessity side, J.P. Morgan must prepare for a future where quantum computers could break current encryption standards, requiring quantum-safe cryptography to protect customer data and transactions. The bank is actively developing quantum-resistant security protocols while exploring quantum computing's positive applications.

J.P. Morgan's future outlook for quantum computing extends beyond traditional banking operations. The bank envisions quantum-enhanced artificial intelligence improving customer service and personalization, quantum algorithms optimizing global payment networks and reducing transaction costs, and quantum simulation enabling better modeling of economic systems and market dynamics. Their strategic positioning in quantum computing reflects a broader digital transformation strategy aimed at reimagining banking for the quantum era.`
  },

  'mercedes-benz': {
    industry: 'Automotive',
    content: `Mercedes-Benz, synonymous with luxury and innovation in the automotive industry, has embraced quantum computing as a key technology for the future of mobility. From its headquarters in Stuttgart, Germany, the company is exploring how quantum computing can accelerate the development of electric vehicles, optimize manufacturing processes, and enhance the driving experience through advanced materials and AI.

The automotive industry faces unprecedented computational challenges as it transitions to electric and autonomous vehicles. Battery chemistry optimization requires simulating quantum mechanical interactions between materials, route optimization for logistics involves solving complex traveling salesman problems at scale, and autonomous driving systems demand real-time processing of vast sensor data streams. Mercedes-Benz recognizes that quantum computing could provide breakthroughs in these areas that are impossible with classical computers alone.

Mercedes-Benz's quantum initiatives reflect a comprehensive approach to technology adoption. The company has partnered with IBM to access quantum computing resources through the IBM Quantum Network, collaborating on research projects in materials science and optimization. Their research focuses on quantum chemistry simulations for battery development, quantum machine learning for manufacturing optimization, and quantum algorithms for supply chain management. Mercedes-Benz has also invested in quantum computing startups and participates in European quantum computing initiatives.

The company's early adoption of quantum computing is driven by the automotive industry's rapid transformation. As vehicles become increasingly software-defined and electrified, computational capabilities become a key differentiator. Mercedes-Benz is investing in quantum computing to accelerate battery development for longer-range electric vehicles, optimize global supply chains and reduce costs, develop new materials for lighter and stronger vehicles, and enhance AI capabilities for autonomous driving systems. This proactive approach positions them to leverage quantum advantage as soon as it becomes available.

Looking ahead, Mercedes-Benz envisions quantum computing revolutionizing automotive design and manufacturing. This includes simulating entire vehicles at the molecular level for optimal material selection, real-time optimization of global production and logistics networks, personalized driving experiences powered by quantum-enhanced AI, and breakthrough innovations in sustainable mobility solutions. The company's quantum computing strategy aligns with its broader vision of leading the transformation to sustainable and intelligent mobility.`
  },

  'boeing': {
    industry: 'Aerospace',
    content: `Boeing, one of the world's largest aerospace companies, has identified quantum computing as a critical technology for maintaining leadership in aviation and space exploration. From its headquarters in Arlington, Virginia, Boeing is exploring how quantum computing can revolutionize aircraft design, optimize complex logistics, and advance materials science for next-generation aerospace applications.

The aerospace industry operates at the cutting edge of engineering, where small improvements in efficiency or performance can have massive impacts. Computational fluid dynamics for aerodynamic optimization, materials simulation for composite development, and mission planning for space exploration all push the boundaries of classical computing. Boeing recognizes that quantum computing could enable breakthrough innovations in these areas, potentially revolutionizing how aircraft are designed, manufactured, and operated.

Boeing's quantum computing initiatives span research, partnerships, and practical applications. The company has established quantum research collaborations with leading universities and quantum computing companies, including partnerships with IBM and IonQ. Boeing's research focuses on quantum algorithms for optimization problems in aerospace engineering, quantum simulation for materials discovery and testing, and quantum machine learning for predictive maintenance. The company has also invested in quantum computing startups through Boeing HorizonX Ventures, demonstrating long-term commitment to the technology.

Boeing's early investment in quantum computing is motivated by both competitive advantage and mission-critical needs. In the commercial aviation market, even small improvements in fuel efficiency or maintenance scheduling can save billions of dollars. In defense and space applications, quantum computing could enable capabilities that are simply impossible with classical computers, such as real-time optimization of satellite constellations or simulation of hypersonic flight conditions. Boeing is building quantum expertise now to ensure they can leverage these advantages as quantum hardware matures.

Looking to the future, Boeing envisions quantum computing transforming every aspect of aerospace. This includes designing aircraft with perfect aerodynamic efficiency through quantum simulation, optimizing global airline networks for minimal fuel consumption and delays, discovering revolutionary materials for spacecraft that can withstand extreme conditions, and enabling autonomous systems that can make complex decisions in real-time. Boeing's quantum strategy positions them to lead the aerospace industry's quantum transformation while advancing the frontiers of flight and space exploration.`
  },

  'volkswagen': {
    industry: 'Automotive',
    content: `Volkswagen Group, Europe's largest automaker, has established itself as a pioneer in applying quantum computing to automotive challenges. From its headquarters in Wolfsburg, Germany, Volkswagen is leveraging quantum technology to accelerate the transition to electric mobility, optimize urban transportation, and revolutionize vehicle manufacturing processes.

The automotive industry's shift toward electrification and digitalization creates computational challenges that exceed classical computing capabilities. Battery chemistry optimization for electric vehicles requires quantum-level simulation of chemical reactions, traffic flow optimization in smart cities involves solving complex routing problems in real-time, and production planning across global manufacturing networks demands optimization across thousands of variables. Volkswagen sees quantum computing as essential for maintaining competitiveness in this rapidly evolving landscape.

Volkswagen's quantum computing program is one of the most advanced in the automotive industry. The company has established a dedicated quantum computing team in San Francisco, partnering with D-Wave, Google, and IBM to access different quantum computing technologies. Their achievements include demonstrating traffic flow optimization in Lisbon using quantum computers, developing quantum algorithms for battery chemistry simulation, and exploring quantum machine learning for production optimization. Volkswagen has also collaborated with quantum software companies to develop industry-specific applications.

The company's early adoption of quantum computing reflects its strategic vision for the future of mobility. Volkswagen is investing in quantum technology to accelerate the development of next-generation electric vehicle batteries, optimize charging infrastructure placement and grid integration, enhance autonomous driving capabilities through quantum machine learning, and revolutionize manufacturing through quantum-optimized production planning. This proactive approach aims to establish Volkswagen as a technology leader in the automotive industry's digital transformation.

Volkswagen's future outlook for quantum computing extends beyond traditional automotive applications. The company envisions quantum-powered smart cities with optimized traffic flow and reduced emissions, personalized mobility services based on quantum-enhanced AI, breakthrough innovations in sustainable materials and manufacturing processes, and new business models enabled by quantum computing capabilities. Their quantum strategy aligns with Volkswagen's broader commitment to becoming a software-driven mobility provider for the sustainable, connected future of transportation.`
  },

  'roche': {
    industry: 'Pharmaceuticals',
    content: `Roche, a global pioneer in pharmaceuticals and diagnostics headquartered in Basel, Switzerland, has embraced quantum computing as a transformative technology for drug discovery and personalized medicine. As one of the world's largest biotech companies, Roche recognizes that quantum computing could accelerate the development of life-saving treatments and revolutionize how diseases are diagnosed and treated.

The pharmaceutical industry faces immense computational challenges in drug discovery and development. Simulating protein folding and drug-protein interactions requires modeling quantum mechanical effects that are computationally intractable for classical computers. Clinical trial optimization involves complex statistical models across diverse patient populations, and personalized medicine demands analyzing vast genomic datasets to identify optimal treatments. Roche views quantum computing as potentially reducing drug development timelines from decades to years while enabling entirely new therapeutic approaches.

Roche's quantum initiatives reflect a comprehensive strategy for leveraging this emerging technology. The company has partnered with Cambridge Quantum Computing (now Quantinuum) and IBM to explore quantum applications in drug discovery. Their research focuses on quantum simulation of molecular interactions for drug design, quantum machine learning for biomarker discovery and patient stratification, and quantum optimization for clinical trial design. Roche has also invested in building internal quantum expertise through training programs and academic collaborations.

The company's early investment in quantum computing is driven by the potential to address unmet medical needs. Many diseases remain untreatable because the computational requirements for understanding their molecular mechanisms exceed classical computing capabilities. Roche is preparing for quantum advantage to accelerate the discovery of treatments for complex diseases like Alzheimer's and cancer, reduce the cost and time of bringing new drugs to market, enable truly personalized medicine based on individual genetic profiles, and identify novel drug targets through quantum simulation of biological systems.

Looking forward, Roche envisions quantum computing fundamentally transforming healthcare. This includes simulating entire biological pathways to understand disease mechanisms, designing drugs with atomic precision for minimal side effects, predicting treatment outcomes based on individual patient data, and discovering entirely new classes of therapeutics through quantum-enhanced exploration of chemical space. Roche's quantum strategy positions them to lead the pharmaceutical industry's quantum revolution while advancing their mission of improving patients' lives through innovation.`
  },

  'airbus': {
    industry: 'Aerospace',
    content: `Airbus, a global leader in aerospace and defense, has positioned quantum computing at the center of its digital transformation strategy. From its headquarters in Toulouse, France, Airbus is exploring how quantum technology can revolutionize aircraft design, optimize complex supply chains, and enable breakthrough innovations in sustainable aviation.

The aerospace industry operates at the intersection of multiple complex systems where optimization and simulation challenges push classical computing to its limits. Computational fluid dynamics for next-generation aircraft design, route optimization for global airline networks, and materials discovery for lightweight, strong components all require enormous computational resources. Airbus recognizes that quantum computing could provide the computational power needed to achieve the next leap in aviation technology and efficiency.

Airbus's quantum computing initiatives span multiple divisions and application areas. The company established the Airbus Quantum Computing Application Challenge, engaging the global quantum community in solving aerospace problems. They have partnered with quantum computing companies including IBM, Pasqal, and IonQ to explore different quantum technologies. Airbus's research focuses on quantum algorithms for aircraft loading optimization, quantum simulation for materials and fluid dynamics, and quantum machine learning for predictive maintenance. The company has demonstrated practical quantum computing applications, including route optimization for aircraft climb trajectories.

Airbus's early adoption of quantum computing reflects its commitment to pioneering sustainable aviation. The company is investing in quantum technology to design more fuel-efficient aircraft through optimized aerodynamics, develop sustainable aviation fuels through quantum chemistry simulation, optimize global supply chains to reduce costs and environmental impact, and enhance flight safety through quantum-powered predictive analytics. This strategic approach positions Airbus to leverage quantum advantages as the technology matures while addressing the aviation industry's sustainability challenges.

Looking to the future, Airbus envisions quantum computing enabling a new era of aviation innovation. This includes designing zero-emission aircraft through quantum simulation of hydrogen propulsion systems, optimizing air traffic management for reduced delays and emissions, discovering revolutionary materials that make aircraft lighter and stronger, and enabling urban air mobility through quantum-optimized routing and scheduling. Airbus's quantum strategy aligns with its vision of pioneering sustainable aerospace for a safe and united world.`
  },

  'bmw-group': {
    industry: 'Automotive',
    content: `BMW Group, renowned for driving innovation in premium mobility, has established a comprehensive quantum computing program to maintain its technological edge. From its headquarters in Munich, Germany, BMW is exploring how quantum computing can enhance vehicle development, optimize production processes, and create new customer experiences in the era of electric and autonomous vehicles.

The premium automotive sector faces unique computational challenges in balancing performance, luxury, and sustainability. Optimizing powertrains for maximum efficiency while maintaining BMW's signature driving dynamics, simulating crash scenarios with new materials and battery configurations, and personalizing vehicles to individual customer preferences all require immense computational power. BMW Group recognizes that quantum computing could enable breakthrough innovations that differentiate their products in an increasingly competitive market.

BMW's quantum computing initiatives demonstrate a systematic approach to technology adoption. The company has joined the IBM Quantum Network and partnered with quantum computing companies including Pasqal and IonQ. BMW's quantum research focuses on optimization problems in production planning and logistics, quantum chemistry for battery and fuel cell development, and quantum machine learning for quality control and predictive maintenance. The company has achieved practical demonstrations, including optimizing robot movements in manufacturing using quantum algorithms.

BMW Group's early investment in quantum computing is driven by its commitment to technological leadership. The company is leveraging quantum technology to accelerate the development of next-generation electric vehicle batteries, optimize global production networks for efficiency and flexibility, enhance autonomous driving systems through quantum machine learning, and create personalized customer experiences through quantum-powered analytics. This proactive approach ensures BMW remains at the forefront of automotive innovation as the industry undergoes fundamental transformation.

Looking ahead, BMW envisions quantum computing revolutionizing premium mobility. This includes designing vehicles optimized at the molecular level for performance and sustainability, enabling real-time customization of vehicle characteristics based on driving conditions, creating new mobility services powered by quantum optimization, and achieving carbon neutrality through quantum-optimized supply chains and production. BMW's quantum strategy reinforces its position as a technology leader while advancing its vision of sustainable, premium mobility for the future.`
  },

  'hsbc': {
    industry: 'Financial Services',
    content: `HSBC, one of the world's largest banking and financial services organizations, has recognized quantum computing as a strategic technology for the future of global finance. With operations spanning 64 countries and serving over 40 million customers, HSBC is exploring how quantum computing can enhance risk management, combat financial crime, and enable new financial products and services.

The global banking industry faces computational challenges that scale with the complexity and interconnectedness of modern financial systems. Real-time fraud detection across millions of daily transactions, portfolio optimization across diverse asset classes and currencies, and regulatory compliance requiring complex scenario analysis all strain classical computing capabilities. HSBC views quantum computing as essential for managing these challenges while maintaining competitive advantage in digital banking services.

HSBC's quantum computing program reflects its global perspective and technological ambition. The bank has partnered with IBM through the IBM Quantum Network and collaborates with quantum software companies to develop financial applications. HSBC's quantum research focuses on quantum algorithms for collateral optimization, quantum machine learning for fraud detection and anti-money laundering, and quantum cryptography for securing financial transactions. The bank has published research on quantum computing applications in finance and actively participates in industry consortiums exploring quantum technologies.

HSBC's early adoption of quantum computing is motivated by both opportunity and risk management. On the opportunity side, quantum computing could enable more sophisticated financial products and better customer service through enhanced analytics. On the risk side, HSBC must prepare for quantum threats to current encryption standards while positioning itself to leverage quantum advantages. The bank is investing in quantum-safe cryptography while exploring positive applications of quantum computing across its global operations.

Looking forward, HSBC envisions quantum computing transforming international banking and finance. This includes enabling real-time risk assessment across global markets and currencies, revolutionizing trade finance through quantum-secured smart contracts, enhancing financial inclusion through quantum-optimized microfinance, and combating financial crime through quantum-powered pattern recognition. HSBC's quantum strategy positions the bank to lead the financial industry's quantum transformation while serving customers and communities worldwide.`
  },

  'microsoft': {
    industry: 'Technology',
    content: `Microsoft has already been covered extensively in the quantum companies section as they are primarily a quantum technology provider rather than a partner company adopting quantum computing.`
  },

  'nvidia': {
    industry: 'Technology',
    content: `NVIDIA, the world's leading GPU manufacturer and AI computing company, has positioned itself strategically at the intersection of classical and quantum computing. From its headquarters in Santa Clara, California, NVIDIA is developing technologies that bridge the gap between today's AI supercomputers and tomorrow's quantum computers, recognizing that hybrid classical-quantum systems will define the future of computing.

The technology industry faces an inflection point as Moore's Law slows and computational demands grow exponentially. Training large AI models requires massive parallel processing power, simulating quantum systems on classical hardware demands specialized architectures, and optimizing hybrid algorithms needs seamless integration between classical and quantum processors. NVIDIA sees its role as providing the classical computing infrastructure and software tools that will enable and complement quantum computers, creating a new paradigm of accelerated computing.

NVIDIA's quantum initiatives leverage its strengths in GPU computing and software development. The company has developed cuQuantum, a software development kit that enables quantum circuit simulation on NVIDIA GPUs, achieving record-breaking simulation speeds. They've partnered with quantum computing companies including IonQ, Pasqal, and Quantum Machines to integrate GPU acceleration with quantum hardware. NVIDIA's DGX Quantum platform, developed with Quantum Machines, combines GPUs with quantum control systems to enable hybrid classical-quantum computing workflows.

NVIDIA's engagement with quantum computing reflects its vision of accelerated computing's future. The company is investing in quantum technologies to accelerate quantum algorithm development through GPU-powered simulation, enable hybrid classical-quantum machine learning applications, provide the classical computing infrastructure for quantum error correction, and bridge the gap between current AI systems and future quantum AI. This strategic positioning ensures NVIDIA remains central to computing innovation as quantum technologies mature.

Looking ahead, NVIDIA envisions a future where GPUs and quantum processors work seamlessly together. This includes training AI models that leverage both classical and quantum computing resources, simulating complex systems using hybrid classical-quantum algorithms, accelerating drug discovery through GPU-quantum collaborative processing, and enabling new applications that combine the strengths of both computing paradigms. NVIDIA's quantum strategy positions them as an essential enabler of the quantum computing revolution while maintaining leadership in accelerated classical computing.`
  },

  'ford': {
    industry: 'Automotive',
    content: `Ford Motor Company, an icon of American automotive innovation, has embraced quantum computing as part of its transformation into a technology-driven mobility company. From its headquarters in Dearborn, Michigan, Ford is exploring how quantum computing can accelerate electric vehicle development, optimize manufacturing processes, and enhance the customer experience in an increasingly digital automotive landscape.

The automotive industry's rapid evolution toward electrification, autonomy, and connectivity creates computational challenges that traditional methods struggle to address. Battery chemistry optimization for electric vehicles requires quantum-mechanical simulation, routing algorithms for autonomous vehicle fleets demand real-time optimization, and supply chain management across global operations involves countless variables. Ford recognizes that quantum computing could provide the computational breakthroughs needed to lead in these transformative areas.

Ford's quantum computing initiatives reflect a pragmatic approach to emerging technology adoption. The company has partnered with NASA's Quantum Artificial Intelligence Laboratory and worked with D-Wave on optimization problems. Ford's quantum research focuses on traffic flow optimization for reducing urban congestion, quantum algorithms for battery materials discovery, and machine learning applications for manufacturing quality control. The company has demonstrated practical applications, including using quantum computing to optimize ride-sharing routes in congested cities.

Ford's investment in quantum computing aligns with its Ford+ plan for growth and value creation. The company is leveraging quantum technology to accelerate the development of breakthrough battery technologies for electric vehicles, optimize production planning across its global manufacturing network, enhance connected vehicle services through quantum-powered analytics, and improve autonomous vehicle decision-making through quantum machine learning. This forward-looking approach positions Ford to capitalize on quantum advantages while transforming its business model for the digital age.

Looking to the future, Ford envisions quantum computing enabling new paradigms in mobility and manufacturing. This includes designing vehicles optimized for specific use cases through quantum simulation, creating dynamic transportation networks that adapt in real-time to demand, achieving zero-waste manufacturing through quantum-optimized resource allocation, and delivering personalized mobility experiences powered by quantum AI. Ford's quantum strategy supports its mission of helping build a better world where every person is free to move and pursue their dreams.`
  },

  'lockheed-martin': {
    industry: 'Defense & Aerospace',
    content: `Lockheed Martin, a global aerospace, defense, and technology company, has been at the forefront of quantum computing adoption in the defense sector. From its headquarters in Bethesda, Maryland, Lockheed Martin is exploring how quantum computing can enhance national security, advance space exploration, and solve complex engineering challenges that are critical to defense and aerospace applications.

The defense and aerospace industry faces computational challenges that directly impact national security and technological superiority. Radar signal processing requires real-time analysis of massive data streams, satellite constellation optimization involves complex orbital mechanics, and materials design for hypersonic vehicles demands simulation at the quantum level. Lockheed Martin recognizes that quantum computing could provide decisive advantages in these mission-critical areas, potentially revolutionizing defense capabilities and space exploration.

Lockheed Martin's quantum computing program demonstrates long-term strategic thinking. The company was one of the first commercial customers of D-Wave Systems, installing a quantum computer in 2011 for research purposes. They've established partnerships with quantum computing companies and universities to explore different quantum technologies. Lockheed Martin's quantum research focuses on verification and validation of complex systems, quantum machine learning for pattern recognition and anomaly detection, and optimization problems in aerospace engineering. The company has published research on using quantum computing for software verification in mission-critical systems.

Lockheed Martin's early adoption of quantum computing reflects its commitment to maintaining technological superiority. The company is investing in quantum technology to enhance cybersecurity through quantum-resistant encryption and quantum key distribution, optimize satellite operations and space mission planning, accelerate the development of advanced materials for extreme environments, and improve autonomous systems for defense applications. This proactive approach ensures Lockheed Martin can leverage quantum advantages for national security while advancing peaceful applications in space and technology.

Looking forward, Lockheed Martin envisions quantum computing transforming defense and aerospace capabilities. This includes enabling unhackable quantum communication networks for secure military communications, simulating complex battlespace scenarios for strategic planning, designing revolutionary propulsion systems through quantum simulation, and advancing space exploration through quantum-enhanced navigation and communication. Lockheed Martin's quantum strategy positions them to lead in applying quantum technologies to the most challenging problems in defense and aerospace.`
  },

  'rolls-royce': {
    industry: 'Aerospace & Engineering',
    content: `Rolls-Royce, a global leader in power systems and propulsion, has identified quantum computing as a key technology for advancing engineering excellence and sustainability. From its headquarters in London, UK, Rolls-Royce is exploring how quantum computing can revolutionize jet engine design, optimize complex engineering systems, and accelerate the transition to sustainable power solutions.

The aerospace and power generation industries face engineering challenges that push the boundaries of computational modeling. Turbine blade design requires simulation of fluid dynamics and heat transfer at microscopic scales, materials development for extreme conditions demands quantum-mechanical modeling, and maintenance optimization across global fleets involves complex predictive analytics. Rolls-Royce recognizes that quantum computing could enable breakthrough innovations in efficiency and performance that are impossible with classical simulation methods.

Rolls-Royce's quantum computing initiatives reflect its commitment to pioneering engineering innovation. The company has partnered with quantum computing companies including Classiq to develop quantum algorithms for engineering applications. Their quantum research focuses on computational fluid dynamics for engine design optimization, quantum simulation for advanced materials discovery, and quantum machine learning for predictive maintenance. Rolls-Royce has also engaged with UK quantum computing initiatives, contributing to the development of the national quantum computing ecosystem.

Rolls-Royce's investment in quantum computing is driven by its vision for sustainable power and propulsion. The company is leveraging quantum technology to design more efficient jet engines that reduce emissions and fuel consumption, develop new materials that can withstand extreme temperatures and pressures, optimize maintenance schedules to maximize asset availability and reduce costs, and accelerate the development of sustainable aviation fuels and hydrogen propulsion systems. This strategic approach positions Rolls-Royce to lead in developing the power solutions needed for a sustainable future.

Looking ahead, Rolls-Royce envisions quantum computing enabling a new era of engineering innovation. This includes designing zero-emission propulsion systems through quantum simulation, creating self-optimizing engines that adapt to operating conditions in real-time, developing revolutionary materials that extend engine life and performance, and enabling predictive maintenance that prevents failures before they occur. Rolls-Royce's quantum strategy aligns with its purpose of pioneering the power that matters to make the world work better.`
  }
};

// Add more companies in the next batch...
const additionalPartnerContent: Record<string, { content: string; industry: string }> = {
  'astrazeneca': {
    industry: 'Pharmaceuticals',
    content: `AstraZeneca, a global biopharmaceutical company headquartered in Cambridge, UK, has embraced quantum computing as a transformative technology for drug discovery and development. With a strong focus on oncology, cardiovascular, and respiratory diseases, AstraZeneca recognizes that quantum computing could dramatically accelerate the journey from drug discovery to patient treatment.

The pharmaceutical industry's drug discovery process is inherently quantum mechanical, involving molecular interactions that classical computers struggle to simulate accurately. Protein-drug binding requires modeling quantum effects in large molecular systems, lead optimization involves exploring vast chemical spaces, and predicting drug metabolism and toxicity demands complex multi-scale simulations. AstraZeneca views quantum computing as potentially reducing drug development timelines while improving success rates in clinical trials.

AstraZeneca's quantum initiatives demonstrate a comprehensive approach to technology adoption. The company has partnered with quantum computing companies including IBM and Menten AI to explore quantum applications in drug discovery. Their research focuses on quantum simulation for protein folding and drug-target interactions, quantum machine learning for biomarker discovery, and quantum optimization for clinical trial design. AstraZeneca has also invested in building internal quantum expertise through collaborations with academic institutions.

The company's early investment in quantum computing reflects its commitment to scientific innovation and patient care. AstraZeneca is leveraging quantum technology to accelerate the discovery of novel drug targets for complex diseases, improve drug design through accurate molecular simulation, optimize clinical trials through better patient stratification, and advance personalized medicine through quantum-enhanced genomic analysis. This proactive approach positions AstraZeneca to deliver breakthrough medicines faster and more efficiently.

Looking forward, AstraZeneca envisions quantum computing revolutionizing every stage of drug development. This includes simulating entire biological pathways to understand disease mechanisms, designing drugs with unprecedented precision and fewer side effects, predicting drug responses based on individual patient genetics, and discovering entirely new therapeutic modalities through quantum exploration. AstraZeneca's quantum strategy supports its ambition to push the boundaries of science to deliver life-changing medicines.`
  },

  'deloitte': {
    industry: 'Professional Services',
    content: `Deloitte, one of the world's largest professional services networks, has positioned itself as a leader in helping organizations navigate the quantum computing revolution. With operations in over 150 countries, Deloitte recognizes that quantum computing will transform business operations across industries and is building capabilities to guide clients through this technological transformation.

The professional services industry faces the challenge of understanding and applying emerging technologies across diverse client needs. Risk assessment requires analyzing complex interdependencies in global business networks, audit procedures involve processing vast amounts of financial data, and strategic consulting demands optimization across multiple business dimensions. Deloitte sees quantum computing as both a service offering and a tool for enhancing their own capabilities in serving clients more effectively.

Deloitte's quantum initiatives span research, education, and client services. The company has established quantum computing practices in multiple regions, partnering with quantum technology providers to offer implementation services. Their quantum teams focus on identifying quantum use cases across industries, developing quantum readiness assessments for organizations, and creating quantum strategy roadmaps for enterprise clients. Deloitte has published extensive research on quantum computing's business implications and offers quantum literacy programs for executives.

Deloitte's investment in quantum computing reflects its role as a trusted advisor to global organizations. The company is building quantum expertise to help clients identify quantum opportunities and threats in their industries, prepare for the transition to quantum-safe cryptography, develop quantum computing pilot projects and proof-of-concepts, and build internal quantum capabilities through training and recruitment. This comprehensive approach positions Deloitte as the go-to advisor for organizations navigating the quantum era.

Looking ahead, Deloitte envisions quantum computing creating new paradigms in business consulting and professional services. This includes quantum-enhanced risk modeling for more accurate business forecasting, quantum-powered audit procedures that can detect complex financial anomalies, strategic optimization that considers millions of variables simultaneously, and new service offerings built around quantum computing capabilities. Deloitte's quantum strategy ensures they remain at the forefront of technological transformation while helping clients succeed in the quantum future.`
  },

  'accenture': {
    industry: 'Professional Services',
    content: `Accenture, a global professional services company specializing in digital transformation, has established quantum computing as a key pillar of its emerging technology portfolio. From offices in more than 120 countries, Accenture is helping organizations understand, prepare for, and leverage quantum computing's transformative potential across industries.

The consulting and technology services industry must stay ahead of technological disruptions to provide value to clients. Digital transformation projects require optimizing complex IT architectures, supply chain optimization involves countless variables and constraints, and AI implementations demand ever-increasing computational power. Accenture recognizes that quantum computing represents the next frontier in computational capability and is positioning itself to guide clients through this transformation.

Accenture's quantum computing program combines thought leadership, technical expertise, and practical implementation. The company has partnered with leading quantum computing providers including IBM, IonQ, and 1QBit to offer comprehensive quantum services. Their quantum practice focuses on quantum algorithm development for specific industry use cases, quantum computing training and education programs, and integration of quantum computing with existing enterprise systems. Accenture Labs conducts research on quantum applications and has developed frameworks for quantum adoption.

Accenture's investment in quantum computing aligns with its mission to deliver on the promise of technology and human ingenuity. The company is building quantum capabilities to help clients identify and prioritize quantum computing use cases, develop proof-of-concepts and pilot implementations, prepare for quantum security threats and opportunities, and build quantum-ready workforces through reskilling programs. This holistic approach ensures Accenture can guide organizations through every aspect of quantum adoption.

Looking forward, Accenture envisions quantum computing enabling new forms of business innovation and value creation. This includes quantum-powered business process optimization that transforms operations, hybrid classical-quantum AI systems that solve previously intractable problems, quantum-safe architectures that protect against future threats, and entirely new business models enabled by quantum capabilities. Accenture's quantum strategy positions them to lead the professional services industry in delivering quantum value to clients worldwide.`
  },

  'barclays': {
    industry: 'Financial Services',
    content: `Barclays, a British multinational bank with over 300 years of history, has emerged as an innovator in exploring quantum computing applications for banking and financial services. From its headquarters in London, Barclays is investigating how quantum technology can enhance everything from trading strategies to customer service in the digital banking era.

The banking industry's computational needs have grown exponentially with algorithmic trading, real-time risk management, and personalized financial services. Portfolio optimization across global markets requires analyzing countless scenarios, fraud detection demands pattern recognition across millions of transactions, and regulatory compliance involves complex stress testing and reporting. Barclays views quantum computing as a potential game-changer that could provide competitive advantages in these critical areas.

Barclays' quantum computing initiatives demonstrate forward-thinking innovation. The bank has partnered with IBM through the IBM Quantum Network and collaborated with quantum software companies on financial applications. Their quantum research focuses on quantum algorithms for derivative pricing and risk analysis, quantum machine learning for credit scoring and fraud detection, and quantum optimization for portfolio management. Barclays has published research on quantum computing applications in finance and actively participates in industry forums on quantum technologies.

Barclays' early adoption of quantum computing reflects its commitment to technological leadership in banking. The bank is investing in quantum technology to enhance trading strategies through better market prediction and optimization, improve risk management through more comprehensive scenario analysis, strengthen cybersecurity through quantum-safe encryption, and deliver personalized financial services through quantum-enhanced analytics. This strategic approach ensures Barclays remains competitive as the financial industry undergoes digital transformation.

Looking ahead, Barclays envisions quantum computing reshaping retail and investment banking. This includes real-time optimization of global trading portfolios, quantum-secured digital currencies and payment systems, hyper-personalized financial products based on individual needs, and advanced fraud prevention through quantum pattern recognition. Barclays' quantum strategy positions the bank to leverage technological innovation while maintaining its tradition of banking excellence.`
  },

  'saudi-aramco': {
    industry: 'Energy',
    content: `Saudi Aramco, the world's largest oil and gas company, has recognized quantum computing as a strategic technology for the future of energy. From its headquarters in Dhahran, Saudi Arabia, Aramco is exploring how quantum computing can optimize oil and gas operations, accelerate the energy transition, and solve complex geological and chemical challenges.

The energy industry faces computational challenges that span from molecular-level chemistry to global-scale logistics. Reservoir simulation requires modeling fluid dynamics in complex geological formations, catalyst design for refining involves quantum chemical calculations, and supply chain optimization encompasses production, refining, and distribution worldwide. Saudi Aramco sees quantum computing as essential for maintaining leadership while transitioning toward sustainable energy solutions.

Saudi Aramco's quantum initiatives reflect its position as an energy technology leader. The company has partnered with Pasqal to explore quantum computing applications in the energy sector. Their quantum research focuses on quantum simulation for materials discovery and catalyst design, quantum optimization for production and logistics planning, and quantum machine learning for seismic data analysis. Aramco has also invested in building regional quantum expertise through university partnerships and research programs.

The company's investment in quantum computing aligns with its dual mission of providing reliable energy while advancing sustainability. Aramco is leveraging quantum technology to optimize oil and gas extraction for maximum efficiency and minimal environmental impact, develop new materials for carbon capture and storage, advance hydrogen production and renewable energy technologies, and improve predictive maintenance across vast infrastructure networks. This forward-looking approach positions Aramco to lead the energy industry's technological transformation.

Looking to the future, Saudi Aramco envisions quantum computing enabling a new era of energy innovation. This includes discovering breakthrough materials for clean energy production and storage, optimizing global energy networks for sustainability and reliability, simulating complex chemical processes for cleaner fuels and chemicals, and enabling the circular carbon economy through quantum-enhanced technologies. Aramco's quantum strategy supports its vision of providing reliable, sustainable, and affordable energy for global prosperity.`
  },

  'toyota': {
    industry: 'Automotive',
    content: `Toyota Motor Corporation, the world's largest automaker by production volume, has embraced quantum computing as part of its transformation toward sustainable mobility. From its headquarters in Toyota City, Japan, the company is exploring how quantum technology can accelerate the development of next-generation vehicles, optimize global operations, and contribute to a carbon-neutral society.

The automotive industry's evolution toward electrification, automation, and new mobility services creates unprecedented computational demands. Battery materials discovery requires quantum-level simulation of electrochemical processes, traffic optimization for connected vehicles involves real-time routing of millions of vehicles, and lean manufacturing optimization spans complex global supply chains. Toyota recognizes that quantum computing could provide breakthrough capabilities essential for leadership in future mobility.

Toyota's quantum computing initiatives reflect its systematic approach to innovation. The company has partnered with quantum computing companies including D-Wave and has invested in quantum research through Toyota Research Institute. Their quantum focus areas include quantum simulation for fuel cell and battery development, quantum optimization for production planning and logistics, and quantum machine learning for autonomous driving systems. Toyota has demonstrated practical applications, including using quantum computing to optimize traffic flow in cities.

Toyota's investment in quantum computing aligns with its commitment to "Mobility for All" and carbon neutrality. The company is leveraging quantum technology to accelerate the development of solid-state batteries for electric vehicles, optimize hydrogen fuel cell technology for zero-emission transportation, enhance the Toyota Production System through quantum optimization, and enable smart cities through quantum-powered traffic management. This comprehensive approach ensures Toyota remains at the forefront of sustainable mobility innovation.

Looking ahead, Toyota envisions quantum computing transforming how society moves. This includes designing vehicles optimized at the molecular level for efficiency and safety, creating seamless multimodal transportation networks, achieving zero-waste manufacturing through perfect resource optimization, and enabling mobility solutions that adapt to individual and societal needs. Toyota's quantum strategy supports its vision of producing happiness for all through mobility while contributing to a sustainable future.`
  },

  'exxonmobil': {
    industry: 'Energy',
    content: `ExxonMobil, one of the world's largest publicly traded energy companies, has identified quantum computing as a critical technology for advancing energy innovation and sustainability. From its headquarters in Irving, Texas, ExxonMobil is exploring how quantum computing can enhance exploration and production, develop cleaner fuels, and accelerate the development of low-carbon solutions.

The energy industry's technical challenges often involve complex chemistry and physics that push computational limits. Molecular simulation for catalyst design requires quantum mechanical accuracy, reservoir modeling involves fluid dynamics in heterogeneous media, and carbon capture technologies demand understanding of complex chemical interactions. ExxonMobil recognizes that quantum computing could unlock breakthroughs in these areas, enabling more efficient and sustainable energy solutions.

ExxonMobil's quantum computing program leverages its deep technical expertise and research capabilities. The company has partnered with IBM through the IBM Quantum Network and collaborates with universities on quantum research. Their quantum initiatives focus on quantum algorithms for molecular simulation and materials discovery, quantum optimization for refinery operations and logistics, and quantum machine learning for subsurface imaging and exploration. ExxonMobil's Corporate Strategic Research laboratory leads efforts to identify and develop quantum applications for energy.

The company's investment in quantum computing reflects its commitment to solving complex energy challenges. ExxonMobil is exploring quantum technology to develop advanced materials for carbon capture and storage, optimize chemical processes for cleaner fuel production, improve exploration through better geological modeling, and advance renewable energy technologies through materials innovation. This strategic approach positions ExxonMobil to leverage quantum computing for both traditional energy operations and emerging low-carbon solutions.

Looking forward, ExxonMobil envisions quantum computing accelerating the energy transition. This includes discovering breakthrough catalysts for efficient chemical transformations, optimizing integrated energy systems across multiple sources, developing revolutionary materials for energy storage and conversion, and enabling circular economy solutions through molecular-level recycling. ExxonMobil's quantum strategy aligns with its mission to provide energy and products that enable modern life while addressing environmental challenges.`
  },

  'natwest': {
    industry: 'Financial Services',
    content: `NatWest Group, a major British banking and insurance holding company, has positioned quantum computing as a key technology for future financial services innovation. From its headquarters in Edinburgh, Scotland, NatWest is exploring how quantum computing can enhance risk management, improve customer services, and strengthen financial security in an increasingly digital banking landscape.

The UK banking sector faces unique challenges in maintaining competitiveness while serving diverse customer needs. Credit risk assessment requires analyzing complex financial networks and dependencies, anti-money laundering involves detecting subtle patterns across vast transaction datasets, and personalized banking demands real-time optimization of financial products. NatWest sees quantum computing as enabling new capabilities that could transform how banks serve customers and manage risk.

NatWest's quantum computing initiatives reflect its commitment to technological innovation. The bank has partnered with IBM and Fujitsu to explore quantum applications in finance. Their quantum research focuses on quantum algorithms for portfolio optimization and risk analysis, quantum machine learning for fraud detection and customer insights, and quantum cryptography for securing financial transactions. NatWest has been particularly active in exploring quantum computing for environmental, social, and governance (ESG) applications.

NatWest's investment in quantum computing aligns with its purpose-led strategy. The bank is exploring quantum technology to enhance sustainable finance through better ESG risk modeling, improve financial inclusion through quantum-optimized credit scoring, strengthen operational resilience through quantum-enhanced cybersecurity, and deliver superior customer experiences through quantum-powered personalization. This forward-thinking approach positions NatWest to leverage quantum advantages while serving customers and communities.

Looking ahead, NatWest envisions quantum computing enabling a new era of responsible banking. This includes quantum-powered climate risk modeling for sustainable lending, real-time fraud prevention that protects customers without friction, hyper-personalized financial wellness solutions, and quantum-secured digital banking infrastructure. NatWest's quantum strategy supports its ambition to champion potential and help people, families, and businesses thrive.`
  }
};

// Function to update companies with content
async function updatePartnerCompanies() {
  console.log('Starting to update partner companies with content...');
  
  // Combine both content objects
  const allContent = { ...partnerCompanyContent, ...additionalPartnerContent };

  for (const [slug, data] of Object.entries(allContent)) {
    // Skip if it's a note about already covered content
    if (data.content.includes('already been covered')) {
      console.log(`⊘ Skipping ${slug} (already covered)`);
      continue;
    }

    try {
      const { error } = await supabase
        .from('partner_companies')
        .update({ 
          main_content: data.content,
          industry: data.industry,
          updated_at: new Date().toISOString()
        })
        .eq('slug', slug);

      if (error) {
        console.error(`Error updating ${slug}:`, error);
      } else {
        console.log(`✓ Updated content for ${slug} (${data.industry})`);
      }
    } catch (error) {
      console.error(`Failed to update ${slug}:`, error);
    }
  }

  console.log('Completed updating partner companies!');
}

// Run the update
updatePartnerCompanies().catch(console.error);