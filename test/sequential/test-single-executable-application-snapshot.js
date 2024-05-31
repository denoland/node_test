'use strict';

require('../common');

const {
  injectAndCodeSign,
  skipIfSingleExecutableIsNotSupported,
} = require('../common/sea');

skipIfSingleExecutableIsNotSupported();

// This tests the snapshot support in single executable applications.

const tmpdir = require('../common/tmpdir');
const { copyFileSync, writeFileSync, existsSync } = require('fs');
const {
  spawnSyncAndExit,
  spawnSyncAndExitWithoutError
} = require('../common/child_process');
const assert = require('assert');

const configFile = tmpdir.resolve('sea-config.json');
const seaPrepBlob = tmpdir.resolve('sea-prep.blob');
const outputFile = tmpdir.resolve(process.platform === 'win32' ? 'sea.exe' : 'sea');

{
  tmpdir.refresh();

  writeFileSync(tmpdir.resolve('snapshot.js'), '', 'utf-8');
  writeFileSync(configFile, `
  {
    "main": "snapshot.js",
    "output": "sea-prep.blob",
    "useSnapshot": true
  }
  `);

  spawnSyncAndExit(
    process.execPath,
    ['--experimental-sea-config', 'sea-config.json'],
    {
      cwd: tmpdir.path
    },
    {
      status: 1,
      signal: null,
      stderr: /snapshot\.js does not invoke v8\.startupSnapshot\.setDeserializeMainFunction\(\)/
    });
}

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

  writeFileSync(tmpdir.resolve('snapshot.js'), code, 'utf-8');
  writeFileSync(configFile, `
  {
    "main": "snapshot.js",
    "output": "sea-prep.blob",
    "useSnapshot": true
  }
  `);

  spawnSyncAndExitWithoutError(
    process.execPath,
    ['--experimental-sea-config', 'sea-config.json'],
    {
      cwd: tmpdir.path
    },
    {
      stderr: /Single executable application is an experimental feature/
    });

  assert(existsSync(seaPrepBlob));

  copyFileSync(process.execPath, outputFile);
  injectAndCodeSign(outputFile, seaPrepBlob);

  spawnSyncAndExitWithoutError(
    outputFile,
    {
      trim: true,
      stdout: 'Hello from snapshot',
      stderr(output) {
        assert.doesNotMatch(
          output,
          /Single executable application is an experimental feature/);
      }
    }
  );
}
