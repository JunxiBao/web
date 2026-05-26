import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---- SCENE SETUP ----
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // Clean white background

// Single unified camera
const macroCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
macroCamera.position.set(-5, 18, 22);

// PIP static camera for macroscopic status monitor
const pipCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
pipCamera.position.set(-5, 15, 18);
pipCamera.lookAt(new THREE.Vector3(-5, 0, 0));

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setScissorTest(true);
renderer.localClippingEnabled = true;  // needed for per-material clipping planes
container.appendChild(renderer.domElement);

// PIP Renderer — dedicated small canvas for rounded-corner macroscopic view
const pipCanvasEl = document.getElementById('pip-canvas');
const pipRenderer = new THREE.WebGLRenderer({ canvas: pipCanvasEl, antialias: true, alpha: false });
pipRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
pipRenderer.shadowMap.enabled = true;
pipRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
pipRenderer.localClippingEnabled = true;

// Independent Controls
// Single OrbitControls over the entire canvas
const macroControls = new OrbitControls(macroCamera, renderer.domElement);
macroControls.enableDamping = true; macroControls.dampingFactor = 0.05;
macroControls.target.set(-5, 0, 0);

// ---- LIGHTING ----
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xa78bfa, 0.6); 
fillLight.position.set(-10, 0, -10);
scene.add(fillLight);

// ---- MATERIALS (MACRO) ----
// X-ray: main chassis is solid aluminium; a clipping plane cuts out the sensor-window region.
// The cutaway starts at chassis local x > CUT_X (right ~1 unit from edge).
const CUT_X = 4.4;  // bezel starts at x≈4.6
const WINDOW_Y_MIN = -0.9;
const WINDOW_Y_MAX = 0.5;

// For solid materials: hide pixels that are INSIDE the window (clipIntersection = true)
const solidClippingPlanes = [
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), CUT_X),           // x > CUT_X
    new THREE.Plane(new THREE.Vector3(0, 0, -1), WINDOW_Y_MIN),    // z > WINDOW_Y_MIN
    new THREE.Plane(new THREE.Vector3(0, 0, 1), -WINDOW_Y_MAX)     // z < WINDOW_Y_MAX
];

// For glass materials: hide pixels that are OUTSIDE the window (clipIntersection = false)
const glassClippingPlanes = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), -CUT_X),           // x < CUT_X
    new THREE.Plane(new THREE.Vector3(0, 0, 1), -WINDOW_Y_MIN),    // z < WINDOW_Y_MIN
    new THREE.Plane(new THREE.Vector3(0, 0, -1), WINDOW_Y_MAX)     // z > WINDOW_Y_MAX
];

const chassisMaterial = new THREE.MeshStandardMaterial({
    color: 0x86868b, roughness: 0.2, metalness: 0.9,
    transparent: false, opacity: 1.0,
    clippingPlanes: solidClippingPlanes,
    clipIntersection: true,
    clipShadows: true
});
// Glass material for the transparent sensor-window panel
const sensorWindowMat = new THREE.MeshStandardMaterial({
    color: 0x99eeff, roughness: 0.05, metalness: 0.1,
    transparent: true, opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
    clippingPlanes: glassClippingPlanes
});
// Bezel and screen also clipped so the sensor window is fully transparent (front+back)
const screenAwakeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff, side: THREE.DoubleSide,
    clippingPlanes: solidClippingPlanes, clipIntersection: true
});
const screenSleepMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000, roughness: 0.05, metalness: 0.95,
    clippingPlanes: solidClippingPlanes, clipIntersection: true
});
const bezelMaterial = new THREE.MeshStandardMaterial({
    color: 0x1d1d1f, roughness: 0.3,
    clippingPlanes: solidClippingPlanes, clipIntersection: true
});
// Cover: solid but clipped open at x_local > CUT_X near the magnet
const coverMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8, roughness: 0.8, metalness: 0.1,
    clippingPlanes: solidClippingPlanes, clipIntersection: true,
    clipShadows: true
});
const coverWindowMat = new THREE.MeshStandardMaterial({
    color: 0x99eeff, roughness: 0.05, metalness: 0.1,
    transparent: true, opacity: 0.10,
    side: THREE.DoubleSide,
    depthWrite: false,
    clippingPlanes: glassClippingPlanes
});
const magnetMaterial = new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.2, emissive: 0xff3b30, emissiveIntensity: 0.3 });
const sensorMaterial = new THREE.MeshStandardMaterial({ color: 0x34c759, roughness: 0.2 });

// Screen Texture
const canvas = document.createElement('canvas');
canvas.width = 1024; canvas.height = 1433; // High res iPad ratio
const ctx = canvas.getContext('2d');
const screenTexture = new THREE.CanvasTexture(canvas);
screenTexture.colorSpace = THREE.SRGBColorSpace;
screenAwakeMaterial.map = screenTexture;

