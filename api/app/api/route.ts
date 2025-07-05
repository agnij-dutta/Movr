import { NextResponse } from 'next/server';

export async function GET() {
  const endpoints = {
    message: 'movr CLI API Backend',
    version: '1.0.0',
    endpoints: {
      init: {
        method: 'POST',
        path: '/api/init',
        description: 'Initialize a new Move package',
        body: {
          packageName: 'string (required)',
          options: {
            network: 'string (optional)',
            verbose: 'boolean (optional)'
          }
        }
      },
      publish: {
        method: 'POST',
        path: '/api/publish',
        description: 'Publish a Move package to IPFS',
        body: {
          packagePath: 'string (required)',
          options: {
            network: 'string (optional)',
            verbose: 'boolean (optional)'
          }
        }
      },
      install: {
        method: 'POST',
        path: '/api/install',
        description: 'Install a Move package from IPFS',
        body: {
          packageName: 'string (required)',
          options: {
            network: 'string (optional)',
            verbose: 'boolean (optional)'
          }
        }
      },
      search: {
        methods: ['GET', 'POST'],
        path: '/api/search',
        description: 'Search for Move packages',
        body: {
          query: 'string (required)',
          options: {
            network: 'string (optional)',
            verbose: 'boolean (optional)'
          }
        },
        query: {
          q: 'string (required for GET)',
          network: 'string (optional)',
          verbose: 'boolean (optional)'
        }
      },
      endorse: {
        method: 'POST',
        path: '/api/endorse',
        description: 'Endorse a Move package',
        body: {
          packageName: 'string (required)',
          options: {
            network: 'string (optional)',
            verbose: 'boolean (optional)'
          }
        }
      },
      tip: {
        method: 'POST',
        path: '/api/tip',
        description: 'Send a tip to a package author',
        body: {
          packageName: 'string (required)',
          amount: 'string (required)',
          options: {
            network: 'string (optional)',
            verbose: 'boolean (optional)'
          }
        }
      },
      wallet: {
        methods: ['GET', 'POST'],
        path: '/api/wallet',
        description: 'Manage wallet operations',
        body: {
          subcommand: 'string (required)',
          options: {
            network: 'string (optional)',
            verbose: 'boolean (optional)'
          }
        },
        query: {
          subcommand: 'string (optional, defaults to "balance")',
          network: 'string (optional)',
          verbose: 'boolean (optional)'
        }
      },
      ipfs: {
        methods: ['GET', 'POST'],
        path: '/api/ipfs',
        description: 'IPFS operations',
        body: {
          subcommand: 'string (required)',
          args: 'array (optional)',
          options: {
            network: 'string (optional)',
            verbose: 'boolean (optional)'
          }
        },
        query: {
          subcommand: 'string (optional, defaults to "status")',
          network: 'string (optional)',
          verbose: 'boolean (optional)'
        }
      }
    }
  };

  return NextResponse.json(endpoints, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 