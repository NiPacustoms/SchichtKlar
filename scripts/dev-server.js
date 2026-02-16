#!/usr/bin/env node

const { spawn } = require('child_process');
const net = require('net');

function findFreePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });

    server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        findFreePort(startPort + 1)
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

async function startDevServer() {
  try {
    const port = await findFreePort();
    console.log(`🚀 Starting development server on port ${port}`);

    const child = spawn('npx', ['next', 'dev', '-p', port.toString()], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', error => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping development server...');
      child.kill('SIGINT');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error finding free port:', error);
    process.exit(1);
  }
}

startDevServer();
