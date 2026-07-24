const MAX_RAM = 5;
let ramQueue = [];
let diskQueue = [];
let nextPid = 100;

const processNames = ["Chrome.exe", "Node.js", "Python Script", "VS Code", "Spotify", "System Idle", "Docker Daemon", "Postgres DB"];

// DOM
const btnAdd = document.getElementById('add-process-btn');
const btnCrowd = document.getElementById('simulate-crowd-btn');
const ramSlotsContainer = document.getElementById('ram-slots');
const diskSlotsContainer = document.getElementById('disk-slots');
const ramCount = document.getElementById('ram-count');
const diskCount = document.getElementById('disk-count');
const animStatus = document.getElementById('anim-status');
const transferArrow = document.getElementById('transfer-arrow');
const arrowIcon = document.getElementById('arrow-icon');
const template = document.getElementById('process-template');

// Initialize empty slots in RAM
function initRAM() {
    ramSlotsContainer.innerHTML = '';
    for (let i = 0; i < MAX_RAM; i++) {
        let slot = document.createElement('div');
        slot.className = 'slot';
        slot.id = `ram-slot-${i}`;
        ramSlotsContainer.appendChild(slot);
    }
}
initRAM();

function setStatus(msg) {
    animStatus.innerText = msg;
}

function updateCounts() {
    ramCount.innerText = ramQueue.length;
    diskCount.innerText = diskQueue.length;
}

function createProcessDOM(process) {
    const clone = template.content.cloneNode(true);
    const block = clone.querySelector('.process-block');
    block.id = `proc-${process.id}`;
    
    block.querySelector('.pid').innerText = `P${process.id}`;
    block.querySelector('.pname').innerText = process.name;
    block.querySelector('.pstate').innerText = process.state;
    
    // Setup color based on state
    if (process.state === 'Active (RAM)') {
        block.style.borderColor = '#eab308';
    } else {
        block.style.borderColor = '#facc15';
        const btn = block.querySelector('.swap-in-btn');
        btn.classList.remove('hidden');
        btn.onclick = (e) => {
            e.stopPropagation();
            swapIn(process.id);
        };
    }
    
    return block;
}

// Add Process
btnAdd.addEventListener('click', () => {
    if (ramQueue.length >= MAX_RAM) {
        setStatus("RAM Full! Swap a process out first, or click 'Simulate Crowd'.");
        return;
    }
    
    btnAdd.disabled = true;
    const process = {
        id: nextPid++,
        name: processNames[Math.floor(Math.random() * processNames.length)],
        state: 'Active (RAM)'
    };
    
    ramQueue.push(process);
    
    const slotIdx = ramQueue.length - 1;
    const slot = document.getElementById(`ram-slot-${slotIdx}`);
    
    const dom = createProcessDOM(process);
    
    // Animation entrance
    dom.style.opacity = '0';
    dom.style.transform = 'translateY(-20px)';
    slot.appendChild(dom);
    
    setTimeout(() => {
        dom.style.opacity = '1';
        dom.style.transform = 'translateY(0)';
        updateCounts();
        setStatus(`Loaded P${process.id} into RAM.`);
        btnAdd.disabled = false;
    }, 50);
});

// Simulate Crowd (Swap Out)
btnCrowd.addEventListener('click', () => {
    if (ramQueue.length === 0) {
        setStatus("RAM is empty. Nothing to swap out.");
        return;
    }
    
    btnCrowd.disabled = true;
    btnAdd.disabled = true;
    
    // Swap out the first process (oldest)
    const process = ramQueue.shift();
    process.state = 'Suspended (Disk)';
    diskQueue.push(process);
    
    const dom = document.getElementById(`proc-${process.id}`);
    
    // Show arrow pointing Right
    arrowIcon.setAttribute('d', 'M14 5l7 7m0 0l-7 7m7-7H3');
    transferArrow.classList.remove('opacity-0');
    setStatus(`Swapping Out P${process.id} to Disk...`);
    
    // Animate DOM movement visually
    dom.style.transform = 'translateX(50px) scale(0.9)';
    dom.style.opacity = '0';
    
    setTimeout(() => {
        dom.remove();
        
        // Re-render RAM to shift items up
        reRenderRAM();
        
        // Add to Disk
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.id = `disk-slot-${process.id}`;
        
        const newDom = createProcessDOM(process);
        newDom.style.opacity = '0';
        newDom.style.transform = 'translateX(-50px) scale(0.9)';
        
        slot.appendChild(newDom);
        diskSlotsContainer.appendChild(slot);
        
        setTimeout(() => {
            newDom.style.opacity = '1';
            newDom.style.transform = 'translateX(0) scale(1)';
            transferArrow.classList.add('opacity-0');
            updateCounts();
            setStatus(`P${process.id} successfully swapped to Disk.`);
            btnCrowd.disabled = false;
            btnAdd.disabled = false;
        }, 300);
        
    }, 500);
});

function reRenderRAM() {
    initRAM();
    ramQueue.forEach((process, idx) => {
        const slot = document.getElementById(`ram-slot-${idx}`);
        const dom = createProcessDOM(process);
        slot.appendChild(dom);
    });
}

// Swap In
function swapIn(pid) {
    if (ramQueue.length >= MAX_RAM) {
        setStatus("Cannot Swap In. RAM is full! Swap something out first.");
        return;
    }
    
    // Find in disk
    const idx = diskQueue.findIndex(p => p.id === pid);
    if(idx === -1) return;
    
    const process = diskQueue.splice(idx, 1)[0];
    process.state = 'Active (RAM)';
    ramQueue.push(process);
    
    const dom = document.getElementById(`proc-${process.id}`);
    const diskSlot = document.getElementById(`disk-slot-${process.id}`);
    
    // Show arrow pointing Left
    arrowIcon.setAttribute('d', 'M10 19l-7-7m0 0l7-7m-7 7h18');
    transferArrow.classList.remove('opacity-0');
    setStatus(`Swapping In P${process.id} to RAM...`);
    
    // Animate
    dom.style.transform = 'translateX(-50px) scale(0.9)';
    dom.style.opacity = '0';
    
    setTimeout(() => {
        diskSlot.remove();
        
        const ramSlotIdx = ramQueue.length - 1;
        const slot = document.getElementById(`ram-slot-${ramSlotIdx}`);
        
        const newDom = createProcessDOM(process);
        newDom.style.opacity = '0';
        newDom.style.transform = 'translateX(50px) scale(0.9)';
        
        slot.appendChild(newDom);
        
        setTimeout(() => {
            newDom.style.opacity = '1';
            newDom.style.transform = 'translateX(0) scale(1)';
            transferArrow.classList.add('opacity-0');
            updateCounts();
            setStatus(`P${process.id} successfully activated in RAM.`);
        }, 300);
        
    }, 500);
}
