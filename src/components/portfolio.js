import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const Portfolio = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme !== 'light';
  });
  
  const [activeTab, setActiveTab] = useState('projects');  // Set initial tab to projects

  useEffect(() => {
    // Force reflow of project cards when tab changes
    if (activeTab === 'projects') {
      projectCardsRef.current.forEach(card => {
        if (card) {
          card.classList.remove('visible');
          // Force reflow
          void card.offsetWidth;
          card.classList.add('visible');
        }
      });
    }
  }, [activeTab]);

  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
  }, [activeTab]);

  const projectCardsRef = useRef([]);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const nodesRef = useRef([]);
  const linesRef = useRef(null);
  const animationRef = useRef(null);

  // Three.js animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const numNodes = 30;
    const maxLines = 500;
    
    const init = () => {
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 100;
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;
      
      const nodeGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      const nodeMaterial = new THREE.MeshBasicMaterial({ 
        color: isDarkMode ? 0x00ff00 : 0x0000ff,
        transparent: true, 
        opacity: 0.8 
      });
      
      for (let i = 0; i < numNodes; i++) {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.x = (Math.random() - 0.5) * 200;
        node.position.y = (Math.random() - 0.5) * 200;
        node.position.z = (Math.random() - 0.5) * 200;
        nodesRef.current.push(node);
        scene.add(node);
      }

      const lineGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(maxLines * 2 * 3);
      const colors = new Float32Array(maxLines * 2 * 3);
      
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
      lineGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));

      const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: isDarkMode ? 0.5 : 0.2
      });

      linesRef.current = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(linesRef.current);

      const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      
      window.addEventListener('resize', onWindowResize);

      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        
        const time = Date.now() * 0.001;
        nodesRef.current.forEach(node => {
          node.position.x += Math.sin(time + node.position.y * 0.01) * 0.02;
          node.position.y += Math.cos(time + node.position.x * 0.01) * 0.02;
          node.position.z += Math.sin(time + node.position.z * 0.01) * 0.02;
        });

        const positions = linesRef.current.geometry.attributes.position.array;
        const colors = linesRef.current.geometry.attributes.color.array;
        let lineCount = 0;
        const lineDistance = 50;

        for (let i = 0; i < nodesRef.current.length; i++) {
          for (let j = i + 1; j < nodesRef.current.length; j++) {
            if (lineCount >= maxLines) break;
            
            const dist = nodesRef.current[i].position.distanceTo(nodesRef.current[j].position);
            if (dist < lineDistance) {
              const opacity = 1 - (dist / lineDistance);
              const r = opacity;
              const g = opacity;
              const b = opacity;

              positions[lineCount * 6] = nodesRef.current[i].position.x;
              positions[lineCount * 6 + 1] = nodesRef.current[i].position.y;
              positions[lineCount * 6 + 2] = nodesRef.current[i].position.z;
              positions[lineCount * 6 + 3] = nodesRef.current[j].position.x;
              positions[lineCount * 6 + 4] = nodesRef.current[j].position.y;
              positions[lineCount * 6 + 5] = nodesRef.current[j].position.z;

              colors[lineCount * 6] = r;
              colors[lineCount * 6 + 1] = g;
              colors[lineCount * 6 + 2] = b;
              colors[lineCount * 6 + 3] = r;
              colors[lineCount * 6 + 4] = g;
              colors[lineCount * 6 + 5] = b;

              lineCount++;
            }
          }
        }

        linesRef.current.geometry.setDrawRange(0, lineCount * 2);
        linesRef.current.geometry.attributes.position.needsUpdate = true;
        linesRef.current.geometry.attributes.color.needsUpdate = true;
        
        camera.position.x = Math.sin(time * 0.1) * 120;
        camera.position.y = Math.cos(time * 0.15) * 80;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationRef.current);
        window.removeEventListener('resize', onWindowResize);
        renderer.dispose();
        
        nodeGeometry.dispose();
        nodeMaterial.dispose();
        lineGeometry.dispose();
        lineMaterial.dispose();
        
        nodesRef.current.forEach(node => scene.remove(node));
        scene.remove(linesRef.current);
        
        nodesRef.current = [];
      };
    };

    const cleanup = init();

    return cleanup;
  }, [isDarkMode]);

  useEffect(() => {
    if (nodesRef.current.length > 0 && linesRef.current) {
      const nodeColor = isDarkMode ? new THREE.Color(0x00ff00) : new THREE.Color(0x0000ff);
      const lineOpacity = isDarkMode ? 0.5 : 0.2;
      
      nodesRef.current.forEach(node => {
        if (node.material) {
          node.material.color.set(nodeColor);
        }
      });
      
      if (linesRef.current.material) {
        linesRef.current.material.opacity = lineOpacity;
      }
    }
  }, [isDarkMode]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    projectCardsRef.current.forEach(card => {
      if (card) observer.observe(card);
    });

    return () => {
      projectCardsRef.current.forEach(card => {
        if (card) observer.unobserve(card);
      });
    };
  }, []);
  
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#111827';
      document.body.style.color = '#f3f4f6';
    } else {
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f3f4f6';
      document.body.style.color = '#111827';
    }
    
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    console.log('Switching to tab:', sectionId);
    setActiveTab(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="antialiased leading-relaxed">
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          body {
            font-family: 'Inter', sans-serif;
            transition: background-color 0.3s ease, color 0.3s ease;
            overflow-x: hidden;
            margin: 0;
            padding: 0;
          }
          
          #neural-net-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
          }
          
          .content-container { 
            position: relative; 
            z-index: 10; 
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .bg-white { background-color: white; }
          .dark .bg-white { background-color: #1f2937; }
          
          .bg-gray-800 { background-color: #1f2937; }
          .dark .bg-gray-800 { background-color: #111827; }
          
          .bg-gray-200 { background-color: #e5e7eb; }
          .dark .bg-gray-200 { background-color: #374151; }
          
          .text-gray-600 { color: #4b5563; }
          .dark .text-gray-600 { color: #d1d5db; }
          
          .text-gray-800 { color: #1f2937; }
          .dark .text-gray-800 { color: #f3f4f6; }
          
          .text-gray-900 { color: #111827; }
          .dark .text-gray-900 { color: #f9fafb; }
          
          .text-gray-700 { color: #374151; }
          .dark .text-gray-700 { color: #e5e7eb; }
          
          .text-gray-300 { color: #d1d5db; }
          .dark .text-gray-300 { color: #4b5563; }
          
          .text-indigo-800 { color: #3730a3; }
          .dark .text-indigo-800 { color: #a5b4fc; }
          
          .text-indigo-600 { color: #4f46e5; }
          .dark .text-indigo-600 { color: #818cf8; }
          
          .text-indigo-400 { color: #818cf8; }
          .dark .text-indigo-400 { color: #4f46e5; }
          
          .border-indigo-400 { border-color: #818cf8; }
          .dark .border-indigo-400 { border-color: #4f46e5; }
          
          .border-indigo-600 { border-color: #4f46e5; }
          .dark .border-indigo-600 { border-color: #818cf8; }
          
          .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
          .dark .shadow-sm { box-shadow: 0 1px 2px 0 rgba(255, 255, 255, 0.05); }
          
          .tab-button {
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            background: transparent;
            cursor: pointer;
          }
          
          .tab-button.active {
            background-color: rgba(79, 70, 229, 0.1);
            color: #4f46e5;
          }
          
          .dark .tab-button.active {
            background-color: rgba(165, 180, 252, 0.1);
            color: #a5b4fc;
          }
          
          .tab-content {
            animation: fadeIn 0.5s ease-in-out;
          }
          
          .skill-card {
            transition: all 0.3s ease-in-out;
            animation: fadeInUp 0.6s ease-out forwards;
            opacity: 0;
          }
          
          .skill-card:hover { 
            transform: translateY(-5px); 
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          }
          
          .dark .skill-card:hover {
            box-shadow: 0 10px 20px rgba(255, 255, 255, 0.1);
          }
          
          .project-card {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
          }
          
          .project-card.visible {
            opacity: 1;
            transform: translateY(0);
          }
          
          .skill-card:nth-child(1) { animation-delay: 0.1s; }
          .skill-card:nth-child(2) { animation-delay: 0.2s; }
          .skill-card:nth-child(3) { animation-delay: 0.3s; }
          
          .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
          }
          
          @media (min-width: 640px) {
            .container {
              padding: 0 1.5rem;
            }
          }
          
          @media (min-width: 1024px) {
            .container {
              padding: 0 2rem;
            }
          }
          
          .grid { display: grid; }
          .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          
          @media (min-width: 768px) {
            .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          
          @media (min-width: 1024px) {
            .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          }
          
          .gap-6 { gap: 1.5rem; }
          .flex { display: flex; }
          .flex-wrap { flex-wrap: wrap; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .space-x-6 > * + * { margin-left: 1.5rem; }
          .space-y-6 > * + * { margin-top: 1.5rem; }
          
          .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
          .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
          .px-4 { padding-left: 1rem; padding-right: 1rem; }
          .p-6 { padding: 1.5rem; }
          .p-8 { padding: 2rem; }
          .p-12 { padding: 3rem; }
          
          .mb-6 { margin-bottom: 1.5rem; }
          .mb-12 { margin-bottom: 3rem; }
          .mt-6 { margin-top: 1.5rem; }
          .mt-12 { margin-top: 3rem; }
          
          .rounded-lg { border-radius: 0.5rem; }
          .rounded-md { border-radius: 0.375rem; }
          
          .text-center { text-align: center; }
          .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
          .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
          .text-5xl { font-size: 3rem; line-height: 1; }
          .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
          .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
          .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
          
          .font-extrabold { font-weight: 800; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          
          .leading-tight { line-height: 1.25; }
          .leading-relaxed { line-height: 1.625; }
          
          .max-w-xl { max-width: 36rem; }
          .mx-auto { margin-left: auto; margin-right: auto; }
          
          .list-disc { list-style-type: disc; }
          .list-inside { list-style-position: inside; }
          
          .transition { transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
          .transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
          .duration-300 { transition-duration: 300ms; }
          
          .hover\\:scale-105:hover { transform: scale(1.05); }
          
          .transform { transform: translateX(0) translateY(0) rotate(0) skewX(0) skewY(0) scaleX(1) scaleY(1); }
          
          .hidden { display: none; }
          
          @media (min-width: 768px) {
            .md\\:p-12 { padding: 3rem; }
          }
        `}
      </style>
      
      <canvas id="neural-net-bg" ref={canvasRef}></canvas>
      
      <div className="content-container">
        <header className="bg-white dark:bg-gray-900 shadow-sm py-6">
          <div className="container flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-indigo-800 dark:text-indigo-200 transition-transform duration-300 hover:scale-105">Aradhya Sharma</h1>
            <nav className="flex items-center space-x-6">
              <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button 
                  className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
                  onClick={() => scrollToSection('about')}
                >
                  About
                </button>
                <button 
                  className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
                  onClick={() => scrollToSection('skills')}
                >
                  Skills
                </button>
                <button 
                  className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
                  onClick={() => scrollToSection('projects')}
                >
                  Projects
                </button>
                <button 
                  className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
                  onClick={() => scrollToSection('contact')}
                >
                  Contact
                </button>
              </div>
              <button onClick={toggleTheme} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-300">
                {isDarkMode ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                  </svg>
                )}
              </button>
            </nav>
          </div>
        </header>

        <main className="container py-12">
          <section id="hero" className="text-center py-12">
            <div className="flex flex-col items-center">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-indigo-800 dark:text-indigo-200 leading-tight mt-6">
                Bridging Engineering with IoT and Embedded Systems
              </h2>
              <p className="mt-4 max-w-xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                A passionate Biomedical Engineer with hands-on experience in prototyping innovative devices, from fNIRS headbands to autonomous robots. I am committed to leveraging technology to create tangible, real-world impact.
              </p>
            </div>
          </section>

          <div className="tab-content">
            {activeTab === 'about' && (
              <>
                <section id="about" className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-lg shadow-sm mb-12">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-indigo-400 dark:border-indigo-600 pb-2">About Me</h3>
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    I am a Biomedical Engineering graduate with a strong foundation in programming, electronics, and mechanical design. My work centers on creating practical solutions in robotics, embedded systems, and medical technology. From developing prototypes for brain oxygenation monitoring to designing autonomous drones, my projects highlight my ability to translate technical knowledge into functional applications. I am a collaborative and dedicated professional, eager to contribute my skills to challenging projects that make a difference.
                  </p>
                  <div className="mt-6">
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Education:</h4>
                    <ul className="mt-2 text-gray-600 dark:text-gray-400">
                      <li><strong>Biomedical Engineering</strong> - SGSITS, Indore</li>
                    </ul>
                  </div>
                </section>

                <section id="responsibilities" className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-lg shadow-sm mb-12">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-indigo-400 dark:border-indigo-600 pb-2">Positions of Responsibility</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Head of Avionics</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">YAN- Aeromodeling Club</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        <li>Oversaw the selection and calibration of avionics systems for drone and Fixed wing projects.</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Idea Lab Student Ambassador</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">IDEALAB, SGSITS</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        <li>Mentored students and startups on project development, providing technical guidance and support.</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section id="achievements" className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-lg shadow-sm mb-12">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-indigo-400 dark:border-indigo-600 pb-2">Academic Achievements & Extracurriculars</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Achievements</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        <li>Secured 3rd place in the Best Design Report category at the Autonomous Drone Design Competition (SAE INDIA).</li>
                        <li>Awarded the gold medal for securing 1st position in the Class 10th Mathematics Olympiad.</li>
                        <li>Earned 2nd position in Dwand-Robowar, a technical robotics competition.</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Extracurricular Activities</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        <li><strong>Ayam, Idea Lab Member:</strong> Designed a mystery box using a laser cutting machine.</li>
                        <li><strong>Abhiyantrika, Aeromodelling Workshop:</strong> Built a BLDC motor mount for a plane using a laser cutting machine as a Technical Team Member.</li>
                      </ul>
                    </div>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'skills' && (
              <section id="skills" className="mb-12">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-indigo-400 dark:border-indigo-600 pb-2">Skills</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm skill-card">
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Technical Skills</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                      <li>Python & Embedded C</li>
                      <li>SolidWorks & KiCad</li>
                      <li>IoT & Embedded Systems</li>
                      <li>Matlab</li>
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm skill-card">
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Software & Tools</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                      <li>VS Code & Arduino IDE</li>
                      <li>Git & GitHub</li>
                      <li>MS Office Suite</li>
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm skill-card">
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Soft Skills</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                      <li>Team Management</li>
                      <li>Technical Communication</li>
                      <li>Problem-Solving</li>
                      <li>Prototyping & Design</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'projects' && (
              <section id="projects" className="mb-12">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-indigo-400 dark:border-indigo-600 pb-2">Projects & Experience</h3>

                <div
                  className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 project-card visible"
                  ref={el => (projectCardsRef.current[0] = el)}
                >
                  <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Biomedical Device Prototyping Internship</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Neurovana, Inc. | May 2024 - Aug 2024</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li><strong>Pioneered</strong> the initial prototype of an fNIRS-based Headband for real-time monitoring of brain oxygenation.</li>
                    <li><strong>Implemented</strong> BLE communication and optimized for low-power microcontrollers to extend device battery life.</li>
                    <li><strong>Contributed</strong> to the early-stage circuit design and performed SMD PCB soldering for the prototype.</li>
                  </ul>
                </div>

                <div
                  className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 project-card visible"
                  ref={el => (projectCardsRef.current[1] = el)}
                >
                  <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">IoT and Embedded Systems Internship</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">IDEALAB, SGSITS, Indore | May 2023 - July 2023</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li><strong>Designed and developed</strong> a Wireless Gesture-Controlled Wheelchair using an MPU-6050 and ESP32.</li>
                    <li><strong>Engineered</strong> a low-latency wireless communication system by implementing the ESP-NOW protocol.</li>
                    <li><strong>Leveraged</strong> hands-on skills in 3D printing, laser cutting, and embedded C programming to build the functional prototype.</li>
                  </ul>
                </div>

                <div
                  className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 project-card"
                  ref={el => (projectCardsRef.current[2] = el)}
                >
                  <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Autonomous Quadcopter</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Technical Project</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li><strong>Designed</strong> and <strong>fabricated</strong> a custom H-mode frame to create a robust autonomous delivery drone.</li>
                    <li><strong>Integrated</strong> core avionics components, including ESC, BLDC motors, and Lithium polymer batteries.</li>
                    <li><strong>Developed</strong> autonomous mission planning software, focusing on navigation and payload delivery logic.</li>
                  </ul>
                </div>

                <div
                  className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 project-card"
                  ref={el => (projectCardsRef.current[3] = el)}
                >
                  <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Obstacle Avoidance Robot</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Academic Project</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li><strong>Programmed</strong> a robot using an Ultrasonic sensor and an Arduino Uno to detect and avoid obstacles.</li>
                    <li><strong>Built</strong> foundational knowledge in programming and robotics to enable basic autonomous navigation.</li>
                  </ul>
                </div>

                <div
                  className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 project-card"
                  ref={el => (projectCardsRef.current[4] = el)}
                >
                  <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Library Management System</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Academic Project</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li><strong>Developed</strong> a full-featured library management system using Python and SQL.</li>
                    <li><strong>Created</strong> a user-friendly graphical interface with Python's Tkinter module.</li>
                    <li><strong>Managed</strong> all book data and user records by implementing a robust SQL backend.</li>
                  </ul>
                </div>
              </section>
            )}

            {activeTab === 'contact' && (
              <section id="contact" className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-lg shadow-sm">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-indigo-400 dark:border-indigo-600 pb-2">Get in Touch</h3>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  I'm always open to new opportunities and collaborations. Feel free to reach out to me via email or connect with me on professional networks.
                </p>
                <div className="mt-6 flex flex-wrap gap-6">
                  <a href="mailto:aradhyash2003@gmail.com" className="bg-indigo-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-indigo-700 transition duration-300 transform hover:scale-105 flex items-center gap-2">
                    <i className="fa-solid fa-envelope"></i> Email
                  </a>
                  <a href="tel:+917974984215" className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-md text-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 transform hover:scale-105 flex items-center gap-2">
                    <i className="fa-solid fa-phone"></i> Call
                </a>
              <a href="https://www.linkedin.com/in/aradhya-sharma-b78809276/" className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-md text-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 transform hover:scale-105 flex items-center gap-2">
                <i className="fab fa-linkedin"></i> LinkedIn
              </a>
              <a href="https://github.com/aradhya2003" className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-md text-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 transform hover:scale-105 flex items-center gap-2">
                <i className="fab fa-github"></i> GitHub
              </a>
            </div>
          </section>
            )}
          </div>
        </main>

        <footer className="bg-gray-800 dark:bg-gray-900 text-white py-6 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; 2025 Aradhya Sharma. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Portfolio;