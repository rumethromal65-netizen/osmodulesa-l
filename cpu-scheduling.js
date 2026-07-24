let processes = [];
let nextPid = 1;

// DOM Elements
const form = document.getElementById('add-process-form');
const tbody = document.getElementById('process-tbody');
const emptyState = document.getElementById('empty-state');
const resetBtn = document.getElementById('reset-btn');
const simulateBtn = document.getElementById('simulate-btn');
const algoSelect = document.getElementById('algo-select');
const tqContainer = document.getElementById('tq-container');
const tqInput = document.getElementById('tq-input');
const tqVal = document.getElementById('tq-val');

const ganttSection = document.getElementById('gantt-section');
const ganttContainer = document.getElementById('gantt-container');
const maxTimeLabel = document.getElementById('max-time');
const metricsSection = document.getElementById('metrics-section');
const metricsTbody = document.getElementById('metrics-tbody');

// Colors for Gantt Chart
const blockColors = ['bg-yellow-400', 'bg-amber-500', 'bg-orange-500', 'bg-yellow-600', 'bg-amber-700', 'bg-orange-700', 'bg-[#facc15]'];

// Event Listeners
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const at = parseInt(document.getElementById('at-input').value) || 0;
    const bt = parseInt(document.getElementById('bt-input').value) || 1;
    const prio = parseInt(document.getElementById('prio-input').value) || 1;

    processes.push({ id: `P${nextPid++}`, at, bt, prio });
    renderTable();
});

resetBtn.addEventListener('click', () => {
    processes = [];
    nextPid = 1;
    renderTable();
    hideResults();
});

tqInput.addEventListener('input', (e) => {
    tqVal.innerText = e.target.value;
});

algoSelect.addEventListener('change', (e) => {
    if (e.target.value === 'RR') {
        tqContainer.classList.remove('hidden');
        setTimeout(() => tqContainer.classList.remove('opacity-50'), 10);
    } else {
        tqContainer.classList.add('opacity-50');
        setTimeout(() => tqContainer.classList.add('hidden'), 300);
    }
});

simulateBtn.addEventListener('click', runSimulation);

