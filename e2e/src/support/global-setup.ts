import { execSync } from 'child_process';

module.exports = async function () {
  console.log('\nStarting docker compose...\n');
  execSync('docker compose up -d', { stdio: 'inherit' });
  const axios = require('axios');
  axios.defaults.baseURL = 'http://localhost:3000/api';
  let ready = false;
for (let i = 0; i < 40; i++) {
    try {
      await axios.get('/tags');
      ready = true;
      break;
    } catch {
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  if (!ready) throw new Error('API did not start in time');
  console.log('\nAPI is ready.\n');
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};