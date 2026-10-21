import * as core from '@actions/core';
import * as cache from '@actions/cache';
import * as exec from '@actions/exec';
import * as path from 'path';
import {
  getCacheKey,
  getNpmGlobalBinPath,
  verifyNrzInstallation,
  addToPath,
  getInstalledNrzVersion,
} from './utils';
import { resolveNrzVersion } from './version';

export interface SetupResult {
  nrzVersion: string;
  nrzPath: string;
  cacheHit: boolean;
}

/**
 * Main setup function - installs nrz and configures PATH
 */
export async function setupNrz(
  requestedVersion: string,
  versionFile?: string,
  registryUrl?: string,
  noCache?: boolean
): Promise<SetupResult> {
  // Resolve the exact version to install
  const resolvedVersion = await resolveNrzVersion(requestedVersion, versionFile);
  core.info(`Setting up nrz version: ${resolvedVersion}`);

  // Check if nrz is already installed with the correct version
  const existingVersion = await getInstalledNrzVersion();
  if (existingVersion && existingVersion === resolvedVersion) {
    core.info(`nrz ${existingVersion} is already installed`);
    const binPath = await getNpmGlobalBinPath();
    const nrzPath = path.join(binPath, process.platform === 'win32' ? 'nrz.cmd' : 'nrz');
    return {
      nrzVersion: existingVersion,
      nrzPath,
      cacheHit: false,
    };
  }

  // Try to restore from cache
  let cacheHit = false;
  const cacheKey = getCacheKey(resolvedVersion);

  if (!noCache && cacheKey) {
    const binPath = await getNpmGlobalBinPath();
    const cachePaths = [binPath];

    core.info(`Attempting to restore nrz from cache with key: ${cacheKey}`);
    const restoredKey = await cache.restoreCache(cachePaths, cacheKey);

    if (restoredKey) {
      core.info('✅ Restored nrz from cache');
      cacheHit = true;

      // Verify the cached installation works
      try {
        const version = await verifyNrzInstallation();
        addToPath(binPath);
        const nrzPath = path.join(binPath, process.platform === 'win32' ? 'nrz.cmd' : 'nrz');
        return {
          nrzVersion: version,
          nrzPath,
          cacheHit: true,
        };
      } catch (error) {
        core.warning(`Cached nrz installation is broken: ${error}`);
        // Continue with fresh installation
      }
    }
  }

  // Install nrz via npm
  await installNrz(resolvedVersion, registryUrl);

  // Verify installation and get actual version
  const installedVersion = await verifyNrzInstallation();

  // Add npm global bin directory to PATH
  const binPath = await getNpmGlobalBinPath();
  addToPath(binPath);

  const nrzPath = path.join(binPath, process.platform === 'win32' ? 'nrz.cmd' : 'nrz');

  return {
    nrzVersion: installedVersion,
    nrzPath,
    cacheHit,
  };
}

/**
 * Install nrz via npm
 */
async function installNrz(version: string, registryUrl?: string): Promise<void> {
  const args = ['install', '-g', `nrz@${version}`];

  if (registryUrl) {
    args.push('--registry', registryUrl);
    core.info(`Using custom registry: ${registryUrl}`);
  }

  core.info(`Installing nrz@${version}...`);

  // Use ignoreReturnCode because npm may exit with code 1 due to
  // EBADENGINE warnings (nrz requires Node >=22.9.0 but the action
  // runner may have an older Node). The install still succeeds.
  const result = await exec.getExecOutput('npm', args, {
    ignoreReturnCode: true,
  });

  if (result.exitCode !== 0) {
    // Check if nrz was actually installed despite the non-zero exit
    const verifyResult = await exec
      .getExecOutput('nrz', ['--version'], {
        ignoreReturnCode: true,
        silent: true,
      })
      .catch(() => null);

    if (verifyResult && verifyResult.exitCode === 0) {
      core.warning(
        `npm exited with code ${result.exitCode} but nrz was installed successfully. ` +
          `This is likely due to engine compatibility warnings.`
      );
    } else {
      throw new Error(
        `Failed to install nrz@${version}: npm exited with code ${result.exitCode}\n${result.stderr}`
      );
    }
  }

  core.info('✅ nrz installed successfully');
}

/**
 * Save installation to cache (called by post action)
 */
export async function saveCacheIfNeeded(
  version: string,
  cacheHit: boolean,
  noCache?: boolean
): Promise<void> {
  if (noCache || cacheHit) {
    core.info('Skipping cache save (disabled or already cached)');
    return;
  }

  const cacheKey = getCacheKey(version);
  if (!cacheKey) {
    core.info('Skipping cache save (latest version or invalid cache key)');
    return;
  }

  try {
    const binPath = await getNpmGlobalBinPath();
    const cachePaths = [binPath];

    core.info(`Saving nrz installation to cache with key: ${cacheKey}`);
    await cache.saveCache(cachePaths, cacheKey);
    core.info('✅ Saved nrz installation to cache');
  } catch (error) {
    core.warning(`Failed to save nrz installation to cache: ${error}`);
  }
}
