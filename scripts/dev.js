const { execSync, spawn } = require('child_process');
const { platform } = require('os');
const { join } = require('path');

// Cross-platform command to find and kill process on port 3000
function killPort3000() {
  try {
    if (platform() === 'win32') {
      execSync('for /f "tokens=5" %a in (\'netstat -aon ^| findstr :3000\') do taskkill /F /PID %a');
    } else {
      execSync('lsof -t -i:3000 | xargs -r kill -9');
    }
  } catch (error) {
    // Ignore errors if no process found
  }
}

// Cross-platform command to open browser
function openBrowser(url) {
  const cmd = platform() === 'win32' ? 'start' :
             platform() === 'darwin' ? 'open' : 'xdg-open';
  try {
    execSync(`${cmd} ${url}`);
  } catch (error) {
    console.log(`Failed to open browser: ${error.message}`);
  }
}

async function startDev() {
  // Kill any process on port 3000
  killPort3000();

  // Clear Next.js cache
  try {
    execSync('rm -rf .next', { stdio: 'inherit' });
  } catch (error) {
    // Ignore errors on Windows
  }

  // Start Next.js dev server
  const nextDev = spawn('next', ['dev', '-p', '3000', '-H', '0.0.0.0'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      FORCE_COLOR: '1', // Enable colors in output
    }
  });

  // Wait for server to be ready
  let isFirstCompile = true;
  nextDev.stdout?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Ready') && isFirstCompile) {
      isFirstCompile = false;
      setTimeout(() => {
        openBrowser('http://localhost:3000');
      }, 1000);
    }
  });

  // Handle server exit
  nextDev.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Next.js dev server exited with code ${code}`);
      process.exit(code || 1);
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    killPort3000();
    process.exit(0);
  });
}
