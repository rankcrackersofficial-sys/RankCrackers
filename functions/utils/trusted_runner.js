const { spawn } = require('child_process');

/**
 * Executes a command deterministically and captures all lifecycle, output, and execution state.
 * @param {string} command - Command to run
 * @param {string[]} args - Command arguments
 * @param {object} options - Options including cwd, timeout, env, shell
 * @returns {Promise<object>} Results object matching exact primary requirement schema
 */
async function runCommand(command, args = [], options = {}) {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const cwd = options.cwd || process.cwd();
  const timeout = options.timeout || 60000; // default 60 seconds

  return new Promise((resolve) => {
    let stdoutAcc = '';
    let stderrAcc = '';
    let child = null;
    let timedOut = false;
    let spawnError = null;

    const timer = setTimeout(() => {
      if (child) {
        timedOut = true;
        child.kill('SIGKILL');
      }
    }, timeout);

    const useShell = typeof options.shell !== 'undefined' ? options.shell : (process.platform === 'win32');

    try {
      child = spawn(command, args, {
        cwd,
        shell: useShell,
        env: { ...process.env, ...options.env }
      });
    } catch (err) {
      clearTimeout(timer);
      const endedAt = new Date().toISOString();
      return resolve({
        command,
        args,
        cwd,
        startedAt,
        endedAt,
        durationMs: Date.now() - startTime,
        stdout: '',
        stderr: err.message || String(err),
        exitCode: null,
        signal: null,
        timedOut: false,
        spawnError: err
      });
    }

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdoutAcc += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderrAcc += data.toString();
      });
    }

    child.on('error', (err) => {
      spawnError = err;
    });

    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      const endedAt = new Date().toISOString();
      resolve({
        command,
        args,
        cwd,
        startedAt,
        endedAt,
        durationMs: Date.now() - startTime,
        stdout: stdoutAcc,
        stderr: stderrAcc,
        exitCode,
        signal,
        timedOut,
        spawnError
      });
    });
  });
}

module.exports = {
  runCommand
};
