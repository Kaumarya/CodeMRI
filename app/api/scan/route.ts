// npm install adm-zip

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { readFileSync } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import AdmZip from 'adm-zip';
import { scanCodebase, safeRemoveDir, calculateRiskScore, extractImports, detectRisks } from '../../../lib/nuclearScanner';

interface ScanResult {
  totalFiles: number;
  analyzedFiles: number;
  jsTsFiles: number;
  foldersCount: number;
  detectedLanguages: Record<string, number>;
  simpleRiskScore: number;
  dependencyGraph: {
    nodes: Array<{ id: string; type: string }>;
    edges: Array<{ source: string; target: string }>;
  };
  externalServices: string[];
  risks: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    file: string;
    line?: number;
    description: string;
  }>;
  files: Array<{
    path: string;
    name: string;
    imports?: string[];
  }>;
}

export async function POST(request: NextRequest): Promise<NextResponse<ScanResult | { error: string }>> {
  let tempDir: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'Only ZIP files are supported' }, { status: 400 });
    }

    // Create temporary directory
    tempDir = path.join(os.tmpdir(), 'codemri-' + randomUUID());
    await fs.mkdir(tempDir, { recursive: true });

    // Save uploaded file
    const zipPath = path.join(tempDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(zipPath, buffer);

    // Extract ZIP completely
    const zip = new AdmZip(buffer);
    zip.extractAllTo(tempDir, true);

    // Use nuclear scanner for exact file counting and dependency graph
    const scanResult = await scanCodebase(tempDir);
    
    // Check for .env file
    const hasEnvFile = scanResult.files.some(file => 
      path.basename(file) === '.env' || path.basename(file).startsWith('.env')
    );
    
    // Extract external services from dependency graph
    const externalServices = scanResult.dependencyGraph.nodes
      .filter(node => node.type === 'External')
      .map(node => node.id);

    // Count JS/TS files
    const jsTsFiles = (scanResult.languages['JavaScript'] || 0) + (scanResult.languages['TypeScript'] || 0);
    
    // Count all unique directories found during the scan
    // (scanner already excludes node_modules, .git, .next, dist, build, coverage, .cache)
    const folderSet = new Set<string>();
    for (const filePath of scanResult.files) {
      let dir = path.relative(tempDir!, filePath);
      dir = path.dirname(dir);
      while (dir && dir !== '.') {
        folderSet.add(dir);
        dir = path.dirname(dir);
      }
    }
    const foldersCount = folderSet.size;

    // Transform scan result files to the expected format with imports
    // Use relative paths instead of absolute temp directory paths
    const transformedFiles = scanResult.files.map(filePath => {
      const relativePath = path.relative(tempDir!, filePath).split(path.sep).join('/');
      const fileName = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      // Extract imports from file content (use absolute path for reading)
      let imports: string[] = [];
      try {
        const content = readFileSync(filePath, 'utf-8');
        imports = extractImports(content, ext);
      } catch (error) {
        console.warn(`Could not read file ${relativePath}:`, error);
      }
      
      return {
        path: relativePath,
        name: fileName,
        imports: imports
      };
    });

    const result: ScanResult = {
      totalFiles: scanResult.totalFiles,
      analyzedFiles: Math.min(scanResult.totalFiles, 500), // Cap for performance
      jsTsFiles,
      foldersCount,
      detectedLanguages: scanResult.languages,
      simpleRiskScore: calculateRiskScore(scanResult, hasEnvFile),
      dependencyGraph: scanResult.dependencyGraph,
      externalServices,
      risks: detectRisks(scanResult, tempDir!),
      files: transformedFiles
    };

    // Prepare response before cleanup
    const response = NextResponse.json(result);

    // Safe cleanup after response preparation
    if (tempDir) {
      await safeRemoveDir(tempDir);
    }

    return response;

  } catch (error) {
    console.error('Scan Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during scan' },
      { status: 500 }
    );
  } finally {
    // Final cleanup attempt if not already done
    if (tempDir) {
      await safeRemoveDir(tempDir);
    }
  }
}
