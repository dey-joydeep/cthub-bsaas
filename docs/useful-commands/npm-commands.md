# Essential npm Commands

## Package Installation

```bash
# Install all dependencies (from package.json)
npm install

# Install a package and save to dependencies
npm install <package-name>

# Install a dev dependency
npm install --save-dev <package-name>

# Install a package globally
npm install -g <package-name>
```

## Package Management

```bash
# Update a package to latest version
npm update <package-name>

# Update all packages (respecting semver in package.json)
npm update

# Update package.json to match installed versions
npm install -g npm-check-updates
ncu -u
npm install

# Check for outdated packages
npm outdated

# Remove a package
npm uninstall <package-name>
```

## Version Management

```bash
# Bump package version (patch, minor, major)
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.1 → 1.1.0
npm version major  # 1.1.0 → 2.0.0

# View current versions
npm list           # Local packages
npm list -g        # Global packages
npm view <package> versions  # All versions of a package
```

## Scripts & Running

```bash
# Run a script defined in package.json
npm run <script-name>

# List available scripts
npm run

# Run tests
npm test

# Start the application
npm start
```

## Audit & Security

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities (auto-install compatible updates)
npm audit fix

# Force audit fix (may include breaking changes)
npm audit fix --force
```

## Cache & Cleanup

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules/
npm install

# Prune unused packages
npm prune
```

## Workspaces (Monorepo)

```bash
# Run command in all workspaces
npm run <command> -ws

# Run command in a specific workspace
npm run <command> -w <workspace-name>

# Add dependency to a specific workspace
npm install <package> -w <workspace-name>
```

## Publishing

```bash
# Login to npm
npm login

# Publish package
npm publish

# Publish with public access
npm publish --access public
```
