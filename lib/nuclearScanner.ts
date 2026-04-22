import { promises as fs, readFileSync, readdirSync } from 'fs';
import path from 'path';

export const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".py": "Python",
  ".java": "Java",
  ".go": "Go",
  ".rs": "Rust",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".json": "JSON",
  ".md": "Markdown",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".env": "Environment"
};

export const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".cache"
]);

export interface ScanResult {
  totalFiles: number;
  languages: Record<string, number>;
  files: string[];
  dependencyGraph: {
    nodes: Array<{ id: string; type: string }>;
    edges: Array<{ source: string; target: string }>;
  };
}

export interface DependencyGraph {
  nodes: Array<{ id: string; type: string }>;
  edges: Array<{ source: string; target: string }>;
}

export interface Risk {
  type: string;
  severity: 'low' | 'medium' | 'high';
  file: string;
  line?: number;
  description: string;
}

/**
 * High-performance recursive file scanner with exact counting
 */
export async function scanCodebase(rootDir: string): Promise<ScanResult> {
  const result: ScanResult = {
    totalFiles: 0,
    languages: {},
    files: [],
    dependencyGraph: {
      nodes: [],
      edges: []
    }
  };

  const supportedExtensions = new Set(Object.keys(EXTENSION_LANGUAGE_MAP));
  const maxConcurrency = 50;
  
  // Debug counters (DEV ONLY)
  let visitedFiles = 0;
  let visitedDirs = 0;
  
  /**
   * Recursively scan directory with controlled concurrency
   */
  async function scanDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const subdirectories: string[] = [];
      
      // Process files immediately, collect subdirectories for batch processing
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!IGNORED_DIRS.has(entry.name)) {
            subdirectories.push(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          
          if (supportedExtensions.has(ext)) {
            result.totalFiles++;
            visitedFiles++;
            result.files.push(fullPath);
            
            const language = EXTENSION_LANGUAGE_MAP[ext];
            result.languages[language] = (result.languages[language] || 0) + 1;
          }
        }
      }
      
      // Process subdirectories in batches to control concurrency
      if (subdirectories.length > 0) {
        const batches: string[][] = [];
        
        for (let i = 0; i < subdirectories.length; i += maxConcurrency) {
          batches.push(subdirectories.slice(i, i + maxConcurrency));
        }
        
        // Process each batch sequentially, but directories within batch in parallel
        for (const batch of batches) {
          await Promise.all(batch.map(subdir => scanDirectory(subdir)));
        }
      }
      
      visitedDirs++;
      
    } catch (error) {
      // Silently ignore directories that can't be read
      // This prevents scan from crashing on permission issues
    }
  }

  await scanDirectory(rootDir);
  
  // Build dependency graph after file collection
  const dependencyGraph = await buildDependencyGraph(result.files, rootDir);
  result.dependencyGraph = dependencyGraph;
  
  // Debug verification (DEV ONLY)
  if (process.env.NODE_ENV === "development") {
    console.log("NUCLEAR SCAN SUMMARY");
    console.log("Files:", visitedFiles);
    console.log("Dirs:", visitedDirs);
    console.log("Graph nodes:", dependencyGraph.nodes.length);
    console.log("Graph edges:", dependencyGraph.edges.length);
  }
  
  // Final verification
  if (!result.totalFiles || result.totalFiles < 1) {
    throw new Error("No files found during scan");
  }
  if (!result.languages || Object.keys(result.languages).length === 0) {
    throw new Error("No languages detected during scan");
  }
  
  return result;
}

/**
 * Build deep dependency connectivity graph
 */
