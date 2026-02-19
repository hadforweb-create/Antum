const https = require('https');

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_ID = process.env.FIGMA_FILE_ID;

function figmaGet(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `https://api.figma.com/v1${endpoint}`;
    const req = https.get(
      url,
      { headers: { 'X-Figma-Token': FIGMA_TOKEN } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function main() {
  try {
    const file = await figmaGet(`/files/${FILE_ID}?depth=2`);
    
    const pages = file.document?.children || [];
    const screens = [];
    
    pages.forEach((page) => {
      page.children?.forEach((frame) => {
        screens.push({
          name: frame.name,
          id: frame.id,
          page: page.name,
          width: frame.absoluteBoundingBox?.width || 390,
          height: frame.absoluteBoundingBox?.height || 844,
        });
      });
    });

    console.log(JSON.stringify(screens, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
