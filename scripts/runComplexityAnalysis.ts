#!/usr/bin/env ts-node

/**
 * Task Complexity Analysis Runner
 * CLI tool for analyzing task complexity from command line or file input
 */

import * as fs from 'fs';
import * as path from 'path';
import { estimateTaskComplexity, generateComplexityReport } from '../src/utils/taskComplexityEstimator';
import { runComplexityAnalysisExamples } from '../examples/complexityAnalysisExamples';

// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
Task Complexity Estimator CLI

Usage:
  npm run analyze:task <command> [options]

Commands:
  analyze "<task>"          - Analyze a single task description
  file <path>              - Analyze tasks from a file (one per line)
  examples                 - Run example analyses
  interactive              - Start interactive mode
  help                     - Show this help message

Examples:
  npm run analyze:task analyze "Build a REST API with authentication"
  npm run analyze:task file ./tasks.txt
  npm run analyze:task examples
  npm run analyze:task interactive

File Format (tasks.txt):
  Create user registration form
  Implement payment processing
  Build admin dashboard
  Set up CI/CD pipeline
`);
}

function analyzeTask(taskDescription: string) {
  console.log('='.repeat(80));
  console.log('TASK COMPLEXITY ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Task: "${taskDescription}"`);
  console.log('\n' + generateComplexityReport(taskDescription));
}

function analyzeTasksFromFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found - ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const tasks = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  if (tasks.length === 0) {
    console.error('Error: No tasks found in file');
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('BATCH TASK COMPLEXITY ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Analyzing ${tasks.length} tasks from: ${filePath}\n`);

  let totalScore = 0;
  const results: Array<{ task: string, score: any }> = [];

  tasks.forEach((task, index) => {
    console.log(`--- Task ${index + 1}/${tasks.length} ---`);
    console.log(`Description: "${task}"`);
    
    const result = estimateTaskComplexity(task);
    results.push({ task, score: result });
    totalScore += result.totalScore;

    console.log(`Category: ${result.category}`);
    console.log(`Score: ${result.totalScore.toFixed(1)}/20`);
    console.log(`Effort: ${result.analysis.estimatedEffort}`);
    console.log(`Domains: ${result.breakdown.technicalDomains.map(d => d.domain).join(', ') || 'None'}`);
    console.log(`Recommendations: ${result.recommendations[0] || 'None'}\n`);
  });

  // Generate summary
  console.log('='.repeat(80));
  console.log('BATCH ANALYSIS SUMMARY');
  console.log('='.repeat(80));

  const categories: { [key: string]: number } = {};
  results.forEach(({ score }) => {
    categories[score.category] = (categories[score.category] || 0) + 1;
  });

  console.log(`Total Tasks: ${tasks.length}`);
  console.log(`Average Complexity: ${(totalScore / tasks.length).toFixed(1)}/20`);
  console.log('\nComplexity Distribution:');
  
  Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      const percentage = ((count / tasks.length) * 100).toFixed(1);
      console.log(`  ${category}: ${count} tasks (${percentage}%)`);
    });

  console.log('\nHighest Complexity Tasks:');
  results
    .sort((a, b) => b.score.totalScore - a.score.totalScore)
    .slice(0, 3)
    .forEach(({ task, score }, index) => {
      console.log(`  ${index + 1}. "${task.substring(0, 60)}${task.length > 60 ? '...' : ''}" (${score.totalScore.toFixed(1)})`);
    });

  // Save detailed report if requested
  const reportPath = path.join(process.cwd(), 'complexity-analysis-report.json');
  const detailedReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTasks: tasks.length,
      averageComplexity: totalScore / tasks.length,
      distribution: categories
    },
    tasks: results.map(({ task, score }) => ({
      task,
      category: score.category,
      totalScore: score.totalScore,
      confidence: score.confidence,
      estimatedEffort: score.analysis.estimatedEffort,
      technicalDomains: score.breakdown.technicalDomains.map((d: any) => d.domain),
      recommendations: score.recommendations
    }))
  };

  fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);
}

async function interactiveMode() {
  const readline = require('readline');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('='.repeat(80));
  console.log('INTERACTIVE TASK COMPLEXITY ANALYZER');
  console.log('='.repeat(80));
  console.log('Enter task descriptions to analyze. Type "exit" to quit.\n');

  function askForTask(): Promise<void> {
    return new Promise((resolve) => {
      rl.question('Enter task description: ', (answer) => {
        if (answer.toLowerCase() === 'exit') {
          rl.close();
          resolve();
          return;
        }

        if (answer.trim()) {
          console.log('\n' + '-'.repeat(60));
          analyzeTask(answer);
          console.log('-'.repeat(60) + '\n');
        }

        askForTask().then(resolve);
      });
    });
  }

  await askForTask();
}

// Main execution
async function main() {
  try {
    switch (command) {
      case 'analyze':
        if (args[1]) {
          analyzeTask(args[1]);
        } else {
          console.error('Error: Task description required');
          console.log('Usage: npm run analyze:task analyze "your task description"');
          process.exit(1);
        }
        break;

      case 'file':
        if (args[1]) {
          analyzeTasksFromFile(args[1]);
        } else {
          console.error('Error: File path required');
          console.log('Usage: npm run analyze:task file ./path/to/tasks.txt');
          process.exit(1);
        }
        break;

      case 'examples':
        runComplexityAnalysisExamples();
        break;

      case 'interactive':
        await interactiveMode();
        break;

      case 'help':
      case undefined:
        showHelp();
        break;

      default:
        console.error(`Error: Unknown command "${command}"`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { main, analyzeTask, analyzeTasksFromFile, interactiveMode };