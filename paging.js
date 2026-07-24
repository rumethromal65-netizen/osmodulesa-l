const pageTableData = {
    0: 5,
    1: 13,
    2: 2,
    3: 7,
    4: 10
};
const TOTAL_FRAMES = 16;

const pageTableEl = document.getElementById('page-table');
const ramEl = document.getElementById('physical-ram');

const pageInput = document.getElementById('page-input');
const offsetInput = document.getElementById('offset-input');
const valP = document.getElementById('val-p');
const valD = document.getElementById('val-d');

const btnLookup = document.getElementById('lookup-btn');
const btnReset = document.getElementById('reset-btn');
const animStatus = document.getElementById('anim-status');

const blockP = document.getElementById('block-p');
const blockD = document.getElementById('block-d');

const animPageVal = document.getElementById('anim-page-val');
const animFrameVal = document.getElementById('anim-frame-val');
const physicalAddrBlock = document.getElementById('physical-address-block');
const animF = document.getElementById('anim-f');
const animD = document.getElementById('anim-d');

// Initialize Layouts
function init() {
    // Populate Page Table
    for (let i = 0; i <= 4; i++) {
        let row = document.createElement('div');
        row.className = 'flex border-b border-[#333333] text-white mono text-sm page-row';
        row.id = `pt-row-${i}`;
        row.innerHTML = `
            <div class="w-1/2 py-2 text-center border-r border-[#333333] font-bold">${i}</div>
            <div class="w-1/2 py-2 text-center">${pageTableData[i]}</div>
        `;
        pageTableEl.appendChild(row);
    }
    
    // Populate RAM Frames
    for (let i = 0; i < TOTAL_FRAMES; i++) {
        let frame = document.createElement('div');
        frame.className = 'flex-grow border-b border-[#333333] flex items-center justify-center text-xs mono text-gray-400 ram-frame';
        frame.id = `ram-frame-${i}`;
        frame.innerText = `Frame ${i}`;
        ramEl.appendChild(frame);
    }
}
init();

// Input listeners
pageInput.addEventListener('input', (e) => {
    valP.innerText = e.target.value;
});
offsetInput.addEventListener('input', (e) => {
    valD.innerText = e.target.value;
});

function setStatus(msg) {
    animStatus.innerText = msg;
    animStatus.classList.remove('opacity-0');
}

function getPos(el) {
    const rect = el.getBoundingClientRect();
    const parentRect = document.querySelector('.grid').getBoundingClientRect();
    return {
        x: rect.left - parentRect.left,
        y: rect.top - parentRect.top,
        w: rect.width,
        h: rect.height
    };
}

btnReset.addEventListener('click', () => {
    btnLookup.disabled = false;
    animStatus.classList.add('opacity-0');
    
    document.querySelectorAll('.page-row').forEach(r => r.classList.remove('highlight-source', 'highlight-target', 'bg-yellow-400', 'text-white'));
    document.querySelectorAll('.ram-frame').forEach(f => f.classList.remove('highlight-target'));
    
    blockP.classList.remove('highlight-source');
    blockD.classList.remove('opacity-50');
    
    animPageVal.style.opacity = '0';
    animFrameVal.style.opacity = '0';
    physicalAddrBlock.style.opacity = '0';
});

btnLookup.addEventListener('click', () => {
    const p = parseInt(pageInput.value);
    const d = parseInt(offsetInput.value);
    
    if (isNaN(p) || p < 0 || p > 4) {
        alert("Invalid Page Number. Choose 0-4.");
        return;
    }
    
    btnLookup.disabled = true;
    btnReset.click();
    btnLookup.disabled = true; // prevent double click after reset
    
    setStatus("Extracting Page Number...");
    blockP.classList.add('highlight-source');
    
    setTimeout(() => {
        // Create flying Page Number
        const startPos = getPos(blockP);
        animPageVal.innerText = `Page ${p}`;
        animPageVal.style.left = `${startPos.x + 20}px`;
        animPageVal.style.top = `${startPos.y}px`;
        animPageVal.style.opacity = '1';
        
        setStatus("Querying Page Table...");
        
        setTimeout(() => {
            const row = document.getElementById(`pt-row-${p}`);
            const targetPos = getPos(row);
            
            animPageVal.style.left = `${targetPos.x - 20}px`;
            animPageVal.style.top = `${targetPos.y - 10}px`;
            
            setTimeout(() => {
                animPageVal.style.opacity = '0';
                row.classList.add('highlight-source', 'bg-yellow-400', 'text-white');
                
                const frameNum = pageTableData[p];
                setStatus(`Found Mapping: Page ${p} -> Frame ${frameNum}`);
                
                setTimeout(() => {
                    // Create flying Frame Number
                    animFrameVal.innerText = `Frame ${frameNum}`;
                    animFrameVal.style.left = `${targetPos.x + targetPos.w / 2}px`;
                    animFrameVal.style.top = `${targetPos.y}px`;
                    animFrameVal.style.opacity = '1';
                    
                    setStatus("Constructing Physical Address...");
                    
                    setTimeout(() => {
                        // Move to construct area
                        const logicPos = getPos(document.getElementById('logical-address-block'));
                        
                        physicalAddrBlock.style.left = `${logicPos.x + 50}px`;
                        physicalAddrBlock.style.top = `${logicPos.y + 150}px`;
                        physicalAddrBlock.style.opacity = '1';
                        
                        animF.innerText = frameNum;
                        animD.innerText = d;
                        
                        animFrameVal.style.left = `${logicPos.x + 50}px`;
                        animFrameVal.style.top = `${logicPos.y + 150}px`;
                        
                        blockD.classList.add('opacity-50');
                        
                        setTimeout(() => {
                            animFrameVal.style.opacity = '0';
                            setStatus("Accessing Physical RAM...");
                            
                            setTimeout(() => {
                                const targetFrame = document.getElementById(`ram-frame-${frameNum}`);
                                targetFrame.classList.add('highlight-target');
                                targetFrame.innerText = `Frame ${frameNum} [DATA]`;
                                
                                physicalAddrBlock.classList.add('highlight-target');
                                
                                setStatus(`Successfully accessed Physical Address (Frame ${frameNum}, Offset ${d}).`);
                                btnLookup.disabled = false;
                                
                            }, 1000);
                        }, 800);
                    }, 1000);
                }, 1000);
            }, 800);
        }, 800);
    }, 800);
});
