const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '🎱 Iniciando BillarPulse (Servidor + Cliente Vite)...');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Servidor Backend (Express + SQLite + WebSocket en puerto 3001)
const server = spawn('node', ['index.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: isWindows,
  detached: !isWindows
});

// 2. Cliente Frontend (Vite HMR en puerto 5173)
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: isWindows,
  detached: !isWindows
});

let isCleaningUp = false;
const cleanup = () => {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\n\x1b[33m%s\x1b[0m', '🛑 Cerrando BillarPulse y liberando puertos...');

  const killChild = (proc) => {
    if (!proc || !proc.pid) return;
    try {
      if (isWindows) {
        spawn('taskkill', ['/pid', proc.pid.toString(), '/f', '/t']);
      } else {
        process.kill(-proc.pid, 'SIGKILL');
      }
    } catch (e) {
      try { proc.kill('SIGKILL'); } catch (err) {}
    }
  };

  killChild(server);
  killChild(client);

  setTimeout(() => {
    process.exit(0);
  }, 200);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGHUP', cleanup);
process.on('exit', cleanup);

server.on('exit', (code) => {
  if (code !== 0 && code !== null && !isCleaningUp) {
    console.error(`\x1b[31m[Servidor] proceso finalizó con código ${code}\x1b[0m`);
    cleanup();
  }
});

client.on('exit', (code) => {
  if (code !== 0 && code !== null && !isCleaningUp) {
    console.error(`\x1b[31m[Cliente] proceso finalizó con código ${code}\x1b[0m`);
    cleanup();
  }
});
