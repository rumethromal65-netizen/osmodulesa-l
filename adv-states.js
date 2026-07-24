const btnAdmit = document.getElementById('btn-admit');
const btnDispatch = document.getElementById('btn-dispatch');
const btnInterrupt = document.getElementById('btn-interrupt');
const btnIoWait = document.getElementById('btn-iowait');
const btnIoEvent = document.getElementById('btn-ioevent');
const btnExit = document.getElementById('btn-exit');

const btnSuspendWait = document.getElementById('btn-suspend-wait');
const btnResumeWait = document.getElementById('btn-resume-wait');
const btnSuspendReady = document.getElementById('btn-suspend-ready');
const btnResumeReady = document.getElementById('btn-resume-ready');
const btnIoEventDisk = document.getElementById('btn-ioevent-disk');

const btnReset = document.getElementById('btn-reset');

const token = document.getElementById('process-token');
const statusText = document.getElementById('status-text');

let currentState = 'NONE'; // NONE, NEW, READY, RUNNING, WAITING, TERMINATED, SUSPEND_READY, SUSPEND_WAIT

function getCenter(nodeId) {
    const node = document.getElementById(nodeId);
    if(!node) return {x:0, y:0};
    const left = parseInt(node.style.left || getComputedStyle(node).left);
    const top = parseInt(node.style.top || getComputedStyle(node).top);
    const width = parseInt(getComputedStyle(node).width);
    const height = parseInt(getComputedStyle(node).height);
    
    return {
        x: left + (width / 2) - 20, 
        y: top + (height / 2) - 20
    };
}

function updateButtons() {
    const buttons = [
        btnAdmit, btnDispatch, btnInterrupt, btnIoWait, btnIoEvent, btnExit,
        btnSuspendWait, btnResumeWait, btnSuspendReady, btnResumeReady, btnIoEventDisk
    ];
    
    buttons.forEach(b => {
        b.disabled = true;
        b.style.opacity = '0.5';
    });
    
    document.querySelectorAll('.state-node').forEach(n => {
        n.style.backgroundColor = 'rgba(19,19,26,0.9)';
        n.style.transform = 'scale(1)';
        n.style.boxShadow = 'var(--card-shadow)';
        n.style.borderColor = 'var(--border-mid)';
        n.style.color = 'var(--text-hi)';
    });

    if(currentState !== 'NONE') {
        const activeNode = document.getElementById(`node-${currentState.toLowerCase().replace('_', '-')}`);
        if(activeNode) {
            activeNode.style.backgroundColor = 'rgba(250,204,21,0.08)';
            activeNode.style.transform = 'scale(1.05)';
            activeNode.style.borderColor = 'var(--yellow)';
            activeNode.style.boxShadow = '0 0 20px var(--yellow-glow)';
            activeNode.style.color = 'var(--yellow)';
        }
    }

    const enable = (btn) => {
        btn.disabled = false;
        btn.style.opacity = '1';
    };

    switch(currentState) {
        case 'NONE':
            enable(btnAdmit);
            break;
        case 'NEW':
            // Auto transitions to READY
            break;
        case 'READY':
            enable(btnDispatch);
            enable(btnSuspendReady);
            break;
        case 'RUNNING':
            enable(btnInterrupt);
            enable(btnIoWait);
            enable(btnExit);
            break;
        case 'WAITING':
            enable(btnIoEvent);
            enable(btnSuspendWait);
            break;
        case 'SUSPEND_READY':
            enable(btnResumeReady);
            break;
        case 'SUSPEND_WAIT':
            enable(btnResumeWait);
            enable(btnIoEventDisk);
            break;
        case 'TERMINATED':
            break;
    }
}

function moveToken(targetState, msg) {
    currentState = targetState;
    const targetNodeId = `node-${targetState.toLowerCase().replace('_', '-')}`;
    const targetPos = getCenter(targetNodeId);
    
    token.style.opacity = '1';
    token.style.left = `${targetPos.x}px`;
    token.style.top = `${targetPos.y}px`;
    
    statusText.innerText = msg;
    
    // Disable all briefly
    document.querySelectorAll('button').forEach(b => b.disabled = true);
    
    setTimeout(() => {
        btnReset.disabled = false;
        updateButtons();
    }, 600);
}

btnAdmit.addEventListener('click', () => {
    const newPos = getCenter('node-new');
    token.style.left = `${newPos.x}px`;
    token.style.top = `${newPos.y + 50}px`; 
    token.style.opacity = '0';
    
    setTimeout(() => {
        token.style.opacity = '1';
        token.style.top = `${newPos.y}px`;
        statusText.innerText = "Process Created (NEW)";
        
        setTimeout(() => {
            moveToken('READY', "Process admitted to Ready Queue");
        }, 1000);
    }, 50);
});

btnDispatch.addEventListener('click', () => moveToken('RUNNING', "Dispatched to CPU"));
btnInterrupt.addEventListener('click', () => moveToken('READY', "Time Quantum expired! (Interrupt)"));
btnIoWait.addEventListener('click', () => moveToken('WAITING', "I/O Request -> Waiting Queue"));
btnIoEvent.addEventListener('click', () => moveToken('READY', "I/O Complete -> Ready Queue"));
btnExit.addEventListener('click', () => moveToken('TERMINATED', "Process Terminated"));

// Swapping
btnSuspendWait.addEventListener('click', () => moveToken('SUSPEND_WAIT', "MTS swaps Waiting process to Disk"));
btnResumeWait.addEventListener('click', () => moveToken('WAITING', "MTS swaps process back to RAM (Waiting)"));
btnSuspendReady.addEventListener('click', () => moveToken('SUSPEND_READY', "MTS swaps Ready process to Disk"));
btnResumeReady.addEventListener('click', () => moveToken('READY', "MTS swaps process back to RAM (Ready)"));
btnIoEventDisk.addEventListener('click', () => moveToken('SUSPEND_READY', "I/O Complete while on Disk -> Suspend Ready"));

btnReset.addEventListener('click', () => {
    currentState = 'NONE';
    token.style.opacity = '0';
    statusText.innerText = 'Ready to admit.';
    updateButtons();
});

updateButtons();
