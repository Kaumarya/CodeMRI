# CodeMRI

A powerful codebase analysis tool that provides deep insights into your project structure, dependencies, and potential risks. Upload ZIP files or scan GitHub repositories to get comprehensive code analysis with AI-powered insights.

## Features

- **Codebase Scanning**: Analyze entire codebases from ZIP files or GitHub repositories
- **Dependency Graph Visualization**: Interactive graph showing file dependencies and relationships
- **Risk Detection**: Automatic detection of security risks, code smells, and potential issues
- **AI-Powered Insights**: Get intelligent analysis and recommendations powered by Groq AI
- **Language Detection**: Identify all programming languages used in your project
- **Architecture Analysis**: Understand your project's structure and patterns
- **File Explorer**: Navigate through scanned files with import tracking
- **History Tracking**: Keep track of previous scans for comparison

## Tech Stack

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Modern UI components
- **React Flow**: Interactive graph visualization
- **Framer Motion**: Smooth animations
- **Zustand**: State management
- **Groq AI**: AI-powered code insights

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```
GROQ_API_KEY=your_groq_api_key_here
GITHUB_TOKEN=your_github_token_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### API Keys

- **GROQ_API_KEY**: Required for AI-powered insights. Get your free API key from [console.groq.com](https://console.groq.com)
- **GITHUB_TOKEN**: Optional but recommended for scanning private repositories and avoiding rate limits. Create a personal access token at [github.com/settings/tokens](https://github.com/settings/tokens)

## Usage

1. **Upload ZIP**: Upload a ZIP file of your codebase
2. **GitHub URL**: Enter a GitHub repository URL to scan directly
3. **View Analysis**: Explore the interactive analysis dashboard
4. **Get AI Insights**: Click "Get AI Insights" for intelligent recommendations

## Project Structure

```
code-mri/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── scan/          # ZIP file scanning endpoint
│   │   ├── scan-github/   # GitHub repository scanning endpoint
│   │   └── ai-insights/   # AI-powered insights endpoint
│   ├── analysis/          # Analysis page
│   ├── compare/           # Comparison page
│   └── history/           # History page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                   # Utility functions
│   ├── nuclearScanner.ts # Core scanning logic
│   └── store.ts          # Zustand state management
└── public/               # Static assets
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## License

MIT License
