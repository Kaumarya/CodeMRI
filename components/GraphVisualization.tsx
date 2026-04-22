'use client';

// Graph Visualization Component with Physics Simulation
import { useEffect, useRef, useMemo, useCallback, memo } from 'react';

interface GraphData {
  nodes: Array<{ id: string; type: string }>;
  edges: Array<{ source: string; target: string }>;
}

interface GraphVisualizationProps {
  graphData: GraphData;
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

const GraphVisualization = memo(function GraphVisualization({ graphData, className = '' }: GraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const isDragging = useRef(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const offset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Memoize node color mapping with normalized language names
  const nodeColorMap = useMemo(() => {
    const colors = new Map<string, string>();
    graphData.nodes.forEach((node: { id: string; type: string }) => {
      const normalizedType = normalizeLanguageName(node.type);
      switch (normalizedType) {
        case 'JavaScript':
          colors.set(node.id, '#f7df1e');
          break;
        case 'TypeScript':
          colors.set(node.id, '#3178c6');
          break;
        case 'Python':
          colors.set(node.id, '#3776ab');
          break;
        case 'Node.js':
          colors.set(node.id, '#68a063');
          break;
        case 'React':
          colors.set(node.id, '#61dafb');
          break;
        case 'Vue.js':
          colors.set(node.id, '#4fc08d');
          break;
        case 'HTML':
          colors.set(node.id, '#e34c26');
          break;
        case 'CSS':
          colors.set(node.id, '#1572b6');
          break;
        case 'Tailwind CSS':
          colors.set(node.id, '#06b6d4');
          break;
        case 'Vite':
          colors.set(node.id, '#646cff');
          break;
        case 'Next.js':
          colors.set(node.id, '#000000');
          break;
        case 'External':
          colors.set(node.id, '#ef4444');
          break;
        default:
          colors.set(node.id, '#8b5cf6');
      }
    });
    return colors;
  }, [graphData.nodes]);

  // Enhanced force-directed graph with physics simulation
  const updateGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (graphData.nodes.length === 0) return;

    // Simple force-directed layout
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.7;

    // Position nodes with improved layout
    const nodePositions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
    
    // Initial positioning in circle
    graphData.nodes.forEach((node: { id: string; type: string }, index: number) => {
      const angle = (index / graphData.nodes.length) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * baseRadius;
      const y = centerY + Math.sin(angle) * baseRadius;
      nodePositions.set(node.id, { x, y, vx: 0, vy: 0 });
    });

    // Simple physics simulation (few iterations for performance)
    for (let iteration = 0; iteration < 20; iteration++) {
      // Apply repulsion between nodes
      const repulsionForce = 50;
      graphData.nodes.forEach((node1: { id: string; type: string }) => {
        const pos1 = nodePositions.get(node1.id);
        if (!pos1) return;

        graphData.nodes.forEach((node2: { id: string; type: string }) => {
          if (node1.id === node2.id) return;
          
          const pos2 = nodePositions.get(node2.id);
          if (!pos2) return;

          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0 && distance < 100) {
            const force = repulsionForce / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            pos1.vx += fx * 0.01;
            pos1.vy += fy * 0.01;
          }
        });
      });

      // Apply attraction along edges
      graphData.edges.forEach((edge: { source: string; target: string }) => {
        const source = nodePositions.get(edge.source);
        const target = nodePositions.get(edge.target);
        
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const attractionForce = distance * 0.001;
            const fx = (dx / distance) * attractionForce;
            const fy = (dy / distance) * attractionForce;
            
            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        }
      });

      // Update positions
      graphData.nodes.forEach((node: { id: string; type: string }) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return;

        // Apply velocity with damping
        pos.x += pos.vx * 0.1;
        pos.y += pos.vy * 0.1;
        pos.vx *= 0.9;
        pos.vy *= 0.9;

        // Keep nodes within bounds
        const margin = 50;
        pos.x = Math.max(margin, Math.min(canvas.width - margin, pos.x));
        pos.y = Math.max(margin, Math.min(canvas.height - margin, pos.y));
      });
    }

    // Draw edges
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    graphData.edges.forEach((edge: { source: string; target: string }) => {
      const source = nodePositions.get(edge.source);
      const target = nodePositions.get(edge.target);
      
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x + offset.current.x, source.y + offset.current.y);
        ctx.lineTo(target.x + offset.current.x, target.y + offset.current.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    graphData.nodes.forEach((node: { id: string; type: string }) => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const color = nodeColorMap.get(node.id) || '#8b5cf6';
      const size = node.type === 'External' ? 8 : 6;

      // Node shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x + offset.current.x, pos.y + offset.current.y, size, 0, 2 * Math.PI);
      ctx.fill();

      // Reset shadow for labels
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw node label for important nodes
      if (node.type === 'External' || node.type === 'TypeScript' || node.type === 'JavaScript') {
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Truncate long labels
        const label = node.id.length > 15 ? node.id.substring(0, 12) + '...' : node.id;
        ctx.fillText(label, pos.x + offset.current.x, pos.y + offset.current.y - size - 3);
      }
    });
  }, [graphData, nodeColorMap, offset]);

  // Initialize and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle resize
    const handleResize = () => {
      updateGraph();
    };
    
    // Mouse events
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      isDragging.current = true;
      dragStart.current = { x, y };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !dragStart.current) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      offset.current = {
        x: x - dragStart.current.x,
        y: y - dragStart.current.y
      };
      
      updateGraph();
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      dragStart.current = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      isDragging.current = true;
      dragStart.current = { x, y };
    });
    
    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      if (!isDragging.current || !dragStart.current) return;

      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      offset.current = {
        x: x - dragStart.current.x,
        y: y - dragStart.current.y
      };
      
      updateGraph();
    });
    
    canvas.addEventListener('touchend', () => {
      isDragging.current = false;
      dragStart.current = null;
    });
    
    window.addEventListener('resize', handleResize);
    
    // Start animation
    const animate = () => {
      updateGraph();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      canvas.removeEventListener('touchstart', handleMouseDown as any);
      canvas.removeEventListener('touchmove', handleMouseMove as any);
      canvas.removeEventListener('touchend', handleMouseUp as any);
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateGraph]);

  // Initial zoom to fit
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      setTimeout(() => {
        updateGraph();
      }, 100);
    }
  }, [graphData.nodes, updateGraph]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full cursor-move ${className}`}
      style={{ 
        background: 'transparent',
        touchAction: 'none'
      }}
    />
  );
});

export default GraphVisualization;
