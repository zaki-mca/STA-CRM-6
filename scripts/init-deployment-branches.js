/**
 * Initialize Git Deployment Branches
 * 
 * This script helps initialize the git branches for deployment strategy.
 * It creates main, staging, and development branches if they don't exist.
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to execute commands safely
function execCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Function to check if a branch exists
function branchExists(branchName) {
  try {
    execSync(`git rev-parse --verify ${branchName}`, { encoding: 'utf8' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main function
async function initBranches() {
  console.log('\n📦 Initializing deployment branches...\n');
  
  // Check if git is initialized
  const gitCheck = execCommand('git status');
  if (!gitCheck.success) {
    console.error('Error: Git repository not initialized or not in the root folder.');
    process.exit(1);
  }
  
  // Get current branch
  const currentBranch = execCommand('git rev-parse --abbrev-ref HEAD').output.trim();
  console.log(`Current branch: ${currentBranch}`);
  
  // Check for uncommitted changes
  const hasChanges = execCommand('git status --porcelain').output.trim().length > 0;
  if (hasChanges) {
    console.warn('\n⚠️ You have uncommitted changes. Commit or stash them before continuing.\n');
    
    const answer = await askQuestion('Do you want to continue anyway? (y/N): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('Operation cancelled. Please commit your changes first.');
      process.exit(0);
    }
  }
  
  // Define branches to create
  const branches = ['main', 'staging', 'development'];
  
  // Check and create branches
  for (const branch of branches) {
    if (branchExists(branch)) {
      console.log(`✅ Branch '${branch}' already exists`);
    } else {
      console.log(`Creating branch '${branch}'...`);
      
      // If it's the first branch, create from current branch
      if (branch === 'main') {
        const result = execCommand(`git branch ${branch}`);
        if (result.success) {
          console.log(`✅ Created branch '${branch}'`);
        } else {
          console.error(`❌ Failed to create branch '${branch}': ${result.error}`);
        }
      } else {
        // Create subsequent branches from main
        const result = execCommand(`git checkout main && git branch ${branch} && git checkout ${currentBranch}`);
        if (result.success) {
          console.log(`✅ Created branch '${branch}' from main`);
        } else {
          console.error(`❌ Failed to create branch '${branch}': ${result.error}`);
        }
      }
    }
  }
  
  console.log('\n🎉 Branch initialization complete!');
  console.log('\nTo push these branches to remote, run:');
  console.log('  git push -u origin main staging development');
  
  rl.close();
}

// Utility to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Execute the script
initBranches().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 