#!/usr/bin/env node

import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import { Command } from "commander";
import asciichart from "asciichart";
import si from "systeminformation";

import { getCPU } from "../modules/cpu.js";
import { getRAM } from "../modules/ram.js";
import { getDisk } from "../modules/disk.js";
import { getNetwork } from "../modules/network.js";
import { getUptime } from "../modules/uptime.js";

const program = new Command();

program
  .option('-r, --refresh <seconds>', 'refresh rate', '2')
  .option('-v, --view <items>', 'items to display (cpu,ram,disk,net,uptime)', 'cpu,ram,disk,net,uptime')
  .option('--alert <thresholds>', 'critical alert thresholds', 'cpu=90,ram=80,disk=90,net=100');

program.parse(process.argv);
const options = program.opts();

const refreshRate = parseInt(options.refresh) * 1000;
const views = options.view.split(',').map(v => v.trim().toLowerCase());

// Critical alert thresholds
const alerts = {};
options.alert.split(',').forEach(pair => {
  const [key, val] = pair.split('=');
  alerts[key.trim()] = Number(val.trim());
});

// Log directory
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

let lastLogTime = Date.now(); // to control log writing

// Graphic history
let cpuHistory = [];
let ramHistory = [];
let diskHistory = [];
let netRxHistory = [];
let netTxHistory = [];

async function displayStats() {
  const spinner = ora("System information being fetched...").start();

  try {
    const cpu = await getCPU();
    const ram = await getRAM();
    const disk = await getDisk();
    const net = await getNetwork();
    const uptime = await getUptime();

    spinner.stop();
    console.clear();
    console.log(chalk.bold.cyan("💻 System Resource Monitor"));
    console.log(chalk.gray("-------------------------------"));

    // CPU
    let cpuStr = '';
    if (views.includes('cpu')) {
      cpuHistory.push(Number(cpu.load));
      if (cpuHistory.length > 20) cpuHistory.shift();
      const cpuColor = cpu.load >= (alerts.cpu || 90) ? chalk.red.bold : chalk.yellow;
      console.log(cpuColor(`CPU: ${cpu.load}%`));
      console.log(cpuColor(asciichart.plot(cpuHistory, { height: 5 })));
      cpuStr = `CPU: ${cpu.load}%`;
    }

    // RAM
    let ramStr = '';
    if (views.includes('ram')) {
      ramHistory.push(Number(ram.usedPercent));
      if (ramHistory.length > 20) ramHistory.shift();
      const ramColor = ram.usedPercent >= (alerts.ram || 80) ? chalk.red.bold : chalk.green;
      console.log(ramColor(`RAM: ${ram.usedPercent}% (${ram.used}/${ram.total} GB)`));
      console.log(ramColor(asciichart.plot(ramHistory, { height: 5 })));
      ramStr = `RAM: ${ram.usedPercent}% (${ram.used}/${ram.total} GB)`;
    }

    // Disk
    let diskStr = '';
    if (views.includes('disk')) {
      if (disk.length > 0) {
        disk.forEach(d => {
          diskHistory.push(Number(d.usePercent));
          if (diskHistory.length > 20) diskHistory.shift();
          const diskColor = d.usePercent >= (alerts.disk || 90) ? chalk.red.bold : chalk.blue;
          const dStr = `Disk (${d.mount}): ${d.usePercent}% (${d.used}/${d.size} GB)`;
          console.log(diskColor(dStr));
        });
        console.log(chalk.blue(asciichart.plot(diskHistory, { height: 5 })));
        diskStr = `Disk: ${disk.map(d => d.usePercent).join(', ')}%`;
      } else {
        console.log(chalk.blue("Disk: Information not available"));
        diskStr = "Disk: Information not available";
      }
    }

    // Network
    let netStr = '';
    if (views.includes('net')) {
      if (net) {
        netRxHistory.push(Number(net.rxMB));
        netTxHistory.push(Number(net.txMB));
        if (netRxHistory.length > 20) netRxHistory.shift();
        if (netTxHistory.length > 20) netTxHistory.shift();
        const netColorRx = net.rxMB >= (alerts.net || 100) ? chalk.red.bold : chalk.magenta;
        const netColorTx = net.txMB >= (alerts.net || 100) ? chalk.red.bold : chalk.magenta;
        console.log(netColorRx(`↓ RX: ${net.rxMB} MB/s`));
        console.log(asciichart.plot(netRxHistory, { height: 5 }));
        console.log(netColorTx(`↑ TX: ${net.txMB} MB/s`));
        console.log(asciichart.plot(netTxHistory, { height: 5 }));
        netStr = `Network (${net.iface}): ↓ ${net.rxMB} MB/s ↑ ${net.txMB} MB/s`;
      } else {
        console.log(chalk.magenta("Network: Information not available"));
        netStr = "Network: Information not available";
      }
    }

    // Uptime
    let uptimeStr = '';
    if (views.includes('uptime')) {
      console.log(chalk.cyan(`Uptime: ${uptime} hours`));
      uptimeStr = `Uptime: ${uptime} hours`;
    }

    // Top 5 process (CPU)
    const processes = await si.processes();
    const top5 = processes.list
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 5)
      .map(p => `${p.pid} ${p.name} CPU:${p.cpu.toFixed(1)}% RAM:${p.mem.toFixed(1)}%`);
    console.log(chalk.gray("-------------------------------"));
    console.log(chalk.bold.white("Top 5 CPU consuming processes:"));
    top5.forEach(p => console.log(chalk.white(p)));
    console.log(chalk.gray("-------------------------------"));

    // Logging: only once per minute
    if (Date.now() - lastLogTime >= 60 * 1000) {
      const outputString = `[${new Date().toISOString()}] ${cpuStr} | ${ramStr} | ${diskStr} | ${netStr} | ${uptimeStr} | Top5: ${top5.join(' ; ')}`;
      fs.appendFileSync(path.join(logDir, "sysmon.log"), outputString + "\n");
      lastLogTime = Date.now();
    }

  } catch (error) {
    spinner.stop();
    console.error(chalk.red("⚠️ Error occurred while fetching system information:"), error);
  }
}

// Dashboard 2 second interval
setInterval(displayStats, refreshRate);