function renderTable() {
    tbody.innerHTML = '';
    if (processes.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        processes.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-2 border-b border-[#333333] text-[#facc15] font-bold">${p.id}</td>
                <td class="py-2 border-b border-[#333333]">${p.at}</td>
                <td class="py-2 border-b border-[#333333]">${p.bt}</td>
                <td class="py-2 border-b border-[#333333]">${p.prio}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function hideResults() {
    ganttSection.classList.add('hidden');
    metricsSection.classList.add('hidden');
    ganttContainer.innerHTML = '';
}

// SIMULATION LOGIC
function runSimulation() {
    if (processes.length === 0) return alert("Add processes first!");
    
    // Deep copy and setup
    let pList = processes.map(p => ({ ...p, rem: p.bt, ct: 0, startTimes: [] }));
    pList.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)); // Sort by AT
    
    const algo = algoSelect.value;
    const tq = parseInt(tqInput.value) || 2;
    
    let time = 0;
    let completed = 0;
    const n = pList.length;
    let gantt = []; // { id, start, end, type: 'process'|'idle' }
    
    if (algo === 'FCFS') {
        while (completed < n) {
            let p = pList.find(x => x.at <= time && x.rem > 0);
            if (p) {
                if (p.startTimes.length === 0) p.startTimes.push(time);
                gantt.push({ id: p.id, start: time, end: time + p.rem });
                time += p.rem;
                p.ct = time;
                p.rem = 0;
                completed++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1, type: 'idle' });
                time++;
            }
        }
    } 
    else if (algo === 'SJF-NP') {
        while (completed < n) {
            let available = pList.filter(x => x.at <= time && x.rem > 0);
            if (available.length > 0) {
                available.sort((a, b) => a.bt - b.bt || a.at - b.at);
                let p = available[0];
                if (p.startTimes.length === 0) p.startTimes.push(time);
                gantt.push({ id: p.id, start: time, end: time + p.rem });
                time += p.rem;
                p.ct = time;
                p.rem = 0;
                completed++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1, type: 'idle' });
                time++;
            }
        }
    }
    else if (algo === 'SJF-P') {
        let currentP = null;
        while (completed < n) {
            let available = pList.filter(x => x.at <= time && x.rem > 0);
            if (available.length > 0) {
                available.sort((a, b) => a.rem - b.rem || a.at - b.at);
                let p = available[0];
                if (p.startTimes.length === 0) p.startTimes.push(time);
                
                if (currentP !== p.id) {
                    currentP = p.id;
                    gantt.push({ id: p.id, start: time, end: time + 1 });
                } else {
                    gantt[gantt.length - 1].end = time + 1;
                }
                
                p.rem--;
                if (p.rem === 0) {
                    p.ct = time + 1;
                    completed++;
                    currentP = null;
                }
            } else {
                if (currentP !== 'IDLE') {
                    gantt.push({ id: 'IDLE', start: time, end: time + 1, type: 'idle' });
                    currentP = 'IDLE';
                } else {
                    gantt[gantt.length - 1].end = time + 1;
                }
            }
            time++;
        }
    }
    else if (algo === 'PRIO-NP') {
        while (completed < n) {
            let available = pList.filter(x => x.at <= time && x.rem > 0);
            if (available.length > 0) {
                available.sort((a, b) => a.prio - b.prio || a.at - b.at); // Lower prio number is better
                let p = available[0];
                if (p.startTimes.length === 0) p.startTimes.push(time);
                gantt.push({ id: p.id, start: time, end: time + p.rem });
                time += p.rem;
                p.ct = time;
                p.rem = 0;
                completed++;
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1, type: 'idle' });
                time++;
            }
        }
    }
    else if (algo === 'PRIO-P') {
        let currentP = null;
        while (completed < n) {
            let available = pList.filter(x => x.at <= time && x.rem > 0);
            if (available.length > 0) {
                available.sort((a, b) => a.prio - b.prio || a.at - b.at);
                let p = available[0];
                if (p.startTimes.length === 0) p.startTimes.push(time);
                
                if (currentP !== p.id) {
                    currentP = p.id;
                    gantt.push({ id: p.id, start: time, end: time + 1 });
                } else {
                    gantt[gantt.length - 1].end = time + 1;
                }
                
                p.rem--;
                if (p.rem === 0) {
                    p.ct = time + 1;
                    completed++;
                    currentP = null;
                }
            } else {
                if (currentP !== 'IDLE') {
                    gantt.push({ id: 'IDLE', start: time, end: time + 1, type: 'idle' });
                    currentP = 'IDLE';
                } else {
                    gantt[gantt.length - 1].end = time + 1;
                }
            }
            time++;
        }
    }
    else if (algo === 'RR') {
        let q = [];
        let inQ = new Set();
        let currentP = null;
        
        while (completed < n) {
            // Add arriving processes
            pList.filter(x => x.at <= time && x.rem > 0 && !inQ.has(x.id)).forEach(x => {
                q.push(x);
                inQ.add(x.id);
            });
            
            if (q.length > 0) {
                let p = q.shift();
                inQ.delete(p.id);
                
                if (p.startTimes.length === 0) p.startTimes.push(time);
                
                let runTime = Math.min(p.rem, tq);
                gantt.push({ id: p.id, start: time, end: time + runTime });
                time += runTime;
                p.rem -= runTime;
                
                // Add newly arrived processes while this was running
                pList.filter(x => x.at > (time - runTime) && x.at <= time && x.rem > 0 && !inQ.has(x.id)).forEach(x => {
                    q.push(x);
                    inQ.add(x.id);
                });
                
                if (p.rem === 0) {
                    p.ct = time;
                    completed++;
                } else {
                    q.push(p);
                    inQ.add(p.id);
                }
            } else {
                gantt.push({ id: 'IDLE', start: time, end: time + 1, type: 'idle' });
                time++;
            }
        }
    }

    // Compress idle times
    let compGantt = [];
    gantt.forEach(g => {
        if (compGantt.length > 0 && compGantt[compGantt.length-1].id === g.id) {
            compGantt[compGantt.length-1].end = g.end;
        } else {
            compGantt.push(g);
        }
    });

    // Calculate metrics
    pList.forEach(p => {
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
        p.rt = p.startTimes[0] - p.at;
    });

    animateGantt(compGantt, time, pList);
}

