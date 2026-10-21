import * as core from '@actions/core';
import { setupNrz } from './setup';

/**
 * Main action entry point
 */
async function run(): Promise<void> {
  try {
    // Get inputs
    const nrzVersion = core.getInput('nrz-version') || 'latest';
    const nrzVersionFile = core.getInput('nrz-version-file') || undefined;
    const registryUrl = core.getInput('registry-url') || undefined;
    const noCache = core.getInput('no-cache') === 'true';

    core.info('🚀 Setting up nrz...');
    core.info(`Version: ${nrzVersion}`);
    if (nrzVersionFile) {
      core.info(`Version file: ${nrzVersionFile}`);
    }
    if (registryUrl) {
      core.info(`Registry URL: ${registryUrl}`);
    }
    if (noCache) {
      core.info('Caching disabled');
    }

    // Setup nrz
    const result = await setupNrz(nrzVersion, nrzVersionFile, registryUrl, noCache);

    // Set outputs
    core.setOutput('nrz-version', result.nrzVersion);
    core.setOutput('nrz-path', result.nrzPath);
    core.setOutput('cache-hit', result.cacheHit.toString());

    // Store values for post action
    core.saveState('nrz-version', result.nrzVersion);
    core.saveState('cache-hit', result.cacheHit.toString());
    core.saveState('no-cache', noCache.toString());

    core.info(`✅ Successfully setup nrz ${result.nrzVersion}`);
    core.info(`nrz path: ${result.nrzPath}`);
    core.info(`Cache hit: ${result.cacheHit}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${message}`);
  }
}

// Run the action
if (require.main === module) {
  run();
}

export { run };
