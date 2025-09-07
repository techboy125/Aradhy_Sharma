import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const App = () => {
  // State for theme and project card visibility
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if a theme is saved in local storage. If not, default to dark mode.
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      return false;
    }
    return true;
  });
  const projectCardsRef = useRef([]);

  // Refs for the Three.js canvas and scene objects
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const nodesRef = useRef([]);
  const linesRef = useRef(null);

  // Effect for the Three.js background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frameId;
    const maxLines = 1000;
    const positions = new Float32Array(maxLines * 2 * 3);
    const colors = new Float32Array(maxLines * 2 * 3);
    const lineDistance = 50;
    
    // Create the node material
    const nodeMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8 });
    // Create the line material
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5
    });

    const init = () => {
      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 100;
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current = renderer;
      
      // Create the nodes (atoms)
      const nodeGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      const numNodes = 60;
      for (let i = 0; i < numNodes; i++) {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.x = (Math.random() - 0.5) * 200;
        node.position.y = (Math.random() - 0.5) * 200;
        node.position.z = (Math.random() - 0.5) * 200;
        nodesRef.current.push(node);
        scene.add(node);
      }

      // Create a single geometry for all lines
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
      lineGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));

      linesRef.current = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(linesRef.current);

      window.addEventListener('resize', onWindowResize);

      animate();
    };

    const onWindowResize = () => {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Animate the nodes
      nodesRef.current.forEach(node => {
        node.position.x += Math.sin(Date.now() * 0.0001 + node.position.y * 0.1) * 0.02;
        node.position.y += Math.cos(Date.now() * 0.0001 + node.position.x * 0.1) * 0.02;
        node.position.z += Math.sin(Date.now() * 0.0001 + node.position.z * 0.1) * 0.02;
      });

      // Update the lines
      let lineCount = 0;
      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
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
      
      // Automated camera movement
      const time = Date.now() * 0.001;
      cameraRef.current.position.x = Math.sin(time * 0.1) * 120;
      cameraRef.current.position.y = Math.cos(time * 0.15) * 80;
      cameraRef.current.lookAt(sceneRef.current.position);

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    init();

    // Cleanup function to prevent memory leaks
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onWindowResize);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // New effect to handle theme changes for the 3D animation
  useEffect(() => {
    // Only update colors if the scene objects exist
    if (nodesRef.current.length > 0 && linesRef.current) {
      const nodeColor = isDarkMode ? new THREE.Color(0x00ff00) : new THREE.Color(0x0000ff);
      const lineColor = isDarkMode ? 0.5 : 0.2;
      
      nodesRef.current.forEach(node => {
        if (node.material && node.material.color) {
          node.material.color.set(nodeColor);
        }
      });
      if (linesRef.current.material) {
        linesRef.current.material.opacity = lineColor;
      }
    }
  }, [isDarkMode]);

  // Effect for project card visibility on scroll
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
  
  // New effect to handle body class for Tailwind dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);


  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    // Save the user's preference to local storage
    localStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');
  };

  return (
    <div className={`antialiased leading-relaxed`}>
      <style>
        {`
          /* Keyframe animations for dynamic effects */
          @keyframes fadeInUp {
              from {
                  opacity: 0;
                  transform: translateY(20px);
              }
              to {
                  opacity: 1;
                  transform: translateY(0);
              }
          }

          /* Base styles for the entire page */
          body {
              font-family: 'Inter', sans-serif;
              transition: background-color 0.3s ease, color 0.3s ease;
              overflow-x: hidden;
          }
          
          body.dark {
            background: #111827;
            color: #f3f4f6;
          }

          body.light {
            background: #f3f4f6;
            color: #111827;
          }

          /* 3D canvas styles to cover the entire background */
          #neural-net-bg {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: -1;
              pointer-events: none;
          }

          /* Content layers on top of the canvas */
          .content-container {
              position: relative;
              z-index: 10;
          }

          /* Other element styles */
          .bg-white, .project-card, .skill-card {
              transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
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
              box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
          }

          .project-card {
              opacity: 0;
              transform: translateY(20px);
          }

          .project-card.visible {
              animation: fadeInUp 0.6s ease-out forwards;
          }

          /* Stagger animation delays for skills */
          .skill-card:nth-child(1) { animation-delay: 0.1s; }
          .skill-card:nth-child(2) { animation-delay: 0.2s; }
          .skill-card:nth-child(3) { animation-delay: 0.3s; }
        `}
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* Three.js Background Canvas */}
      <canvas id="neural-net-bg" ref={canvasRef}></canvas>

      <div className="content-container">
        <header className="bg-white dark:bg-gray-900 shadow-sm py-6">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-indigo-800 transition-transform duration-300 hover:scale-105">Aradhya Sharma</h1>
            <nav className="flex items-center space-x-6">
              <ul className="flex space-x-6">
                <li><a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-300">About</a></li>
                <li><a href="#skills" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-300">Skills</a></li>
                <li><a href="#projects" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-300">Projects</a></li>
                <li><a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-300">Contact</a></li>
              </ul>
              <button id="theme-toggle" onClick={toggleTheme} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-300">
                <svg className={`w-6 h-6 ${isDarkMode ? 'block' : 'hidden'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                <svg className={`w-6 h-6 ${isDarkMode ? 'hidden' : 'block'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
              </button>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <section id="hero" className="text-center py-12">
            <div className="flex flex-col items-center">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-indigo-800 dark:text-indigo-200 leading-tight mt-6">
                Bridging Biomedical Engineering with IoT and Embedded Systems
              </h2>
              <p className="mt-4 max-w-xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                A passionate Biomedical Engineer with hands-on experience in prototyping innovative devices, from fNIRS headbands to autonomous robots. I am committed to leveraging technology to create tangible, real-world impact.
              </p>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-lg shadow-sm mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-indigo-400 dark:border-indigo-600 pb-2">About Me</h3>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              I am a Biomedical Engineering graduate with a strong foundation in programming, electronics, and mechanical design. My work centers on creating practical solutions in robotics, embedded systems, and medical technology. From developing prototypes for brain oxygenation monitoring to designing autonomous drones, my projects highlight my ability to translate technical knowledge into functional applications. I am a collaborative and dedicated professional, eager to contribute my skills to challenging projects that make a difference.
            </p>
            <div className="mt-6">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Education:</h4>
              <ul className="mt-2 text-gray-600 dark:text-gray-400">
                <li><strong>Biomedical Engineering</strong> - SGSITS, Indore</li>
                <li><strong>High School (Class 12)</strong> - CBSE</li>
                <li><strong>High School (Class 10)</strong> - CBSE</li>
              </ul>
            </div>
          </section>

          {/* Positions of Responsibility */}
          <section id="responsibilities" className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-lg shadow-sm mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-indigo-400 dark:border-indigo-600 pb-2">Positions of Responsibility</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Head of Avionics</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-2">Ayam</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Oversaw the selection and calibration of avionics systems for drone projects.</li>
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

          {/* Academic Achievements & Extracurriculars */}
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
                  <li>**Ayam, Idea Lab Member:** Designed a mystery box using a laser cutting machine.</li>
                  <li>**Abhiyantrika, Aeromodelling Workshop:** Built a BLDC motor mount for a plane using a laser cutting machine as a Technical Team Member.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Skills Section */}
          <section id="skills" className="mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-indigo-400 dark:border-indigo-600 pb-2">Skills</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Technical Skills */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm skill-card">
                <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Technical Skills</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Python & Embedded C</li>
                  <li>SolidWorks & KiCad</li>
                  <li>IoT & Embedded Systems</li>
                  <li>Matlab</li>
                </ul>
              </div>
              {/* Software & Tools */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm skill-card">
                <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Software & Tools</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>VS Code & Arduino IDE</li>
                  <li>Git & GitHub</li>
                  <li>MS Office Suite</li>
                </ul>
              </div>
              {/* Soft Skills */}
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

          {/* Projects Section */}
          <section id="projects" className="mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-indigo-400 dark:border-indigo-600 pb-2">Projects & Experience</h3>

            {/* Project components */}
            <div
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 project-card"
              ref={el => (projectCardsRef.current[0] = el)}
            >
              <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Biomedical Device Prototyping Internship</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Neurovana, Inc. | May 2024 - Aug 2024</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>**Pioneered** the initial prototype of an fNIRS-based Headband for real-time monitoring of brain oxygenation.</li>
                <li>**Implemented** BLE communication and optimized for low-power microcontrollers to extend device battery life.</li>
                <li>**Contributed** to the early-stage circuit design and performed SMD PCB soldering for the prototype.</li>
              </ul>
            </div>

            <div
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 project-card"
              ref={el => (projectCardsRef.current[1] = el)}
            >
              <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">IoT and Embedded Systems Internship</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">IDEALAB, SGSITS, Indore | May 2023 - July 2023</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>**Designed and developed** a Wireless Gesture-Controlled Wheelchair using an MPU-6050 and ESP32.</li>
                <li>**Engineered** a low-latency wireless communication system by implementing the ESP-NOW protocol.</li>
                <li>**Leveraged** hands-on skills in 3D printing, laser cutting, and embedded C programming to build the functional prototype.</li>
              </ul>
            </div>

            <div
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 project-card"
              ref={el => (projectCardsRef.current[2] = el)}
            >
              <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Autonomous Quadcopter</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Technical Project</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>**Designed** and **fabricated** a custom H-mode frame to create a robust autonomous delivery drone.</li>
                <li>**Integrated** core avionics components, including ESC, BLDC motors, and Lithium polymer batteries.</li>
                <li>**Developed** autonomous mission planning software, focusing on navigation and payload delivery logic.</li>
              </ul>
            </div>

            <div
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 project-card"
              ref={el => (projectCardsRef.current[3] = el)}
            >
              <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Obstacle Avoidance Robot</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Academic Project</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>**Programmed** a robot using an Ultrasonic sensor and an Arduino Uno to detect and avoid obstacles.</li>
                <li>**Built** foundational knowledge in programming and robotics to enable basic autonomous navigation.</li>
              </ul>
            </div>

            <div
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-6 project-card"
              ref={el => (projectCardsRef.current[4] = el)}
            >
              <h4 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Library Management System</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Academic Project</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>**Developed** a full-featured library management system using Python and SQL.</li>
                <li>**Created** a user-friendly graphical interface with Python's Tkinter module.</li>
                <li>**Managed** all book data and user records by implementing a robust SQL backend.</li>
              </ul>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-lg shadow-sm">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 border-b-2 border-indigo-400 dark:border-indigo-600 pb-2">Get in Touch</h3>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              I'm always open to new opportunities and collaborations. Feel free to reach out to me via email or connect with me on professional networks.
            </p>
            <div className="mt-6 flex flex-wrap gap-6">
              <a href="mailto:aradhyash2003@gmail.com" className="bg-indigo-600 text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-indigo-700 transition duration-300 transform hover:scale-105 flex items-center gap-2">
                <i className="fa-solid fa-envelope"></i> Email Me
              </a>
              <a href="tel:+917974984215" className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-md text-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 transform hover:scale-105 flex items-center gap-2">
                <i className="fa-solid fa-phone"></i> Call Me
              </a>
              <a href="https://www.linkedin.com/in/aradhya-sharma-b78809276/" className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-md text-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 transform hover:scale-105 flex items-center gap-2">
                <i className="fab fa-linkedin"></i> LinkedIn
              </a>
              <a href="https://github.com/aradhya2003" className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-md text-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 transform hover:scale-105 flex items-center gap-2">
                <i className="fab fa-github"></i> GitHub
              </a>
            </div>
          </section>
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

export default App;