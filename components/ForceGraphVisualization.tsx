'use client';

// Advanced Force-Directed Graph using react-force-graph-2d
import { useRef, useEffect, useCallback, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { useCodeMRIStore } from '@/lib/store';

const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-r-2 border-t-2 border-l-2 border-cyan-400"></div>
          <p className="text-cyan-300 text-sm">Loading Force Graph...</p>
        </div>
      </div>
    )
  }
);

interface ForceGraphVisualizationProps {
  className?: string;
}

// Language normalization function
function normalizeLanguageName(language: string): string {
  const languageMap: Record<string, string> = {
    'js': 'JavaScript',
    'node': 'Node.js',
    'ts': 'TypeScript',
    'py': 'Python',
    'html': 'HTML',
    'css': 'CSS',
    'jsx': 'React',
    'tsx': 'React',
    'vue': 'Vue.js',
    'angular': 'Angular',
    'vite': 'Vite',
    'tailwind': 'Tailwind CSS',
    'scss': 'SCSS',
    'sass': 'Sass',
    'json': 'JSON',
    'md': 'Markdown',
    'yml': 'YAML',
    'yaml': 'YAML',
    'env': 'Environment',
    'go': 'Go',
    'rs': 'Rust',
    'java': 'Java',
    'c': 'C',
    'cpp': 'C++',
    'csharp': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'dart': 'Dart',
    'scala': 'Scala',
    'r': 'R',
    'sql': 'SQL',
    'sh': 'Shell',
    'bash': 'Bash',
    'zsh': 'Zsh',
    'fish': 'Fish',
    'ps1': 'PowerShell',
    'dockerfile': 'Docker',
    'docker': 'Docker',
    'k8s': 'Kubernetes',
    'kubernetes': 'Kubernetes',
    'terraform': 'Terraform',
    'tf': 'Terraform',
    'graphql': 'GraphQL',
    'gql': 'GraphQL',
    'xml': 'XML',
    'csv': 'CSV',
    'txt': 'Text',
    'log': 'Log',
    'lock': 'Lock',
    'gitignore': 'Git',
    'eslintrc': 'ESLint',
    'prettierrc': 'Prettier',
    'editorconfig': 'EditorConfig',
    'babelrc': 'Babel',
    'tsconfig': 'TypeScript Config',
    'package': 'Package',
    'npm': 'NPM',
    'yarn': 'Yarn',
    'pnpm': 'PNPM',
    'webpack': 'Webpack',
    'rollup': 'Rollup',
    'parcel': 'Parcel',
    'next': 'Next.js',
    'nuxt': 'Nuxt.js',
    'gatsby': 'Gatsby',
    'svelte': 'Svelte',
    'solid': 'SolidJS',
    'qwik': 'Qwik',
    'remix': 'Remix',
    'astro': 'Astro',
    'deno': 'Deno',
    'bun': 'Bun',
    'express': 'Express.js',
    'koa': 'Koa.js',
    'fastify': 'Fastify',
    'nest': 'NestJS',
    'socket': 'Socket.io',
    'ws': 'WebSocket',
    'prisma': 'Prisma',
    'typeorm': 'TypeORM',
    'sequelize': 'Sequelize',
    'mongoose': 'Mongoose',
    'postgres': 'PostgreSQL',
    'mysql': 'MySQL',
    'sqlite': 'SQLite',
    'redis': 'Redis',
    'mongodb': 'MongoDB',
    'firebase': 'Firebase',
    'supabase': 'Supabase',
    'aws': 'AWS',
    'azure': 'Azure',
    'gcp': 'Google Cloud',
    'vercel': 'Vercel',
    'netlify': 'Netlify',
    'heroku': 'Heroku',
    'digitalocean': 'DigitalOcean',
    'cloudflare': 'Cloudflare',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'bitbucket': 'Bitbucket',
    'jest': 'Jest',
    'vitest': 'Vitest',
    'mocha': 'Mocha',
    'jasmine': 'Jasmine',
    'karma': 'Karma',
    'cypress': 'Cypress',
    'playwright': 'Playwright',
    'selenium': 'Selenium',
    'storybook': 'Storybook',
    'chromatic': 'Chromatic',
    'testing': 'Testing Library',
    'enzyme': 'Enzyme',
    'sinon': 'Sinon',
    'chai': 'Chai',
    'lodash': 'Lodash',
    'axios': 'Axios',
    'fetch': 'Fetch API',
    'request': 'Request',
    'moment': 'Moment.js',
    'date': 'Date.js',
    'luxon': 'Luxon',
    'dayjs': 'Day.js',
    'preact': 'Preact',
    'inferno': 'Inferno',
    'hyperapp': 'Hyperapp',
    'mithril': 'Mithril.js',
    'marionette': 'Marionette.js',
    'backbone': 'Backbone.js',
    'underscore': 'Underscore.js',
    'jquery': 'jQuery',
    'bootstrap': 'Bootstrap',
    'bulma': 'Bulma',
    'foundation': 'Foundation',
    'semantic': 'Semantic UI',
    'materialize': 'Materialize',
    'material': 'Material UI',
    'ant': 'Ant Design',
    'chakra': 'Chakra UI',
    'mantine': 'Mantine',
    'mui': 'MUI',
    'prime': 'PrimeReact',
    'shadcn': 'shadcn/ui',
    'radix': 'Radix UI',
    'headless': 'Headless UI',
    'reach': 'Reach UI',
    'reactstrap': 'Reactstrap',
    'rebass': 'Rebass',
    'grommet': 'Grommet',
    'evergreen': 'Evergreen',
    'theme': 'Theme UI',
    'styled': 'Styled Components',
    'emotion': 'Emotion',
    'glamorous': 'Glamorous',
    'aphrodite': 'Aphrodite',
    'fela': 'Fela',
    'jss': 'JSS',
    'cssinjs': 'CSS-in-JS',
    'styledjsx': 'Styled JSX',
    'cssmodules': 'CSS Modules',
    'postcss': 'PostCSS',
    'autoprefixer': 'Autoprefixer',
    'purgecss': 'PurgeCSS',
    'unocss': 'UnoCSS',
    'windicss': 'WindiCSS',
    'tailwindcss': 'Tailwind CSS',
    'bootstrapcss': 'Bootstrap CSS',
    'bulmacss': 'Bulma CSS',
    'foundationcss': 'Foundation CSS',
    'semanticcss': 'Semantic UI CSS',
    'materializecss': 'Materialize CSS',
    'materialcss': 'Material CSS',
    'antcss': 'Ant Design CSS',
    'chakracss': 'Chakra UI CSS',
    'mantecss': 'Mantine CSS',
    'muicss': 'MUI CSS',
    'primecss': 'PrimeReact CSS',
    'shadcncss': 'shadcn/ui CSS',
    'radixcss': 'Radix UI CSS',
    'headlesscss': 'Headless UI CSS',
    'reachcss': 'Reach UI CSS',
    'reactstrapcss': 'Reactstrap CSS',
    'rebasscss': 'Rebass CSS',
    'grommetcss': 'Grommet CSS',
    'evergreencss': 'Evergreen CSS',
    'themecss': 'Theme UI CSS',
    'styledcomponents': 'Styled Components',
    'emotioncss': 'Emotion CSS',
    'glamorouscss': 'Glamorous CSS',
    'aphroditecss': 'Aphrodite CSS',
    'felacss': 'Fela CSS',
    'jsscss': 'JSS CSS',
    'cssinjscss': 'CSS-in-JS CSS',
    'styledjsxcss': 'Styled JSX CSS',
    'cssmodulescss': 'CSS Modules CSS',
    'postcsscss': 'PostCSS CSS',
    'autoprefixercss': 'Autoprefixer CSS',
    'purgecsscss': 'PurgeCSS CSS',
    'unocsscss': 'UnoCSS CSS',
    'windicsscss': 'WindiCSS CSS'
  };
  
  const lowercased = language.toLowerCase();
  return languageMap[lowercased] || language;
}

