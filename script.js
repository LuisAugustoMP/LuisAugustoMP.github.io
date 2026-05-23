document.addEventListener('DOMContentLoaded', () => {
  // --- THREE.JS SPACE BACKGROUND ---
  const canvas = document.getElementById('space-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 8;

  // Stars / Particles
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 3000;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPositions[i] = (Math.random() - 0.5) * 50;
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0x00a3ff, size: 0.02, transparent: true, opacity: 0.8 });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Planets
  const planets = [];
  const createPlanet = (radius, color, distance, speed, offset) => {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.2,
      shininess: 100
    });
    const planet = new THREE.Mesh(geometry, material);
    scene.add(planet);
    return { mesh: planet, distance, speed, angle: offset, tilt: (Math.random() - 0.5) * 0.5 };
  };

  const light = new THREE.PointLight(0xffffff, 150, 100);
  light.position.set(5, 5, 5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x222222));

  // Sun
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), new THREE.MeshBasicMaterial({ color: 0xfff5d7 }));
  scene.add(sun);

  planets.push(createPlanet(0.5, 0x00a3ff, 6, 0.002, 0));
  planets.push(createPlanet(0.3, 0xff3e00, 9, 0.0015, Math.PI));
  planets.push(createPlanet(0.8, 0x6e00ff, 12, 0.001, Math.PI / 2));

  // --- MATTER.JS PHYSICS ---
  const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Composite } = Matter;
  const engine = Engine.create();
  engine.world.gravity.y = 0.05; // Low gravity like floating in space

  const grid = document.querySelector('.grid');
  const cardElements = document.querySelectorAll('.card');
  const cards = [];

  // Create physical bodies for each card
  cardElements.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * -500; // Start above screen
    
    const body = Bodies.rectangle(x, y, 320, 160, {
      chamfer: { radius: 20 },
      restitution: 0.6,
      friction: 0.1,
      angle: (Math.random() - 0.5) * 0.5
    });
    
    World.add(engine.world, body);
    cards.push({ el, body });
  });

  // Walls
  const wallOptions = { isStatic: true, render: { visible: false } };
  const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth, 100, wallOptions);
  const leftWall = Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, wallOptions);
  const rightWall = Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, wallOptions);
  World.add(engine.world, [ground, leftWall, rightWall]);

  // Mouse Interaction
  const mouse = Mouse.create(document.body);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
  });
  World.add(engine.world, mouseConstraint);

  // --- ANIMATION LOOP ---
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) / 100;
    mouseY = (e.clientY - window.innerHeight / 2) / 100;
  });

  function animate() {
    requestAnimationFrame(animate);
    Engine.update(engine);

    // Sync HTML cards with physics bodies
    cards.forEach(card => {
      const { position, angle } = card.body;
      card.el.style.left = `${position.x - 160}px`;
      card.el.style.top = `${position.y - 80}px`;
      card.el.style.transform = `rotate(${angle}rad)`;
    });

    // Three.js Updates
    planets.forEach(p => {
      p.angle += p.speed;
      p.mesh.position.x = Math.cos(p.angle) * p.distance;
      p.mesh.position.z = Math.sin(p.angle) * p.distance;
      p.mesh.position.y = Math.sin(p.angle) * p.distance * p.tilt;
      p.mesh.rotation.y += 0.01;
    });

    stars.rotation.y += 0.0005;
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update ground position on resize
    Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + 50 });
  });

  animate();
});