export async function buildDependencyGraph(files: string[], rootDir: string): Promise<DependencyGraph> {
  const graph: DependencyGraph = {
    nodes: [],
    edges: []
  };
  
  const nodeSet = new Set<string>();
  
  // Filter text-based files under 1MB
  const textFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    const isTextFile = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.html', '.css', '.scss', '.md'].includes(ext);
    return isTextFile;
  });
  
  // Build resolution map: normalized absolute path -> relative node ID
  // This allows resolving raw imports (like './style.css') to actual graph node IDs
  const absoluteToRelId = new Map<string, string>();
  
  // Create nodes for all files using relative paths
  for (const file of textFiles) {
    const relPath = path.relative(rootDir, file).split(path.sep).join('/');
    const ext = path.extname(file).toLowerCase();
    const language = EXTENSION_LANGUAGE_MAP[ext] || 'Unknown';
    const absNorm = file.replace(/\\/g, '/');
    
    if (!nodeSet.has(relPath)) {
      graph.nodes.push({ id: relPath, type: language });
      nodeSet.add(relPath);
    }
    
    // Map absolute path (with and without extension) to relPath for resolution
    absoluteToRelId.set(absNorm, relPath);
    const withoutExt = absNorm.replace(/\.[^.]+$/, '');
    if (!absoluteToRelId.has(withoutExt)) {
      absoluteToRelId.set(withoutExt, relPath);
    }
  }
  
  // Resolve a raw import string to a known node ID, or return null
  const importExtensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json', '.scss'];
  const indexExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  function resolveToNodeId(imp: string, importerAbsPath: string): string | null {
    const importerDir = path.dirname(importerAbsPath).replace(/\\/g, '/');
    
    // Resolve relative, absolute-from-root, or bare filename imports
    let resolved: string;
    if (imp.startsWith('.') || imp.startsWith('/')) {
      resolved = path.resolve(importerDir, imp).replace(/\\/g, '/');
    } else {
      // Bare name — could be a local file in same dir (HTML/CSS refs) or an npm package
      // Try resolving as local file first
      resolved = path.resolve(importerDir, imp).replace(/\\/g, '/');
    }
    
    // Try exact match
    if (absoluteToRelId.has(resolved)) return absoluteToRelId.get(resolved)!;
    
    // Try with common extensions
    for (const ext of importExtensions) {
      if (absoluteToRelId.has(resolved + ext)) return absoluteToRelId.get(resolved + ext)!;
    }
    
    // Try as directory with index file
    for (const ext of indexExtensions) {
      if (absoluteToRelId.has(resolved + '/index' + ext)) return absoluteToRelId.get(resolved + '/index' + ext)!;
    }
    
    // Try without extension then re-resolve (import has extension, stored without)
    const impWithoutExt = resolved.replace(/\.[^.]+$/, '');
    if (impWithoutExt !== resolved && absoluteToRelId.has(impWithoutExt)) {
      return absoluteToRelId.get(impWithoutExt)!;
    }
    
    return null; // Truly external or unresolvable
  }
  
  // Simplify an unresolved import to its package/module name
  function simplifyImport(imp: string): string {
    const cleaned = imp
      .replace(/^\.\//, '')
      .replace(/^\.\.\//g, '')
      .replace(/^\//, '')
      .replace(/\.(js|ts|jsx|tsx|json|css|html|py|java|go|rs)$/, '');
    const parts = cleaned.split('/');
    return parts[0] || cleaned;
  }
  
  // Parse dependencies for each file with controlled concurrency
  const batchSize = 20;
  for (let i = 0; i < textFiles.length; i += batchSize) {
    const batch = textFiles.slice(i, i + batchSize);
    
    const dependencyPromises = batch.map(async (file) => {
      const ext = path.extname(file).toLowerCase();
      const relPath = path.relative(rootDir, file).split(path.sep).join('/');
      
      try {
        // Check file size (under 1MB requirement)
        const stats = await fs.stat(file);
        if (stats.size > 1024 * 1024) return []; // Skip files over 1MB
        
        const content = await fs.readFile(file, 'utf-8');
        const rawImports = extractRawImportsForFile(content, ext);
        
        return rawImports.map(imp => {
          // Try to resolve to an actual node ID
          const resolved = resolveToNodeId(imp, file);
          return {
            source: relPath,
            target: resolved || simplifyImport(imp)
          };
        });
      } catch {
        return [];
      }
    });
    
    const batchDependencies = await Promise.all(dependencyPromises);
    const flatDependencies = batchDependencies.flat();
    
    // Create edges and external nodes
    for (const dep of flatDependencies) {
      if (!nodeSet.has(dep.target)) {
        // Create node for external dependency
        graph.nodes.push({ id: dep.target, type: 'External' });
        nodeSet.add(dep.target);
      }
      
      // Avoid duplicate edges
      const edgeExists = graph.edges.some(edge => 
        edge.source === dep.source && edge.target === dep.target
      );
      
      if (!edgeExists) {
        graph.edges.push({ source: dep.source, target: dep.target });
      }
    }
  }
  
  // Final verification
  if (!graph.nodes.length) {
    throw new Error("No nodes in dependency graph");
  }
  
  return graph;
}

/**
 * Extract imports from file content with comprehensive pattern matching
 */
export function extractImports(content: string, ext: string): string[] {
  const imports: string[] = [];
  
  try {
    switch (ext) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        // ES6 imports: import ... from '...'
        const es6ImportRegex = /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"`]([^'"`]+)['"`]/g;
        let match;
        while ((match = es6ImportRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        
        // CommonJS: require('...')
        const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        
        // Dynamic imports: import('...')
        const dynamicImportRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
        while ((match = dynamicImportRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
        
      case '.py':
        // Python: import x
        const pythonImportRegex = /import\s+([^\s]+)/g;
        while ((match = pythonImportRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        
        // Python: from x import y
        const fromImportRegex = /from\s+([^\s]+)\s+import/g;
        while ((match = fromImportRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
        
      case '.java':
        // Java imports
        const javaImportRegex = /import\s+([^\s;]+);/g;
        while ((match = javaImportRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
        
      case '.go':
        // Go imports
        const goImportRegex = /import\s+['"`]([^'"`]+)['"`]/g;
        while ((match = goImportRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
        
      case '.rs':
        // Rust imports
        const rustImportRegex = /use\s+([^;]+);/g;
        while ((match = rustImportRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
        
      case '.html':
        // HTML: <link href="..."> and <script src="...">
        const linkHrefRegex = /<link[^>]+href\s*=\s*['"]([^'"]+)['"]|<script[^>]+src\s*=\s*['"]([^'"]+)['"]/gi;
        while ((match = linkHrefRegex.exec(content)) !== null) {
          const ref = match[1] || match[2];
          if (ref && !ref.startsWith('http') && !ref.startsWith('//') && !ref.startsWith('data:')) {
            imports.push(ref);
          }
        }
        break;
        
      case '.css':
      case '.scss':
        // CSS: @import '...' or @import url('...')
        const cssImportRegex = /@import\s+(?:url\s*\(\s*)?['"]([^'"]+)['"]\s*\)?/g;
        while ((match = cssImportRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
    }
  } catch {
    // Ignore regex errors
  }
  
  // Clean and filter imports
  return imports
    .filter(imp => imp && imp.trim().length > 0)
    .map(imp => {
      // Remove relative path indicators and clean
      const cleaned = imp
        .replace(/^\.\//, '')
        .replace(/^\.\.\//g, '')
        .replace(/^\//, '')
        .replace(/\.(js|ts|jsx|tsx|json|css|html|py|java|go|rs)$/, '');
      
      // Extract package name from complex imports
      const parts = cleaned.split('/');
      return parts[0] || cleaned;
    })
    .filter((imp, index, arr) => arr.indexOf(imp) === index); // Remove duplicates
}

/**
 * Extract raw import paths from file content without simplification.
 * Handles all supported file types including HTML and CSS.
 */
function extractRawImportsForFile(content: string, ext: string): string[] {
  const imports: string[] = [];
  let match;

  switch (ext) {
    case '.js':
    case '.jsx':
    case '.ts':
    case '.tsx': {
      const es6ImportRegex = /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"`]([^'"`]+)['"`]/g;
      while ((match = es6ImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      const dynamicImportRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
      while ((match = dynamicImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      break;
    }
    case '.html': {
      const linkHrefRegex = /<link[^>]+href\s*=\s*['"]([^'"]+)['"]|<script[^>]+src\s*=\s*['"]([^'"]+)['"]/gi;
      while ((match = linkHrefRegex.exec(content)) !== null) {
        const ref = match[1] || match[2];
        if (ref && !ref.startsWith('http') && !ref.startsWith('//') && !ref.startsWith('data:')) {
          imports.push(ref);
        }
      }
      break;
    }
    case '.css':
    case '.scss': {
      const cssImportRegex = /@import\s+(?:url\s*\(\s*)?['"]([^'"]+)['"]\s*\)?/g;
      while ((match = cssImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      break;
    }
    case '.py': {
      const pythonImportRegex = /import\s+([^\s]+)/g;
      while ((match = pythonImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      const fromImportRegex = /from\s+([^\s]+)\s+import/g;
      while ((match = fromImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      break;
    }
    case '.java': {
      const javaImportRegex = /import\s+([^\s;]+);/g;
      while ((match = javaImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      break;
    }
    case '.go': {
      const goImportRegex = /import\s+['"`]([^'"`]+)['"`]/g;
      while ((match = goImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      break;
    }
    case '.rs': {
      const rustImportRegex = /use\s+([^;]+);/g;
      while ((match = rustImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      break;
    }
  }

  return imports.filter(imp => imp && imp.trim().length > 0);
}

/**
 * Detect risks in the scanned codebase
 */
export function detectRisks(scanResult: ScanResult, rootDir: string): Risk[] {
  const risks: Risk[] = [];

  // 1. large_file: any file over 300 lines
  for (const file of scanResult.files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const lineCount = content.split('\n').length;
      if (lineCount > 300) {
        const relPath = path.relative(rootDir, file).split(path.sep).join('/');
        risks.push({
          type: 'large_file',
          severity: 'high',
          file: relPath,
          line: lineCount,
          description: `File has ${lineCount} lines (threshold: 300)`
        });
      }
    } catch {
      // Skip unreadable files
    }
  }

  // 2. circular_dependency: files that import each other
  const importableExts = new Set(['.ts', '.tsx', '.js', '.jsx']);
  const filePathSet = new Set(scanResult.files.map(f => f.replace(/\\/g, '/')));

  function resolveImport(importPath: string, importerDir: string): string | null {
    if (!importPath.startsWith('.')) return null;
    const resolved = path.resolve(importerDir, importPath).replace(/\\/g, '/');
    if (filePathSet.has(resolved)) return resolved;
    for (const ext of ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx']) {
      if (filePathSet.has(resolved + ext)) return resolved + ext;
    }
    return null;
  }

  const fileImportMap = new Map<string, Set<string>>();
  for (const file of scanResult.files) {
    const ext = path.extname(file).toLowerCase();
    if (!importableExts.has(ext)) continue;
    try {
      const content = readFileSync(file, 'utf-8');
      const rawImports = extractRawImportsForFile(content, ext);
      const dir = path.dirname(file);
      const resolvedSet = new Set<string>();
      for (const imp of rawImports) {
        const resolved = resolveImport(imp, dir);
        if (resolved) resolvedSet.add(resolved);
      }
      fileImportMap.set(file.replace(/\\/g, '/'), resolvedSet);
    } catch {
      // Skip unreadable files
    }
  }

  const reportedPairs = new Set<string>();
  for (const [fileA, importsA] of fileImportMap) {
    for (const fileB of importsA) {
      const importsB = fileImportMap.get(fileB);
      if (importsB && importsB.has(fileA)) {
        const pairKey = [fileA, fileB].sort().join('|');
        if (!reportedPairs.has(pairKey)) {
          reportedPairs.add(pairKey);
          const relA = path.relative(rootDir, fileA).split(path.sep).join('/');
          const relB = path.relative(rootDir, fileB).split(path.sep).join('/');
          risks.push({
            type: 'circular_dependency',
            severity: 'high',
            file: relA,
            description: `Circular dependency between ${relA} and ${relB}`
          });
        }
      }
    }
  }

  // 3. env_exposure: .env files present in the zip
  function findEnvFilesSync(dir: string, depth: number = 0): string[] {
    if (depth > 10) return [];
    const envFiles: string[] = [];
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && (entry.name === '.env' || entry.name.startsWith('.env.'))) {
          envFiles.push(path.join(dir, entry.name));
        } else if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name)) {
          envFiles.push(...findEnvFilesSync(path.join(dir, entry.name), depth + 1));
        }
      }
    } catch {
      // Skip unreadable directories
    }
    return envFiles;
  }

  const envFiles = findEnvFilesSync(rootDir);
  for (const file of envFiles) {
    const baseName = path.basename(file);
    const relPath = path.relative(rootDir, file).split(path.sep).join('/');
    risks.push({
      type: 'env_exposure',
      severity: 'high',
      file: relPath,
      description: `Environment file "${baseName}" found in project — may contain secrets`
    });
  }

  // 4. high_fan_in: any file imported by 5+ other files
  const fanInCounts = new Map<string, number>();
  for (const edge of scanResult.dependencyGraph.edges) {
    fanInCounts.set(edge.target, (fanInCounts.get(edge.target) || 0) + 1);
  }
  for (const [target, count] of fanInCounts) {
    if (count >= 5) {
      risks.push({
        type: 'high_fan_in',
        severity: 'medium',
        file: target,
        description: `Module imported by ${count} other files (threshold: 5)`
      });
    }
  }

  // 5. deep_nesting: folder depth greater than 5 levels
  for (const file of scanResult.files) {
    const relPath = path.relative(rootDir, file).split(path.sep).join('/');
    const depth = relPath.split('/').length - 1; // subtract 1 for the filename itself
    if (depth > 5) {
      risks.push({
        type: 'deep_nesting',
        severity: 'medium',
        file: relPath,
        description: `File nested ${depth} levels deep (threshold: 5)`
      });
    }
  }

  // 6. no_tests: project has no test files
  const hasTests = scanResult.files.some(file => {
    const baseName = path.basename(file);
    return /\.(test|spec)\./i.test(baseName);
  });
  if (!hasTests) {
    risks.push({
      type: 'no_tests',
      severity: 'low',
      file: '',
      description: 'No test files found in project (*.test.*, *.spec.*)'
    });
  }

  return risks;
}

/**
 * Calculate meaningful risk score
 */
export function calculateRiskScore(
  scanResult: ScanResult, 
  hasEnvFile: boolean
): number {
  let risk = 0;
  
  // Circular dependencies detection
  const circularCount = detectCircularDependencies(scanResult.dependencyGraph);
  risk += circularCount * 15;
  
  // Large files detection (>500 lines)
  const largeFileCount = scanResult.files.filter(file => {
    try {
      const content = readFileSync(file, 'utf-8');
      return content.split('\n').length > 500;
    } catch {
      return false;
    }
  }).length;
  risk += largeFileCount * 2;
  
  // High fan-in modules (files imported by many others)
  const fanInCounts = new Map<string, number>();
  for (const edge of scanResult.dependencyGraph.edges) {
    fanInCounts.set(edge.target, (fanInCounts.get(edge.target) || 0) + 1);
  }
  const highFanInCount = Array.from(fanInCounts.values()).filter(count => count > 5).length;
  risk += highFanInCount * 3;
  
  // External services
  const externalServices = scanResult.dependencyGraph.nodes.filter(node => 
    node.type === 'External'
  ).length;
  risk += externalServices * 3;
  
  // Environment file presence
  if (hasEnvFile) {
    risk += 10;
  }
  
  const riskScore = Math.min(100, Math.max(20, risk));
  return riskScore;
}

/**
 * Detect circular dependencies
 */
function detectCircularDependencies(graph: DependencyGraph): number {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  let circularCount = 0;
  
  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      circularCount++;
      return true;
    }
    
    if (visited.has(nodeId)) {
      return false;
    }
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const outgoingEdges = graph.edges.filter(edge => edge.source === nodeId);
    for (const edge of outgoingEdges) {
      if (dfs(edge.target)) {
        return true;
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }
  
  return circularCount;
}

/**
 * Safe directory removal with retry logic for Windows EBUSY errors
 */
export async function safeRemoveDir(dirPath: string): Promise<void> {
  const maxRetries = 5;
  const retryDelay = 500; // 500ms between retries
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      return;
    } catch (error: any) {
      // Retry on EBUSY or EPERM errors, fail on others
      if ((error.code === 'EBUSY' || error.code === 'EPERM') && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        // Final attempt failed, but we don't want to crash API
        // The OS will eventually clean up temp directory
        return;
      }
    }
  }
}
