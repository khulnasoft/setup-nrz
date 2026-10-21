import * as core from '@actions/core';
import { saveCacheIfNeeded } from './setup';

/**
 * Post action entry point - saves nrz installation to cache
 */
async function run(): Promise<void> {
  try {
    // Retrieve state from main action
    const nrzVersion = core.getState('nrz-version');
    const cacheHit = core.getState('cache-hit') === 'true';
    const noCache = core.getState('no-cache') === 'true';

    if (!nrzVersion) {
      core.info('No nrz version state found, skipping cache save');
      return;
    }

    core.info(`📦 Post-action: Saving nrz ${nrzVersion} to cache...`);

    await saveCacheIfNeeded(nrzVersion, cacheHit, noCache);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    core.warning(`Cache save failed: ${message}`);
    // Don't fail the entire workflow if cache save fails
  }
}

// Run the post action
if (require.main === module) {
  run();
}

export { run };
