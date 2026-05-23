document.addEventListener('DOMContentLoaded', () => {
  // Three.js Space Background
  const canvas = document.getElementById('space-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // Stars
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 1500;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPositions[i] = (Math.random() - 0.5) * 20;
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.015 });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Planets (Simplified 3D spheres with gradients)
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
    return { mesh: planet, distance, speed, offset, angle: offset };
  };

  const light = new THREE.PointLight(0xffffff, 100, 100);
  light.position.set(5, 5, 5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x222222));

  // Sun / Central Light
  const sunGeometry = new THREE.SphereGeometry(0.8, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfff5d7 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // Sun Glow
  const sunGlowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
  const sunGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.15
  });
  const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
  scene.add(sunGlow);

  planets.push(createPlanet(0.4, 0x00a3ff, 4, 0.005, 0));
  planets.push(createPlanet(0.2, 0xff3e00, 6, 0.003, Math.PI));
  planets.push(createPlanet(0.6, 0x6e00ff, 8, 0.002, Math.PI / 2));

  // Add random orbit tilts
  planets.forEach(p => {
    p.tilt = (Math.random() - 0.5) * 0.5;
  });

  // Mouse Parallax
  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) / 100;
    mouseY = (e.clientY - window.innerHeight / 2) / 100;
  });

  function animate() {
    requestAnimationFrame(animate);

    planets.forEach(p => {
      p.angle += p.speed;
      p.mesh.position.x = Math.cos(p.angle) * p.distance;
      p.mesh.position.z = Math.sin(p.angle) * p.distance;
      p.mesh.position.y = Math.sin(p.angle) * p.distance * p.tilt;
      p.mesh.rotation.y += 0.01;
      p.mesh.rotation.x += 0.005;
    });

    // Subtle camera movement
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();

  // Reveal cards on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    observer.observe(card);
  });

  // Backup reveal: ensure all cards are visible after 2 seconds regardless of scroll
  setTimeout(() => {
    cards.forEach(card => card.classList.add('visible'));
  }, 2000);
});
