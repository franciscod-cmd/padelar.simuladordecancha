const THREE = window.THREE;
const OrbitControls = THREE?.OrbitControls;

if (!THREE || !OrbitControls) {
  throw new Error('No se pudo iniciar el motor 3D.');
}

const canvas = document.getElementById('court-3d-canvas');
const card = document.getElementById('court-3d-card');

if (!canvas || !card) {
  throw new Error('No se encontró el contenedor del modelo 3D.');
}

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.72;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
camera.position.set(15.5, 17.5, 22.5);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.1, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.minDistance = 12;
controls.maxDistance = 38;
controls.minPolarAngle = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.025;
controls.rotateSpeed = 0.65;
controls.zoomSpeed = 0.8;

const court = new THREE.Group();
scene.add(court);

const lime = new THREE.MeshStandardMaterial({ color: 0x7dff37, roughness: 0.5, metalness: 0.12 });
const metal = new THREE.MeshStandardMaterial({ color: 0x15191d, roughness: 0.48, metalness: 0.65 });
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x090b0d, roughness: 0.55, metalness: 0.58 });
const white = new THREE.MeshStandardMaterial({ color: 0xf4f5ee, roughness: 0.7 });
const glass = new THREE.MeshPhysicalMaterial({
  color: 0xdde4ff,
  transparent: true,
  opacity: 0.22,
  roughness: 0.08,
  metalness: 0,
  transmission: 0.2,
  depthWrite: false,
  side: THREE.DoubleSide
});
const meshMaterial = new THREE.MeshStandardMaterial({
  color: 0x0b0f13,
  transparent: true,
  opacity: 0.82,
  roughness: 0.65,
  metalness: 0.35
});
const turfMaterial = new THREE.MeshStandardMaterial({ color: 0x1007b8, roughness: 0.84, metalness: 0 });
const clampMaterial = new THREE.MeshStandardMaterial({ color: 0x353b40, roughness: 0.34, metalness: 0.82 });

function addBox(size, position, material, parent = court, castShadow = true) {
  const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addGlassPanel(width, height, position, rotationY = 0) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const panel = new THREE.Mesh(geometry, glass);
  panel.position.set(position[0], position[1], position[2]);
  panel.rotation.y = rotationY;
  panel.castShadow = false;
  panel.receiveShadow = false;
  panel.renderOrder = 1;
  court.add(panel);
  return panel;
}

function cylinderBetween(start, end, radius, material, parent = court) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(to, from);
  const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 10);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function addFencePanel({ width, height, position, rotationY = 0, columns = 10, rows = 7, material = meshMaterial, parent = court }) {
  const group = new THREE.Group();
  group.position.set(position[0], position[1], position[2]);
  group.rotation.y = rotationY;

  addBox([width, 0.07, 0.055], [0, height / 2, 0], material, group, false);
  addBox([width, 0.07, 0.055], [0, -height / 2, 0], material, group, false);
  addBox([0.07, height, 0.055], [-width / 2, 0, 0], material, group, false);
  addBox([0.07, height, 0.055], [width / 2, 0, 0], material, group, false);

  for (let i = 1; i < columns; i += 1) {
    const x = -width / 2 + (width * i) / columns;
    addBox([0.012, height, 0.016], [x, 0, 0], material, group, false);
  }
  for (let i = 1; i < rows; i += 1) {
    const y = -height / 2 + (height * i) / rows;
    addBox([width, 0.012, 0.016], [0, y, 0], material, group, false);
  }
  parent.add(group);
  return group;
}

// Continuous playing surface and regulation interior court markings.
addBox([10, 0.12, 20], [0, 0, 0], turfMaterial, court, false);
const lineY = 0.075;
const lineWidth = 0.05;
// Regulation service lines: 6.95 metres from the net on each half.
const serviceLineDistance = 6.95;
addBox([9.9, 0.012, lineWidth], [0, lineY, -serviceLineDistance], white, court, false);
addBox([9.9, 0.012, lineWidth], [0, lineY, serviceLineDistance], white, court, false);
// Centre service line: two exact segments, from the net to each service line.
addBox([lineWidth, 0.012, serviceLineDistance], [0, lineY, -serviceLineDistance / 2], white, court, false);
addBox([lineWidth, 0.012, serviceLineDistance], [0, lineY, serviceLineDistance / 2], white, court, false);

// Perimeter base and signature lime structural frame.
for (const z of [-10.05, 10.05]) addBox([10.25, 0.16, 0.15], [0, 0.08, z], darkMetal);
for (const x of [-5.05, 5.05]) addBox([0.15, 0.16, 20.25], [x, 0.08, 0], darkMetal);
// Lime beams frame the glass ends and returns; the central side mesh stays black.
for (const z of [-10.05, 10.05]) addBox([10.25, 0.17, 0.17], [0, 3.02, z], lime);
const classicCornerStructure = new THREE.Group();
court.add(classicCornerStructure);
for (const x of [-5.05, 5.05]) {
  for (const z of [-8.05, 8.05]) addBox([0.17, 0.17, 4.1], [x, 3.02, z], lime);
  for (const z of [-10.05, 10.05]) {
    addBox([0.16, 3.05, 0.16], [x, 1.525, z], lime, classicCornerStructure);
    addBox([0.11, 1, 0.11], [x, 3.5, z], metal);
    addBox([0.38, 0.055, 0.38], [x, 0.025, z], lime, classicCornerStructure);
  }
}

