import { execSync } from 'child_process';

module.exports = async function () {
  console.log(globalThis.__TEARDOWN_MESSAGE__);
  execSync('docker compose down', { stdio: 'inherit' });
};