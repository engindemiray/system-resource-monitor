const cpuData = { labels: [], datasets: [{ label: 'CPU %', data: [], borderColor: 'yellow', backgroundColor: 'rgba(255,255,0,0.1)', borderWidth: 2 }] };
const ramData = { labels: [], datasets: [{ label: 'RAM %', data: [], borderColor: 'green', backgroundColor: 'rgba(0,255,0,0.1)', borderWidth: 2 }] };
const diskData = { labels: [], datasets: [{ label: 'Disk %', data: [], borderColor: 'blue', backgroundColor: 'rgba(0,0,255,0.1)', borderWidth: 2 }] };
const netData = { labels: [], datasets: [{ label: 'Network MB/s', data: [], borderColor: 'magenta', backgroundColor: 'rgba(255,0,255,0.1)', borderWidth: 2 }] };

const cpuChart = new Chart(document.getElementById('cpuChart').getContext('2d'), { type: 'line', data: cpuData, options: { responsive: true, animation: false } });
const ramChart = new Chart(document.getElementById('ramChart').getContext('2d'), { type: 'line', data: ramData, options: { responsive: true, animation: false } });
const diskChart = new Chart(document.getElementById('diskChart').getContext('2d'), { type: 'line', data: diskData, options: { responsive: true, animation: false } });
const netChart = new Chart(document.getElementById('netChart').getContext('2d'), { type: 'line', data: netData, options: { responsive: true, animation: false } });

const topTableBody = document.querySelector("#topProcesses tbody");

const ws = new WebSocket(`ws://${location.host}`);

function getColor(value, type){
  const thresholds = { cpu: 80, ram: 80, disk: 90, net: 50 };
  if(value >= thresholds[type]) return 'red';
  switch(type){
    case 'cpu': return 'yellow';
    case 'ram': return 'green';
    case 'disk': return 'blue';
    case 'net': return 'magenta';
    default: return 'white';
  }
}

ws.onmessage = event => {
  const data = JSON.parse(event.data);
  const time = new Date().toLocaleTimeString();

  // CPU
  cpuData.labels.push(time);
  cpuData.datasets[0].data.push(data.cpu);
  cpuData.datasets[0].borderColor = getColor(data.cpu, 'cpu');
  if(cpuData.labels.length>20){ cpuData.labels.shift(); cpuData.datasets[0].data.shift(); }
  cpuChart.update();

  // RAM
  ramData.labels.push(time);
  ramData.datasets[0].data.push(data.ram);
  ramData.datasets[0].borderColor = getColor(data.ram, 'ram');
  if(ramData.labels.length>20){ ramData.labels.shift(); ramData.datasets[0].data.shift(); }
  ramChart.update();

  // Disk
  diskData.labels.push(time);
  diskData.datasets[0].data.push(data.disk);
  diskData.datasets[0].borderColor = getColor(data.disk, 'disk');
  if(diskData.labels.length>20){ diskData.labels.shift(); diskData.datasets[0].data.shift(); }
  diskChart.update();

  // Network
  netData.labels.push(time);
  netData.datasets[0].data.push(data.net.rx);
  netData.datasets[0].borderColor = getColor(data.net.rx, 'net');
  if(netData.labels.length>20){ netData.labels.shift(); netData.datasets[0].data.shift(); }
  netChart.update();

  // Top 5 process
  const topList = data.topProcesses || [];
  topTableBody.innerHTML = '';
  topList.forEach(p=>{
    const tr = document.createElement('tr');
    if(Number(p.cpu)>=90) tr.classList.add('critical');
    tr.innerHTML = `<td>${p.pid}</td><td>${p.name}</td><td>${p.cpu}</td><td>${p.ram}</td>`;
    topTableBody.appendChild(tr);
  });
};