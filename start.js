#!/usr/bin/env node

import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import { Command } from "commander";
import si from "systeminformation";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

// --- CLI & Logging settings ---
const program = new Command();
program
  .option('-r, --refresh <seconds>', 'refresh rate', '2')
  .option('-v, --view <items>', 'items to display (cpu,ram,disk,net,uptime)', 'cpu,ram,disk,net,uptime')
  .option('--alert <thresholds>', 'critical alert thresholds', 'cpu=90,ram=80,disk=90,net=100');
program.parse(process.argv);
const options = program.opts();
const refreshRate = parseInt(options.refresh) * 1000;
const views = options.view.split(',').map(v => v.trim().toLowerCase());
const alerts = {};
options.alert.split(',').forEach(pair => { const [k,v]=pair.split('='); alerts[k.trim()] = Number(v.trim()); });

const logDir = path.join(process.cwd(), "logs");
if(!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// --- Log rotate ---
const MAX_LOG_LINES = 100;
function rotateLogs() {
  const logFile = path.join(logDir, 'sysmon.log');
  if(!fs.existsSync(logFile)) return;

  const lines = fs.readFileSync(logFile,'utf-8').split('\n').filter(Boolean);
  if(lines.length > MAX_LOG_LINES){
    const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
    const archiveFile = path.join(logDir, `sysmon-${timestamp}.log`);
    fs.writeFileSync(archiveFile, lines.join('\n')+'\n');
    fs.writeFileSync(logFile, ''); // old logs clear
    console.log(chalk.gray(`🔄 Log rotate: old logs archived to ${archiveFile}`));
  }
}

// --- WebSocket Server ---
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
app.use(express.static(path.join(process.cwd(),'web/public')));

wss.on('connection', ws => console.log('New client connected'));

// --- CLI + Logging + WebSocket ---
let lastLogTime = 0;

async function displayStats() {
  const spinner = ora("System information being fetched...").start();
  try {
    const cpu = await si.currentLoad();
    const ram = await si.mem();
    const disk = await si.fsSize();
    const net = await si.networkStats();
    const uptime = si.time().uptime;

    const processes = await si.processes();
    const top5 = processes.list
      .sort((a,b)=>b.cpu-a.cpu)
      .slice(0,5)
      .map(p=>({ pid:p.pid, name:p.name, cpu:p.cpu.toFixed(1), ram:p.mem.toFixed(1) }));

    spinner.stop();
    console.clear();
    console.log(chalk.bold.cyan("💻 System Resource Monitor"));
    console.log(chalk.gray("-------------------------------"));
    console.log(chalk.yellow(`CPU: ${cpu.currentLoad.toFixed(1)}%`));
    console.log(chalk.green(`RAM: ${((ram.active/ram.total)*100).toFixed(1)}%`));
    console.log(chalk.blue(`Disk: ${disk[0]?.use || 0}%`));
    console.log(chalk.magenta(`Network: ${(net[0]?.rx_sec/1024/1024).toFixed(2)} MB/s`));
    console.log(chalk.cyan(`Uptime: ${(uptime/3600).toFixed(1)} hours`));
    console.log(chalk.gray("-------------------------------"));
    console.log(chalk.bold.white("Top 5 CPU consuming processes:"));
    top5.forEach(p=>console.log(`${p.pid} ${p.name} CPU:${p.cpu}% RAM:${p.ram}%`));
    console.log(chalk.gray("-------------------------------"));

    // WebSocket send
    const wsData = {
      cpu: cpu.currentLoad,
      ram: (ram.active/ram.total)*100,
      disk: disk[0]?.use || 0,
      net: { rx: net[0]?.rx_sec/1024/1024 || 0, tx: net[0]?.tx_sec/1024/1024 || 0 },
      uptime,
      topProcesses: top5
    };
    wss.clients.forEach(client=>{ if(client.readyState===1) client.send(JSON.stringify(wsData)); });

    // Logging: only once per minute
    const now = Date.now();
    if(now - lastLogTime >= 60000){ // 1 minute
      lastLogTime = now;
      const outputString = `[${new Date().toISOString()}] CPU:${cpu.currentLoad.toFixed(1)} RAM:${((ram.active/ram.total)*100).toFixed(1)} Disk:${disk[0]?.use || 0} Network:${(net[0]?.rx_sec/1024/1024).toFixed(2)} Top5:${top5.map(p=>p.name).join(';')}`;
      fs.appendFileSync(path.join(logDir,'sysmon.log'), outputString+'\n');
      rotateLogs();
    }

  } catch(err) {
    spinner.stop();
    console.error(chalk.red("⚠️ Error occurred:"), err);
  }
}

setInterval(displayStats, refreshRate);

// --- Server start ---
server.listen(3000, ()=>console.log('Dashboard: http://localhost:3000'));