let lastMinute = -1;
function updateScreenTexture() {
    if (!isScreenOn) return;
    
    const now = new Date();
    const currentMinute = now.getMinutes();
    
    // Only redraw if the minute changed to save performance
    if (currentMinute === lastMinute) return;
    lastMinute = currentMinute;
    
    // Draw abstract wallpaper (gradient)
    const grd = ctx.createLinearGradient(0, 0, 1024, 1433);
    grd.addColorStop(0, "#4f46e5"); // Deep blue/indigo
    grd.addColorStop(0.5, "#db2777"); // Pink/Magenta
    grd.addColorStop(1, "#f97316"); // Orange
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,1024,1433);
    
    // Draw waves
    ctx.beginPath();
    ctx.moveTo(0, 900);
    ctx.bezierCurveTo(300, 600, 700, 1100, 1024, 900);
    ctx.lineTo(1024, 1433);
    ctx.lineTo(0, 1433);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(0, 1100);
    ctx.bezierCurveTo(400, 1300, 800, 800, 1024, 1100);
    ctx.lineTo(1024, 1433);
    ctx.lineTo(0, 1433);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();

    // Draw Time
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const timeString = hours + ':' + minutes;

    ctx.fillStyle = '#ffffff'; 
    ctx.font = 'bold 220px -apple-system, BlinkMacSystemFont, sans-serif'; 
    ctx.textAlign = 'center';
    ctx.fillText(timeString, 512, 400);
    
    // Draw Date
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    ctx.font = '500 50px -apple-system, BlinkMacSystemFont, sans-serif'; 
    ctx.fillText(dateString, 512, 500);
    
    // Draw "Swipe up to open"
    ctx.font = '400 35px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Swipe up to open', 512, 1350);
    ctx.fillRect(412, 1380, 200, 8); // Home indicator

    screenTexture.needsUpdate = true;
}

// ---- MACRO MODELS (Realistic iPad) ----
const macroGroup = new THREE.Group();
scene.add(macroGroup);

const ipadWidth = 10, ipadHeight = 14, ipadDepth = 0.3, cornerRadius = 0.8;

function createRoundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const x = -w/2, y = -h/2;
    s.moveTo(x, y + r); s.lineTo(x, y + h - r);
    s.quadraticCurveTo(x, y + h, x + r, y + h); s.lineTo(x + w - r, y + h);
    s.quadraticCurveTo(x + w, y + h, x + w, y + h - r); s.lineTo(x + w, y + r);
    s.quadraticCurveTo(x + w, y, x + w - r, y); s.lineTo(x + r, y);
    s.quadraticCurveTo(x, y, x, y + r);
    return s;
}

const extrudeSettings = { depth: ipadDepth, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
const shape = createRoundedRectShape(ipadWidth, ipadHeight, cornerRadius);
const chassisGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
const chassis = new THREE.Mesh(chassisGeo, chassisMaterial);
// Extrude goes along +Z, let's rotate it to lay flat like our previous box
chassis.rotation.x = Math.PI / 2;
chassis.position.y = ipadDepth / 2;
chassis.castShadow = true; chassis.receiveShadow = true;
macroGroup.add(chassis);

// Sensor-window glass overlay for chassis (same geometry, transparent clip)
const chassisWindow = new THREE.Mesh(chassisGeo, sensorWindowMat);
chassisWindow.rotation.x = Math.PI / 2;
chassisWindow.position.y = ipadDepth / 2;
macroGroup.add(chassisWindow);

// Bezel & Screen (Simplified overlay for the extruded shape)
const bezelShape = createRoundedRectShape(ipadWidth - 0.2, ipadHeight - 0.2, cornerRadius - 0.1);
const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, { depth: 0.02, bevelEnabled: false });
const bezel = new THREE.Mesh(bezelGeo, bezelMaterial);
bezel.position.z = -0.01; // Slightly above chassis surface (because rotated, -Z is up in local space)
chassis.add(bezel);

const screenShape = createRoundedRectShape(ipadWidth - 0.8, ipadHeight - 0.8, cornerRadius - 0.2);
const screenGeo = new THREE.ShapeGeometry(screenShape);
screenGeo.computeBoundingBox();
const bb = screenGeo.boundingBox;
const uvs = screenGeo.attributes.uv;
for (let i = 0; i < uvs.count; i++) {
    const u = (uvs.getX(i) - bb.min.x) / (bb.max.x - bb.min.x);
    const v = (uvs.getY(i) - bb.min.y) / (bb.max.y - bb.min.y);
    uvs.setXY(i, u, v);
}
uvs.needsUpdate = true;
const screenMesh = new THREE.Mesh(screenGeo, screenAwakeMaterial);
screenMesh.position.z = -0.1; // Slightly in front of the bezel
screenMesh.rotation.y = Math.PI;
screenMesh.rotation.z = Math.PI;
chassis.add(screenMesh);

