import { NextRequest, NextResponse } from 'next/server';
import { CLIExecutor } from '@/lib/cli-executor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageName, amount, options = {} } = body;

    if (!packageName) {
      return NextResponse.json(
        { success: false, error: 'Package name is required' },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { success: false, error: 'Amount is required' },
        { status: 400 }
      );
    }

    const cliExecutor = new CLIExecutor();
    const result = await cliExecutor.tip(packageName, amount, options);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
  } catch (error) {
    console.error('Tip API error:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 