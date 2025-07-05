import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export interface CLIResponse {
  success: boolean;
  data?: any;
  error?: string;
  stdout?: string;
  stderr?: string;
}

export class CLIExecutor {
  private cliPath: string;
  
  constructor() {
    // Get project root directory (parent of api)
    const PROJECT_ROOT = path.resolve(process.cwd(), '..');
    const CLI_DIST_PATH = path.join(PROJECT_ROOT, 'cli', 'dist', 'bin', 'cli.js');
    
    // Check if the CLI dist file exists
    if (fs.existsSync(CLI_DIST_PATH)) {
      this.cliPath = `node ${CLI_DIST_PATH}`;
    } else {
      // Fallback: try to find CLI in current directory structure
      const localCliPath = path.join(process.cwd(), 'cli', 'dist', 'bin', 'cli.js');
      if (fs.existsSync(localCliPath)) {
        this.cliPath = `node ${localCliPath}`;
      } else {
        // Last resort: try relative to api directory
        const relativeCliPath = path.join(__dirname, '..', '..', 'cli', 'dist', 'bin', 'cli.js');
        if (fs.existsSync(relativeCliPath)) {
          this.cliPath = `node ${relativeCliPath}`;
        } else {
          // If no CLI found, we'll have to use the binary approach
          const binaryPath = path.join(PROJECT_ROOT, 'cli', 'cli_binaries', 'movr-linux');
          if (fs.existsSync(binaryPath)) {
            this.cliPath = binaryPath;
          } else {
            throw new Error('CLI executable not found. Please ensure the CLI is built and available.');
          }
        }
      }
    }
    
    console.log(`CLI path resolved to: ${this.cliPath}`);
  }

  async executeCommand(command: string, args: string[] = [], options: any = {}): Promise<CLIResponse> {
    try {
      const fullCommand = `${this.cliPath} ${command} ${args.join(' ')}`;
      
      console.log(`Executing: ${fullCommand}`);
      
      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        timeout: options.timeout || 30000, // 30 second timeout
      });

      // Try to parse stdout as JSON, fallback to string
      let data;
      try {
        data = JSON.parse(stdout);
      } catch {
        data = stdout.trim();
      }

      return {
        success: true,
        data,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      };
    } catch (error: any) {
      console.error('CLI execution error:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        stdout: error.stdout || '',
        stderr: error.stderr || '',
      };
    }
  }

  async init(packageName: string, options: any = {}): Promise<CLIResponse> {
    const args = [packageName];
    if (options.network) args.push('--network', options.network);
    if (options.verbose) args.push('--verbose');
    
    return this.executeCommand('init', args, options);
  }

  async publish(packagePath: string, options: any = {}): Promise<CLIResponse> {
    const args = ['--package-path', packagePath];
    if (options.network) args.push('--network', options.network);
    if (options.verbose) args.push('--verbose');
    
    return this.executeCommand('publish', args, options);
  }

  async install(packageName: string, options: any = {}): Promise<CLIResponse> {
    const args = [packageName];
    if (options.network) args.push('--network', options.network);
    if (options.verbose) args.push('--verbose');
    
    return this.executeCommand('install', args, options);
  }

  async search(query: string, options: any = {}): Promise<CLIResponse> {
    const args = [query];
    if (options.network) args.push('--network', options.network);
    if (options.verbose) args.push('--verbose');
    
    return this.executeCommand('search', args, options);
  }

  async endorse(packageName: string, options: any = {}): Promise<CLIResponse> {
    const args = [packageName];
    if (options.network) args.push('--network', options.network);
    if (options.verbose) args.push('--verbose');
    
    return this.executeCommand('endorse', args, options);
  }

  async tip(packageName: string, amount: string, options: any = {}): Promise<CLIResponse> {
    const args = [packageName, amount];
    if (options.network) args.push('--network', options.network);
    if (options.verbose) args.push('--verbose');
    
    return this.executeCommand('tip', args, options);
  }

  async wallet(subcommand: string, options: any = {}): Promise<CLIResponse> {
    const args = [subcommand];
    if (options.network) args.push('--network', options.network);
    if (options.verbose) args.push('--verbose');
    
    return this.executeCommand('wallet', args, options);
  }

  async ipfs(subcommand: string, args: string[] = [], options: any = {}): Promise<CLIResponse> {
    const fullArgs = [subcommand, ...args];
    if (options.network) fullArgs.push('--network', options.network);
    if (options.verbose) fullArgs.push('--verbose');
    
    return this.executeCommand('ipfs', fullArgs, options);
  }
} 