import * as os from 'os';
import * as core from '@actions/core';
import * as exec from '@actions/exec';

/**
 * Get the platform-specific npm global directory
 */
export async function getNpmGlobalPath(): Promise<string> {
  let output = '';
  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
    silent: true,
    ignoreReturnCode: true,
  };

  await exec.exec('npm', ['root', '-g'], options);
  return output.trim();
}

/**
 * Get the npm global bin directory
 */
export async function getNpmGlobalBinPath(): Promise<string> {
  let output = '';
  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
    silent: true,
    ignoreReturnCode: true,
  };

  // Try `npm prefix -g` + /bin first (works on all npm versions)
  await exec.exec('npm', ['prefix', '-g'], options);
  const prefix = output.trim();
  if (prefix) {
    const binDir = process.platform === 'win32' ? prefix : `${prefix}/bin`;
    return binDir;
  }

  // Fallback: npm bin -g (deprecated in npm 10+, may exit non-zero)
  output = '';
  await exec.exec('npm', ['bin', '-g'], options);
  return output.trim();
}

/**
 * Generate cache key for nrz installation
 */
export function getCacheKey(version: string): string {
  const platform = os.platform();
  const arch = os.arch();

  // Don't cache 'latest' as it can change
  if (version === 'latest') {
    return '';
  }

  return `setup-nrz-${version}-${platform}-${arch}`;
}

/**
 * Check if nrz is already installed and get its version
 */
export async function getInstalledNrzVersion(): Promise<string | null> {
  try {
    let output = '';
    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
      silent: true,
    };

    await exec.exec('nrz', ['--version'], options);
    return output.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Verify nrz installation by running --version
 */
export async function verifyNrzInstallation(): Promise<string> {
  try {
    let output = '';
    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
    };

    await exec.exec('nrz', ['--version'], options);
    const version = output.trim();
    core.info(`✅ nrz ${version} is installed and working`);
    return version;
  } catch (error) {
    throw new Error(`nrz installation verification failed: ${error}`);
  }
}

/**
 * Add directory to PATH
 */
export function addToPath(dirPath: string): void {
  core.addPath(dirPath);
  core.info(`Added ${dirPath} to PATH`);
}
