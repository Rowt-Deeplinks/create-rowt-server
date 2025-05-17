#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');
const crypto = require('crypto');

// Function to generate a secure random string
function generateSecureRandomString(length = 32) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

// Function to generate a secure password
function generateSecurePassword(length = 16) {
  // Define character sets for password complexity
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  
  // Ensure at least one character from each type
  let password = '';
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  // Fill the rest with random characters from all sets
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

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
  const config = await prompts([
    {
      type: 'select',
      name: 'tenantMode',
      message: 'Select tenant mode:',
      choices: [
        { title: 'Single-tenant (RECOMMENDED)', value: 'single-tenant' },
        { title: 'Multi-tenant', value: 'multi-tenant' },
      ],
      initial: 0,
    },
    {
      type: 'select',
      name: 'databaseType',
      message: 'Select database type:',
      choices: [
        { title: 'PostgreSQL', value: 'postgres' },
        { title: 'SQLite', value: 'sqlite' },
      ],
      initial: 0,
    }
  ]);

  // Generate secure values
  const jwtSecret = generateSecureRandomString(48);
  const adminPassword = generateSecurePassword(20);
  // Generate a random UUID for the admin user
  const adminUuid = crypto.randomUUID();
  
  // Create project
  console.log(`\nCreating ${projectName}...`);
  fs.copySync(path.join(__dirname, 'template'), targetDir);

  // Copy and update .env
  fs.moveSync(
    path.join(targetDir, '.env.example'),
    path.join(targetDir, '.env'),
  );

  // Create properly prefixed .env file with secure random values
  const envContent = `# Rowt Server Configuration
ROWT_TENANT_MODE=${config.tenantMode}

# Database Configuration
${config.databaseType === 'sqlite' 
  ? `ROWT_DATABASE_URL=sqlite:${projectName}.sqlite` 
  : 'ROWT_DATABASE_URL=postgresql://username:password@localhost:5432/rowt'}
ROWT_DB_TYPE=${config.databaseType}
${config.databaseType === 'postgres' ? 'ROWT_DB_SSL=true' : ''}

# Server Configuration
ROWT_JWT_SECRET=${jwtSecret}
PORT=3000

# Single Tenant Admin (only for single-tenant mode)
ROWT_ADMIN_EMAIL=admin@example.com
ROWT_ADMIN_PASSWORD=${adminPassword}
ROWT_ADMIN_UUID=${adminUuid}

${config.tenantMode === 'multi-tenant' ? 
'# Multi Tenant (only for multi-tenant mode and if you want to use the Stripe integration)\n# STRIPE_SECRET_KEY=sk_test_...\n# STRIPE_WEBHOOK_SECRET=whsec_...' : ''}
`;

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

# Database
*.sqlite
*.sqlite3
`;

  fs.writeFileSync(path.join(targetDir, '.gitignore'), gitignoreContent.trim());

  // Update package.json
  const packagePath = path.join(targetDir, 'package.json');
  const packageJson = fs.readJsonSync(packagePath);
  packageJson.name = projectName;
  
  // Conditionally add SQLite dependency if selected
  if (config.databaseType === 'sqlite') {
    packageJson.dependencies.sqlite3 = "^5.1.7";
  } else {
    // For postgres, ensure pg is included
    packageJson.dependencies.pg = "^8.14.0";
  }
  
  fs.writeJsonSync(packagePath, packageJson, { spaces: 2 });

  console.log('\n✅ Success!');
  console.log(`\ncd ${projectName}`);
  console.log('npm install');
  
  if (config.databaseType === 'postgres') {
    console.log('Update ROWT_DATABASE_URL in .env with your database connection string');
  } else {
    console.log('SQLite database will be created automatically');
  }
  
  console.log('npm run build');
  console.log('npm run start\n');
  
  // Display security credentials
  console.log('Unique JWT_SECRET generated for your server');
  console.log('---------------------------------------');
  console.log('IMPORTANT: SAVE THESE CREDENTIALS');
  console.log('---------------------------------------');
  console.log(`Admin Email: admin@example.com`);
  console.log(`Admin Password: ${adminPassword}`);
  console.log(`Admin UUID: ${adminUuid}`);
  console.log('---------------------------------------');
  console.log('These credentials are stored in your .env file');
  console.log('---------------------------------------\n');
  
  console.log(`View the documentation at https://docs.rowt.app`);
}

init().catch(console.error);