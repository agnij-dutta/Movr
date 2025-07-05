import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

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
    // Use the compiled JavaScript version instead of the broken binary
    this.cliPath = `node ${path.join(process.cwd(), '..', 'cli', 'dist', 'bin', 'cli.js')}`;
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