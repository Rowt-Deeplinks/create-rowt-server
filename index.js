#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');

async function init() {
  // Get project name from args or prompt
  let projectName = process.argv[2];

  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-rowt-server',
    });
    projectName = response.projectName;
  }

  const targetDir = path.join(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.error(`Error: Directory ${projectName} already exists`);
    process.exit(1);
  }

  // Ask for configuration
  const config = await prompts({
    type: 'select',
    name: 'tenantMode',
    message: 'Select tenant mode:',
    choices: [
      { title: 'Single-tenant (RECOMMENDED)', value: 'single-tenant' },
      { title: 'Multi-tenant', value: 'multi-tenant' },
    ],
    initial: 0,
  });

  // Create project
  console.log(`\nCreating ${projectName}...`);
  fs.copySync(path.join(__dirname, 'template'), targetDir);

  // Copy and update .env
  fs.moveSync(
    path.join(targetDir, '.env.example'),
    path.join(targetDir, '.env'),
  );

  // Update .env with selected mode
  let envContent = fs.readFileSync(path.join(targetDir, '.env'), 'utf8');
  envContent = envContent.replace(
    'TENANT_MODE=single-tenant',
    `TENANT_MODE=${config.tenantMode}`,
  );

  if (config.tenantMode === 'multi-tenant') {
    envContent +=
      '\n# Multi-tenant configuration\nSTRIPE_SECRET_KEY=\nSTRIPE_WEBHOOK_SECRET=\n';
  }

  fs.writeFileSync(path.join(targetDir, '.env'), envContent);

  // Create .gitignore
  const gitignoreContent = `
# Dependencies
node_modules/
/node_modules

# Production
dist/
build/

# Environment
.env
.env.local
.env.production

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo

# Testing
coverage/
.nyc_output/

# Misc
*.pem
.npm
`;

  fs.writeFileSync(path.join(targetDir, '.gitignore'), gitignoreContent.trim());

  // Update package.json
  const packagePath = path.join(targetDir, 'package.json');
  const packageJson = fs.readJsonSync(packagePath);
  packageJson.name = projectName;
  fs.writeJsonSync(packagePath, packageJson, { spaces: 2 });

  console.log('\n✅ Success!');
  console.log(`\ncd ${projectName}`);
  console.log('npm install');
  console.log('Add your database connection string to .env');
  console.log('npm run build\n');
  console.log('npm run start\n');
  console.log(`View the documentation at https://docs.rowt.app`);
}

init().catch(console.error);
