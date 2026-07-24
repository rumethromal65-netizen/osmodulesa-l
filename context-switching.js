const btnSwitch = document.getElementById('btn-switch');
const sysLog = document.getElementById('sys-log');

const pcbA = document.getElementById('pcb-a');
const pcbB = document.getElementById('pcb-b');
const cpuCore = document.getElementById('cpu-core');

const cpuExecTitle = document.getElementById('cpu-exec-title');
const cpuPc = document.getElementById('cpu-pc');
const cpuReg = document.getElementById('cpu-reg');

const packetSave = document.getElementById('packet-save');
const packetLoad = document.getElementById('packet-load');

let activeProcess = 'A'; // 'A' or 'B'
let isSwitching = false;

const processData = {
    A: { color: '#facc15', pc: '0x004A', reg: 'R1=5, R2=10' },
    B: { color: '#facc15', pc: '0x10B2', reg: 'R1=0, R2=99' }
};

function logMsg(msg, cls = 'log-line') {
    const div = document.createElement('div');
    div.className = cls;
    div.innerHTML = `> ${msg}`;
    sysLog.appendChild(div);
    sysLog.scrollTop = sysLog.scrollHeight;
}

function getPos(el) {
    const rect = el.getBoundingClientRect();
    const parentRect = document.querySelector('.grid').getBoundingClientRect();
    return {
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top + rect.height / 2
    };
}

btnSwitch.addEventListener('click', () => {
    if(isSwitching) return;
    isSwitching = true;
    btnSwitch.disabled = true;
    btnSwitch.classList.add('opacity-50');

    const nextProcess = activeProcess === 'A' ? 'B' : 'A';
    const activeColor = processData[activeProcess].color;
    const nextColor = processData[nextProcess].color;

    const sourcePCB = activeProcess === 'A' ? pcbA : pcbB;
    const targetPCB = nextProcess === 'A' ? pcbA : pcbB;

    logMsg(`[INTERRUPT] CPU halts execution of Process ${activeProcess}.`, 'log-yellow');

    // Step 1: Save State
    setTimeout(() => {
        logMsg(`Saving Context to PCB_${activeProcess}...`, 'log-yellow');
        cpuCore.classList.remove('highlight-glow');
        sourcePCB.classList.add('highlight-glow');

        // Setup save packet
        const cpuPos = getPos(cpuCore);
        const sourcePos = getPos(sourcePCB);

        packetSave.style.backgroundColor = activeColor;
        packetSave.style.left = `${cpuPos.x - 40}px`;
        packetSave.style.top = `${cpuPos.y - 20}px`;
        packetSave.style.opacity = '1';

        // Update CPU UI to idle
        cpuExecTitle.innerText = "IDLE";
        cpuExecTitle.style.color = 'var(--text-lo)';
        cpuPc.innerText = "---";
        cpuReg.innerText = "---";

        setTimeout(() => {
            // Move packet to PCB
            packetSave.style.left = `${sourcePos.x - 40}px`;
            packetSave.style.top = `${sourcePos.y - 20}px`;

            setTimeout(() => {
                packetSave.style.opacity = '0';
                sourcePCB.classList.remove('highlight-glow');
                
                // Update PCB UI
                document.getElementById(`pcb-${activeProcess.toLowerCase()}-state`).children[1].innerText = "Ready";
                
                // Step 2: Load State
                setTimeout(() => {
                    logMsg(`Loading Context from PCB_${nextProcess}...`, nextColor);
                    targetPCB.classList.add('highlight-glow');
                    
                    const targetPos = getPos(targetPCB);
                    
                    packetLoad.style.backgroundColor = nextColor;
                    packetLoad.style.left = `${targetPos.x - 40}px`;
                    packetLoad.style.top = `${targetPos.y - 20}px`;
                    packetLoad.style.opacity = '1';

                    // Update PCB UI
                    document.getElementById(`pcb-${nextProcess.toLowerCase()}-state`).children[1].innerText = "Running";

                    setTimeout(() => {
                        // Move packet to CPU
                        packetLoad.style.left = `${cpuPos.x - 40}px`;
                        packetLoad.style.top = `${cpuPos.y - 20}px`;

                        setTimeout(() => {
                            packetLoad.style.opacity = '0';
                            targetPCB.classList.remove('highlight-glow');
                            
                            // Step 3: Resume
                            logMsg(`[RESUME] CPU executing Process ${nextProcess}.`, '#10b981');
                            
                            cpuCore.style.borderColor = nextColor;
                            cpuExecTitle.innerText = `Process ${nextProcess}`;
                            cpuExecTitle.style.color = nextColor;
                            cpuPc.innerText = processData[nextProcess].pc + '...';
                            cpuReg.innerText = processData[nextProcess].reg;

                            activeProcess = nextProcess;
                            isSwitching = false;
                            btnSwitch.disabled = false;
                            btnSwitch.classList.remove('opacity-50');

                        }, 800);
                    }, 100);
                }, 800);

            }, 800);
        }, 100);
    }, 1000);
});
