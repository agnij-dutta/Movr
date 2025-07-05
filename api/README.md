# movr CLI API Backend

A Next.js API backend that wraps the movr CLI functionality, allowing your frontend to interact with the CLI commands through HTTP endpoints.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- The movr CLI binary must be available in `../cli/cli_binaries/movr-linux`

### Installation

1. Install dependencies:
   ```bash
   cd api
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3001`

3. For production:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Base URL
- Development: `http://localhost:3001`
- All endpoints are under `/api/`

### Available Endpoints

#### 1. **GET /api**
Returns information about available endpoints.

#### 2. **POST /api/init**
Initialize a new Move package.

**Request Body:**
```json
{
  "packageName": "my-package",
  "options": {
    "network": "testnet",
    "verbose": true
  }
}
```

#### 3. **POST /api/publish**
Publish a Move package to IPFS.

**Request Body:**
```json
{
  "packagePath": "/path/to/package",
  "options": {
    "network": "testnet",
    "verbose": true
  }
}
```

#### 4. **POST /api/install**
Install a Move package from IPFS.

**Request Body:**
```json
{
  "packageName": "package-name",
  "options": {
    "network": "testnet",
    "verbose": true
  }
}
```

#### 5. **GET|POST /api/search**
Search for Move packages.

**POST Request Body:**
```json
{
  "query": "search term",
  "options": {
    "network": "testnet",
    "verbose": true
  }
}
```

**GET Query Parameters:**
- `q` (required): Search query
- `network` (optional): Network to use
- `verbose` (optional): Enable verbose output

**Example GET request:**
```
GET /api/search?q=defi&network=testnet&verbose=true
```

#### 6. **POST /api/endorse**
Endorse a Move package.

**Request Body:**
```json
{
  "packageName": "package-name",
  "options": {
    "network": "testnet",
    "verbose": true
  }
}
```

#### 7. **POST /api/tip**
Send a tip to a package author.

**Request Body:**
```json
{
  "packageName": "package-name",
  "amount": "1000000",
  "options": {
    "network": "testnet",
    "verbose": true
  }
}
```

#### 8. **GET|POST /api/wallet**
Manage wallet operations.

**POST Request Body:**
```json
{
  "subcommand": "balance",
  "options": {
    "network": "testnet",
    "verbose": true
  }
}
```

**GET Query Parameters:**
- `subcommand` (optional): Wallet subcommand (defaults to "balance")
- `network` (optional): Network to use
- `verbose` (optional): Enable verbose output

#### 9. **GET|POST /api/ipfs**
IPFS operations.

**POST Request Body:**
```json
{
  "subcommand": "status",
  "args": ["arg1", "arg2"],
  "options": {
    "network": "testnet",
    "verbose": true
  }
}
```

**GET Query Parameters:**
- `subcommand` (optional): IPFS subcommand (defaults to "status")
- `network` (optional): Network to use
- `verbose` (optional): Enable verbose output

## Response Format

All endpoints return responses in the following format:

### Success Response
```json
{
  "success": true,
  "data": "response data or parsed JSON",
  "stdout": "raw stdout from CLI",
  "stderr": "raw stderr from CLI"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "stdout": "raw stdout from CLI (if any)",
  "stderr": "raw stderr from CLI (if any)"
}
```

## CORS

The API includes CORS headers to allow cross-origin requests from your frontend applications.

## Error Handling

- **400 Bad Request**: Missing required parameters
- **500 Internal Server Error**: CLI execution failed or internal error

## Integration with Frontend

You can integrate this API with your frontend by making HTTP requests to the endpoints. Example using JavaScript fetch:

```javascript
// Search for packages
const searchPackages = async (query) => {
  const response = await fetch('http://localhost:3001/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      options: {
        network: 'testnet'
      }
    })
  });
  
  const result = await response.json();
  return result;
};

// Install a package
const installPackage = async (packageName) => {
  const response = await fetch('http://localhost:3001/api/install', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      packageName: packageName,
      options: {
        network: 'testnet'
      }
    })
  });
  
  const result = await response.json();
  return result;
};
```

## Development

### File Structure
```
api/
├── app/
│   └── api/
│       ├── route.ts          # Main API endpoint
│       ├── init/
│       │   └── route.ts      # Init endpoint
│       ├── publish/
│       │   └── route.ts      # Publish endpoint
│       ├── install/
│       │   └── route.ts      # Install endpoint
│       ├── search/
│       │   └── route.ts      # Search endpoint
│       ├── endorse/
│       │   └── route.ts      # Endorse endpoint
│       ├── tip/
│       │   └── route.ts      # Tip endpoint
│       ├── wallet/
│       │   └── route.ts      # Wallet endpoint
│       └── ipfs/
│           └── route.ts      # IPFS endpoint
├── lib/
│   └── cli-executor.ts       # CLI execution utility
├── package.json
├── next.config.js
├── tsconfig.json
└── README.md
```

### Environment Variables

The API uses the CLI binary from `../cli/cli_binaries/movr-linux`. If you need to change the CLI path, modify the `CLIExecutor` constructor in `lib/cli-executor.ts`.

## Troubleshooting

1. **CLI binary not found**: Ensure the movr CLI binary exists at `../cli/cli_binaries/movr-linux`
2. **Permission denied**: Make sure the CLI binary has execute permissions
3. **Timeout errors**: CLI operations timeout after 30 seconds by default
4. **CORS issues**: The API includes CORS headers, but make sure your frontend is making requests to the correct port (3001)

## License

MIT License - see the main project LICENSE file for details. 