// iPad Buttons (Power & Volume)
// Use a slightly darker material so they stand out from the chassis
const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0x6e6e73, roughness: 0.3, metalness: 0.9 }); 

// Power Button (Top right edge, visually local -Y is the top because screen is flipped)
const powerButtonGeo = new THREE.BoxGeometry(1.0, 0.2, 0.15);
const powerButton = new THREE.Mesh(powerButtonGeo, buttonMaterial);
// Push it out to y = -ipadHeight/2 - 0.1 to clear the top bevel
powerButton.position.set(ipadWidth/2 - 1.5, -ipadHeight/2 - 0.1, ipadDepth/2);
chassis.add(powerButton);

// Volume Up Button (Right edge, near top)
const volButtonGeo = new THREE.BoxGeometry(0.2, 0.8, 0.15);
const volUpButton = new THREE.Mesh(volButtonGeo, buttonMaterial);
// Push it out to x = ipadWidth/2 + 0.1, and near the top (local -Y)
volUpButton.position.set(ipadWidth/2 + 0.1, -ipadHeight/2 + 1.5, ipadDepth/2);
chassis.add(volUpButton);

// Volume Down Button (Right edge, below Vol Up)
const volDownButton = new THREE.Mesh(volButtonGeo, buttonMaterial);
volDownButton.position.set(ipadWidth/2 + 0.1, -ipadHeight/2 + 2.5, ipadDepth/2);
chassis.add(volDownButton);

// Sensor indicator removed — the micro view inside the window shows the chip directly

const coverGroup = new THREE.Group();
coverGroup.position.set(-ipadWidth/2, 0.36, 0); 
macroGroup.add(coverGroup);

const coverShape = createRoundedRectShape(ipadWidth, ipadHeight, cornerRadius);
const coverGeo = new THREE.ExtrudeGeometry(coverShape, { depth: 0.1, bevelEnabled: false });
const cover = new THREE.Mesh(coverGeo, coverMaterial);
cover.rotation.x = Math.PI / 2;
cover.position.set(ipadWidth/2, 0, 0);
cover.castShadow = true;
coverGroup.add(cover);

// Cover sensor-window glass overlay
const coverWindow = new THREE.Mesh(coverGeo, coverWindowMat);
coverWindow.rotation.x = Math.PI / 2;
coverWindow.position.set(ipadWidth/2, 0, 0);
coverGroup.add(coverWindow);

// Cover Apple Logo
const coverLogoCanvas = document.createElement('canvas');
coverLogoCanvas.width = 256; coverLogoCanvas.height = 256;
const coverLogoCtx = coverLogoCanvas.getContext('2d');
coverLogoCtx.fillStyle = 'rgba(0,0,0,0.15)'; // Embossed dark look
coverLogoCtx.font = '160px -apple-system, BlinkMacSystemFont, sans-serif';
coverLogoCtx.textAlign = 'center';
coverLogoCtx.textBaseline = 'middle';
coverLogoCtx.fillText('', 128, 120); 

const coverLogoTex = new THREE.CanvasTexture(coverLogoCanvas);
coverLogoTex.colorSpace = THREE.SRGBColorSpace;
const coverLogoMat = new THREE.MeshBasicMaterial({ map: coverLogoTex, transparent: true, depthWrite: false });
const coverLogo = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), coverLogoMat);
coverLogo.rotation.x = Math.PI; // Face upwards (local -Z)
coverLogo.position.set(0, 0, -0.001);
cover.add(coverLogo);

// Magnet mesh (red cylinder) removed per user request
// But we keep the magnetic field lines at the magnet's physical location
const fieldLinesGroup = new THREE.Group();
fieldLinesGroup.position.set(ipadWidth/2 - 0.25, -0.05, 0); 
cover.add(fieldLinesGroup);

const lineMaterial = new THREE.LineDashedMaterial({ color: 0xff3b30, transparent: true, opacity: 0.8, dashSize: 0.15, gapSize: 0.1 });

for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {   // 4 angles instead of 8
    for (let radius = 0.3; radius <= 1.0; radius += 0.7) {           // 2 radii instead of 4
        // Dipole field shape: looping perpendicular to the cover (dipole axis along Z)
        const curve = new THREE.EllipseCurve(0, 0, radius, radius*1.5, Math.PI/2, -Math.PI/2, true, 0);
        const points = curve.getPoints(30);
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
            const x = points[i].x; const y = points[i].y;
            // Map the ellipse height 'y' to the Z-axis (perpendicular to the cover)
            positions[i*3] = x * Math.cos(angle);
            positions[i*3+1] = x * Math.sin(angle);
            positions[i*3+2] = y;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const line = new THREE.Line(geometry, lineMaterial);
        line.computeLineDistances();
        fieldLinesGroup.add(line);
        
        // Add a small arrowhead (cone) at the apex (t = 0.5) of the field line, pointing along the loop (into the screen)
        const point = curve.getPointAt(0.5);
        const tangent = curve.getTangentAt(0.5).normalize();
        
        const pos3D = new THREE.Vector3(point.x * Math.cos(angle), point.x * Math.sin(angle), point.y);
        const tan3D = new THREE.Vector3(tangent.x * Math.cos(angle), tangent.x * Math.sin(angle), tangent.y).normalize();
        tan3D.negate(); // Force arrowhead to point INTO the screen (towards -Z)
        
        const coneGeo = new THREE.ConeGeometry(0.04, 0.12, 6);
        const coneMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.9 });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.copy(pos3D);
        
        // Default cone points along +Y. Align with tangent.
        const up = new THREE.Vector3(0, 1, 0);
        cone.quaternion.setFromUnitVectors(up, tan3D);
        fieldLinesGroup.add(cone);
    }
}
// fieldLinesGroup is already added to cover directly
// Grid removed per user request

