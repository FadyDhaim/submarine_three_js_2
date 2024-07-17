const particleGeometry = new THREE.BufferGeometry();
const particleCount = 1000;

const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * AppWater.SPATIAL_SIZE;
    const y = Math.random() * 100; // Adjust y range for particle distribution
    const z = (Math.random() - 0.5) * AppWater.SPATIAL_SIZE;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
}

particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

const particleMaterial = new THREE.PointsMaterial({
    size: 2,
    sizeAttenuation: true,
    color: 0xffffff,
    opacity: 0.2,
    transparent: true,
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);
underwaterFolder.add(particleMaterial, 'opacity', 0, 1, 0.01).name('Particle Opacity');