const ForceGraphVisualization = memo(function ForceGraphVisualization({ className = '' }: ForceGraphVisualizationProps) {
  const { scanResult } = useCodeMRIStore();
  const graphRef = useRef<any>(null);

  // Memoize graph data for performance
  const graphData = useMemo(() => {
    if (!scanResult?.dependencyGraph) {
      return { nodes: [], links: [] };
    }

    // Limit nodes for performance while preserving connectivity
    const maxNodes = 400;
    const allNodes = scanResult.dependencyGraph.nodes;
    const allEdges = scanResult.dependencyGraph.edges;
    const nodeById = new Map(allNodes.map((node) => [node.id, node]));
    const selectedNodeIds = new Set<string>();

    // Prefer nodes that participate in edges so links remain visible.
    for (const edge of allEdges) {
      if (selectedNodeIds.size >= maxNodes) break;
      if (nodeById.has(edge.source)) selectedNodeIds.add(edge.source);
      if (selectedNodeIds.size >= maxNodes) break;
      if (nodeById.has(edge.target)) selectedNodeIds.add(edge.target);
    }

    // Fill remaining slots with unconnected nodes.
    if (selectedNodeIds.size < maxNodes) {
      for (const node of allNodes) {
        if (selectedNodeIds.size >= maxNodes) break;
        selectedNodeIds.add(node.id);
      }
    }

    const nodes = allNodes.filter((node) => selectedNodeIds.has(node.id));
    const links = allEdges.filter(
      (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    );

    // Process nodes with normalized language names and colors
    const processedNodes = nodes.map(node => {
      const normalizedType = normalizeLanguageName(node.type);
      let color = '#8b5cf6'; // Default purple
      
      switch (normalizedType) {
        case 'JavaScript':
          color = '#f7df1e';
          break;
        case 'TypeScript':
          color = '#3178c6';
          break;
        case 'Python':
          color = '#3776ab';
          break;
        case 'Node.js':
          color = '#68a063';
          break;
        case 'React':
          color = '#61dafb';
          break;
        case 'Vue.js':
          color = '#4fc08d';
          break;
        case 'HTML':
          color = '#e34c26';
          break;
        case 'CSS':
          color = '#1572b6';
          break;
        case 'Tailwind CSS':
          color = '#06b6d4';
          break;
        case 'Vite':
          color = '#646cff';
          break;
        case 'Next.js':
          color = '#000000';
          break;
        case 'External':
          color = '#ef4444';
          break;
      }

      return {
        id: node.id,
        name: node.id,
        color,
        type: normalizedType,
        // Node size based on type
        radius: node.type === 'External' ? 6 : 4,
      };
    });

    return {
      nodes: processedNodes,
      links: links.map(edge => ({
        source: edge.source,
        target: edge.target,
      }))
    };
  }, [scanResult?.dependencyGraph]);

  // Handle node hover for labels
  const handleNodeHover = useCallback((node: any) => {
    if (node) {
      // Show node label on hover
      graphRef.current?.highlightNode?.(node);
    }
  }, []);

  // Handle node click for details
  const handleNodeClick = useCallback((node: any) => {
    console.log('Node clicked:', node);
    // Could show modal with node details
  }, []);

  return (
    <div className={`w-full h-full ${className}`}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="name"
        nodeAutoColorBy="type"
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth + 6, fontSize + 4];
          
          // Draw node background
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw label if hovered or important
          if (node.type === 'External' || node.type === 'TypeScript' || node.type === 'JavaScript') {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(label, node.x, node.y + node.radius + fontSize + 2);
          }
        }}
        linkColor={() => 'rgba(107, 114, 128, 0.3)'}
        linkWidth={0.5}
        linkDirectionalParticles={graphData.nodes.length < 200 ? 2 : 0}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={1}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTicks={120}
        cooldownTime={4000}
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        backgroundColor="rgba(15, 23, 42, 0.9)"
      />
    </div>
  );
});

export default ForceGraphVisualization;
