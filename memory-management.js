const translateBtn = document.getElementById('translate-btn');
const resetBtn = document.getElementById('reset-btn');

const logicalInput = document.getElementById('logical-input');
const relocationInput = document.getElementById('relocation-input');

const displayLogical = document.getElementById('display-logical');
const displayReloc = document.getElementById('display-reloc');
const displayMar = document.getElementById('display-mar');

const lineCpuMmu = document.getElementById('line-cpu-mmu');
const lineRelocMmu = document.getElementById('line-reloc-mmu');
const lineMmuMar = document.getElementById('line-mmu-mar');
const lineMarRam = document.getElementById('line-mar-ram');

const nodeCpu = document.getElementById('node-cpu');
const nodeMmu = document.getElementById('node-mmu');
const nodeAdder = document.getElementById('node-adder');
const nodeMar = document.getElementById('node-mar');
const nodeReloc = document.getElementById('node-reloc');
const nodeRam = document.getElementById('node-ram');

const mathPopup = document.getElementById('math-popup');
const mathText = document.getElementById('math-text');
const animStatus = document.getElementById('anim-status');
const ramBlocksContainer = document.getElementById('ram-blocks');

const TOTAL_RAM_SIZE = 30000;
const BLOCK_SIZE = 2000;
const NUM_BLOCKS = TOTAL_RAM_SIZE / BLOCK_SIZE;

// Initialize RAM
function initRAM() {
    ramBlocksContainer.innerHTML = '';
    for (let i = 0; i < NUM_BLOCKS; i++) {
        const block = document.createElement('div');
        block.className = 'ram-block flex-grow border-b border-[#333333] flex items-center justify-center text-xs text-gray-400 mono';
        let startAddr = i * BLOCK_SIZE;
        let endAddr = startAddr + BLOCK_SIZE - 1;
        block.innerText = `${startAddr} - ${endAddr}`;
        block.dataset.start = startAddr;
        block.dataset.end = endAddr;
        ramBlocksContainer.appendChild(block);
    }
}
initRAM();

function setStatus(msg) {
    animStatus.innerText = msg;
    animStatus.classList.remove('opacity-0');
}

function resetAll() {
    displayLogical.innerText = '---';
    displayReloc.innerText = '---';
    displayMar.innerText = '---';
    
    [lineCpuMmu, lineRelocMmu, lineMmuMar, lineMarRam].forEach(l => l.classList.remove('active'));
    [nodeCpu, nodeMmu, nodeAdder, nodeMar, nodeReloc, nodeRam].forEach(n => n.classList.remove('node-highlight'));
    
    document.querySelectorAll('.ram-block').forEach(b => {
        b.classList.remove('active');
        const start = parseInt(b.dataset.start);
        b.innerText = `${start} - ${start + BLOCK_SIZE - 1}`;
    });
    
    mathPopup.classList.add('opacity-0');
    animStatus.classList.add('opacity-0');
    translateBtn.disabled = false;
}

resetBtn.addEventListener('click', resetAll);

translateBtn.addEventListener('click', () => {
    translateBtn.disabled = true;
    resetAll();
    
    const logical = parseInt(logicalInput.value) || 0;
    const reloc = parseInt(relocationInput.value) || 0;
    const physical = logical + reloc;

    displayLogical.innerText = logical;
    displayReloc.innerText = reloc;
    
    // Step 1: CPU requests Logical Address
    setTimeout(() => {
        setStatus("CPU issues Logical Address...");
        nodeCpu.classList.add('node-highlight');
        lineCpuMmu.classList.add('active');
    }, 500);

    // Step 2: Enters MMU, fetches Relocation Register
    setTimeout(() => {
        setStatus("MMU fetches Relocation Register...");
        nodeCpu.classList.remove('node-highlight');
        lineCpuMmu.classList.remove('active');
        
        nodeMmu.classList.add('node-highlight');
        nodeReloc.classList.add('node-highlight');
        lineRelocMmu.classList.add('active');
    }, 2500);

    // Step 3: Adder calculates
    setTimeout(() => {
        setStatus("Hardware Adder calculates Physical Address...");
        lineRelocMmu.classList.remove('active');
        nodeReloc.classList.remove('node-highlight');
        
        nodeAdder.classList.add('node-highlight');
        
        mathText.innerText = `${logical} (Logical) + ${reloc} (Reloc) = ${physical}`;
        mathPopup.classList.remove('opacity-0');
    }, 4500);

    // Step 4: MAR loaded
    setTimeout(() => {
        setStatus("Physical Address loaded into MAR...");
        nodeAdder.classList.remove('node-highlight');
        mathPopup.classList.add('opacity-0');
        
        lineMmuMar.classList.add('active');
        nodeMar.classList.add('node-highlight');
        displayMar.innerText = physical;
    }, 7000);

    // Step 5: RAM Lookup
    setTimeout(() => {
        setStatus(`Fetching data from Physical Address ${physical}...`);
        lineMmuMar.classList.remove('active');
        nodeMar.classList.remove('node-highlight');
        nodeMmu.classList.remove('node-highlight');
        
        lineMarRam.classList.add('active');
        nodeRam.classList.add('node-highlight');
        
        // Find which RAM block this belongs to
        let targetBlock = null;
        if (physical >= 0 && physical < TOTAL_RAM_SIZE) {
            let blockIndex = Math.floor(physical / BLOCK_SIZE);
            targetBlock = ramBlocksContainer.children[blockIndex];
        }

        if (targetBlock) {
            targetBlock.classList.add('active');
            targetBlock.innerText = `ADDR: ${physical} [HIT]`;
        } else {
            setStatus(`SEGMENTATION FAULT: Address ${physical} out of bounds!`);
            animStatus.classList.remove('bg-amber-500', 'border-[#eab308]');
            animStatus.classList.add('bg-red-200', 'border-red-500', 'text-red-800');
        }
    }, 9500);

    // End
    setTimeout(() => {
        lineMarRam.classList.remove('active');
        if(physical >= 0 && physical < TOTAL_RAM_SIZE) {
            setStatus("Memory Fetch Complete.");
        }
        translateBtn.disabled = false;
    }, 12000);
});
