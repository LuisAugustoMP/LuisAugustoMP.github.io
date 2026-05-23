document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. THREE.JS: DERIVA ESPACIAL
  // ==========================================
  const canvas = document.getElementById('space-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 15;

  const starGeometry = new THREE.BufferGeometry();
  const starCount = 4000; 
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount * 3; i++) {
    // Espalha as partículas em um volume profundo e largo
    starPositions[i] = (Math.random() - 0.5) * 80;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  
  const starMaterial = new THREE.PointsMaterial({ 
    color: 0xcccccc, 
    size: 0.05, 
    transparent: true, 
    opacity: 0.7 
  });
  
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);


  // ==========================================
  // 2. MATTER.JS: FÍSICA E GIROSCÓPIO
  // ==========================================
  const { Engine, Runner, World, Bodies, Mouse, MouseConstraint } = Matter;

  const engine = Engine.create();
  engine.world.gravity.y = 0.05; 
  engine.world.gravity.x = 0;

  const domCards = document.querySelectorAll('.physics-card');
  const bodiesMap = [];
  const isMobile = window.innerWidth <= 768;
  const scaleRatio = isMobile ? 0.85 : 1;

  domCards.forEach((cardEl, index) => {
    let w = parseInt(cardEl.dataset.width) * scaleRatio;
    let h = parseInt(cardEl.dataset.height) * scaleRatio;

    const startX = (window.innerWidth / 2) + ((Math.random() - 0.5) * window.innerWidth * 0.5);
    const startY = (window.innerHeight * 0.3) + (index * 40); 

    const body = Bodies.rectangle(startX, startY, w, h, {
      chamfer: { radius: 12 },
      restitution: 0.6,
      friction: 0.05,
      frictionAir: 0.02,
      angle: (Math.random() - 0.5) * 0.3
    });

    World.add(engine.world, body);
    bodiesMap.push({ element: cardEl, body: body, width: w, height: h });
  });

  const wallOptions = { isStatic: true, friction: 0, restitution: 0.4 };
  const wallThickness = 100;
  
  const ground = Bodies.rectangle(0, 0, 0, 0, wallOptions);
  const ceiling = Bodies.rectangle(0, 0, 0, 0, wallOptions);
  const leftWall = Bodies.rectangle(0, 0, 0, 0, wallOptions);
  const rightWall = Bodies.rectangle(0, 0, 0, 0, wallOptions);

  World.add(engine.world, [ground, ceiling, leftWall, rightWall]);

  function updateBoundaries() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    Matter.Body.setPosition(ground, { x: w / 2, y: h + wallThickness / 2 });
    Matter.Body.setVertices(ground, Bodies.rectangle(w / 2, h + wallThickness / 2, w * 2, wallThickness).vertices);

    Matter.Body.setPosition(ceiling, { x: w / 2, y: -wallThickness / 2 });
    Matter.Body.setVertices(ceiling, Bodies.rectangle(w / 2, -wallThickness / 2, w * 2, wallThickness).vertices);

    Matter.Body.setPosition(leftWall, { x: -wallThickness / 2, y: h / 2 });
    Matter.Body.setVertices(leftWall, Bodies.rectangle(-wallThickness / 2, h / 2, wallThickness, h * 2).vertices);

    Matter.Body.setPosition(rightWall, { x: w + wallThickness / 2, y: h / 2 });
    Matter.Body.setVertices(rightWall, Bodies.rectangle(w + wallThickness / 2, h / 2, wallThickness, h * 2).vertices);
  }
  
  updateBoundaries();

  const layer = document.getElementById('interactive-layer');
  const mouse = Mouse.create(layer);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
  });

  mouse.pixelRatio = window.devicePixelRatio;
  World.add(engine.world, mouseConstraint);

  let dragged = false;
  Matter.Events.on(mouseConstraint, 'startdrag', () => { dragged = true; });
  Matter.Events.on(mouseConstraint, 'enddrag', () => { setTimeout(() => dragged = false, 50); });

  domCards.forEach(card => {
    card.addEventListener('click', (e) => { if (dragged) e.preventDefault(); });
  });

  Runner.run(Runner.create(), engine);

  // ==========================================
  // 3. EVENTOS: GIROSCÓPIO
  // ==========================================
  let isGyroActive = false;

  function handleOrientation(event) {
    const { gamma, beta } = event; 
    if (gamma === null || beta === null) return;
    
    // Mapeia angulação (-90 a 90) para a gravidade da física Matter.js
    const gravityX = Math.min(Math.max(gamma / 90, -1), 1) * 0.8;
    const gravityY = Math.min(Math.max(beta / 90, -1), 1) * 0.8;

    // Atualiza o mundo dinamicamente
    engine.world.gravity.x = gravityX;
    engine.world.gravity.y = gravityY;
  }

  // Inicializa o giroscópio no primeiro toque (Para bypass nas políticas do iOS 13+)
  document.addEventListener('click', () => {
    if (!isGyroActive) {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(permissionState => {
            if (permissionState === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
              isGyroActive = true;
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
        isGyroActive = true;
      }
    }
  }, { once: true });


  // ==========================================
  // 4. RENDER LOOP
  // ==========================================
  function renderLoop() {
    // Animação de Deriva das Estrelas
    const positions = stars.geometry.attributes.position.array;
    for (let i = 0; i < starCount; i++) {
      // Move a estrela no eixo Z em direção à câmera
      positions[i * 3 + 2] += 0.08; 
      
      // Se a estrela passar da câmera, reseta no fundo e altera o X/Y
      if (positions[i * 3 + 2] > 15) { 
        positions[i * 3 + 0] = (Math.random() - 0.5) * 80; // Novo X
        positions[i * 3 + 1] = (Math.random() - 0.5) * 80; // Novo Y
        positions[i * 3 + 2] = -40; // Envia para o fundo
      }
    }
    stars.geometry.attributes.position.needsUpdate = true;
    stars.rotation.y += 0.0002;

    renderer.render(scene, camera);

    // Atualiza Cards no DOM baseados na física
    bodiesMap.forEach((item) => {
      const { element, body, width, height } = item;
      const x = body.position.x - width / 2;
      const y = body.position.y - height / 2;
      const angle = body.angle;
      element.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad)`;
    });

    requestAnimationFrame(renderLoop);
  }
  
  renderLoop();

  window.addEventListener('resize', () => {
    updateBoundaries();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

});