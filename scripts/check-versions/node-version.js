import chalk from 'chalk';
import { fileURLToPath } from 'url';

function checkNodeVersion() {
  try {
    const requiredNodeVersion = '>=18.0.0';
    const currentNodeVersion = process.version;

    // Simple version check without semver to avoid extra dependency
    const extractVersion = (v) => {
      const match = v.match(/v?(\d+)\.(\d+)\.(\d+)/);
      return match ? parseInt(match[1], 10) * 10000 + parseInt(match[2], 10) * 100 + parseInt(match[3], 10) : 0;
    };

    const current = extractVersion(currentNodeVersion);
    const required = extractVersion(requiredNodeVersion.replace(/[^0-9.]/g, ''));

    if (current < required) {
      console.error(chalk.red(`❌ Node.js version ${currentNodeVersion} does not meet the required version ${requiredNodeVersion}`));
      console.error(chalk.yellow('Please update your Node.js installation.'));
      process.exit(1);
    }

    console.log(chalk.green(`✅ Using Node.js ${currentNodeVersion} (required: ${requiredNodeVersion})`));
  } catch (error) {
    console.error(chalk.red('❌ Error checking Node.js version:'), error.message);
    process.exit(1);
  }
}

// Check if this file is being run directly (not imported)
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  checkNodeVersion();
}

export { checkNodeVersion };
