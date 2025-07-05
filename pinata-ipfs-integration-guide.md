# Pinata IPFS Integration Guide for Aptos CLI

This guide explains how to integrate Pinata IPFS with the Aptos CLI for storing and retrieving off-chain data related to your Aptos blockchain projects.

## Prerequisites

- [Aptos CLI](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli/) installed
- [Node.js and npm](https://nodejs.org/) (v16 or higher) installed
- [Pinata account](https://app.pinata.cloud/register) (free or paid plan)

## Setting Up Pinata

### 1. Create a Pinata Account

1. Sign up at [Pinata Cloud](https://app.pinata.cloud/register)
2. Verify your email address
3. Log in to your Pinata dashboard

### 2. Generate API Keys

1. Navigate to the "API Keys" section in your Pinata dashboard
2. Click "New Key"
3. Set the following permissions:
   - Pinning: Enable all
   - IPFS: Enable all
   - Admin: Optional, based on your needs
4. Name your key (e.g., "Aptos CLI Integration")
5. Click "Create Key"
6. Save your JWT (you'll need it later)

### 3. Set Up Your Gateway

1. Navigate to the "Gateways" section in your Pinata dashboard
2. Note your default gateway URL or create a dedicated gateway
3. Save your gateway URL (e.g., `example-gateway.mypinata.cloud`)

## Integrating with Aptos CLI

### Option 1: Using the Pinata SDK Directly

1. Create a new directory for your integration:

```bash
mkdir aptos-pinata-integration
cd aptos-pinata-integration
npm init -y
```

2. Install required packages:

```bash
npm install pinata axios dotenv
```

3. Create a `.env` file:

```
PINATA_JWT=your_pinata_jwt_here
PINATA_GATEWAY=your-gateway.mypinata.cloud
```

4. Create a basic integration script (`pinata-service.js`):

```javascript
const { PinataSDK } = require("pinata");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Initialize Pinata client
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY
});

// Upload a file to IPFS
async function uploadFile(filePath, options = {}) {
  try {
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);
    
    const result = await pinata.upload.public.file(fileStream, {
      pinataMetadata: {
        name: fileName,
        ...options.metadata
      },
      pinataOptions: {
        cidVersion: 1,
        ...options.pinataOptions
      }
    });
    
    console.log(`File uploaded to IPFS with CID: ${result.IpfsHash}`);
    return result;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Upload JSON data to IPFS
async function uploadJSON(data, options = {}) {
  try {
    const result = await pinata.upload.public.json(data, {
      pinataMetadata: {
        name: options.name || "aptos-data",
        ...options.metadata
      },
      pinataOptions: {
        cidVersion: 1,
        ...options.pinataOptions
      }
    });
    
    console.log(`JSON uploaded to IPFS with CID: ${result.IpfsHash}`);
    return result;
  } catch (error) {
    console.error("Error uploading JSON:", error);
    throw error;
  }
}

// Retrieve data from IPFS
async function retrieveData(cid) {
  try {
    const data = await pinata.gateways.public.get(cid);
    return data;
  } catch (error) {
    console.error("Error retrieving data:", error);
    throw error;
  }
}

module.exports = {
  uploadFile,
  uploadJSON,
  retrieveData
};
```

5. Create a CLI wrapper script (`aptos-ipfs.js`):

```javascript
#!/usr/bin/env node
const { uploadFile, uploadJSON, retrieveData } = require("./pinata-service");
const fs = require("fs");

const command = process.argv[2];
const arg = process.argv[3];

async function main() {
  try {
    switch (command) {
      case "upload-file":
        if (!arg) {
          console.error("Please provide a file path");
          process.exit(1);
        }
        const result = await uploadFile(arg);
        console.log(JSON.stringify(result, null, 2));
        break;
        
      case "upload-json":
        if (!arg) {
          console.error("Please provide a JSON file path");
          process.exit(1);
        }
        const jsonData = JSON.parse(fs.readFileSync(arg, "utf8"));
        const jsonResult = await uploadJSON(jsonData, { name: arg });
        console.log(JSON.stringify(jsonResult, null, 2));
        break;
        
      case "retrieve":
        if (!arg) {
          console.error("Please provide a CID");
          process.exit(1);
        }
        const data = await retrieveData(arg);
        console.log(data);
        break;
        
      default:
        console.log("Available commands:");
        console.log("  upload-file <file_path>");
        console.log("  upload-json <json_file_path>");
        console.log("  retrieve <cid>");
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
```

6. Make the script executable:

```bash
chmod +x aptos-ipfs.js
```

7. Link the script to use it globally:

```bash
npm link
```

### Option 2: Extending the Aptos CLI

1. Clone the Aptos CLI repository (if you want to modify the CLI directly):

```bash
git clone https://github.com/aptos-labs/aptos-core.git
cd aptos-core/crates/aptos
```

2. Add a new module for IPFS integration in `cli/src/ipfs/pinata.rs`:

```rust
use anyhow::{bail, Result};
use reqwest::{
    header::{HeaderMap, HeaderValue, AUTHORIZATION},
    Client,
};
use serde::{Deserialize, Serialize};
use std::path::Path;
use tokio::fs::File;
use tokio_util::codec::{BytesCodec, FramedRead};

#[derive(Debug, Serialize, Deserialize)]
pub struct PinataResponse {
    pub ipfs_hash: String,
    pub pin_size: u64,
    pub timestamp: String,
}

pub struct PinataClient {
    client: Client,
    jwt: String,
    gateway: String,
}

impl PinataClient {
    pub fn new(jwt: String, gateway: String) -> Self {
        Self {
            client: Client::new(),
            jwt,
            gateway,
        }
    }

    pub async fn upload_file(&self, file_path: &Path) -> Result<PinataResponse> {
        let file = match File::open(file_path).await {
            Ok(file) => file,
            Err(e) => bail!("Failed to open file: {}", e),
        };

        let file_name = match file_path.file_name() {
            Some(name) => name.to_string_lossy().to_string(),
            None => bail!("Invalid file path"),
        };

        let stream = FramedRead::new(file, BytesCodec::new());
        let form = reqwest::multipart::Form::new()
            .part("file", reqwest::multipart::Part::stream(stream).file_name(file_name));

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", self.jwt))?,
        );

        let response = self
            .client
            .post("https://api.pinata.cloud/pinning/pinFileToIPFS")
            .headers(headers)
            .multipart(form)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            bail!("Failed to upload file: {}", error_text);
        }

        let pinata_response: PinataResponse = response.json().await?;
        Ok(pinata_response)
    }

    pub async fn upload_json(&self, json_data: serde_json::Value) -> Result<PinataResponse> {
        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", self.jwt))?,
        );
        headers.insert("Content-Type", HeaderValue::from_static("application/json"));

        let response = self
            .client
            .post("https://api.pinata.cloud/pinning/pinJSONToIPFS")
            .headers(headers)
            .json(&json_data)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            bail!("Failed to upload JSON: {}", error_text);
        }

        let pinata_response: PinataResponse = response.json().await?;
        Ok(pinata_response)
    }

    pub async fn retrieve_data(&self, cid: &str) -> Result<String> {
        let url = format!("https://{}/ipfs/{}", self.gateway, cid);
        
        let response = self.client.get(&url).send().await?;
        
        if !response.status().is_success() {
            let error_text = response.text().await?;
            bail!("Failed to retrieve data: {}", error_text);
        }
        
        let data = response.text().await?;
        Ok(data)
    }
}
```

3. Add commands to the CLI in `cli/src/commands/mod.rs`:

```rust
pub mod ipfs;
```

4. Create the command module in `cli/src/commands/ipfs.rs`:

```rust
use crate::ipfs::pinata::PinataClient;
use anyhow::Result;
use clap::Parser;
use std::path::PathBuf;
use tokio::fs;

/// Commands for interacting with IPFS via Pinata
#[derive(Parser)]
pub enum IpfsCommand {
    #[clap(subcommand)]
    Pinata(PinataCommand),
}

#[derive(Parser)]
pub enum PinataCommand {
    /// Upload a file to IPFS via Pinata
    UploadFile {
        /// Path to the file to upload
        #[clap(long, parse(from_os_str))]
        file: PathBuf,
        
        /// Pinata JWT token
        #[clap(long)]
        jwt: String,
        
        /// Pinata gateway domain
        #[clap(long)]
        gateway: String,
    },
    
    /// Upload JSON data to IPFS via Pinata
    UploadJson {
        /// Path to the JSON file to upload
        #[clap(long, parse(from_os_str))]
        file: PathBuf,
        
        /// Pinata JWT token
        #[clap(long)]
        jwt: String,
        
        /// Pinata gateway domain
        #[clap(long)]
        gateway: String,
    },
    
    /// Retrieve data from IPFS via Pinata
    Retrieve {
        /// IPFS CID to retrieve
        #[clap(long)]
        cid: String,
        
        /// Pinata JWT token
        #[clap(long)]
        jwt: String,
        
        /// Pinata gateway domain
        #[clap(long)]
        gateway: String,
    },
}

impl IpfsCommand {
    pub async fn execute(self) -> Result<()> {
        match self {
            IpfsCommand::Pinata(cmd) => cmd.execute().await,
        }
    }
}

impl PinataCommand {
    pub async fn execute(self) -> Result<()> {
        match self {
            PinataCommand::UploadFile { file, jwt, gateway } => {
                let client = PinataClient::new(jwt, gateway);
                let response = client.upload_file(&file).await?;
                println!("File uploaded to IPFS:");
                println!("CID: {}", response.ipfs_hash);
                println!("Size: {} bytes", response.pin_size);
                println!("Timestamp: {}", response.timestamp);
                Ok(())
            }
            PinataCommand::UploadJson { file, jwt, gateway } => {
                let client = PinataClient::new(jwt, gateway);
                let json_content = fs::read_to_string(&file).await?;
                let json_data: serde_json::Value = serde_json::from_str(&json_content)?;
                let response = client.upload_json(json_data).await?;
                println!("JSON uploaded to IPFS:");
                println!("CID: {}", response.ipfs_hash);
                println!("Size: {} bytes", response.pin_size);
                println!("Timestamp: {}", response.timestamp);
                Ok(())
            }
            PinataCommand::Retrieve { cid, jwt, gateway } => {
                let client = PinataClient::new(jwt, gateway);
                let data = client.retrieve_data(&cid).await?;
                println!("{}", data);
                Ok(())
            }
        }
    }
}
```

5. Update the main command handler in `cli/src/main.rs` to include the new IPFS commands.

## Using the Integration

### With the Node.js Script (Option 1)

1. Upload a file to IPFS:

```bash
aptos-ipfs upload-file path/to/your/file.png
```

2. Upload JSON metadata:

```bash
aptos-ipfs upload-json path/to/your/metadata.json
```

3. Retrieve data from IPFS:

```bash
aptos-ipfs retrieve bafybeihkoviema7g3gxyt6la3u6hlvnmqn2nl5dxsjmjwkomwwn6gxdpea
```

### With the Extended Aptos CLI (Option 2)

1. Upload a file to IPFS:

```bash
aptos ipfs pinata upload-file --file path/to/your/file.png --jwt your_jwt --gateway your-gateway.mypinata.cloud
```

2. Upload JSON metadata:

```bash
aptos ipfs pinata upload-json --file path/to/your/metadata.json --jwt your_jwt --gateway your-gateway.mypinata.cloud
```

3. Retrieve data from IPFS:

```bash
aptos ipfs pinata retrieve --cid bafybeihkoviema7g3gxyt6la3u6hlvnmqn2nl5dxsjmjwkomwwn6gxdpea --jwt your_jwt --gateway your-gateway.mypinata.cloud
```

## Integrating with Move Contracts

### Storing IPFS CIDs in Move Contracts

1. Create a Move module to store IPFS references:

```move
module my_address::ipfs_registry {
    use std::string::String;
    use std::signer;
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};
    
    // Error constants
    const ENOT_AUTHORIZED: u64 = 1;
    const ERECORD_NOT_FOUND: u64 = 2;
    
    // Resource struct
    struct IPFSRegistry has key {
        records: Table<String, IPFSRecord>,
        owner: address
    }
    
    // Record struct
    struct IPFSRecord has store, drop {
        cid: String,
        metadata: String,
        timestamp: u64
    }
    
    // Initialize registry
    public entry fun initialize(account: &signer) {
        let signer_address = signer::address_of(account);
        
        let registry = IPFSRegistry {
            records: table::new(),
            owner: signer_address
        };
        
        move_to(account, registry);
    }
    
    // Add a record
    public entry fun add_record(
        account: &signer, 
        name: String, 
        cid: String, 
        metadata: String,
        timestamp: u64
    ) acquires IPFSRegistry {
        let signer_address = signer::address_of(account);
        
        let registry = borrow_global_mut<IPFSRegistry>(signer_address);
        
        let record = IPFSRecord {
            cid,
            metadata,
            timestamp
        };
        
        table::upsert(&mut registry.records, name, record);
    }
    
    // Get a record
    #[view]
    public fun get_record(owner: address, name: String): (String, String, u64) acquires IPFSRegistry {
        assert!(exists<IPFSRegistry>(owner), ERECORD_NOT_FOUND);
        
        let registry = borrow_global<IPFSRegistry>(owner);
        assert!(table::contains(&registry.records, name), ERECORD_NOT_FOUND);
        
        let record = table::borrow(&registry.records, name);
        
        (record.cid, record.metadata, record.timestamp)
    }
    
    // Remove a record
    public entry fun remove_record(account: &signer, name: String) acquires IPFSRegistry {
        let signer_address = signer::address_of(account);
        
        let registry = borrow_global_mut<IPFSRegistry>(signer_address);
        assert!(table::contains(&registry.records, name), ERECORD_NOT_FOUND);
        
        table::remove(&mut registry.records, name);
    }
}
```

2. Deploy the contract:

```bash
aptos move publish --named-addresses my_address=<your_address>
```

### JavaScript Integration Example

Create a script to interact with both Pinata and your Move contract:

```javascript
const { PinataSDK } = require("pinata");
const { AptosClient, AptosAccount, TxnBuilderTypes, BCS } = require("aptos");
require("dotenv").config();

// Initialize clients
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY
});

const aptosClient = new AptosClient(process.env.APTOS_NODE_URL);
const account = AptosAccount.fromAptosAccountObject({
  privateKey: process.env.PRIVATE_KEY,
  address: process.env.ADDRESS
});

// Upload to IPFS and register on-chain
async function uploadAndRegister(filePath, name, metadata) {
  try {
    // 1. Upload file to IPFS
    const fileStream = fs.createReadStream(filePath);
    const uploadResult = await pinata.upload.public.file(fileStream);
    console.log(`File uploaded to IPFS with CID: ${uploadResult.IpfsHash}`);
    
    // 2. Register CID on-chain
    const payload = {
      type: "entry_function_payload",
      function: `${process.env.ADDRESS}::ipfs_registry::add_record`,
      type_arguments: [],
      arguments: [
        name,
        uploadResult.IpfsHash,
        metadata || "",
        Math.floor(Date.now() / 1000)
      ]
    };
    
    const txnRequest = await aptosClient.generateTransaction(account.address(), payload);
    const signedTxn = await aptosClient.signTransaction(account, txnRequest);
    const txnResult = await aptosClient.submitTransaction(signedTxn);
    
    await aptosClient.waitForTransaction(txnResult.hash);
    console.log(`Record registered on-chain: ${txnResult.hash}`);
    
    return {
      cid: uploadResult.IpfsHash,
      transactionHash: txnResult.hash
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Retrieve record from chain and IPFS
async function retrieveRecord(owner, name) {
  try {
    // 1. Get record from chain
    const record = await aptosClient.view({
      function: `${owner}::ipfs_registry::get_record`,
      type_arguments: [],
      arguments: [owner, name]
    });
    
    const [cid, metadata, timestamp] = record;
    
    // 2. Retrieve data from IPFS
    const ipfsData = await pinata.gateways.public.get(cid);
    
    return {
      cid,
      metadata,
      timestamp,
      ipfsData
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

module.exports = {
  uploadAndRegister,
  retrieveRecord
};
```

## Best Practices

1. **Store Metadata, Not Large Files**: Store large files on IPFS and only keep the CID references on-chain.

2. **Use Content Addressing**: IPFS uses content-based addressing, so identical files will have the same CID.

3. **Pin Important Data**: Make sure to pin your data on Pinata to ensure it remains available.

4. **Use Dedicated Gateways**: For production applications, use dedicated gateways for better performance.

5. **Secure Your API Keys**: Never expose your Pinata JWT in client-side code.

6. **Batch Uploads**: When uploading multiple files, consider using the folder upload feature.

7. **Verify Data Integrity**: Always verify the CID of retrieved data matches what's stored on-chain.

## Troubleshooting

1. **Upload Failures**: 
   - Check your JWT permissions
   - Verify file size limits (depends on your Pinata plan)
   - Ensure proper network connectivity

2. **Retrieval Issues**:
   - Confirm the CID is correct
   - Check if the content is properly pinned
   - Try using a different gateway

3. **Transaction Errors**:
   - Verify account has sufficient funds
   - Check function parameters match expected types

## Resources

- [Pinata Documentation](https://docs.pinata.cloud/)
- [Aptos Developer Documentation](https://aptos.dev/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Move Language Book](https://move-language.github.io/move/) 