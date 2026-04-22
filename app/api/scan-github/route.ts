import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { readFileSync } from 'fs';
import path from 'path';
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

function parseGithubUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return null;
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    let repo = parts[1];
    if (repo.endsWith('.git')) repo = repo.slice(0, -4);
    return { owner: parts[0], repo };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ScanResult | { error: string }>> {
  let tempDir: string | null = null;
  
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    const githubInfo = parseGithubUrl(url);
    if (!githubInfo) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const { owner, repo } = githubInfo;

    const headers: HeadersInit = { 'User-Agent': 'CodeMRI' };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const githubUrl = `https://api.github.com/repos/${owner}/${repo}/zipball`;
    const response = await fetch(githubUrl, { headers });
    
    if (response.status === 404) {
      return NextResponse.json({ error: 'Repository not found or is private' }, { status: 404 });
    }
    if (response.status === 403 || response.status === 429) {
      return NextResponse.json({ error: 'GitHub rate limit reached. Add a GITHUB_TOKEN to .env.local' }, { status: 429 });
    }
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to download repository from GitHub' }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    tempDir = path.join(process.cwd(), 'temp', randomUUID());
    await fs.mkdir(tempDir, { recursive: true });

    const zipPath = path.join(tempDir, `${repo}.zip`);
    await fs.writeFile(zipPath, buffer);

    const zip = new AdmZip(buffer);
    zip.extractAllTo(tempDir, true);

    const scanResult = await scanCodebase(tempDir);
    
    const hasEnvFile = scanResult.files.some(file => 
      path.basename(file) === '.env' || path.basename(file).startsWith('.env')
    );
    
    const externalServices = scanResult.dependencyGraph.nodes
      .filter(node => node.type === 'External')
      .map(node => node.id);

    const jsTsFiles = (scanResult.languages['JavaScript'] || 0) + (scanResult.languages['TypeScript'] || 0);
    
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

    const transformedFiles = scanResult.files.map(filePath => {
      const relativePath = path.relative(tempDir!, filePath).split(path.sep).join('/');
      const fileName = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
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
      analyzedFiles: Math.min(scanResult.totalFiles, 500),
      jsTsFiles,
      foldersCount,
      detectedLanguages: scanResult.languages,
      simpleRiskScore: calculateRiskScore(scanResult, hasEnvFile),
      dependencyGraph: scanResult.dependencyGraph,
      externalServices,
      risks: detectRisks(scanResult, tempDir!),
      files: transformedFiles
    };

    const nextResponse = NextResponse.json(result);

    if (tempDir) {
      await safeRemoveDir(tempDir);
    }

    return nextResponse;

  } catch (error) {
    if (tempDir) {
      await safeRemoveDir(tempDir);
    }
    return NextResponse.json(
      { error: 'Internal server error during scan' },
      { status: 500 }
    );
  }
}
