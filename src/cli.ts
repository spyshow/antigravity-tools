#!/usr/bin/env node
import { ModuleRegistry } from './modules/registry.js';
import { PromptsModule } from './modules/prompts/index.js';
import { WebDashboardServer } from './web/server.js';
import { MCPServer } from './mcp-server.js';
import { spawn } from 'child_process';
import * as os from 'os';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const registry = new ModuleRegistry();
  const promptsModule = registry.getModule<PromptsModule>('prompts');
  const service = promptsModule?.getService();

  switch (command) {
    case 'ui':
    case 'web':
    case 'dashboard': {
      let port = 4321;
      const portIdx = args.indexOf('--port');
      if (portIdx !== -1 && args[portIdx + 1]) {
        port = parseInt(args[portIdx + 1], 10);
      }

      const server = new WebDashboardServer(registry, port);
      const actualPort = await server.start(port);
      const url = `http://localhost:${actualPort}`;

      console.log(`\n🚀 Antigravity Tools Web Dashboard running at: ${url}`);
      console.log(`Press Ctrl+C to stop.\n`);

      // Auto-open browser if not in headless/CI
      if (!args.includes('--no-open')) {
        const platform = os.platform();
        if (platform === 'win32') {
          spawn('cmd.exe', ['/c', 'start', url]);
        } else if (platform === 'darwin') {
          spawn('open', [url]);
        } else {
          spawn('xdg-open', [url]);
        }
      }
      break;
    }

    case 'mcp':
    case 'serve': {
      const mcpServer = new MCPServer(registry);
      mcpServer.start();
      break;
    }

    case 'list':
    case 'ls': {
      if (!service) break;
      const category = args[1] && !args[1].startsWith('-') ? args[1] : undefined;
      const prompts = await service.listPrompts({ category });

      console.log(`\n📚 Antigravity Prompt Library (${prompts.length} prompts):\n`);
      for (const p of prompts) {
        const fav = p.favorite ? ' ⭐' : '';
        const vars = p.variables.length > 0 ? ` [${p.variables.map(v => v.name).join(', ')}]` : '';
        console.log(`  • [${p.id}] ${p.title}${fav} (${p.category})`);
        console.log(`    ${p.description}`);
        if (vars) console.log(`    Variables: ${vars}`);
        console.log('');
      }
      break;
    }

    case 'paste': {
      if (!service) break;
      const idOrTitle = args[1];
      if (!idOrTitle) {
        console.error('Error: Please specify prompt id or title to paste.');
        console.error('Usage: agy-tools paste <prompt-id> [--var key=value ...]');
        process.exit(1);
      }

      // Parse variables: --var key=val or -v key=val
      const vars: Record<string, string> = {};
      for (let i = 2; i < args.length; i++) {
        if ((args[i] === '--var' || args[i] === '-v') && args[i + 1]) {
          const [k, ...vParts] = args[i + 1].split('=');
          if (k) vars[k.trim()] = vParts.join('=').trim();
          i++;
        }
      }

      try {
        const res = await service.pastePrompt(idOrTitle, vars);
        console.log(`\n✅ ${res.message}\n`);
        console.log('--- Rendered Output ---');
        console.log(res.rendered);
        console.log('-----------------------\n');
      } catch (err: any) {
        console.error(`\n❌ Error: ${err.message}\n`);
        process.exit(1);
      }
      break;
    }

    case 'get': {
      if (!service) break;
      const idOrTitle = args[1];
      if (!idOrTitle) {
        console.error('Usage: agy-tools get <prompt-id>');
        process.exit(1);
      }

      const prompt = await service.getPrompt(idOrTitle);
      if (!prompt) {
        console.error(`Prompt "${idOrTitle}" not found.`);
        process.exit(1);
      }

      console.log(JSON.stringify(prompt, null, 2));
      break;
    }

    case 'help':
    default: {
      console.log(`
Antigravity Tools CLI (v1.3.0)

Usage:
  agy-tools ui [--port 4321]           Launch interactive Antigravity Tools Web Dashboard
  agy-tools list [category]           List all prompts in library
  agy-tools paste <id> [--var k=v]     Render prompt and copy to system clipboard
  agy-tools get <id>                  View full prompt details as JSON
  agy-tools mcp                       Run Antigravity Model Context Protocol (stdio)
  agy-tools help                      Display this help message
`);
      break;
    }
  }
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