// ---- MICRO MODELS (Hall Effect Logic) — embedded inside iPad at sensor edge ----
// Sensor world position ≈ (4.75, 0.17, 0)  [chassis local (4.75, 0, -0.02), rotation.x=PI/2]
// microGroup is rotated by PI/2 around X so the slab lies flat in the iPad face (XZ plane):
//   local X → world X  (electrons flow along iPad width)
//   local Y → world -Z (charge accumulation along iPad height)
//   local Z → world  Y (iPad thickness direction)
// MICRO_SCALE=0.10 keeps sensor inside the bezel (world X: 4.5–5.0, width 0.5)
//   slab height (4 local Y) → world X: ±0.20 → center 4.72 → 4.52 to 4.92 ✓ in bezel
//   slab width  (8 local X) → world Z: ±0.40 → well inside window ±1.0 ✓
//   slab depth  (0.5 local Z) → world Y: ±0.025 → inside iPad thickness ✓
const microGroup = new THREE.Group();
const MICRO_SCALE = 0.10;
microGroup.scale.setScalar(MICRO_SCALE);
microGroup.rotation.x =  Math.PI / 2;
microGroup.rotation.z = -Math.PI / 2;
microGroup.position.set(4.72, 0.15, 0);  // centre of bezel (x: 4.5–5.0)
scene.add(microGroup);

// X-RAY FRAME removed per user request
const slabWidth = 8, slabHeight = 4, slabDepth = 0.5;
const slabGeo = new THREE.BoxGeometry(slabWidth, slabHeight, slabDepth);
const slabMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
const slab = new THREE.Mesh(slabGeo, slabMat);
microGroup.add(slab);
const slabEdges = new THREE.LineSegments(new THREE.EdgesGeometry(slabGeo), new THREE.LineBasicMaterial({ color: 0x0ea5e9, opacity: 0.5, transparent: true }));
microGroup.add(slabEdges);

const numElectrons = 150;
const electronGeo = new THREE.SphereGeometry(0.12, 8, 8);
const electronMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Use white to support instance colors
const electrons = new THREE.InstancedMesh(electronGeo, electronMat, numElectrons);
const dummy = new THREE.Object3D();
const electronData = []; // Store velocity for each

for(let i=0; i<numElectrons; i++) {
    const x = (Math.random() - 0.5) * slabWidth;
    const y = (Math.random() - 0.5) * slabHeight;
    const z = (Math.random() - 0.5) * slabDepth * 0.8;
    
    dummy.position.set(x, y, z);
    dummy.updateMatrix();
    electrons.setMatrixAt(i, dummy.matrix);
    
    // Assign a constant baseline speed to each electron to prevent per-frame jitter
    const speedX = 3.5 + Math.random() * 2.0; 
    const restY = -slabHeight/2 + 0.1 + Math.random() * 0.2; // Unique resting height at bottom
    
    // 80% are normal (blue), 20% are deflected (amber/orange)
    const isDeflected = i < (numElectrons * 0.2); // 30 deflected, 120 normal
    const color = isDeflected ? new THREE.Color(0xffb000) : new THREE.Color(0x38bdf8);
    electrons.setColorAt(i, color);
    
    electronData.push({ x, y, z, speedX, restY, isDeflected });
}
if (electrons.instanceColor) {
    electrons.instanceColor.needsUpdate = true;
}
microGroup.add(electrons);

// ---- POSITIVE CHARGE SIGNS (top face, 7 symbols for fine-grained steps) ----
const MAX_CHARGES = 7;
const positiveGroup = new THREE.Group();
positiveGroup.position.y = slabHeight / 2 + 0.5;
for(let i=0; i<MAX_CHARGES; i++) {
    const pMat = new THREE.MeshBasicMaterial({ color: 0x34c759 });
    const pMesh1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), pMat);
    const pMesh2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), pMat);
    const pObj = new THREE.Group(); pObj.add(pMesh1); pObj.add(pMesh2);
    pObj.position.x = -slabWidth * 0.42 + i * (slabWidth * 0.84 / (MAX_CHARGES - 1));
    pObj.visible = false;
    positiveGroup.add(pObj);
}
microGroup.add(positiveGroup);

