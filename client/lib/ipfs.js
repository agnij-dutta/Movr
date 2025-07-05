// Pinata/IPFS config (hardcoded)
export const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5YTNmNTZkNC0wOWM1LTQ0MTItYWE3YS1hOTFmMzNmNmMwYjgiLCJlbWFpbCI6ImR1dHRhYWduaWowMUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMjc2MDQ1NmI4ZmEzMmRmZGNlZjMiLCJzY29wZWRLZXlTZWNyZXQiOiJkZDlkYzI2NDY2ZGE4M2ViZjAyNDZkNTVjOTlhMjI2MTUxMjZkYjU0YjFjOWJjN2Q3ZmU1MWM3Njc4NjA2YzI1IiwiZXhwIjoxNzgzMTg3MzkzfQ.-vd_M2DZSTk2QnRhLE959dMjf-fX9CSZqyGT3bmNngw';
export const PINATA_GATEWAY = 'aquamarine-defiant-woodpecker-351.mypinata.cloud';

// Upload a file/blob to Pinata, returns IPFS hash
export async function uploadFile(file, metadata = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pinataMetadata', JSON.stringify({
    name: metadata.name || file.name || 'upload',
    keyvalues: metadata,
  }));
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.IpfsHash;
}

// Download a file from IPFS (returns blob)
export async function downloadFile(ipfsHash) {
  const url = `https://${PINATA_GATEWAY}/ipfs/${ipfsHash}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch from IPFS');
  return await res.blob();
}

// Pin JSON to IPFS
export async function pinJSON(obj, metadata = {}) {
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: obj,
      pinataMetadata: {
        name: metadata.name || 'json-content',
        keyvalues: metadata,
      },
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.IpfsHash;
} 