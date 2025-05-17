import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Reads an HTML file from the given path relative to the project root.
 * @param relativePath - The relative path to the HTML file (from the project root).
 * @returns The content of the HTML file as a string.
 */
export function readHtmlFile(relativePath: string): string {
  // Construct the absolute path to the file
  const filePath = join(process.cwd(), relativePath);

  // Read and return the file content
  return readFileSync(filePath, 'utf8');
}
