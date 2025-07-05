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
  private cliPath: string = '';
  
  constructor() {
    // Priority order for finding CLI:
    // 1. Local copied CLI (for Vercel deployment)
    const localCliPath = path.join(process.cwd(), 'cli', 'dist', 'bin', 'cli.js');
    // 2. Vercel task environment
    const vercelCliPath = path.join('/var/task', 'cli', 'dist', 'bin', 'cli.js');
    // 3. Development environment (parent directory)
    const devCliPath = path.join(process.cwd(), '..', 'cli', 'dist', 'bin', 'cli.js');
    
    if (fs.existsSync(localCliPath)) {
      this.cliPath = `node ${localCliPath}`;
      console.log('Using local CLI path:', localCliPath);
    } else if (fs.existsSync(vercelCliPath)) {
      this.cliPath = `node ${vercelCliPath}`;
      console.log('Using Vercel CLI path:', vercelCliPath);
    } else if (fs.existsSync(devCliPath)) {
      this.cliPath = `node ${devCliPath}`;
      console.log('Using development CLI path:', devCliPath);
    } else {
      console.error('CLI not found in any expected location');
      console.error('Checked paths:', [localCliPath, vercelCliPath, devCliPath]);
      this.cliPath = 'echo "CLI not found"';
    }
  }

  private async executeCommand(command: string, args: string[] = [], options: any = {}): Promise<CLIResponse> {
    const cmd = `${this.cliPath} ${command} ${args.join(' ')}`;
    console.log('Executing CLI command:', cmd);
    
    try {
      // Set NODE_PATH to include CLI's node_modules
      const env = { 
        ...process.env,
        NODE_PATH: [
          path.join(process.cwd(), 'cli', 'node_modules'),
          path.join('/var/task', 'cli', 'node_modules'),
          path.join(process.cwd(), '..', 'cli', 'node_modules'),
          process.env.NODE_PATH
        ].filter(Boolean).join(path.delimiter)
      };
      
      const { stdout, stderr } = await execAsync(cmd, { timeout: 30000, env });
      
      // Try to parse JSON output, fallback to raw text
      let parsedData;
      try {
        parsedData = JSON.parse(stdout);
      } catch {
        parsedData = stdout.trim();
      }

      return {
        success: true,
        data: parsedData,
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
    const args = [`"${query}"`];
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