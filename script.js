document.addEventListener('DOMContentLoaded', () => {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const starColor = isDark ? 0xffffff : 0x000000;

  // --- THREE.JS MINIMALIST BACKGROUND ---
  const canvas = document.getElementById('space-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 10;

  // Minimalist Particles
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 1000;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPositions[i] = (Math.random() - 0.5) * 40;
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ 
    color: starColor, 
    size: 0.03, 
    transparent: true, 
    opacity: 0.4 
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // --- MATTER.JS PHYSICS ---
  const { Engine, World, Bodies, Mouse, MouseConstraint } = Matter;
  const engine = Engine.create();
  engine.world.gravity.y = 0.02; // Very low gravity

  const cardElements = document.querySelectorAll('.card');
  const cards = [];

  cardElements.forEach((el) => {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * (window.innerHeight / 2);
    
    const body = Bodies.rectangle(x, y, 300, 140, {
      chamfer: { radius: 16 },
      restitution: 0.5,
      friction: 0.1,
      angle: (Math.random() - 0.5) * 0.2
    });
    
    World.add(engine.world, body);
    cards.push({ el, body });
  });

  // Boundaries
  const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth, 100, { isStatic: true });
  const leftWall = Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true });
  const rightWall = Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true });
  const ceiling = Bodies.rectangle(window.innerWidth / 2, -100, window.innerWidth, 100, { isStatic: true });
  World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

  // Mouse
  const mouse = Mouse.create(document.body);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.1, render: { visible: false } }
  });
  World.add(engine.world, mouseConstraint);

  function animate() {
    requestAnimationFrame(animate);
    Engine.update(engine);

    cards.forEach(card => {
      const { position, angle } = card.body;
      card.el.style.left = `${position.x - 150}px`;
      card.el.style.top = `${position.y - 70}px`;
      card.el.style.transform = `rotate(${angle}rad)`;
    });

    stars.rotation.y += 0.0003;
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  animate();
});
