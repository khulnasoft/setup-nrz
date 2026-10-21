import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  engines?: {
    nrz?: string;
  };
  packageManager?: string;
}

/**
 * Resolve nrz version from various sources
 */
export async function resolveNrzVersion(version: string, versionFile?: string): Promise<string> {
  // If version file is specified, read from it
  if (versionFile) {
    const resolvedVersion = await readVersionFromFile(versionFile);
    if (resolvedVersion) {
      return resolveActualVersion(resolvedVersion);
    }
  }

  // If version is 'latest', return as-is (will be resolved during npm install)
  if (version === 'latest') {
    return version;
  }

  // For specific versions or semver ranges, resolve to exact version
  return resolveActualVersion(version);
}

/**
 * Read version from a file (.nrz-version or package.json)
 */
async function readVersionFromFile(filePath: string): Promise<string | null> {
  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    core.warning(`Version file not found: ${fullPath}`);
    return null;
  }

  try {
    if (filePath.endsWith('.nrz-version')) {
      const content = fs.readFileSync(fullPath, 'utf-8').trim();
      core.info(`Read nrz version from ${filePath}: ${content}`);
      return content;
    }

    if (filePath.endsWith('package.json')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const packageJson: PackageJson = JSON.parse(content);

      // Check engines.nrz first
      if (packageJson.engines?.nrz) {
        core.info(`Read nrz version from ${filePath} engines.nrz: ${packageJson.engines.nrz}`);
        return packageJson.engines.nrz;
      }

      // Check packageManager field (e.g., "nrz@1.0.0")
      if (packageJson.packageManager?.startsWith('nrz@')) {
        const version = packageJson.packageManager.substring(4);
        core.info(`Read nrz version from ${filePath} packageManager: ${version}`);
        return version;
      }

      core.warning(`No nrz version found in ${filePath} (checked engines.nrz and packageManager)`);
      return null;
    }

    core.warning(`Unsupported version file format: ${filePath}`);
    return null;
  } catch (error) {
    core.warning(`Failed to read version from ${filePath}: ${error}`);
    return null;
  }
}

/**
 * Resolve semver range or version to exact version using npm view
 */
async function resolveActualVersion(versionSpec: string): Promise<string> {
  // If it's already a specific version (not a range), return as-is
  if (/^\d+\.\d+\.\d+(-.*)?$/.test(versionSpec)) {
    return versionSpec;
  }

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

    await exec.exec('npm', ['view', `nrz@${versionSpec}`, 'version', '--json'], options);

    const result = JSON.parse(output.trim());

    // npm view returns either a string (single version) or array (multiple versions)
    const resolvedVersion = Array.isArray(result) ? result[result.length - 1] : result;

    core.info(`Resolved nrz@${versionSpec} to ${resolvedVersion}`);
    return resolvedVersion;
  } catch (error) {
    core.warning(`Failed to resolve version ${versionSpec} via npm view: ${error}`);
    return versionSpec; // Fallback to original spec
  }
}

/**
 * Get the latest available nrz version from npm
 */
export async function getLatestNrzVersion(): Promise<string> {
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

    await exec.exec('npm', ['view', 'nrz@latest', 'version'], options);
    return output.trim();
  } catch (error) {
    core.warning(`Failed to fetch latest nrz version: ${error}`);
    return 'latest'; // Fallback
  }
}
