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

// Content for remaining partner companies
const remainingPartnerContent: Record<string, { content: string; industry: string }> = {
  'bbva': {
    industry: 'Financial Services',
    content: `BBVA (Banco Bilbao Vizcaya Argentaria), one of the largest financial institutions in the Spanish-speaking world, has positioned quantum computing as a strategic technology for digital banking innovation. From its headquarters in Madrid and Bilbao, Spain, BBVA is exploring how quantum computing can enhance financial services across its global operations in Europe, the Americas, and Asia.

The international banking sector faces unique challenges in serving diverse markets while maintaining operational efficiency. Cross-border payment optimization requires navigating complex regulatory and currency considerations, credit risk assessment must account for varied economic conditions across regions, and digital banking services demand real-time personalization at scale. BBVA recognizes that quantum computing could provide competitive advantages in these areas while advancing its digital transformation strategy.

BBVA's quantum computing initiatives demonstrate its commitment to technological innovation. The bank has partnered with quantum technology companies including Fujitsu and participates in quantum research consortiums. Their quantum research focuses on quantum algorithms for portfolio optimization and currency arbitrage, quantum machine learning for credit scoring and customer segmentation, and quantum cryptography for securing international transactions. BBVA has published research on quantum computing applications and has been exploring quantum computing for optimizing investment portfolios.

BBVA's investment in quantum computing reflects its vision of creating opportunities for all through digital banking. The bank is leveraging quantum technology to enhance financial inclusion through better risk assessment models, optimize global treasury operations and liquidity management, improve customer experience through quantum-powered analytics, and strengthen cybersecurity across digital channels. This strategic approach positions BBVA to lead in digital banking innovation while serving diverse global markets.

Looking forward, BBVA envisions quantum computing transforming international banking and financial services. This includes real-time optimization of global payment networks, quantum-secured cross-border transactions and digital currencies, personalized financial products adapted to local market needs, and advanced fraud prevention across multiple jurisdictions. BBVA's quantum strategy supports its purpose of bringing the age of opportunity to everyone through innovative financial solutions.`
  },

  'biogen': {
    industry: 'Biotechnology',
    content: `Biogen, a pioneering biotechnology company focused on neurological diseases, has embraced quantum computing as a transformative technology for drug discovery and development. Headquartered in Cambridge, Massachusetts, Biogen recognizes that quantum computing could accelerate breakthroughs in treating complex neurological conditions like Alzheimer's, Parkinson's, and multiple sclerosis.

The biotechnology industry faces unique computational challenges in understanding and treating neurological diseases. Protein misfolding in neurodegenerative diseases involves quantum mechanical processes, drug-brain barrier penetration requires precise molecular modeling, and neural pathway simulation demands enormous computational resources. Biogen views quantum computing as potentially unlocking new therapeutic approaches for conditions that have resisted traditional drug development methods.

Biogen's quantum initiatives reflect its commitment to pioneering neuroscience. The company has partnered with quantum computing companies and research institutions to explore applications in drug discovery. Their quantum research focuses on quantum simulation of protein folding and aggregation in neurological diseases, quantum machine learning for biomarker discovery and patient stratification, and quantum optimization for clinical trial design in neurology. Biogen has been particularly interested in using quantum computing to understand the complex molecular mechanisms underlying neurodegeneration.

The company's investment in quantum computing aligns with its mission to discover and deliver innovative therapies for neurological diseases. Biogen is exploring quantum technology to accelerate the identification of novel drug targets in the brain, improve drug design for crossing the blood-brain barrier, optimize treatment protocols for personalized neurology care, and advance understanding of complex brain disorders through quantum simulation. This forward-thinking approach positions Biogen to make breakthrough discoveries in neuroscience.

Looking ahead, Biogen envisions quantum computing revolutionizing neurological disease treatment. This includes simulating entire neural networks to understand disease progression, designing precision medicines that target specific neurological pathways, predicting treatment responses based on individual genetic and molecular profiles, and discovering entirely new therapeutic modalities for brain disorders. Biogen's quantum strategy supports its vision of transforming neuroscience to defeat devastating neurological diseases.`
  },

  'boehringer-ingelheim': {
    industry: 'Pharmaceuticals',
    content: `Boehringer Ingelheim, one of the world's largest pharmaceutical companies, has recognized quantum computing as a key technology for advancing human and animal health. From its headquarters in Ingelheim, Germany, this family-owned company is exploring how quantum computing can accelerate drug discovery, improve therapeutic development, and enhance personalized medicine approaches.

The pharmaceutical industry's drug discovery challenges are fundamentally quantum mechanical in nature. Enzyme-substrate interactions involve quantum tunneling effects, drug metabolism requires modeling complex chemical transformations, and protein dynamics demand simulation at atomic resolution. Boehringer Ingelheim sees quantum computing as essential for understanding these processes and developing more effective therapeutics with fewer side effects.

Boehringer Ingelheim's quantum computing program reflects its long-term commitment to innovation. The company has partnered with IBM through the IBM Quantum Network and collaborates with quantum software companies on drug discovery applications. Their quantum research focuses on quantum simulation for molecular dynamics and drug-target interactions, quantum machine learning for drug repurposing and indication expansion, and quantum optimization for pharmaceutical manufacturing processes. The company has been particularly active in exploring quantum computing for veterinary medicine applications.

The company's investment in quantum computing aligns with its vision of transforming lives through innovative medicines. Boehringer Ingelheim is leveraging quantum technology to accelerate the discovery of first-in-class therapeutics, improve drug safety through better toxicity prediction, advance precision medicine in both human and animal health, and optimize biopharmaceutical production processes. This comprehensive approach ensures Boehringer Ingelheim remains at the forefront of pharmaceutical innovation.

Looking forward, Boehringer Ingelheim envisions quantum computing enabling new paradigms in drug discovery and development. This includes simulating complete biological systems to understand disease mechanisms, designing drugs that modulate quantum biological processes, developing personalized treatment protocols based on quantum biomarkers, and creating novel therapeutic approaches for previously untreatable diseases. Boehringer Ingelheim's quantum strategy supports its commitment to improving health and quality of life for patients worldwide.`
  },

  'dow-chemical': {
    industry: 'Chemicals & Materials',
    content: `Dow Inc., a global leader in materials science, has identified quantum computing as a transformative technology for chemical innovation and sustainability. From its headquarters in Midland, Michigan, Dow is exploring how quantum computing can accelerate materials discovery, optimize chemical processes, and advance circular economy solutions.

The chemicals and materials industry faces computational challenges in designing molecules and materials with specific properties. Catalyst design requires understanding quantum mechanical reaction mechanisms, polymer engineering involves predicting complex molecular interactions, and process optimization spans multiple scales from molecular to industrial. Dow recognizes that quantum computing could enable breakthroughs in materials that are impossible to discover through traditional methods.

Dow's quantum computing initiatives leverage its deep expertise in chemistry and materials science. The company has engaged with quantum computing providers and research institutions to explore applications in materials discovery. Their quantum research focuses on quantum simulation for catalyst design and reaction pathway optimization, quantum machine learning for materials property prediction, and quantum optimization for supply chain and production planning. Dow has been particularly interested in using quantum computing to develop sustainable materials and processes.

The company's investment in quantum computing aligns with its ambition to become the most innovative, customer-centric, inclusive, and sustainable materials science company. Dow is exploring quantum technology to accelerate the development of recyclable and biodegradable polymers, optimize chemical processes for reduced energy consumption and emissions, discover novel materials for renewable energy applications, and advance molecular recycling technologies for circular economy. This strategic approach positions Dow to lead in sustainable materials innovation.

Looking ahead, Dow envisions quantum computing revolutionizing materials science and chemical engineering. This includes designing materials atom-by-atom for specific applications, optimizing entire chemical plants for maximum efficiency and sustainability, discovering breakthrough catalysts for green chemistry, and enabling closed-loop recycling at the molecular level. Dow's quantum strategy supports its purpose of delivering a sustainable future through materials science innovation.`
  },

  'eon': {
    industry: 'Energy & Utilities',
    content: `E.ON, one of Europe's largest energy networks and customer solutions providers, has embraced quantum computing as a key technology for the energy transition. Headquartered in Essen, Germany, E.ON is exploring how quantum computing can optimize renewable energy integration, enhance grid management, and accelerate the development of sustainable energy solutions.

The energy sector's transition to renewables creates unprecedented computational challenges. Grid optimization with intermittent renewable sources requires real-time balancing across complex networks, energy trading involves optimizing across multiple markets and timeframes, and customer energy management demands personalized solutions at scale. E.ON recognizes that quantum computing could provide the computational power needed to manage increasingly complex and decentralized energy systems.

E.ON's quantum computing initiatives reflect its role as a leader in Europe's energy transition. The company has partnered with IBM and other quantum technology providers to explore applications in energy. Their quantum research focuses on quantum optimization for renewable energy integration and grid balancing, quantum machine learning for energy demand forecasting, and quantum algorithms for energy trading and market optimization. E.ON has been particularly active in exploring quantum computing for smart city energy management.

The company's investment in quantum computing aligns with its strategy to make energy networks smarter and more sustainable. E.ON is leveraging quantum technology to optimize the integration of distributed renewable energy resources, enhance grid resilience through better predictive maintenance, enable peer-to-peer energy trading in local communities, and develop personalized energy solutions for customers. This forward-thinking approach positions E.ON to lead Europe's transition to sustainable energy.

Looking forward, E.ON envisions quantum computing enabling a fully sustainable and intelligent energy system. This includes real-time optimization of continental-scale renewable energy networks, quantum-powered virtual power plants that aggregate distributed resources, predictive energy management that anticipates and prevents outages, and personalized energy services that optimize comfort and sustainability. E.ON's quantum strategy supports its vision of creating a better tomorrow through sustainable energy solutions.`
  },

  'denso': {
    industry: 'Automotive Supplier',
    content: `DENSO Corporation, one of the world's largest automotive component manufacturers, has identified quantum computing as a critical technology for the future of mobility. From its headquarters in Kariya, Japan, DENSO is exploring how quantum computing can enhance automotive electronics, optimize manufacturing processes, and accelerate the development of technologies for connected and autonomous vehicles.

The automotive supplier industry faces increasing complexity as vehicles become more electronic and software-defined. Semiconductor design for automotive applications requires atomic-level precision, thermal management in electric vehicles involves complex multi-physics simulation, and supply chain optimization spans global networks with millions of components. DENSO recognizes that quantum computing could provide breakthrough capabilities in these areas, maintaining its position as a leading automotive technology innovator.

DENSO's quantum computing initiatives reflect its commitment to pioneering automotive innovation. The company has partnered with quantum computing companies and invested in quantum startups through its venture arm. Their quantum research focuses on quantum simulation for semiconductor and sensor development, quantum optimization for production planning and logistics, and quantum machine learning for quality control and predictive maintenance. DENSO has been particularly interested in quantum computing for optimizing electric vehicle thermal management systems.

The company's investment in quantum computing aligns with its vision of creating a mobility society with zero traffic accidents and environmental impact. DENSO is exploring quantum technology to accelerate the development of advanced semiconductors for automotive AI, optimize battery management systems for electric vehicles, enhance sensor fusion algorithms for autonomous driving, and improve manufacturing efficiency through quantum optimization. This strategic approach ensures DENSO remains at the forefront of automotive technology innovation.

Looking ahead, DENSO envisions quantum computing transforming automotive component design and manufacturing. This includes designing electronic components optimized at the quantum level, creating adaptive systems that optimize vehicle performance in real-time, developing revolutionary materials for automotive applications, and achieving zero-defect manufacturing through quantum quality control. DENSO's quantum strategy supports its commitment to contributing to a better world by creating value together with a vision for the future.`
  },

  'daimler': {
    industry: 'Automotive',
    content: `Daimler AG, the parent company of Mercedes-Benz and a global leader in premium vehicles and mobility services, has been a pioneer in exploring quantum computing applications in the automotive industry. From its headquarters in Stuttgart, Germany, Daimler is investigating how quantum technology can revolutionize vehicle development, manufacturing, and future mobility solutions.

The premium automotive sector's evolution toward electric, autonomous, and connected vehicles creates computational demands that challenge traditional methods. Battery cell chemistry optimization requires quantum-mechanical accuracy, autonomous driving algorithms must process vast amounts of sensor data, and mobility-as-a-service platforms need real-time optimization across complex networks. Daimler recognizes that quantum computing could provide decisive advantages in these transformative areas.

Daimler's quantum computing program demonstrates systematic innovation. The company has partnered with IBM, Google, and other quantum technology providers to explore diverse applications. Their quantum research focuses on quantum chemistry for battery materials development, quantum machine learning for autonomous vehicle perception, and quantum optimization for logistics and production planning. Daimler has achieved notable demonstrations, including using quantum computing to simulate lithium-sulfur battery chemistry.

The company's investment in quantum computing reflects its ambition to shape the future of mobility. Daimler is leveraging quantum technology to accelerate the development of next-generation battery technologies, optimize global supply chains for efficiency and sustainability, enhance autonomous driving through quantum-powered AI, and create new mobility services through quantum optimization. This comprehensive approach positions Daimler to lead in the transformation of personal transportation.

Looking forward, Daimler envisions quantum computing enabling revolutionary advances in sustainable luxury mobility. This includes designing vehicles with perfect aerodynamics through quantum simulation, creating self-optimizing production systems that eliminate waste, developing materials that combine luxury with sustainability, and delivering personalized mobility experiences through quantum AI. Daimler's quantum strategy aligns with its vision of providing sustainable and inspiring mobility for future generations.`
  },

  'mizuho-dl-financial-technology': {
    industry: 'Financial Technology',
    content: `Mizuho-DL Financial Technology, a joint venture between Mizuho Financial Group and DL Technologies, represents Japan's ambitious push into quantum computing for financial services. Based in Tokyo, the company is developing quantum applications specifically designed for Asian financial markets, addressing unique challenges in one of the world's most technologically advanced financial ecosystems.

The Asian financial technology sector faces distinctive computational challenges. High-frequency trading across multiple Asian exchanges requires microsecond optimization, cross-currency derivatives pricing involves complex correlation modeling, and risk management must account for diverse regulatory frameworks. Mizuho-DL recognizes that quantum computing could provide competitive advantages in these areas while advancing Japan's position in financial technology innovation.

Mizuho-DL's quantum initiatives combine Japanese precision with cutting-edge technology. The company has partnered with quantum computing providers and collaborates with Japanese universities on quantum research. Their focus areas include quantum algorithms for derivatives pricing and risk management, quantum optimization for portfolio management across Asian markets, and quantum machine learning for fraud detection in digital payments. The company has been particularly active in developing quantum applications for cryptocurrency and digital asset management.

The company's investment in quantum computing reflects Japan's strategic focus on maintaining technological leadership in finance. Mizuho-DL is leveraging quantum technology to enhance algorithmic trading strategies in Asian markets, improve risk assessment for cross-border investments, develop quantum-safe financial infrastructure, and enable new financial products based on quantum capabilities. This targeted approach positions the company to bridge traditional finance with quantum-powered innovation.

Looking ahead, Mizuho-DL envisions quantum computing transforming Asian financial markets. This includes real-time optimization of pan-Asian investment portfolios, quantum-secured digital yen and cross-border payments, AI-powered financial advisors using quantum machine learning, and new derivatives products enabled by quantum pricing models. The company's quantum strategy supports Japan's vision of Society 5.0, where advanced technology creates a human-centered, sustainable society.`
  },

  'nec': {
    industry: 'Technology & Electronics',
    content: `NEC Corporation, a leader in the integration of IT and network technologies, has positioned quantum computing as a cornerstone of its advanced technology portfolio. From its headquarters in Tokyo, Japan, NEC is developing quantum annealing technology and exploring applications that leverage its strengths in communications, computing, and artificial intelligence.

The technology industry's push toward edge computing and 5G networks creates optimization challenges that strain classical algorithms. Network routing optimization requires real-time decision-making across massive infrastructures, cybersecurity demands pattern recognition in enormous data streams, and smart city management involves coordinating countless IoT devices. NEC recognizes that quantum computing could provide breakthrough capabilities in these areas, enhancing its position as a global technology leader.

NEC's quantum computing program combines hardware development with application research. The company has developed its own quantum annealing machine and partnered with D-Wave to offer quantum computing services. Their quantum initiatives focus on quantum optimization for telecommunications network management, quantum machine learning for cybersecurity and biometric authentication, and quantum algorithms for smart city optimization. NEC has demonstrated practical applications, including optimizing delivery routes and manufacturing schedules.

The company's investment in quantum computing aligns with its vision of orchestrating a brighter world through technology. NEC is leveraging quantum technology to enhance 5G network optimization and resource allocation, strengthen cybersecurity through quantum-safe cryptography, advance facial recognition and biometric systems, and enable smarter cities through quantum-optimized infrastructure. This integrated approach positions NEC to deliver comprehensive quantum solutions across its technology portfolio.

Looking forward, NEC envisions quantum computing enabling new paradigms in digital transformation. This includes self-optimizing telecommunications networks that adapt in real-time, quantum-enhanced AI that solves complex societal challenges, ultra-secure digital infrastructure protected by quantum cryptography, and smart cities that optimize resources for sustainability and quality of life. NEC's quantum strategy supports its commitment to creating the social values of safety, security, fairness, and efficiency.`
  },

  'nippon-steel': {
    industry: 'Steel & Materials',
    content: `Nippon Steel Corporation, one of the world's largest steel producers, has identified quantum computing as a transformative technology for materials science and manufacturing. From its headquarters in Tokyo, Japan, Nippon Steel is exploring how quantum computing can revolutionize steel production, develop advanced materials, and optimize complex industrial processes.

The steel industry faces computational challenges in developing new alloys and optimizing production. Alloy design requires understanding quantum mechanical interactions between elements, process optimization involves balancing multiple variables across integrated plants, and quality prediction demands modeling complex thermodynamic processes. Nippon Steel recognizes that quantum computing could enable breakthroughs in materials and efficiency that maintain Japan's leadership in advanced steel technology.

Nippon Steel's quantum initiatives reflect its commitment to technological innovation. The company has engaged with quantum computing providers and research institutions to explore applications in materials science. Their quantum research focuses on quantum simulation for alloy design and phase prediction, quantum optimization for production scheduling and energy management, and quantum machine learning for quality control and defect prediction. Nippon Steel has been particularly interested in using quantum computing to develop ultra-high-strength steels for automotive and construction applications.

The company's investment in quantum computing aligns with its vision of contributing to society through world-leading technologies. Nippon Steel is exploring quantum technology to accelerate the development of revolutionary steel alloys, optimize integrated steelmaking for minimal environmental impact, enhance predictive maintenance across production facilities, and advance recycling technologies for circular economy. This strategic approach positions Nippon Steel to lead in sustainable materials innovation.

Looking ahead, Nippon Steel envisions quantum computing transforming the steel and materials industry. This includes designing materials with properties tailored at the atomic level, achieving zero-emission steel production through optimized processes, creating self-healing materials through quantum-designed microstructures, and enabling perfect recycling through quantum-enhanced separation technologies. Nippon Steel's quantum strategy supports its commitment to providing solutions for a sustainable society through advanced materials.`
  },

  'mitsui-co': {
    industry: 'Trading & Investment',
    content: `Mitsui & Co., one of Japan's largest sogo shosha (general trading companies), has recognized quantum computing as a strategic technology for optimizing global trade and investment. With operations spanning every continent and involvement in diverse industries from energy to healthcare, Mitsui sees quantum computing as essential for managing complexity in global business networks.

The global trading industry faces optimization challenges that grow exponentially with scale. Supply chain optimization across multiple commodities and routes involves millions of variables, investment portfolio management requires analyzing complex correlations across markets, and risk assessment must account for geopolitical and environmental factors. Mitsui recognizes that quantum computing could provide unprecedented capabilities for optimizing global trade and investment decisions.

Mitsui's quantum computing initiatives reflect its role as a global business enabler. The company has partnered with quantum technology providers and invested in quantum startups through its venture arm. Their quantum research focuses on quantum optimization for global logistics and supply chain management, quantum machine learning for market prediction and trading strategies, and quantum algorithms for risk assessment across diverse portfolios. Mitsui has been particularly interested in quantum computing for optimizing energy trading and logistics.

The company's investment in quantum computing aligns with its mission of building brighter futures through innovation. Mitsui is exploring quantum technology to optimize global commodity flows for efficiency and sustainability, enhance investment strategies through better risk-return analysis, improve supply chain resilience through predictive analytics, and enable new business models based on quantum capabilities. This comprehensive approach positions Mitsui to leverage quantum advantages across its global operations.

Looking forward, Mitsui envisions quantum computing transforming global trade and investment. This includes real-time optimization of global supply networks, quantum-powered prediction of market trends and disruptions, risk management that accounts for complex global interdependencies, and new trading platforms enabled by quantum technology. Mitsui's quantum strategy supports its vision of creating long-term value for society through global business innovation.`
  },

  'paypal': {
    industry: 'Financial Technology',
    content: `PayPal, a global leader in digital payments and financial technology, has identified quantum computing as a critical technology for the future of digital finance. From its headquarters in San Jose, California, PayPal is exploring how quantum computing can enhance payment security, prevent fraud, and enable new financial services in the digital economy.

The digital payments industry faces computational challenges that scale with transaction volume and complexity. Real-time fraud detection requires analyzing patterns across billions of transactions, risk assessment for instant credit decisions demands complex modeling, and cryptocurrency operations involve sophisticated cryptographic calculations. PayPal recognizes that quantum computing could provide breakthrough capabilities in these areas while also posing new security challenges that must be addressed.

PayPal's quantum initiatives reflect its position at the forefront of financial technology innovation. The company has engaged with quantum computing researchers and security experts to understand implications for digital payments. Their quantum focus areas include quantum-resistant cryptography for payment security, quantum machine learning for fraud detection and prevention, and quantum optimization for payment routing and settlement. PayPal has been particularly active in preparing for the post-quantum cryptography era.

The company's investment in quantum computing aligns with its mission to democratize financial services. PayPal is exploring quantum technology to enhance payment security against future quantum threats, improve fraud detection without compromising user experience, optimize global payment networks for speed and cost, and enable new financial products through quantum capabilities. This proactive approach ensures PayPal remains secure and innovative as quantum technology advances.

Looking forward, PayPal envisions quantum computing enabling new paradigms in digital finance. This includes instant global payments optimized through quantum algorithms, quantum-secured digital identities and wallets, AI-powered financial assistants using quantum machine learning, and new forms of programmable money enabled by quantum technology. PayPal's quantum strategy supports its vision of providing accessible, affordable, and secure financial services for everyone.`
  },

  'crown-bioscience': {
    industry: 'Biotechnology',
    content: `Crown Bioscience, a global drug discovery and development services company, has embraced quantum computing as a transformative technology for accelerating preclinical research. With operations in the US, Europe, and Asia, Crown Bioscience recognizes that quantum computing could revolutionize how therapeutic candidates are identified, optimized, and validated.

The preclinical research industry faces computational challenges in modeling complex biological systems. Tumor microenvironment simulation requires modeling interactions between multiple cell types, drug pharmacokinetics involves predicting molecular behavior in biological systems, and biomarker discovery demands analyzing vast multi-omics datasets. Crown Bioscience views quantum computing as potentially accelerating every stage of preclinical drug development.

Crown Bioscience's quantum initiatives leverage its expertise in translational research. The company has partnered with pharmaceutical clients to explore quantum applications in drug discovery. Their quantum research focuses on quantum simulation for drug-target interaction prediction, quantum machine learning for biomarker discovery and patient stratification, and quantum optimization for clinical trial design. Crown Bioscience has been particularly interested in using quantum computing for oncology and immunology applications.

The company's investment in quantum computing aligns with its mission to accelerate the development of novel therapeutics. Crown Bioscience is exploring quantum technology to improve in silico modeling of drug candidates, enhance prediction of drug efficacy and toxicity, optimize preclinical study designs for better translation, and advance personalized medicine through quantum-enhanced analytics. This forward-thinking approach positions Crown Bioscience to deliver superior preclinical services in the quantum era.

Looking ahead, Crown Bioscience envisions quantum computing transforming preclinical research and drug development. This includes simulating complete disease models at the molecular level, predicting clinical outcomes from preclinical data with high accuracy, discovering novel drug targets through quantum exploration of biological networks, and enabling truly personalized therapeutic approaches. Crown Bioscience's quantum strategy supports its commitment to advancing human health through innovative drug discovery services.`
  },

  'db-schenker': {
    industry: 'Logistics',
    content: `DB Schenker, one of the world's leading logistics providers, has identified quantum computing as a game-changing technology for global supply chain optimization. As part of Deutsche Bahn AG, DB Schenker operates in over 130 countries and recognizes that quantum computing could revolutionize how goods move around the world.

The logistics industry faces optimization problems of staggering complexity. Route optimization for global shipping networks involves millions of possible combinations, warehouse operations require real-time coordination of thousands of movements, and last-mile delivery demands dynamic routing across urban environments. DB Schenker views quantum computing as essential for achieving new levels of efficiency and sustainability in global logistics.

DB Schenker's quantum computing initiatives reflect its position as a logistics innovation leader. The company has partnered with quantum technology providers to explore applications in supply chain optimization. Their quantum research focuses on quantum algorithms for multi-modal transportation planning, quantum optimization for warehouse automation and inventory management, and quantum machine learning for demand forecasting and capacity planning. DB Schenker has demonstrated practical applications, including quantum-optimized routing for delivery vehicles.

The company's investment in quantum computing aligns with its vision of driving sustainable logistics innovation. DB Schenker is leveraging quantum technology to optimize global supply chains for minimal environmental impact, enhance resilience through better risk prediction and mitigation, improve last-mile delivery efficiency in urban areas, and enable new logistics services through quantum capabilities. This strategic approach positions DB Schenker to lead the logistics industry's digital transformation.

Looking forward, DB Schenker envisions quantum computing enabling intelligent, autonomous supply chains. This includes real-time global optimization of all transportation modes, predictive logistics that anticipate and prevent disruptions, zero-emission delivery through perfectly optimized routes, and personalized logistics services adapted to individual needs. DB Schenker's quantum strategy supports its commitment to delivering sustainable logistics solutions for a connected world.`
  },

  'pawsey-supercomputing-research-centre': {
    industry: 'Research & Computing',
    content: `The Pawsey Supercomputing Research Centre, Australia's premier high-performance computing facility, has positioned itself at the forefront of quantum-classical hybrid computing. Based in Perth, Western Australia, Pawsey is exploring how quantum computing can complement traditional supercomputing to solve Australia's most challenging scientific and industrial problems.

The supercomputing industry faces the challenge of maintaining computational growth as Moore's Law slows. Climate modeling requires simulating complex Earth systems at unprecedented resolution, radio astronomy data processing involves analyzing petabytes of observations, and materials discovery demands accurate quantum mechanical calculations. Pawsey recognizes that integrating quantum computing with classical supercomputing could provide breakthrough capabilities for Australian research and industry.

Pawsey's quantum initiatives reflect its role as a national research infrastructure provider. The centre has partnered with Quantum Brilliance to install room-temperature quantum accelerators alongside classical supercomputers. Their quantum program focuses on developing hybrid quantum-classical algorithms for scientific computing, creating software tools for seamless integration of quantum and classical resources, and training researchers in quantum computing applications. Pawsey has been particularly active in exploring quantum computing for astronomy and earth sciences.

The centre's investment in quantum computing aligns with Australia's national quantum strategy. Pawsey is leveraging quantum technology to enhance climate and weather modeling capabilities, accelerate materials discovery for mining and energy sectors, advance radio astronomy data processing for the Square Kilometre Array, and support Australian quantum computing research and development. This comprehensive approach positions Pawsey as a crucial enabler of Australia's quantum ambitions.

Looking forward, Pawsey envisions quantum-classical hybrid computing transforming scientific discovery. This includes simulating complete Earth systems for climate prediction, discovering new materials for Australia's resources sector, processing astronomical data to understand the universe's origins, and enabling breakthrough research across all scientific disciplines. Pawsey's quantum strategy supports its mission to accelerate scientific discovery through advanced computing for the benefit of Australia and the global community.`
  },

  'us-air-force-research-laboratory': {
    industry: 'Defense Research',
    content: `The U.S. Air Force Research Laboratory (AFRL), the primary scientific research and development center for the Air Force and Space Force, has identified quantum computing as a critical technology for maintaining aerospace superiority. From its headquarters at Wright-Patterson Air Force Base, Ohio, AFRL is exploring how quantum computing can enhance everything from materials development to autonomous systems.

The defense research sector faces computational challenges that directly impact national security. Hypersonic flight simulation requires modeling extreme physics, autonomous drone swarm coordination involves real-time optimization, and space situational awareness demands tracking thousands of objects simultaneously. AFRL recognizes that quantum computing could provide decisive advantages in these areas, potentially revolutionizing aerospace and defense capabilities.

AFRL's quantum computing program reflects the strategic importance of quantum technology for defense. The laboratory has established partnerships with quantum computing companies, universities, and other government agencies. Their quantum research focuses on quantum algorithms for aerospace design and optimization, quantum sensing for enhanced detection and navigation, and quantum communications for secure military networks. AFRL has been particularly active in exploring quantum computing for materials discovery and autonomous systems.

The laboratory's investment in quantum computing aligns with maintaining technological superiority in aerospace and defense. AFRL is leveraging quantum technology to accelerate the development of advanced aerospace materials, enhance autonomous system decision-making capabilities, improve space domain awareness and satellite operations, and strengthen cybersecurity through quantum cryptography. This comprehensive approach ensures the U.S. maintains aerospace dominance as quantum technology matures.

Looking forward, AFRL envisions quantum computing enabling revolutionary aerospace and defense capabilities. This includes designing aircraft and spacecraft with unprecedented performance, coordinating autonomous systems for complex missions, protecting critical infrastructure with quantum security, and advancing space exploration through quantum-enhanced technologies. AFRL's quantum strategy supports its mission of leading the discovery, development, and delivery of warfighting technologies for air, space, and cyberspace forces.`
  },

  'quanscient': {
    industry: 'Engineering Software',
    content: `Quanscient, a pioneering engineering simulation company based in Finland, has positioned quantum computing at the core of its next-generation simulation platform. The company recognizes that quantum computing could revolutionize computer-aided engineering (CAE) by enabling simulations that are currently impossible with classical computers.

The engineering simulation industry faces computational limits that constrain innovation. Multiphysics simulations involving fluid-structure interaction require enormous computational resources, electromagnetic field modeling for 5G and beyond demands high accuracy at scale, and topology optimization explores vast design spaces. Quanscient views quantum computing as essential for breaking through these computational barriers and enabling a new era of engineering design.

Quanscient's quantum initiatives reflect its vision of democratizing advanced simulation. The company has developed a cloud-native platform that prepares engineering simulations for quantum acceleration. Their quantum research focuses on quantum algorithms for computational fluid dynamics and structural analysis, quantum optimization for generative design and topology optimization, and hybrid quantum-classical solvers for multiphysics problems. Quanscient has been working to make quantum computing accessible to engineers without quantum expertise.

The company's investment in quantum computing aligns with its mission to accelerate engineering innovation. Quanscient is leveraging quantum technology to enable simulations of unprecedented scale and accuracy, reduce simulation time from weeks to hours, democratize access to advanced simulation capabilities, and discover optimal designs that classical methods cannot find. This innovative approach positions Quanscient to bridge the gap between classical and quantum engineering simulation.

Looking forward, Quanscient envisions quantum computing transforming how products are designed and optimized. This includes simulating complete products at the molecular level, discovering revolutionary designs through quantum exploration, enabling real-time simulation for digital twins, and democratizing quantum simulation for engineers worldwide. Quanscient's quantum strategy supports its vision of empowering engineers to solve humanity's greatest challenges through advanced simulation.`
  },

  'axa': {
    industry: 'Financial Services',
    content: `AXA Group, one of the world's leading insurance and asset management companies, has identified quantum computing as a transformative technology for risk management and financial services. Headquartered in Paris, France, AXA operates across five continents and recognizes that quantum computing could revolutionize how insurance risks are modeled, priced, and managed in an increasingly complex world.

The insurance industry faces computational challenges that grow with global interconnectedness. Catastrophe modeling requires simulating complex weather systems and their correlations, portfolio risk assessment involves analyzing millions of policies simultaneously, and fraud detection demands pattern recognition across vast datasets. AXA views quantum computing as potentially providing breakthrough capabilities in these critical areas.

AXA's quantum computing initiatives reflect its commitment to innovation in financial services. The company has engaged with quantum technology providers and research institutions to explore applications in insurance and investment management. Their quantum research focuses on quantum simulation for catastrophe and climate risk modeling, quantum optimization for investment portfolio management, and quantum machine learning for customer analytics and fraud prevention. AXA has been particularly interested in quantum computing for actuarial science and pricing optimization.

The company's investment in quantum computing aligns with its purpose of empowering people to live better lives. AXA is exploring quantum technology to improve risk assessment for emerging threats like climate change, optimize investment strategies for better customer returns, enhance personalization of insurance products, and strengthen cybersecurity across digital channels. This forward-thinking approach positions AXA to lead in the digital transformation of insurance and financial services.

Looking ahead, AXA envisions quantum computing enabling new paradigms in risk management and financial protection. This includes real-time modeling of global systemic risks, personalized insurance products based on quantum analytics, investment strategies that optimize across multiple objectives simultaneously, and predictive models that anticipate and prevent financial losses. AXA's quantum strategy supports its mission of protecting what matters for its customers and society.`
  },

  'google-deepmind-ai': {
    industry: 'Artificial Intelligence',
    content: `Google DeepMind, formed through the merger of Google's AI division and DeepMind Technologies, represents one of the world's most advanced artificial intelligence research organizations. Based in London and Mountain View, DeepMind has pioneered quantum-AI convergence, recognizing that quantum computing and artificial intelligence can accelerate each other's development in revolutionary ways.

The AI industry increasingly faces computational bottlenecks that limit the scale and sophistication of intelligent systems. Training large language models requires enormous computational resources, neural architecture search involves exploring vast design spaces, and reinforcement learning in complex environments demands massive parallel processing. DeepMind sees quantum computing as potentially unlocking new frontiers in AI capabilities.

DeepMind's quantum computing initiatives leverage its world-class expertise in both AI and quantum physics. The organization has developed quantum machine learning algorithms, explored quantum neural networks, and investigated how quantum computers can be used to improve AI training. Their research focuses on quantum-enhanced optimization for neural network training, quantum algorithms for machine learning, and using AI to control and optimize quantum computers. DeepMind has made significant contributions to understanding the intersection of quantum computing and artificial intelligence.

The organization's investment in quantum computing aligns with its mission to solve intelligence and use it to advance scientific discovery. DeepMind is leveraging quantum technology to accelerate the training of large AI models, discover new neural network architectures through quantum exploration, enhance reinforcement learning with quantum speedups, and develop quantum AI algorithms for scientific applications. This integrated approach positions DeepMind at the forefront of the quantum-AI revolution.

Looking forward, DeepMind envisions quantum computing and AI converging to enable unprecedented intelligent systems. This includes quantum-enhanced large language models with capabilities beyond current systems, AI systems that can design and control quantum computers, quantum reinforcement learning agents for complex real-world problems, and AI-quantum hybrid systems for scientific discovery. DeepMind's quantum strategy supports its vision of building AI systems that can help solve humanity's greatest challenges.`
  },

  'mitsubishi-chemical': {
    industry: 'Chemicals & Materials',
    content: `Mitsubishi Chemical Group, one of Japan's largest chemical companies, has positioned quantum computing as a key technology for advancing materials innovation and sustainable chemistry. From its headquarters in Tokyo, the company is exploring how quantum computing can accelerate the development of advanced materials for electronics, automotive, and energy applications.

The chemical industry's push toward sustainability and advanced materials creates computational challenges that strain classical methods. Polymer design for high-performance applications requires understanding complex molecular interactions, catalyst development involves quantum mechanical reaction pathways, and materials optimization spans multiple properties simultaneously. Mitsubishi Chemical recognizes that quantum computing could provide breakthrough capabilities in these areas.

Mitsubishi Chemical's quantum initiatives reflect its commitment to technological innovation. The company has partnered with quantum technology providers and research institutions to explore applications in materials discovery. Their quantum research focuses on quantum simulation for polymer and catalyst design, quantum optimization for chemical process development, and quantum machine learning for materials property prediction. The company has been particularly interested in quantum computing for developing materials for renewable energy and electric vehicles.

The company's investment in quantum computing aligns with its vision of creating solutions for a sustainable society. Mitsubishi Chemical is leveraging quantum technology to accelerate the development of eco-friendly materials and processes, optimize chemical manufacturing for reduced environmental impact, discover breakthrough materials for clean energy applications, and advance recycling technologies through better understanding of polymer chemistry. This strategic approach positions the company to lead in sustainable chemical innovation.

Looking ahead, Mitsubishi Chemical envisions quantum computing transforming materials science and chemical manufacturing. This includes designing materials with precisely controlled properties at the molecular level, developing carbon-neutral chemical processes, creating revolutionary materials for next-generation electronics, and enabling perfect recycling through quantum-enhanced chemistry. The company's quantum strategy supports its commitment to contributing to a sustainable society through innovative chemistry and materials.`
  },

  'save-on-foods': {
    industry: 'Retail & Grocery',
    content: `Save-On-Foods, one of Western Canada's leading grocery retailers, has identified quantum computing as a transformative technology for supply chain optimization and customer experience enhancement. As part of the Pattison Food Group, Save-On-Foods operates hundreds of stores across British Columbia, Alberta, Saskatchewan, and Manitoba, recognizing that quantum computing could revolutionize retail operations and logistics.

The grocery retail industry faces complex optimization challenges that scale exponentially with business size. Supply chain management involves coordinating thousands of products across multiple suppliers and distribution centers, inventory optimization requires predicting demand across diverse product categories and seasonal variations, and route optimization for delivery services must account for real-time traffic and customer preferences. Save-On-Foods views quantum computing as potentially providing breakthrough capabilities in these critical operational areas.

Save-On-Foods' quantum computing initiatives reflect its commitment to innovation in retail operations. The company has engaged with quantum technology providers to explore applications in logistics and customer analytics. Their quantum research focuses on quantum optimization for supply chain planning and inventory management, quantum machine learning for demand forecasting and customer behavior analysis, and quantum algorithms for dynamic pricing and promotion optimization. The company has been particularly interested in quantum computing for optimizing fresh food logistics and reducing waste.

The company's investment in quantum computing aligns with its mission to providing exceptional customer service and community support. Save-On-Foods is exploring quantum technology to optimize fresh food supply chains for better quality and reduced waste, enhance personalized shopping experiences through quantum-powered analytics, improve delivery route optimization for e-commerce operations, and enable dynamic pricing strategies that benefit both customers and business efficiency. This forward-thinking approach positions Save-On-Foods to lead in retail innovation within the Canadian market.

Looking ahead, Save-On-Foods envisions quantum computing enabling new paradigms in retail operations and customer engagement. This includes real-time optimization of entire supply networks from farm to shelf, personalized nutrition recommendations based on quantum analysis of individual health data, zero-waste grocery operations through perfect demand prediction, and community-optimized store layouts that maximize customer satisfaction. Save-On-Foods' quantum strategy supports its commitment to serving Western Canadian communities through innovative retail solutions.`
  },

  'pattison': {
    industry: 'Diversified Holdings',
    content: `The Jim Pattison Group, Canada's third-largest private company, has recognized quantum computing as a strategic technology across its diverse portfolio of businesses spanning automotive, food, media, packaging, and entertainment. From its headquarters in Vancouver, British Columbia, this family-owned conglomerate sees quantum computing as essential for optimizing operations across multiple industries and maintaining competitive advantages in complex business environments.

The diversified holdings industry faces unique computational challenges in managing multiple business sectors simultaneously. Portfolio optimization across diverse industries requires analyzing complex correlations and market dynamics, operational efficiency improvements must account for different business models and constraints, and strategic planning involves numerous variables across automotive dealerships, grocery chains, media properties, and entertainment venues. The Jim Pattison Group recognizes that quantum computing could provide unprecedented capabilities for cross-industry optimization and strategic decision-making.

Pattison's quantum computing initiatives reflect the company's approach to systematic innovation across its business portfolio. The group has engaged with quantum technology providers to explore applications across its diverse operations. Their quantum research focuses on quantum optimization for multi-business portfolio management and resource allocation, quantum machine learning for market analysis across different industries, and quantum algorithms for supply chain coordination across automotive, food, and packaging operations. The company has been particularly interested in quantum computing for optimizing advertising placement across its media properties and customer analytics across retail operations.

The company's investment in quantum computing aligns with its philosophy of long-term value creation and operational excellence. Pattison is leveraging quantum technology to optimize advertising effectiveness across its radio, television, and billboard properties, enhance supply chain efficiency across food and packaging operations, improve customer experience at automotive dealerships through better inventory management, and enable cross-business synergies through quantum-powered analytics. This integrated approach positions Pattison to leverage quantum advantages across its entire business ecosystem.

Looking forward, The Jim Pattison Group envisions quantum computing transforming how diversified companies operate and create value. This includes real-time optimization of resources across all business units, quantum-enhanced market intelligence that identifies cross-industry opportunities, predictive analytics that anticipate customer needs across different sectors, and strategic planning that optimizes the entire business portfolio simultaneously. Pattison's quantum strategy supports its commitment to building long-term value for customers, employees, and communities across Canada.`
  },

  'sumitomocorporation': {
    industry: 'Trading & Conglomerate',
    content: `Sumitomo Corporation, one of Japan's largest sogo shosha (general trading companies) and a key member of the Sumitomo Group, has positioned quantum computing as a strategic technology for optimizing global trade and investment operations. With a history spanning over 400 years and business operations in more than 60 countries, Sumitomo Corporation recognizes that quantum computing could revolutionize how complex global business networks are managed and optimized.

The general trading company industry operates at unprecedented scale and complexity. Global commodity trading requires optimizing across multiple markets, currencies, and regulatory environments simultaneously, investment portfolio management involves analyzing complex correlations across diverse asset classes and geographic regions, and supply chain coordination spans multiple continents and involves thousands of suppliers and customers. Sumitomo Corporation views quantum computing as essential for managing this complexity and identifying optimal strategies in real-time.

Sumitomo Corporation's quantum computing initiatives reflect its position as a global business integrator. The company has partnered with quantum technology providers and invested in quantum research through its venture capital arm. Their quantum research focuses on quantum optimization for global trading strategies and commodity flow management, quantum machine learning for market prediction and risk assessment, and quantum algorithms for supply chain optimization across diverse industries including metals, energy, chemicals, and infrastructure. The company has been particularly interested in quantum computing for optimizing renewable energy trading and carbon credit markets.

The company's investment in quantum computing aligns with its vision of creating shared value for society through business innovation. Sumitomo Corporation is exploring quantum technology to optimize global commodity flows for enhanced efficiency and sustainability, improve investment strategies through better risk-return analysis across diverse markets, enhance supply chain resilience through predictive analytics and optimization, and enable new business models based on quantum-enhanced data analysis. This comprehensive approach positions Sumitomo Corporation to lead in the digital transformation of global trading.

Looking ahead, Sumitomo Corporation envisions quantum computing enabling new paradigms in global trade and investment. This includes real-time optimization of global commodity networks, quantum-powered prediction of market disruptions and geopolitical events, carbon-neutral trading operations through optimized logistics and renewable energy integration, and personalized business solutions for clients based on quantum analysis of global market data. Sumitomo Corporation's quantum strategy supports its commitment to creating sustainable growth and shared value in the global economy.`
  },

  'moltex-energy': {
    industry: 'Nuclear Energy',
    content: `Moltex Energy, a leading developer of molten salt reactor technology, has identified quantum computing as a transformative tool for advancing next-generation nuclear energy systems. Based in New Brunswick, Canada, with operations in the UK, Moltex Energy is pioneering safe, clean, and economical nuclear power through innovative reactor designs that could benefit significantly from quantum-enhanced simulation and optimization.

The nuclear energy industry faces complex computational challenges in reactor design and safety analysis. Neutron transport simulation requires solving complex multiphysics problems across multiple scales, reactor safety analysis involves modeling rare but critical failure scenarios, and fuel cycle optimization spans decades of operation with complex interdependencies. Moltex Energy recognizes that quantum computing could provide breakthrough capabilities for these computationally intensive applications, particularly in modeling the complex chemistry and physics of molten salt systems.

Moltex Energy's quantum computing initiatives reflect its commitment to advancing nuclear technology through computational innovation. The company has engaged with quantum computing researchers to explore applications in reactor physics and materials science. Their quantum research focuses on quantum simulation for molten salt chemistry and neutron transport modeling, quantum optimization for reactor design and fuel cycle management, and quantum machine learning for predictive maintenance and safety system optimization. The company has been particularly interested in quantum computing for modeling the complex corrosion and materials interactions in molten salt environments.

The company's investment in quantum computing aligns with its mission to deliver safe, clean, and affordable nuclear power. Moltex Energy is leveraging quantum technology to accelerate the development of advanced reactor designs with enhanced safety features, optimize fuel utilization and waste management strategies, improve predictive maintenance systems for enhanced reactor reliability, and advance materials research for corrosion-resistant reactor components. This innovative approach positions Moltex Energy at the forefront of nuclear technology development.

Looking forward, Moltex Energy envisions quantum computing enabling revolutionary advances in nuclear power. This includes complete reactor simulation from neutron level to system level, optimal fuel cycle strategies that minimize waste and maximize efficiency, predictive safety systems that anticipate and prevent potential issues, and accelerated materials discovery for next-generation reactor components. Moltex Energy's quantum strategy supports its vision of providing clean, safe, and economical nuclear power to help address climate change and energy security challenges.`
  },

  'mattermost': {
    industry: 'Enterprise Software',
    content: `Mattermost, the leading open-source collaboration platform, has emerged as a partner in quantum computing through its secure communication infrastructure that supports quantum research teams and quantum computing organizations. With its focus on privacy, security, and team collaboration, Mattermost provides essential communication infrastructure for quantum computing projects requiring secure coordination and knowledge sharing.

The quantum computing industry faces unique collaboration challenges due to the interdisciplinary nature of quantum research and the sensitive nature of quantum algorithm development. Quantum teams often include physicists, computer scientists, engineers, and domain experts who need secure platforms for sharing research findings, coordinating experiments, and discussing proprietary quantum algorithms. Mattermost's private, self-hosted communication platform addresses these specific requirements.

Mattermost's quantum computing partnerships focus on providing secure collaboration infrastructure for quantum research institutions, quantum computing companies, and government quantum programs. The platform's end-to-end encryption, on-premises deployment options, and integration capabilities make it suitable for quantum projects requiring strict security and compliance. Features include secure channels for quantum research discussions, file sharing for quantum algorithms and experimental data, and integration with quantum development environments.

The company's value to the quantum ecosystem lies in providing the secure communication foundation necessary for quantum research collaboration. Mattermost enables quantum teams to coordinate complex research projects, share sensitive quantum algorithms, and maintain secure communications across distributed quantum research networks. Educational institutions and quantum startups particularly benefit from the platform's open-source model and enterprise-grade security features.

Looking ahead, Mattermost continues to support the quantum computing community through enhanced security features and integrations with quantum development tools. The platform's role in enabling secure quantum collaboration becomes increasingly important as quantum computing moves toward commercial applications requiring protection of intellectual property and sensitive research. Mattermost's commitment to open-source collaboration aligns with the quantum community's emphasis on advancing quantum science through secure knowledge sharing.`
  }
};

// Function to update companies with content
async function updateRemainingPartnerCompanies() {
  console.log('Starting to update remaining partner companies with content...');

  for (const [slug, data] of Object.entries(remainingPartnerContent)) {
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

  console.log('Completed updating remaining partner companies!');
}

// Run the update
updateRemainingPartnerCompanies().catch(console.error);