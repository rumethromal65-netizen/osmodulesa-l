const translateBtn = document.getElementById('translate-btn');
const resetBtn = document.getElementById('reset-btn');

const logicalInput = document.getElementById('logical-input');
const limitInput = document.getElementById('limit-input');
const relocationInput = document.getElementById('relocation-input');

const displayLogical = document.getElementById('display-logical');
const displayLimit = document.getElementById('display-limit');
const displayReloc = document.getElementById('display-reloc');
const displayMar = document.getElementById('display-mar');

const lineCpuMmu = document.getElementById('line-cpu-mmu');
const lineRelocMmu = document.getElementById('line-reloc-mmu');
const lineMmuMar = document.getElementById('line-mmu-mar');
const lineMarRam = document.getElementById('line-mar-ram');

const nodeCpu = document.getElementById('node-cpu');
const nodeMmu = document.getElementById('node-mmu');
const nodeLimit = document.getElementById('node-limit');
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
    displayLimit.innerText = '---';
    displayReloc.innerText = '---';
    displayMar.innerText = '---';
    
    [lineCpuMmu, lineRelocMmu, lineMmuMar, lineMarRam].forEach(l => l.classList.remove('active'));
    [nodeCpu, nodeMmu, nodeLimit, nodeAdder, nodeMar, nodeReloc, nodeRam].forEach(n => n.classList.remove('node-highlight'));
    
    nodeLimit.classList.remove('bg-red-500', 'text-white');
    nodeLimit.classList.add('bg-[var(--bg-level2)]');
    displayLimit.classList.remove('text-white', 'text-green-400');
    displayLimit.classList.add('text-red-300');
    
    animStatus.className = 'absolute bottom-6 left-6 text-black font-bold bg-[var(--yellow)] px-4 py-2 rounded-lg opacity-0 transition-opacity';

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
    const limit = parseInt(limitInput.value) || 0;
    const reloc = parseInt(relocationInput.value) || 0;
    const physical = logical + reloc;

    displayLogical.innerText = logical;
    displayLimit.innerText = limit;
    displayReloc.innerText = reloc;
    
    let hasFault = false;

    // Step 1: CPU requests Logical Address
    setTimeout(() => {
        setStatus("CPU issues Logical Address...");
        nodeCpu.classList.add('node-highlight');
        lineCpuMmu.classList.add('active');
    }, 500);

    // Step 2: Enters MMU, fetches Relocation Register
    setTimeout(() => {
        setStatus("MMU fetches Limit and Relocation Registers...");
        nodeCpu.classList.remove('node-highlight');
        lineCpuMmu.classList.remove('active');
        
        nodeMmu.classList.add('node-highlight');
        nodeReloc.classList.add('node-highlight');
        nodeLimit.classList.add('node-highlight');
        lineRelocMmu.classList.add('active');
    }, 2500);

    // Step 3: Limit Check
    setTimeout(() => {
        setStatus("MMU performs Limit Check...");
        lineRelocMmu.classList.remove('active');
        
        if (logical >= limit) {
            hasFault = true;
            setStatus(`SEGMENTATION FAULT: Logical Address (${logical}) is >= Limit (${limit})!`);
            animStatus.className = 'absolute bottom-6 left-6 text-white font-bold bg-red-600 px-4 py-2 rounded-lg transition-opacity border-2 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.6)]';
            
            nodeLimit.classList.remove('bg-[var(--bg-level2)]');
            nodeLimit.classList.add('bg-red-500', 'text-white');
            displayLimit.innerText = "VIOLATION!";
            displayLimit.classList.remove('text-red-300');
            displayLimit.classList.add('text-white');
            
            translateBtn.disabled = false;
        } else {
            displayLimit.innerText = `${logical} < ${limit} ✓`;
            displayLimit.classList.remove('text-red-300');
            displayLimit.classList.add('text-green-400');
        }
    }, 5000);

    // Step 4: Adder calculates
    setTimeout(() => {
        if (hasFault) return;
        setStatus("Hardware Adder calculates Physical Address...");
        nodeReloc.classList.remove('node-highlight');
        nodeLimit.classList.remove('node-highlight');
        
        nodeAdder.classList.add('node-highlight');
        
        mathText.innerText = `${logical} (Logical) + ${reloc} (Reloc) = ${physical}`;
        mathPopup.classList.remove('opacity-0');
    }, 7500);

    // Step 5: MAR loaded
    setTimeout(() => {
        if (hasFault) return;
        setStatus("Physical Address loaded into MAR...");
        nodeAdder.classList.remove('node-highlight');
        mathPopup.classList.add('opacity-0');
        
        lineMmuMar.classList.add('active');
        nodeMar.classList.add('node-highlight');
        displayMar.innerText = physical;
    }, 10000);

    // Step 6: RAM Lookup
    setTimeout(() => {
        if (hasFault) return;
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
            setStatus(`SEGMENTATION FAULT: Address ${physical} out of physical RAM bounds!`);
            animStatus.className = 'absolute bottom-6 left-6 text-white font-bold bg-red-600 px-4 py-2 rounded-lg transition-opacity border-2 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.6)]';
        }
    }, 12500);

    // End
    setTimeout(() => {
        if (hasFault) return;
        lineMarRam.classList.remove('active');
        if(physical >= 0 && physical < TOTAL_RAM_SIZE) {
            setStatus("Memory Fetch Complete.");
        }
        translateBtn.disabled = false;
    }, 15000);
});