// ---- NEGATIVE CHARGE SIGNS (bottom face, 7 symbols) ----
const negativeGroup = new THREE.Group();
negativeGroup.position.y = -slabHeight / 2 - 0.5;
for(let i=0; i<MAX_CHARGES; i++) {
    const nMat = new THREE.MeshBasicMaterial({ color: 0x4fc3f7 });
    const nMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), nMat);
    const nObj = new THREE.Group(); nObj.add(nMesh);
    nObj.position.x = -slabWidth * 0.42 + i * (slabWidth * 0.84 / (MAX_CHARGES - 1));
    nObj.visible = false;
    negativeGroup.add(nObj);
}
microGroup.add(negativeGroup);

// ---- MAGNETIC FIELD X MARKERS (behind slab, 4 cols x 2 rows = 8 total) ----
// Store them in a flat array sorted by distance from centre so we can add/remove gradually
const arrowGroup = new THREE.Group();
const crossMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: false });
const crossGeo1 = new THREE.BoxGeometry(0.8, 0.1, 0.1);
const crossGeo2 = new THREE.BoxGeometry(0.1, 0.8, 0.1);
const crossPositions = [];
for(let x=-slabWidth/2 + 1; x<=slabWidth/2; x+=2) {
    for(let y=-slabHeight/2 + 1; y<=slabHeight/2; y+=2) {
        crossPositions.push({ x, y, dist: Math.sqrt(x*x + y*y) });
    }
}
// Sort: centre-out so crosses appear from the middle as field grows
crossPositions.sort((a, b) => a.dist - b.dist);

for(const pos of crossPositions) {
    const c1 = new THREE.Mesh(crossGeo1, crossMat);
    c1.rotation.z = Math.PI / 4;
    const c2 = new THREE.Mesh(crossGeo2, crossMat);
    c2.rotation.z = Math.PI / 4;
    const cross = new THREE.Group();
    cross.add(c1); cross.add(c2);
    cross.position.set(pos.x, pos.y, -slabDepth/2 - 0.5);
    cross.visible = false;
    arrowGroup.add(cross);
}
microGroup.add(arrowGroup);

// ---- VOLTAGE SENSOR (Hall Voltage Probes) ----
// Two gold electrodes, one on top face and one on bottom face of the slab,
// connected by wires to a floating voltmeter label.
const probeMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.9 });
const probeGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.25, 16);

// Top probe (at +Y face of slab)
const probeTop = new THREE.Mesh(probeGeo, probeMat);
probeTop.position.set(0, slabHeight / 2 + 0.12, 0);
microGroup.add(probeTop);

// Bottom probe (at -Y face of slab)
const probeBottom = new THREE.Mesh(probeGeo, probeMat);
probeBottom.position.set(0, -slabHeight / 2 - 0.12, 0);
microGroup.add(probeBottom);

// Wire from top probe to voltmeter
const wireTopPoints = [
    new THREE.Vector3(0, slabHeight / 2 + 0.12, 0),
    new THREE.Vector3(0, slabHeight / 2 + 1.0, 0),
    new THREE.Vector3(slabWidth / 2 + 2.4, slabHeight / 2 + 1.0, 0),
    new THREE.Vector3(slabWidth / 2 + 2.4, 1.0, 0)
];
const wireTopGeo = new THREE.BufferGeometry().setFromPoints(wireTopPoints);
const wireTopLine = new THREE.Line(wireTopGeo, new THREE.LineBasicMaterial({ color: 0xffd700, linewidth: 2 }));
microGroup.add(wireTopLine);

// Wire from bottom probe to voltmeter
const wireBotPoints = [
    new THREE.Vector3(0, -slabHeight / 2 - 0.12, 0),
    new THREE.Vector3(0, -slabHeight / 2 - 1.0, 0),
    new THREE.Vector3(slabWidth / 2 + 2.4, -slabHeight / 2 - 1.0, 0),
    new THREE.Vector3(slabWidth / 2 + 2.4, -1.0, 0)
];
const wireBotGeo = new THREE.BufferGeometry().setFromPoints(wireBotPoints);
const wireBotLine = new THREE.Line(wireBotGeo, new THREE.LineBasicMaterial({ color: 0xffd700, linewidth: 2 }));
microGroup.add(wireBotLine);

// Voltmeter box (a small rounded box on the right side)
const vmeterGeo = new THREE.BoxGeometry(1.8, 2.0, 0.3);
const vmeterMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.5, metalness: 0.1 });
const vmeter = new THREE.Mesh(vmeterGeo, vmeterMat);
vmeter.position.set(slabWidth / 2 + 2.4, 0, 0);
microGroup.add(vmeter);