// Classic Elite: compact high-section corners and structural posts at every light bay.
const eliteReinforcements = new THREE.Group();
eliteReinforcements.visible = false;
court.add(eliteReinforcements);
for (const x of [-5.05, 5.05]) {
  for (const z of [-10.05, 10.05]) {
    addBox([0.34, 3.05, 0.42], [x, 1.525, z], lime, eliteReinforcements);
    addBox([0.5, 0.075, 0.58], [x, 0.035, z], lime, eliteReinforcements);
    addBox([0.46, 0.09, 0.5], [x, 3.0, z], lime, eliteReinforcements);
  }
  for (const z of [-6, 6]) {
    addBox([0.2, 3.05, 0.2], [x, 1.525, z], lime, eliteReinforcements);
    addBox([0.4, 0.06, 0.4], [x, 0.03, z], lime, eliteReinforcements);
  }
}

// Full 360°: the glass ends remain panoramic; loads move to reinforced side bays.
const full360Structure = new THREE.Group();
full360Structure.visible = false;
court.add(full360Structure);
for (const x of [-5.05, 5.05]) {
  for (const z of [-6, 6]) {
    addBox([0.22, 3.05, 0.24], [x, 1.525, z], lime, full360Structure);
    addBox([0.44, 0.06, 0.48], [x, 0.03, z], lime, full360Structure);
    addBox([0.34, 0.08, 0.34], [x, 3.0, z], lime, full360Structure);
    addBox([0.08, 1.25, 0.34], [x + Math.sign(x) * 0.14, 1.12, z], darkMetal, full360Structure);
  }
}

// Tempered glass end walls and side returns.
const endGlassFrames = new THREE.Group();
court.add(endGlassFrames);
for (const z of [-10.01, 10.01]) {
  addGlassPanel(9.95, 3, [0, 1.5, z]);
  addFencePanel({ width: 10, height: 1, position: [0, 3.5, z], columns: 12, rows: 3 });
  for (const x of [-3.33, 0, 3.33]) addBox([0.055, 3, 0.08], [x, 1.5, z], metal, endGlassFrames);
  for (const x of [-4.2, -2.1, 0, 2.1, 4.2]) {
    addBox([0.13, 0.2, 0.12], [x, 0.2, z], clampMaterial, court, false);
    addBox([0.13, 0.2, 0.12], [x, 2.8, z], clampMaterial, court, false);
  }
}
for (const x of [-5.01, 5.01]) {
  for (const z of [-8, 8]) {
    addGlassPanel(4, 3, [x, 1.5, z], Math.PI / 2);
    // The raised mesh only occupies the outer half of each glass return.
    addFencePanel({ width: 2, height: 1, position: [x, 3.5, z + Math.sign(z)], rotationY: Math.PI / 2, columns: 3, rows: 3 });
    for (const zOffset of [-1.45, 0, 1.45]) {
      addBox([0.12, 0.18, 0.13], [x, 0.2, z + zOffset], clampMaterial, court, false);
      addBox([0.12, 0.18, 0.13], [x, 2.8, z + zOffset], clampMaterial, court, false);
    }
  }
}

// Central electro-welded side mesh, leaving the real access bay beside the net.
for (const x of [-5.03, 5.03]) {
  for (const z of [-3.6, 3.6]) {
    addFencePanel({ width: 4.8, height: 3, position: [x, 1.5, z], rotationY: Math.PI / 2, columns: 6, rows: 6 });
  }
  addFencePanel({ width: 2.4, height: 0.55, position: [x, 2.725, 0], rotationY: Math.PI / 2, columns: 3, rows: 2 });
  for (const z of [-1.2, 1.2]) addBox([0.11, 3, 0.11], [x, 1.5, z], metal);
  for (const z of [-6, 6]) {
    addBox([0.14, 3.05, 0.14], [x, 1.525, z], lime);
    addBox([0.34, 0.055, 0.34], [x, 0.025, z], lime);
  }
}

// Net and posts.
addFencePanel({ width: 10, height: 0.88, position: [0, 0.48, 0], columns: 42, rows: 8, material: white });
addBox([0.16, 1.08, 0.16], [-5.08, 0.54, 0], lime);
addBox([0.16, 1.08, 0.16], [5.08, 0.54, 0], lime);

// The Classic always has four exterior posts. Only the LED matrix changes.
const lightingRig = new THREE.Group();
court.add(lightingRig);
let activeModelKey = 'Classic';
let activeLightingModules = 4;

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    child.traverse((node) => {
      node.geometry?.dispose?.();
      if (node.material && ![metal, darkMetal, lime].includes(node.material)) node.material.dispose?.();
    });
  }
}

