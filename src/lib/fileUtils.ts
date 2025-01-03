import fs from 'fs';
import path from 'path';

export const createFile = (filePath: string, content: string) => {
  // Create directories if they don't exist
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write the file
  fs.writeFileSync(filePath, content);
}; 