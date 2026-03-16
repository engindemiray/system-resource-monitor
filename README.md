<img width="1399" height="747" alt="Screenshot 2026-03-14 at 15 45 37" src="https://github.com/user-attachments/assets/cb02ae31-3c20-481b-8cf6-3ac5b310ebb9" />

## Tech Stack

- JavaScript
- Node.js
- Express.js
- WebSocket

## System Resource Monitoring

By monitoring system resource usage, you can do the following:

- Collect data that reflects how a service that is using specific system resources is performing.
- Discover resource bottlenecks or overload and so preempt problems.
- More efficiently manage workloads.

## Installation

Clone the repository:
``` bash
$ git clone https://github.com/engindemiray/system-resource-monitor.git
cd system-resource-monitor
```

Install npm packages:
``` bash
$ npm install
```

Run the app:
``` bash
$ node start.js
```

You may visit the application on browser with the URL: http://localhost:3000

## Project Structure

```
system-resource-monitor/
├──cli/
│  └──monitor.js           # CLI tool that prints system metrics in the terminal
├──logs/
│  └──sysmon.log           # Log file where monitoring data is stored
├──modules/
│  ├──cpu.js               # CPU usage monitoring module
│  ├──disk.js              # Disk usage monitoring module
│  ├──network.js           # Network traffic monitoring module
│  ├──ram.js               # RAM usage monitoring module
│  └──uptime.js            # System uptime information module
├──node_modules/           # Installed npm dependencies
├──web/
│  ├──public/
│  │  ├──css/
│  │  │  └──style.css      # Styles for the web dashboard
│  │  ├──js/
│  │  │  └──dashboard.js   # Frontend logic for charts and live updates
│  │  └──index.html        # Web dashboard interface
│  └──server.js            # Express server serving the dashboard
├──package.json            # Project metadata and npm dependencies
├──package-lock.json       # Locked dependency versions
└──start.js                # Application entry point
```