function addLightTower(side, z, moduleCount) {
  const group = new THREE.Group();
  const xBase = side * 5.12;
  const yBase = 0.55;
  const xElbow = side * 6.35;
  const xLamp = side * 5.15;
  cylinderBetween([xBase, yBase, z], [xElbow, 4.75, z], 0.075, darkMetal, group);
  cylinderBetween([xElbow, 4.75, z], [xLamp, 6.18, z], 0.075, darkMetal, group);

  const fixture = new THREE.Group();
  fixture.position.set(xLamp, 6.08, z);
  fixture.rotation.z = side * -0.22;
  const columns = moduleCount / 2;
  const housingWidth = 0.36 + columns * 0.19;
  addBox([housingWidth, 0.2, 0.5], [0, 0, 0], darkMetal, fixture);

  const ledMaterial = new THREE.MeshStandardMaterial({
    color: 0xf3fbff,
    emissive: 0xdff4ff,
    emissiveIntensity: 2.4,
    roughness: 0.18,
    metalness: 0.12
  });
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = columns === 1 ? 0 : -((columns - 1) * 0.17) / 2 + column * 0.17;
      const zCell = row === 0 ? -0.13 : 0.13;
      addBox([0.12, 0.035, 0.16], [x, -0.115, zCell], ledMaterial, fixture, false);
    }
  }
  group.add(fixture);

  const glow = new THREE.PointLight(0xdff1ff, 0.035 + moduleCount * 0.01, 12, 2);
  glow.position.set(xLamp, 5.85, z);
  group.add(glow);
  lightingRig.add(group);
}

function setLightingModules(modules) {
  activeLightingModules = Number(modules);
  clearGroup(lightingRig);
  const normalizedModules = [4, 6, 8].includes(activeLightingModules) ? activeLightingModules : 4;
  for (const side of [-1, 1]) {
    for (const z of [-6, 6]) addLightTower(side, z, normalizedModules);
  }
}

setLightingModules(4);

// Lighting and a soft receiving plane give the structure depth from every angle.
scene.add(new THREE.HemisphereLight(0xdce7ff, 0x101317, 0.38));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.72);
keyLight.position.set(8, 18, 11);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1536, 1536);
keyLight.shadow.camera.left = -18;
keyLight.shadow.camera.right = 18;
keyLight.shadow.camera.top = 18;
keyLight.shadow.camera.bottom = -18;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xaec7ff, 0.16);
fillLight.position.set(-10, 10, -13);
scene.add(fillLight);

const shadowMaterial = new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.32 });
const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(48, 48), shadowMaterial);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.09;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

const turfColors = {
  Verde: 0x168447,
  Rosa: 0xef4f91,
  Rojo: 0xff1010,
  'Gris Grafito': 0x34383d,
  'Gris Claro': 0xaeb5bc,
  Azul: 0x163ec7
};

const structureColors = {
  Verde: 0x7dff37,
  Negro: 0x111315,
  Gris: 0x737980,
  'Azul Marino': 0x102a4c,
  Rojo: 0xff1010
};

function setTurfColor(name) {
  turfMaterial.color.setHex(turfColors[name] ?? turfColors.Azul).convertSRGBToLinear();
  turfMaterial.needsUpdate = true;
}

function setStructureColor(name) {
  // Only the original lime-painted metal changes. Glass and mesh materials stay untouched.
  lime.color.setHex(structureColors[name] ?? structureColors.Verde).convertSRGBToLinear();
  lime.needsUpdate = true;
}

function setVisible(visible) {
  court.visible = visible;
  shadowPlane.visible = visible;
}

function resetView() {
  camera.position.set(15.5, 17.5, 22.5);
  controls.target.set(0, 1.1, 0);
  controls.update();
}

function setModel(modelKey) {
  activeModelKey = modelKey;
  classicCornerStructure.visible = modelKey === 'Classic';
  eliteReinforcements.visible = modelKey === 'Elite';
  full360Structure.visible = modelKey === '360';
  endGlassFrames.visible = modelKey !== '360';
  setLightingModules(activeLightingModules);
  resetView();
}

function resize() {
  const rect = card.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width < 520 ? 48 : 38;
  camera.updateProjectionMatrix();
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(card);
resize();

let running = true;
document.addEventListener('visibilitychange', () => {
  running = !document.hidden;
});

function animate() {
  requestAnimationFrame(animate);
  if (!running) return;
  controls.update();
  renderer.render(scene, camera);
}

window.padelar3d = { setTurfColor, setStructureColor, setLightingModules, setVisible, setModel, resetView };
card.classList.add('webgl-ready');
setModel(document.querySelector('input[name="model"]:checked')?.value || 'Classic');
setTurfColor(document.getElementById('badge-color-text')?.textContent || 'Azul');
setStructureColor('Verde');
animate();
