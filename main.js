// --- THREE.JS INITIALIZATION ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070a13, 0.02);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Tab Scenes
const pcbGroup = new THREE.Group();
const statesGroup = new THREE.Group();
const bootGroup = new THREE.Group();

let activeGroup = pcbGroup;
scene.add(activeGroup);

// Utility: Create glowing materials
function createNeonMaterial(color, opacity = 0.8) {
    return new THREE.MeshPhysicalMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: opacity,
        roughness: 0.2,
        metalness: 0.8,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    });
}

// --- 1. BUILD PCB SCENE ---
const pcbLayers = [];
let pcbExploded = false;
const layerColors = [0x3b82f6, 0x10b981, 0x8b5cf6, 0xf59e0b];
const layerNames = ["Process ID & State", "Program Counter", "CPU Registers (PSD)", "Memory Limits"];

function buildPCB() {
    const geometry = new THREE.BoxGeometry(10, 1, 15);
    
    for (let i = 0; i < 4; i++) {
        const material = createNeonMaterial(layerColors[i], 0.8);
        const mesh = new THREE.Mesh(geometry, material);
        
        // Base Y position
        const yPos = i * 1.5;
        mesh.position.y = yPos;
        
        // Save target positions for animation
        mesh.userData = {
            collapsedY: yPos,
            explodedY: i * 4,
            label: layerNames[i]
        };
        
        pcbLayers.push(mesh);
        pcbGroup.add(mesh);
    }
}
buildPCB();

document.getElementById('explode-btn').addEventListener('click', () => {
    pcbExploded = !pcbExploded;
});

// --- 2. BUILD STATE DIAGRAM SCENE ---
const stateNodes = {};
const stateConfig = {
    new: { pos: [-10, 0, -5], color: 0xa855f7, name: "NEW" },
    ready: { pos: [0, 0, 5], color: 0x3b82f6, name: "READY" },
    running: { pos: [0, 5, -5], color: 0x22c55e, name: "RUNNING" },
    waiting: { pos: [0, -5, -5], color: 0xf97316, name: "WAITING" },
    terminated: { pos: [10, 0, -5], color: 0xef4444, name: "TERMINATED" }
};

function buildStateDiagram() {
    const geo = new THREE.SphereGeometry(1.5, 32, 32);
    
    // Create Nodes
    for (const [key, data] of Object.entries(stateConfig)) {
        const mat = createNeonMaterial(data.color, 0.6);
        const sphere = new THREE.Mesh(geo, mat);
        sphere.position.set(...data.pos);
        sphere.userData = { name: data.name, baseColor: data.color };
        stateNodes[key] = sphere;
        statesGroup.add(sphere);
    }
    
    // Create Edges (Lines)
    const materialLine = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    const edges = [
        ['new', 'ready'], ['ready', 'running'], ['running', 'ready'], 
        ['running', 'waiting'], ['waiting', 'ready'], ['running', 'terminated']
    ];
    
    const stateParticles = [];
    window.stateParticles = stateParticles;
    
    edges.forEach(edge => {
        const p1 = stateNodes[edge[0]].position;
        const p2 = stateNodes[edge[1]].position;
        
        // Offset running->ready slightly so lines don't overlap completely
        let points = [];
        if (edge[0] === 'running' && edge[1] === 'ready') {
            points = [p1, new THREE.Vector3(2, 2.5, 0), p2];
        } else {
            points = [p1, p2];
        }
        
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeo, materialLine);
        statesGroup.add(line);
        
        // Particle for this edge
        const particleGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const particleMat = createNeonMaterial(stateNodes[edge[1]].userData.baseColor, 1.0);
        const particle = new THREE.Mesh(particleGeo, particleMat);
        
        const curve = new THREE.CatmullRomCurve3(points);
        
        particle.userData = {
            curve: curve,
            progress: Math.random(),
            speed: 0.003 + Math.random() * 0.005
        };
        statesGroup.add(particle);
        stateParticles.push(particle);
    });
}
buildStateDiagram();

// Simulation State Logic
const simSequence = ['new', 'ready', 'running', 'waiting', 'ready', 'running', 'terminated'];
let simIndex = -1;
let simInterval = null;

document.getElementById('animate-states-btn').addEventListener('click', () => {
    if (simInterval) clearInterval(simInterval);
    simIndex = 0;
    
    // Reset all
    Object.values(stateNodes).forEach(node => {
        node.material.emissiveIntensity = 0.5;
        node.scale.set(1, 1, 1);
    });
    
    simInterval = setInterval(() => {
        if (simIndex >= simSequence.length) {
            clearInterval(simInterval);
            return;
        }
        
        // Reset previous
        if (simIndex > 0) {
            const prev = stateNodes[simSequence[simIndex - 1]];
            prev.material.emissiveIntensity = 0.5;
            prev.scale.set(1, 1, 1);
        }
        
        // Highlight current
        const current = stateNodes[simSequence[simIndex]];
        current.material.emissiveIntensity = 2.0;
        current.scale.set(1.3, 1.3, 1.3);
        
        simIndex++;
    }, 1500);
});

