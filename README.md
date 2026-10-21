# Setup nrz Action

[![CI](https://github.com/khulnasoft/setup-nrz/actions/workflows/ci.yml/badge.svg)](https://github.com/khulnasoft/setup-nrz/actions/workflows/ci.yml)
[![Integration Tests](https://github.com/khulnasoft/setup-nrz/actions/workflows/test.yml/badge.svg)](https://github.com/khulnasoft/setup-nrz/actions/workflows/test.yml)

Set up your GitHub Actions workflow with [nrz](https://nrz.khulnasoft.com) — the next-gen JavaScript package manager.

## Features

- 🚀 **Fast installation** via npm global install
- 📦 **Smart caching** to speed up subsequent runs
- 🎯 **Version flexibility** - latest, specific versions, or semver ranges
- 📄 **Version files** - read from package.json or .nrz-version
- 🌐 **Custom registries** supported
- ✅ **Cross-platform** - works on Ubuntu, macOS, and Windows

## Usage

### Basic Usage

```yaml
- name: Setup nrz
  uses: khulnasoft/setup-nrz@v1
  with:
    nrz-version: 'latest'

- name: Install dependencies
  run: nrz install

- name: Run tests
  run: nrz run test
```

### Specific Version

```yaml
- name: Setup nrz
  uses: khulnasoft/setup-nrz@v1
  with:
    nrz-version: '1.0.0-rc.18'
```

### Version from File

```yaml
# Read from package.json engines.nrz or packageManager field
- name: Setup nrz
  uses: khulnasoft/setup-nrz@v1
  with:
    nrz-version-file: 'package.json'

# Or read from a .nrz-version file
- name: Setup nrz
  uses: khulnasoft/setup-nrz@v1
  with:
    nrz-version-file: '.nrz-version'
```

### Custom Registry

```yaml
- name: Setup nrz
  uses: khulnasoft/setup-nrz@v1
  with:
    nrz-version: 'latest'
    registry-url: 'https://your-private-registry.com'
```

### Disable Caching

```yaml
- name: Setup nrz
  uses: khulnasoft/setup-nrz@v1
  with:
    nrz-version: '1.0.0-rc.18'
    no-cache: 'true'
```

### Complete Example

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup nrz
        uses: khulnasoft/setup-nrz@v1
        id: setup-nrz
        with:
          nrz-version: '^1.0.0'
          nrz-version-file: 'package.json'

      - name: Print nrz version
        run: |
          echo "Installed nrz version: ${{ steps.setup-nrz.outputs.nrz-version }}"
          echo "nrz path: ${{ steps.setup-nrz.outputs.nrz-path }}"
          echo "Cache hit: ${{ steps.setup-nrz.outputs.cache-hit }}"

      - name: Install dependencies
        run: nrz install

      - name: Run linter
        run: nrz run lint

      - name: Run tests
        run: nrz run test

      - name: Build
        run: nrz run build
```

## Inputs

| Input              | Description                                                         | Default               | Required |
| ------------------ | ------------------------------------------------------------------- | --------------------- | -------- |
| `nrz-version`      | The version of nrz to install (e.g. "latest", "1.0.0-rc.18", "1.x") | `latest`              | No       |
| `nrz-version-file` | File to read nrz version from (e.g. "package.json", ".nrz-version") |                       | No       |
| `registry-url`     | The npm registry URL to use for installing nrz                      |                       | No       |
| `no-cache`         | Disable caching of nrz installation                                 | `false`               | No       |
| `token`            | GitHub token for API requests (helps avoid rate limiting)           | `${{ github.token }}` | No       |

## Outputs

| Output        | Description                                          |
| ------------- | ---------------------------------------------------- |
| `nrz-version` | The version of nrz that was installed                |
| `nrz-path`    | The path to the nrz executable                       |
| `cache-hit`   | Whether the nrz installation was restored from cache |

## Version Resolution

The action supports several ways to specify which version of nrz to install:

### 1. Exact Version

```yaml
nrz-version: '1.0.0-rc.18' # Installs exactly this version
```

### 2. Latest Version

```yaml
nrz-version: 'latest' # Installs the latest available version
```

### 3. Semver Range

```yaml
nrz-version: '^1.0.0' # Installs the latest 1.x version
nrz-version: '1.x' # Same as above
```

### 4. Version Files

#### package.json

The action can read the version from your `package.json` in two ways:

```json
{
  "engines": {
    "nrz": "^1.0.0"
  }
}
```

Or from the `packageManager` field:

```json
{
  "packageManager": "nrz@1.0.0-rc.18"
}
```

#### .nrz-version file

Create a `.nrz-version` file in your repository root:

```
1.0.0-rc.18
```

## Caching

The action automatically caches nrz installations to speed up subsequent workflow runs. The cache key is based on:

- nrz version
- Operating system
- CPU architecture

Caching behavior:

- ✅ **Enabled by default** for specific versions
- ❌ **Disabled for `latest`** (since it can change)
- 🚫 **Can be disabled** with `no-cache: 'true'`

Cache is saved after the main action completes successfully and restored at the beginning of subsequent runs.

## nrz Binaries

After installation, the following binaries are available in your PATH:

- `nrz` - Main nrz package manager
- `vlr` - nrz runner
- `vlx` - nrz executor
- `vlrx` - nrz runner executor
- `vlxl` - nrz executor with logging

## Comparison with Manual Installation

### ❌ Manual Installation

```yaml
- name: Install nrz manually
  run: |
    npm install -g nrz@1.0.0-rc.18
    echo "$(npm bin -g)" >> $GITHUB_PATH
```

### ✅ setup-nrz Action

```yaml
- name: Setup nrz
  uses: khulnasoft/setup-nrz@v1
  with:
    nrz-version: '1.0.0-rc.18'
```

**Benefits of using the action:**

- 🚀 **Faster** - intelligent caching
- 🔧 **Easier** - no PATH management needed
- 🎯 **Flexible** - version files and semver ranges
- 🛡️ **Reliable** - installation verification
- 📊 **Observable** - outputs for version and paths

## Supported Platforms

- ✅ Ubuntu (ubuntu-latest, ubuntu-20.04, ubuntu-22.04)
- ✅ macOS (macos-latest, macos-12, macos-13, macos-14)
- ✅ Windows (windows-latest, windows-2019, windows-2022)

## About nrz

nrz is a next-generation JavaScript package manager that offers:

- ⚡ **Fast installations** with smart dependency resolution
- 🔒 **Secure by default** with built-in integrity checking
- 📦 **Workspace support** for monorepos
- 🎯 **Zero-config** for most projects
- 🔄 **Compatible** with npm ecosystem

Learn more at [nrz.khulnasoft.com](https://nrz.khulnasoft.com).

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.
