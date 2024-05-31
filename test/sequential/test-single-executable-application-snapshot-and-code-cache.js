'use strict';

require('../common');

const {
  injectAndCodeSign,
  skipIfSingleExecutableIsNotSupported,
} = require('../common/sea');

skipIfSingleExecutableIsNotSupported();

// This tests "useCodeCache" is ignored when "useSnapshot" is true.

const tmpdir = require('../common/tmpdir');
const { copyFileSync, writeFileSync, existsSync } = require('fs');
const {
  spawnSyncAndExitWithoutError
} = require('../common/child_process');
const { join } = require('path');
const assert = require('assert');

const configFile = join(tmpdir.path, 'sea-config.json');
const seaPrepBlob = join(tmpdir.path, 'sea-prep.blob');
const outputFile = join(tmpdir.path, process.platform === 'win32' ? 'sea.exe' : 'sea');

{
  tmpdir.refresh();
  const code = `
  const {
    setDeserializeMainFunction,
  } = require('v8').startupSnapshot;

  setDeserializeMainFunction(() => {
    console.log('Hello from snapshot');
  });
  `;

  writeFileSync(join(tmpdir.path, 'snapshot.js'), code, 'utf-8');
  writeFileSync(configFile, `
  {
    "main": "snapshot.js",
    "output": "sea-prep.blob",
    "useSnapshot": true,
    "useCodeCache": true
  }
  `);

  spawnSyncAndExitWithoutError(
    process.execPath,
    ['--experimental-sea-config', 'sea-config.json'],
    {
      cwd: tmpdir.path
    },
    {
      stderr: /"useCodeCache" is redundant when "useSnapshot" is true/
    }
  );

  assert(existsSync(seaPrepBlob));

  copyFileSync(process.execPath, outputFile);
  injectAndCodeSign(outputFile, seaPrepBlob);

  spawnSyncAndExitWithoutError(outputFile, {
    stdout: 'Hello from snapshot',
    trim: true,
  });
}
