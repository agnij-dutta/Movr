import { NextRequest, NextResponse } from 'next/server';
import { CLIExecutor } from '@/lib/cli-executor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subcommand, options = {} } = body;

    if (!subcommand) {
      return NextResponse.json(
        { success: false, error: 'Wallet subcommand is required' },
        { status: 400 }
      );
    }

    const cliExecutor = new CLIExecutor();
    const result = await cliExecutor.wallet(subcommand, options);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subcommand = searchParams.get('subcommand') || 'balance';
    const network = searchParams.get('network');
    const verbose = searchParams.get('verbose') === 'true';

    const options = { network, verbose };
    const cliExecutor = new CLIExecutor();
    const result = await cliExecutor.wallet(subcommand, options);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 