// --- 3. BUILD BOOTING SCENE ---
const bootComponents = [];
const bootStagesInfo = [
    "Power Supply initialized. CPU Reset.",
    "BIOS/UEFI running POST (Power-On Self-Test).",
    "Bootloader (MBR/GPT) loaded into RAM.",
    "OS Kernel expanding into memory.",
    "Init process started. OS Ready."
];

function buildBootProcess() {
    // Motherboard Base
    const boardGeo = new THREE.BoxGeometry(20, 0.5, 20);
    const boardMat = new THREE.MeshPhongMaterial({ color: 0x1e293b });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = -2;
    bootGroup.add(board);
    
    // 0: PSU
    const psuGeo = new THREE.BoxGeometry(4, 3, 4);
    const psu = new THREE.Mesh(psuGeo, createNeonMaterial(0x333333, 0.3));
    psu.position.set(-7, 0, -7);
    bootGroup.add(psu);
    bootComponents.push(psu);
    
    // 1: BIOS Chip
    const biosGeo = new THREE.BoxGeometry(2, 0.5, 2);
    const bios = new THREE.Mesh(biosGeo, createNeonMaterial(0x333333, 0.3));
    bios.position.set(-6, -1, 5);
    bootGroup.add(bios);
    bootComponents.push(bios);
    
    // 2: Disk (Bootloader)
    const diskGeo = new THREE.CylinderGeometry(2, 2, 0.5, 32);
    const disk = new THREE.Mesh(diskGeo, createNeonMaterial(0x333333, 0.3));
    disk.position.set(6, -1, -6);
    bootGroup.add(disk);
    bootComponents.push(disk);
    
    // 3: RAM (Kernel)
    const ramGeo = new THREE.BoxGeometry(1, 2, 8);
    const ram = new THREE.Mesh(ramGeo, createNeonMaterial(0x333333, 0.3));
    ram.position.set(4, -0.5, 2);
    bootGroup.add(ram);
    bootComponents.push(ram);
    
    // 4: CPU (Init/OS)
    const cpuGeo = new THREE.BoxGeometry(4, 0.5, 4);
    const cpu = new THREE.Mesh(cpuGeo, createNeonMaterial(0x333333, 0.3));
    cpu.position.set(-2, -1, 0);
    bootGroup.add(cpu);
    bootComponents.push(cpu);
}
buildBootProcess();

const bootParticles = [];
window.bootParticles = bootParticles;

// Add boot data flow paths
const bootPaths = [
    [bootComponents[0], bootComponents[1]], // PSU to BIOS
    [bootComponents[1], bootComponents[2]], // BIOS to Disk
    [bootComponents[2], bootComponents[3]], // Disk to RAM
    [bootComponents[3], bootComponents[4]]  // RAM to CPU
];

const bootLineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.2 });

bootPaths.forEach((path, idx) => {
    // Offset Y a bit
    const p1 = path[0].position.clone().add(new THREE.Vector3(0, 1, 0));
    const p2 = path[1].position.clone().add(new THREE.Vector3(0, 1, 0));
    const points = [p1, p2];
    
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeo, bootLineMat);
    bootGroup.add(line);
    
    // Add particle
    const particleGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const particleMat = createNeonMaterial(0x3b82f6, 1.0);
    const particle = new THREE.Mesh(particleGeo, particleMat);
    
    const curve = new THREE.CatmullRomCurve3(points);
    particle.userData = {
        curve: curve,
        progress: 0,
        speed: 0.015,
        activeStage: idx + 1 // Starts moving when this stage is active
    };
    particle.visible = false;
    bootGroup.add(particle);
    bootParticles.push(particle);
});

let currentBootStage = -1;
const bootColors = [0xef4444, 0xf97316, 0xeab308, 0x3b82f6, 0x22c55e];