// Voltmeter face / screen (facing local -Z = World +Y, the screen side)
const vmeterScreenGeo = new THREE.PlaneGeometry(1.4, 0.9);
const vmeterScreenCanvas = document.createElement('canvas');
vmeterScreenCanvas.width = 256; vmeterScreenCanvas.height = 128;
const vmeterCtx = vmeterScreenCanvas.getContext('2d');
const vmeterTex = new THREE.CanvasTexture(vmeterScreenCanvas);
const vmeterScreenMat = new THREE.MeshBasicMaterial({ map: vmeterTex });
const vmeterScreen = new THREE.Mesh(vmeterScreenGeo, vmeterScreenMat);
vmeterScreen.position.set(slabWidth / 2 + 2.1, 0, -0.16); // 6.4 - 0.3 = 6.1
vmeterScreen.rotation.set(Math.PI, 0, -Math.PI / 2); // Up is local -X
microGroup.add(vmeterScreen);

// Voltmeter label plane (shows 'V' symbol)
const vmeterLabelCanvas = document.createElement('canvas');
vmeterLabelCanvas.width = 256; vmeterLabelCanvas.height = 64;
const vmLabelCtx = vmeterLabelCanvas.getContext('2d');
vmLabelCtx.fillStyle = 'transparent';
vmLabelCtx.clearRect(0, 0, 256, 64);
vmLabelCtx.fillStyle = '#ffd700';
vmLabelCtx.font = 'bold 36px monospace';
vmLabelCtx.textAlign = 'center';
vmLabelCtx.textBaseline = 'middle';
vmLabelCtx.fillText('⚡ VOLTMETER', 128, 32);
const vmLabelTex = new THREE.CanvasTexture(vmeterLabelCanvas);
const vmLabelMat = new THREE.MeshBasicMaterial({ map: vmLabelTex, transparent: true });
const vmLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), vmLabelMat);
vmLabel.position.set(slabWidth / 2 + 2.95, 0, -0.16); // 6.4 + 0.55 = 6.95
vmLabel.rotation.set(Math.PI, 0, -Math.PI / 2);
microGroup.add(vmLabel);

// Probe label: "+" on top, "-" on bottom
function makeProbeLabel(text, color) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const cx = c.getContext('2d');
    cx.fillStyle = color;
    cx.font = 'bold 48px monospace';
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.fillText(text, 32, 32);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    return new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), mat);
}
const probeLabelTop = makeProbeLabel('+', '#ff3b30');
probeLabelTop.position.set(0, slabHeight / 2 + 0.8, -0.1);
probeLabelTop.rotation.set(Math.PI, 0, -Math.PI / 2);
microGroup.add(probeLabelTop);

const probeLabelBot = makeProbeLabel('−', '#0ea5e9');
probeLabelBot.position.set(0, -slabHeight / 2 - 0.8, -0.1);
probeLabelBot.rotation.set(Math.PI, 0, -Math.PI / 2);
microGroup.add(probeLabelBot);

function updateVmeterDisplay(voltage) {
    vmeterCtx.clearRect(0, 0, 256, 128);
    // Background
    vmeterCtx.fillStyle = '#0a0a1a';
    vmeterCtx.fillRect(0, 0, 256, 128);
    // Green border glow
    vmeterCtx.strokeStyle = '#39ff14';
    vmeterCtx.lineWidth = 4;
    vmeterCtx.strokeRect(4, 4, 248, 120);
    // Voltage value
    const displayV = Math.max(0, voltage).toFixed(2);
    vmeterCtx.fillStyle = '#39ff14';
    vmeterCtx.font = 'bold 44px monospace';
    vmeterCtx.textAlign = 'center';
    vmeterCtx.textBaseline = 'middle';
    vmeterCtx.fillText(displayV + ' V', 128, 60);
    // Unit label
    vmeterCtx.font = '18px monospace';
    vmeterCtx.fillStyle = 'rgba(57,255,20,0.6)';
    vmeterCtx.fillText('Hall Voltage', 128, 108);
    vmeterTex.needsUpdate = true;
}

// ---- STATE & LOGIC ----
let isScreenOn = true;
let lorentzForceStrength = 0; 
let targetVoltage = 3.3;
let lastVoltageUpdateTime = 0;

const coverSlider = document.getElementById('cover-slider');
const magStatusEl = document.getElementById('magnetic-field-status');
const voltageEl = document.getElementById('sensor-voltage');
const screenStateEl = document.getElementById('screen-state');
const explanationEl = document.getElementById('explanation-text');
const pipContainer = document.getElementById('pip-container');
const pipScreenBadge = document.getElementById('pip-screen-badge');

