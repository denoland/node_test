// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.

/** This scripts vendors the test/ dir of nodejs repository to local ./test dir */

import $ from "https://deno.land/x/dax@0.31.1/mod.ts";
import { version } from "./node_version.ts";

// The version to vendor
const tag = "v" + version;

await $`rm -rf node`;
await $`git clone --depth 1 --sparse --branch ${tag} --single-branch https://github.com/nodejs/node.git`;
await $`git sparse-checkout add test`.cwd("node");

// remove large & unused dirs
await $`rm -rf test/fixture/wpt`;
await $`rm -rf test/fixture/snapshot`;

await $`rm -rf test`;
await $`cp -r node/test ./test`;