document.getElementById('next-boot-btn').addEventListener('click', () => {
    currentBootStage++;
    if (currentBootStage >= bootComponents.length) {
        currentBootStage = -1; // Reset
        bootComponents.forEach(comp => {
            comp.material.color.setHex(0x333333);
            comp.material.emissive.setHex(0x333333);
            comp.position.y -= 0.5; // push down if it was up
        });
        document.getElementById('boot-desc-text').innerText = "System reset. Ready to power on.";
        return;
    }
    
    const comp = bootComponents[currentBootStage];
    const color = bootColors[currentBootStage];
    
    // Highlight
    comp.material.color.setHex(color);
    comp.material.emissive.setHex(color);
    comp.material.emissiveIntensity = 1.0;
    comp.position.y += 0.5; // pop up
    
    document.getElementById('boot-desc-text').innerText = bootStagesInfo[currentBootStage];
});


// --- DOM LABELS LOGIC ---
const labelsContainer = document.getElementById('labels-container');
const labels = []; // { mesh, element, text, tabId }

function createLabel(mesh, text, tabId) {
    const el = document.createElement('div');
    el.className = 'scene-label';
    el.innerText = text;
    labelsContainer.appendChild(el);
    labels.push({ mesh, element: el, text, tabId });
}

// Add labels for PCB
pcbLayers.forEach(layer => createLabel(layer, layer.userData.label, 'pcb'));
// Add labels for States
Object.values(stateNodes).forEach(node => createLabel(node, node.userData.name, 'states'));
// Add labels for Boot
bootComponents.forEach((comp, idx) => {
    const names = ["PSU", "BIOS", "Disk", "RAM", "CPU"];
    createLabel(comp, names[idx], 'boot');
});

function updateLabels() {
    const activeTab = document.querySelector('.nav-btn.active').dataset.tab;
    
    labels.forEach(labelObj => {
        // Only show labels for active tab
        if (labelObj.tabId !== activeTab) {
            labelObj.element.classList.remove('visible');
            return;
        }
        
        // Project 3D position to 2D screen coordinates
        const vector = new THREE.Vector3();
        labelObj.mesh.getWorldPosition(vector);
        
        // If object is behind camera, hide it
        vector.project(camera);
        if (vector.z > 1) {
            labelObj.element.classList.remove('visible');
            return;
        }
        
        const x = (vector.x * .5 + .5) * window.innerWidth;
        const y = (vector.y * -.5 + .5) * window.innerHeight;
        
        labelObj.element.style.left = `${x}px`;
        labelObj.element.style.top = `${y}px`;
        labelObj.element.classList.add('visible');
    });
}


// --- UI TAB SWITCHING ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Update Buttons
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // Update Info Panels
        const tabId = e.currentTarget.dataset.tab;
        document.querySelectorAll('.info-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`info-${tabId}`).classList.add('active');
        
        // Switch 3D Scene
        scene.remove(activeGroup);
        if (tabId === 'pcb') { activeGroup = pcbGroup; camera.position.set(0, 10, 30); }
        if (tabId === 'states') { activeGroup = statesGroup; camera.position.set(0, 5, 25); }
        if (tabId === 'boot') { activeGroup = bootGroup; camera.position.set(0, 15, 25); }
        scene.add(activeGroup);
        controls.target.set(0,0,0);
    });
});


// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();
    
    // PCB Animation
    if (activeGroup === pcbGroup) {
        // Floating effect
        pcbGroup.position.y = Math.sin(time) * 1;
        
        // Explode transition
        pcbLayers.forEach(layer => {
            const targetY = pcbExploded ? layer.userData.explodedY : layer.userData.collapsedY;
            // Lerp towards target
            layer.position.y += (targetY - layer.position.y) * 0.05;
        });
    }
    
    // States Animation
    if (activeGroup === statesGroup) {
        statesGroup.rotation.y = Math.sin(time * 0.2) * 0.2; // slight sway
        
        // Animate particles
        if (window.stateParticles) {
            window.stateParticles.forEach(p => {
                p.userData.progress += p.userData.speed;
                if (p.userData.progress > 1) p.userData.progress = 0;
                const pos = p.userData.curve.getPointAt(p.userData.progress);
                p.position.copy(pos);
            });
        }
    }

    // Boot Animation
    if (activeGroup === bootGroup) {
        if (window.bootParticles) {
            window.bootParticles.forEach((p, idx) => {
                // Determine color based on active stage
                if (currentBootStage >= p.userData.activeStage) {
                    p.visible = true;
                    p.material.color.setHex(bootColors[p.userData.activeStage]);
                    p.material.emissive.setHex(bootColors[p.userData.activeStage]);
                    p.userData.progress += p.userData.speed;
                    if (p.userData.progress > 1) p.userData.progress = 0; // loop
                    const pos = p.userData.curve.getPointAt(p.userData.progress);
                    p.position.copy(pos);
                } else {
                    p.visible = false;
                }
            });
        }
    }
    
    updateLabels();
    controls.update();
    renderer.render(scene, camera);
}

// Window resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start loop
animate();
