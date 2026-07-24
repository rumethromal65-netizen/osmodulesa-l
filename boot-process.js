const btnPower = document.getElementById('btn-power');
const sysLog = document.getElementById('sys-log');

const blockPsu = document.getElementById('block-psu');
const blockBios = document.getElementById('block-bios');
const blockDisk = document.getElementById('block-disk');
const blockRam = document.getElementById('block-ram');

const statusPsu = document.getElementById('status-psu');
const statusBios = document.getElementById('status-bios');
const statusDisk = document.getElementById('status-disk');

const linePsuBios = document.getElementById('line-psu-bios');
const lineBiosDisk = document.getElementById('line-bios-disk');
const lineDiskRam = document.getElementById('line-disk-ram');

const animKernel = document.getElementById('anim-kernel');
const diskKernel = document.getElementById('disk-kernel');
const ramEmpty = document.getElementById('ram-empty');
const ramContainer = document.getElementById('ram-container');

let bootInProgress = false;
let isBooted = false;

function logMsg(msg, cls = 'log-line') {
    const div = document.createElement('div');
    const time = new Date().toISOString().substring(11, 23);
    div.className = cls;
    div.innerHTML = `<span style="opacity:0.45">[${time}]</span> ${msg}`;
    sysLog.appendChild(div);
    sysLog.scrollTop = sysLog.scrollHeight;
}

function getPos(el) {
    const rect = el.getBoundingClientRect();
    const parentRect = document.querySelector('.grid').getBoundingClientRect();
    return {
        x: rect.left - parentRect.left,
        y: rect.top - parentRect.top,
        w: rect.width,
        h: rect.height,
        cx: rect.left - parentRect.left + rect.width / 2,
        cy: rect.top - parentRect.top + rect.height / 2
    };
}

function resetAll() {
    isBooted = false;
    sysLog.innerHTML = '<div class="log-line">> System is powered off.</div>';
    
    [blockPsu, blockBios, blockDisk, blockRam].forEach(b => b.classList.remove('hw-active'));
    [statusPsu, statusBios, statusDisk].forEach(s => s.classList.add('opacity-0'));
    [linePsuBios, lineBiosDisk, lineDiskRam].forEach(l => l.classList.remove('active'));
    
    animKernel.style.opacity = '0';
    ramContainer.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-xs" id="ram-empty" style="color:var(--text-lo)">Empty</div>';
    
    btnPower.innerText = 'Power On System';
    btnPower.style.background = 'var(--grad-btn)';
}

btnPower.addEventListener('click', () => {
    if(bootInProgress) return;
    
    if(isBooted) {
        resetAll();
        return;
    }
    
    bootInProgress = true;
    btnPower.disabled = true;
    btnPower.classList.add('opacity-50');
    
    sysLog.innerHTML = '';
    logMsg("System power button pressed.", 'log-yellow');

    // Phase 1: PSU
    setTimeout(() => {
        blockPsu.classList.add('hw-active');
        statusPsu.classList.remove('opacity-0');
        logMsg("Power Supply Unit (PSU) initializing. Validating 5V/12V rails (Power Good signal)...", 'log-yellow');
        
        // Connect to BIOS
        setTimeout(() => {
            linePsuBios.classList.add('active');
            logMsg("Power Good signal sent to CPU. CPU resets and jumps to BIOS address.", 'log-yellow');
            
            // Phase 2: BIOS & POST
            setTimeout(() => {
                blockPsu.classList.remove('hw-active');
                blockBios.classList.add('hw-active');
                statusBios.classList.remove('opacity-0');
                logMsg("Basic Input/Output System (BIOS) executing from ROM.", 'log-yellow');
                logMsg("Running POST (Power-On Self Test). Checking Memory, Keyboard, Display...", 'log-yellow');
                
                // Connect to Disk
                setTimeout(() => {
                    lineBiosDisk.classList.add('active');
                    logMsg("POST successful. BIOS searching for bootable device...", 'log-white');
                    
                    // Phase 3: Disk (Bootloader)
                    setTimeout(() => {
                        blockBios.classList.remove('hw-active');
                        blockDisk.classList.add('hw-active');
                        statusDisk.classList.remove('opacity-0');
                        logMsg("Bootable Hard Disk found.", 'log-white');
                        logMsg("Reading Master Boot Record (MBR) from Sector 0. Bootloader executed.", 'log-white');
                        logMsg("Bootloader locating OS Kernel image on disk...", 'log-white');
                        
                        // Connect to RAM and copy Kernel
                        setTimeout(() => {
                            lineDiskRam.classList.add('active');
                            logMsg("OS Kernel located. Initiating copy to Main Memory (RAM)...", 'log-yellow');
                            
                            // Setup animating token
                            const startPos = getPos(diskKernel);
                            const endPos = getPos(document.getElementById('ram-container'));
                            
                            animKernel.style.left = `${startPos.cx - 50}px`;
                            animKernel.style.top = `${startPos.y}px`;
                            animKernel.style.opacity = '1';
                            
                            // Move token
                            setTimeout(() => {
                                animKernel.style.left = `${endPos.cx - 50}px`;
                                animKernel.style.top = `${endPos.cy - 20}px`;
                                
                                // Phase 4: OS Loaded
                                setTimeout(() => {
                                    animKernel.style.opacity = '0';
                                    blockDisk.classList.remove('hw-active');
                                    blockRam.classList.add('hw-active');
                                    
                                    document.getElementById('ram-empty').remove();
                                    
                                    const kernelBlock = document.createElement('div');
                                    kernelBlock.className = 'w-full h-full flex items-center justify-center text-base font-bold';
                                    kernelBlock.style.cssText = 'background:rgba(250,204,21,0.12);border:1.5px solid rgba(250,204,21,0.4);color:var(--yellow)';
                                    kernelBlock.innerText = "OS Kernel (Active)";
                                    ramContainer.appendChild(kernelBlock);
                                    
                                    logMsg("OS Kernel successfully loaded into RAM.", 'log-yellow');
                                    logMsg("Bootloader transferring execution control to Kernel...", 'log-yellow');
                                    logMsg("Kernel initializing drivers, interrupts, and init process. Boot sequence complete.", 'log-yellow');
                                    
                                    setTimeout(() => {
                                        blockRam.classList.remove('hw-active');
                                        [linePsuBios, lineBiosDisk, lineDiskRam].forEach(l => l.classList.remove('active'));
                                        
                                        isBooted = true;
                                        bootInProgress = false;
                                        btnPower.disabled = false;
                                        btnPower.classList.remove('opacity-50');
                                        btnPower.innerText = "Power Off System";
                                        btnPower.style.background = 'linear-gradient(135deg, #fff 0%, #ccc 100%)';
                                        btnPower.style.color = '#000';
                                        
                                    }, 1500);
                                    
                                }, 1200);
                            }, 100);
                        }, 2500);
                    }, 1500);
                }, 2000);
            }, 1000);
        }, 1500);
    }, 500);
});