function animateGantt(gantt, maxTime, pList) {
    ganttSection.classList.remove('hidden');
    metricsSection.classList.add('hidden'); // Hide until animation done
    ganttContainer.innerHTML = '';
    maxTimeLabel.innerText = '0';
    
    let totalDurationMs = 2000; 
    let pxPerUnit = 100 / maxTime; // Percentage
    
    let currentAnimTime = 0;
    
    gantt.forEach((g, idx) => {
        let block = document.createElement('div');
        let colorClass = g.type === 'idle' ? 'bg-[#333333] repeating-linear-gradient' : blockColors[(parseInt(g.id.substring(1)) - 1) % blockColors.length];
        let textColor = g.type === 'idle' ? 'text-[var(--text-lo)]' : (colorClass === 'bg-amber-700' ? 'text-white' : 'text-black');
        
        block.className = `absolute h-16 top-4 rounded flex items-center justify-center font-bold text-sm transition-all duration-300 ease-linear ${colorClass} ${textColor} border border-white/50`;
        if(g.type === 'idle') {
            block.style.background = 'repeating-linear-gradient(45deg, #333333, #333333 10px, #111111 10px, #111111 20px)';
        }
        
        block.style.left = (g.start * pxPerUnit) + '%';
        block.style.width = '0%';
        block.innerHTML = `<span class="opacity-0 transition-opacity">${g.id}</span>`;
        ganttContainer.appendChild(block);
        
        let blockDuration = ((g.end - g.start) / maxTime) * totalDurationMs;
        
        setTimeout(() => {
            block.style.width = ((g.end - g.start) * pxPerUnit) + '%';
            setTimeout(() => {
                block.querySelector('span').classList.remove('opacity-0');
            }, blockDuration / 2);
            
            // Update timer
            let ticker = setInterval(() => {
                maxTimeLabel.innerText = Math.min(g.end, parseInt(maxTimeLabel.innerText) + 1);
            }, blockDuration / (g.end - g.start));
            
            setTimeout(() => clearInterval(ticker), blockDuration);
            
        }, currentAnimTime);
        
        currentAnimTime += blockDuration;
    });

    // Show metrics after animation
    setTimeout(() => {
        maxTimeLabel.innerText = maxTime;
        displayMetrics(pList, maxTime);
    }, totalDurationMs + 500);
}

function displayMetrics(pList, maxTime) {
    metricsSection.classList.remove('hidden');
    metricsTbody.innerHTML = '';
    
    let sumTat = 0, sumWt = 0, sumRt = 0;
    
    pList.forEach(p => {
        sumTat += p.tat;
        sumWt += p.wt;
        sumRt += p.rt;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-2 border-b border-[#333333] font-bold text-[#facc15]">${p.id}</td>
            <td class="py-2 border-b border-[#333333]">${p.ct}</td>
            <td class="py-2 border-b border-[#333333]">${p.tat}</td>
            <td class="py-2 border-b border-[#333333]">${p.wt}</td>
            <td class="py-2 border-b border-[#333333]">${p.rt}</td>
        `;
        metricsTbody.appendChild(tr);
    });
    
    const n = pList.length;
    document.getElementById('avg-tat').innerText = (sumTat / n).toFixed(2);
    document.getElementById('avg-wt').innerText = (sumWt / n).toFixed(2);
    document.getElementById('avg-rt').innerText = (sumRt / n).toFixed(2);
    document.getElementById('throughput').innerText = (n / maxTime).toFixed(3);
}
