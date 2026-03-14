import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import si from 'systeminformation';
import path from 'path';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(process.cwd(), 'web/public')));

wss.on('connection', ws => {
  console.log('New client connected');
});

async function sendStats() {
  try {
    const cpu = await si.currentLoad();
    const ram = await si.mem();
    const disk = await si.fsSize();
    const net = await si.networkStats();
    const uptime = si.time().uptime;

    const processes = await si.processes();
    const top5 = processes.list
      .sort((a,b) => b.cpu - a.cpu)
      .slice(0,5)
      .map(p => ({ pid: p.pid, name: p.name, cpu: p.cpu.toFixed(1), ram: p.mem.toFixed(1) }));

    const data = {
      cpu: cpu.currentLoad,
      ram: (ram.active/ram.total)*100,
      disk: disk[0]?.use || 0,
      net: { rx: net[0]?.rx_sec/1024/1024 || 0, tx: net[0]?.tx_sec/1024/1024 || 0 },
      uptime,
      topProcesses: top5
    };

    wss.clients.forEach(client => {
      if(client.readyState === 1) client.send(JSON.stringify(data));
    });

  } catch (err) {
    console.error('WebSocket data sending error:', err);
  }
}

setInterval(sendStats, 2000);

server.listen(3000, () => console.log('Server http://localhost:3000 is running'));