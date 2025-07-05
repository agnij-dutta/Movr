import { NextRequest, NextResponse } from 'next/server';
import { CLIExecutor } from '@/lib/cli-executor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packagePath, options = {} } = body;

    if (!packagePath) {
      return NextResponse.json(
        { success: false, error: 'Package path is required' },
        { status: 400 }
      );
    }

    const cliExecutor = new CLIExecutor();
    const result = await cliExecutor.publish(packagePath, options);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
  } catch (error) {
    console.error('Publish API error:', error);
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