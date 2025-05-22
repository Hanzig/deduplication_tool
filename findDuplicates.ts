import * as fs from 'fs';
import * as path from 'path';

/**
 * Represents a group of potentially duplicate company names.
 */
export interface MatchResult {
  group: string[];
}

/**
 * Common non-distinctive words to exclude from token comparison.
 * These are often suffixes or generic terms that don’t help in deduplication.
 */
const NOISE_WORDS = new Set([
  'inc', 'llc', 'ltd', 'corp', 'co', 'plc', 'gmbh', 'sa', 'ag', 'bv', 'oy', 'pty', 'limited',
  'software', 'technologies', 'solutions', 'systems', 'services', 'studios', 'studio',
  'interactive', 'entertainment', 'digital', 'media', 'group', 'network', 'global',
  'international', 'holding', 'partners', 'enterprises', 'development',
  'the', 'and', 'of', 'for', 'with', 'by', 'at', 'from', 'to', 'in', 'on', 'an', 'a', 'team'
]);

const DEFAULT_THRESHOLD = 0.5;

/**
 * Normalizes a company name.
 * @param name - The raw company name
 * @returns A cleaned and simplified version of the name
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => !NOISE_WORDS.has(word))
    .join(' ')
    .trim();
}

/**
 * Calculates the Jaccard similarity between two sets of tokens.
 * Jaccard similarity = (intersection size) / (union size)
 *
 * This measures the degree of overlap between two sets:
 * - 1 means complete overlap (identical sets)
 * - 0 means no overlap at all
 *
 * @param setA - First token set
 * @param setB - Second token set
 * @returns A similarity score between 0 and 1
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Tokenizes a company name into a set of normalized words.
 * @param name - A raw company name
 * @returns A set of distinct, cleaned tokens
 */
function tokenize(name: string): Set<string> {
  return new Set(normalizeCompanyName(name).split(' '));
}

/**
 * Loads company names from a text file.
 * @param filePath - The path to the input file
 * @returns A cleaned array of non-empty company names
 */
export function loadCompanies(filePath: string): string[] {
  const content: string = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);
}

/**
 * Finds and groups similar company names using blocking and token similarity.
 *
 * @param companies - List of company names to analyze
 * @param threshold - Jaccard similarity threshold (default: 0.5)
 * @returns An array of groups of similar company names
 */
export function findDuplicateGroups(companies: string[], threshold: number = DEFAULT_THRESHOLD): MatchResult[] {
  const groups: MatchResult[] = []; // Final grouped duplicates
  const seen: Set<string> = new Set(); // Track which names have already been grouped
  const tokenMap: Map<string, Set<string>> = new Map(); // Cache: name -> tokens
  const blocks: Map<string, string[]> = new Map(); // Blocks of names sharing the same key

  // Step 1: Normalize and tokenize names, assign to blocks
  for (const name of companies) {
    const tokens = tokenize(name); // Get token set for name
    tokenMap.set(name, tokens); // Store for reuse

    const sortedTokens = Array.from(tokens).sort();
    const blockKey = sortedTokens[0]; // Use first token as a grouping key

    if (!blocks.has(blockKey)) {
      blocks.set(blockKey, []); // Create new block if needed
    }

    blocks.get(blockKey)!.push(name); // Add name to the block
  }

  // Step 2: Compare entries only within their blocks
  for (const block of blocks.values()) {
    for (let i = 0; i < block.length; i++) {
      const nameA = block[i];
      if (seen.has(nameA)) {
        continue; // Skip if already grouped
      }

      const tokensA = tokenMap.get(nameA)!;
      const group: string[] = [nameA];
      seen.add(nameA);

      for (let j = i + 1; j < block.length; j++) {
        const nameB = block[j];
        if (seen.has(nameB)) {
          continue;
        } 

        const tokensB = tokenMap.get(nameB)!;
        const similarity = jaccardSimilarity(tokensA, tokensB); // Compare token overlap

        if (similarity >= threshold) {
          group.push(nameB); // Group similar name
          seen.add(nameB);   // Mark as grouped
        }
      }

      if (group.length > 1) {
        groups.push({ group }); // Add only groups with >1 name
      }
    }
  }

  return groups;
}

/**
 * CLI entry point: reads company names from a file and finds duplicates.
 *
 * @param filePath - Path to the input file from CLI
 */
export async function main(filePath: string): Promise<void> {
  const resolvedPath: string = path.resolve(filePath);
  const companies: string[] = loadCompanies(resolvedPath);

  console.log(`Loaded ${companies.length} companies. Grouping duplicates...`);
  console.time('deduplication');
  const results: MatchResult[] = findDuplicateGroups(companies);
  console.timeEnd('deduplication');

  console.log(`\nFound ${results.length} duplicate groups:\n`);
  results.forEach((result: MatchResult, index: number) => {
    console.log(`Group ${index + 1}:`);
    result.group.forEach((name: string) => console.log(`  - ${name}`));
    console.log('');
  });
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const inputFile: string = process.argv[2] || './companies.txt';
  main(inputFile);
}