function updateUI(angleDeg) {
    const angleRad = THREE.MathUtils.degToRad(angleDeg);
    coverGroup.rotation.z = angleRad;
    
    const closeness = 1 - (angleDeg / 180); 
    lorentzForceStrength = closeness;
    
    const scale = 0.5 + closeness * 1.5;
    fieldLinesGroup.scale.set(scale, scale, scale);
    lineMaterial.opacity = 0.1 + closeness * 0.9;
    
    // --- Dynamic X marker count: show N crosses based on closeness (0 → all hidden, 1 → all shown) ---
    const totalCrosses = arrowGroup.children.length;
    const crossesToShow = Math.round(closeness * totalCrosses);
    arrowGroup.children.forEach((cross, idx) => {
        cross.visible = idx < crossesToShow;
    });

    // --- Dynamic charge sign count: show N signs based on closeness threshold ---
    // Charges only appear once the field is strong enough to deflect electrons noticeably
    const chargesToShow = closeness > 0.15
        ? Math.round(((closeness - 0.15) / 0.85) * MAX_CHARGES)
        : 0;
    positiveGroup.children.forEach((pObj, idx) => {
        pObj.visible = idx < chargesToShow;
    });
    negativeGroup.children.forEach((nObj, idx) => {
        nObj.visible = idx < chargesToShow;
    });
    
    const thresholdAngle = 10;
    
    // Hall Voltage INCREASES as magnetic field gets stronger (cover closes, closeness -> 1)
    // When the magnet is close, the Lorentz force deflects electrons, building up a Hall Voltage.
    // When cover is open, no field = no charge separation = near 0V Hall Voltage.
    targetVoltage = 3.3 * Math.pow(closeness, 2);
    if (targetVoltage > 3.3) targetVoltage = 3.3;
    
    if (angleDeg < thresholdAngle) {
        if (isScreenOn) { screenMesh.material = screenSleepMaterial; isScreenOn = false; }
        magStatusEl.textContent = 'Strong'; magStatusEl.className = 'data-value success';
        screenStateEl.textContent = 'Sleep'; screenStateEl.className = 'data-value warning';
        explanationEl.innerHTML = '<strong>Cover Closed:</strong> The magnet is adjacent to the sensor. The Lorentz force deflects electrons, separating charges and building a peak Hall Voltage (~3.3V). The processor detects this high voltage and sleeps the screen.';
        // sensorRing removed
    } else {
        if (!isScreenOn) { screenMesh.material = screenAwakeMaterial; isScreenOn = true; }
        if (angleDeg < 45) { magStatusEl.textContent = 'Approaching'; magStatusEl.className = 'data-value warning'; } 
        else { magStatusEl.textContent = 'Weak'; magStatusEl.className = 'data-value warning'; }
        screenStateEl.textContent = 'Awake'; screenStateEl.className = 'data-value success';
        explanationEl.innerHTML = '<strong>Cover Open:</strong> The magnetic field is absent. Electrons flow straight through the sensor with no deflection — the Hall Voltage drops to near 0V, signaling the processor to keep the screen awake.';
        // sensorRing removed
    }

    // Dynamic PIP screen status update
    if (pipScreenBadge) {
        if (!isScreenOn) {
            pipScreenBadge.textContent = 'Sleep';
            pipScreenBadge.className = 'pip-status-badge warning';
        } else {
            pipScreenBadge.textContent = 'Awake';
            pipScreenBadge.className = 'pip-status-badge success';
        }
    }
}

updateUI(180);
coverSlider.addEventListener('input', (e) => updateUI(parseFloat(e.target.value)));

// Disable OrbitControls while the slider is being dragged
coverSlider.addEventListener('pointerdown', () => { macroControls.enabled = false; });
const reenableControls = () => { macroControls.enabled = true; };
coverSlider.addEventListener('pointerup', reenableControls);
coverSlider.addEventListener('pointercancel', reenableControls);

function onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    macroCamera.aspect = w / h;
    macroCamera.updateProjectionMatrix();
    macroControls.update();
}

