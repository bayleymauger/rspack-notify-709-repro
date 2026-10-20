// Drives `rspack build --watch` through the steps that trigger notify-rs/notify#709
// and reports whether the native watcher failed with "Invalid argument (os error 22)".
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// `src/dir` exists, `src/dir/missing` does not. The missing path is two levels
// below `src/dir`, so on Linux rspack watches `src/dir` recursively.
fs.rmSync('src', { recursive: true, force: true });
fs.mkdirSync('src/dir', { recursive: true });
fs.writeFileSync('src/dir/.gitkeep', '');
fs.writeFileSync('src/index.js', "import './dir/missing/a.js';\n");

const child = spawn('npx', ['rspack', 'build', '--watch'], { stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
const onData = (chunk) => {
  output += chunk;
  process.stdout.write(chunk);
};
child.stdout.on('data', onData);
child.stderr.on('data', onData);

await sleep(3000);

// inotify adds a watch for the new subdirectory, then the kernel drops it on
// delete. notify 8.2.0 fails to forget the dropped watch descriptor.
console.log('\n>>> mkdir src/dir/sub && rm -rf src/dir/sub');
fs.mkdirSync('src/dir/sub');
await sleep(1000);
fs.rmSync('src/dir/sub', { recursive: true });
await sleep(2000);

// `src/dir` is no longer needed, so rspack unwatches it and notify trips over
// the stale descriptor.
console.log('\n>>> remove the missing import from src/index.js');
fs.writeFileSync('src/index.js', "console.log('fixed');\n");
await sleep(3000);

child.kill();
const reproduced = output.includes('os error 22');
console.log(reproduced ? '\nREPRODUCED: native watcher failed with os error 22' : '\nNOT REPRODUCED');
process.exit(reproduced ? 1 : 0);