window.addEventListener('resize', onWindowResize);
onWindowResize(); // Initialize sizes

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
    // Macro animation: Flowing magnetic field lines
    fieldLinesGroup.children.forEach(line => {
        if(line.material.dashOffset !== undefined) {
            line.material.dashOffset += delta * 1.5;
        }
    });

    // Real-time Voltage UI Update (flutter effect like a digital multimeter)
    if (time - lastVoltageUpdateTime > 0.15) {
        lastVoltageUpdateTime = time;
        let noise = targetVoltage > 0.1 ? (Math.random() * 0.04 - 0.02) : (Math.random() * 0.01);
        let displayVoltage = Math.max(0, targetVoltage + noise);
        voltageEl.textContent = displayVoltage.toFixed(2) + 'V';
        // Update the in-scene voltmeter display too
        updateVmeterDisplay(displayVoltage);
    }

    // Micro animation
    for(let i=0; i<numElectrons; i++) {
        const data = electronData[i];
        
        // Smooth continuous velocity without per-frame randomization
        let vx = data.speedX; 
        let vy = data.isDeflected ? (-lorentzForceStrength * 6.0) : 0;
        
        data.x -= vx * delta;
        data.y += vy * delta;

        if(data.x < -slabWidth/2) {
            data.x = slabWidth/2;
            data.y = (Math.random() - 0.5) * slabHeight;
        }
        
        // Smooth bottom collision for deflected, normal ones stay within boundaries
        if (data.isDeflected) {
            if(data.y < data.restY) {
                data.y = data.restY; 
            } else if(data.y > slabHeight/2) {
                data.y = slabHeight/2;
            }
        } else {
            if(data.y < -slabHeight/2) data.y = -slabHeight/2;
            if(data.y > slabHeight/2) data.y = slabHeight/2;
        }
        
        dummy.position.set(data.x, data.y, data.z);
        dummy.updateMatrix();
        electrons.setMatrixAt(i, dummy.matrix);
    }
    electrons.instanceMatrix.needsUpdate = true;

    macroControls.update();
    
    updateScreenTexture();
    
    // Render main viewport
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setViewport(0, 0, width, height);
    renderer.setScissor(0, 0, width, height);
    renderer.render(scene, macroCamera);

    // PIP macroscopic overview (only when focused on sensor)
    if (focusedOnSensor) {
        if (pipContainer) {
            pipContainer.classList.add('active');
            const pipBody = pipContainer.querySelector('.pip-body');
            if (pipBody) {
                const rect = pipBody.getBoundingClientRect();
                const pipW = Math.floor(rect.width);
                const pipH = Math.floor(rect.height);
                if (pipW > 0 && pipH > 0) {
                    pipRenderer.setSize(pipW, pipH, false);
                    pipCamera.aspect = pipW / pipH;
                    pipCamera.updateProjectionMatrix();
                    pipRenderer.render(scene, pipCamera);
                }
            }
        }
    } else {
        if (pipContainer) {
            pipContainer.classList.remove('active');
        }
    }
    
    // Camera fly-to animation
    if (cameraFly.active) {
        const t = Math.min((Date.now() - cameraFly.startTime) / cameraFly.duration, 1);
        const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // easeInOut
        macroCamera.position.lerpVectors(cameraFly.fromPos, cameraFly.toPos, ease);
        macroControls.target.lerpVectors(cameraFly.fromTarget, cameraFly.toTarget, ease);
        macroControls.update();
        if (t >= 1) cameraFly.active = false;
    }
    // SVG overlay removed — micro view is now embedded inside the iPad
}

// ---- CAMERA FLY-TO SYSTEM ----
const OVERVIEW  = { pos: new THREE.Vector3(-5, 18, 22),   target: new THREE.Vector3(-5, 0, 0) };
const SENSOR_VIEW = { pos: new THREE.Vector3(4.72, 3.2, 1.1), target: new THREE.Vector3(4.72, 0.15, 0.3) };
let focusedOnSensor = false;

const cameraFly = { active: false, startTime: 0, duration: 1200,
    fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(), toTarget: new THREE.Vector3() };

function flyTo(dest) {
    cameraFly.fromPos.copy(macroCamera.position);
    cameraFly.fromTarget.copy(macroControls.target);
    cameraFly.toPos.copy(dest.pos);
    cameraFly.toTarget.copy(dest.target);
    cameraFly.startTime = Date.now();
    cameraFly.active = true;
}

const focusBtn = document.getElementById('focus-sensor-btn');
if (focusBtn) {
    focusBtn.addEventListener('click', () => {
        focusedOnSensor = !focusedOnSensor;
        flyTo(focusedOnSensor ? SENSOR_VIEW : OVERVIEW);
        focusBtn.textContent = focusedOnSensor ? '🔭 Overview' : '🔬 Focus on Sensor';
    });
}

const panelToggle = document.getElementById('panel-toggle');
const mainPanel = document.getElementById('main-panel');
if (panelToggle && mainPanel) {
    panelToggle.addEventListener('click', () => {
        mainPanel.classList.toggle('collapsed');
    });
}

// ---- PHYSICS KNOWLEDGE MODAL SYSTEM ----
const infoTriggerBtn = document.getElementById('info-trigger-btn');
const scienceModal = document.getElementById('science-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalStartBtn = document.getElementById('modal-start-btn');
const segmentBtns = document.querySelectorAll('.segment-btn');
const tabContents = document.querySelectorAll('.tab-content');

if (infoTriggerBtn && scienceModal) {
    // Open modal
    infoTriggerBtn.addEventListener('click', () => {
        scienceModal.classList.add('active');
        macroControls.enabled = false; // Disable controls while reading modal
    });

    // Close modal function
    const closeModal = () => {
        scienceModal.classList.remove('active');
        macroControls.enabled = true;
    };

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalStartBtn) modalStartBtn.addEventListener('click', closeModal);

    // Close on overlay click
    scienceModal.addEventListener('click', (e) => {
        if (e.target === scienceModal) {
            closeModal();
        }
    });

    // Tab switching logic
    segmentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            segmentBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
}

animate();
