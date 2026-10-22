import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AgencySkillItem } from './types.js';

export class AgencyDetector {
  /**
   * Discovers all candidate skill directories across project and OS profile locations.
   */
  public getCandidateSkillDirs(workspaceDir: string = process.cwd()): string[] {
    const dirs: string[] = [];
    const addIfExists = (dirPath: string) => {
      try {
        if (fs.existsSync(dirPath)) {
          dirs.push(path.resolve(dirPath));
        }
      } catch {}
    };

    // 1. Local project skills directory
    addIfExists(path.join(workspaceDir, '.agents', 'skills'));
    addIfExists(path.join(workspaceDir, 'skills'));

    // 2. Standard HOME & USERPROFILE directories
    const home = os.homedir();
    addIfExists(path.join(home, '.gemini', 'antigravity', 'skills'));
    addIfExists(path.join(home, '.gemini', 'config', 'skills'));

    // Windows APPDATA & USERPROFILE
    if (process.env.USERPROFILE && process.env.USERPROFILE !== home) {
      addIfExists(path.join(process.env.USERPROFILE, '.gemini', 'antigravity', 'skills'));
      addIfExists(path.join(process.env.USERPROFILE, '.gemini', 'config', 'skills'));
    }

    if (process.env.APPDATA) {
      addIfExists(path.join(process.env.APPDATA, 'antigravity', 'skills'));
    }

    // 3. WSL2 check if running in Linux inspecting Windows host
    if (process.platform === 'linux' && fs.existsSync('/mnt/c/Users')) {
      try {
        const users = fs.readdirSync('/mnt/c/Users');
        for (const u of users) {
          if (u === 'Public' || u === 'Default' || u === 'All Users') continue;
          addIfExists(path.join('/mnt/c/Users', u, '.gemini', 'antigravity', 'skills'));
          addIfExists(path.join('/mnt/c/Users', u, '.gemini', 'config', 'skills'));
          addIfExists(path.join('/mnt/c/Users', u, 'AppData', 'Roaming', 'antigravity', 'skills'));
        }
      } catch {}
    }

    // Remove duplicates
    return Array.from(new Set(dirs));
  }

  /**
   * Scans all candidate directories to identify installed Agency Agents.
   */
  public discoverAgencySkills(workspaceDir: string = process.cwd()): AgencySkillItem[] {
    const candidateDirs = this.getCandidateSkillDirs(workspaceDir);
    const agentMap = new Map<string, AgencySkillItem>();

    for (const baseDir of candidateDirs) {
      try {
        const entries = fs.readdirSync(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;

          const skillFilePath = path.join(baseDir, entry.name, 'SKILL.md');
          if (!fs.existsSync(skillFilePath)) continue;

          try {
            const raw = fs.readFileSync(skillFilePath, 'utf8');
            const lines = raw.split('\n');

            let parsedName = '';
            let parsedDescription = '';

            // Read YAML frontmatter
            let inFrontmatter = false;
            for (let i = 0; i < Math.min(lines.length, 30); i++) {
              const line = lines[i].trim();
              if (line === '---') {
                if (!inFrontmatter) {
                  inFrontmatter = true;
                  continue;
                } else {
                  break; // end of frontmatter
                }
              }

              if (inFrontmatter) {
                const nameMatch = line.match(/^name:\s*['"]?([^'"]+)['"]?/i);
                if (nameMatch) {
                  parsedName = nameMatch[1].trim();
                }

                const descMatch = line.match(/^description:\s*['"]?([^'"]+)['"]?/i);
                if (descMatch) {
                  parsedDescription = descMatch[1].trim().replace(/\r$/, '');
                }
              }
            }

            // An Agency Agent either has folder starting with agency- OR frontmatter name starting with agency-
            const isAgency = entry.name.startsWith('agency-') || parsedName.startsWith('agency-');
            if (!isAgency) continue;

            const slug = parsedName.startsWith('agency-') ? parsedName : entry.name;

            // Clean description and escape pipes for markdown tables
            let cleanDesc = parsedDescription || `Specialized Agency Agent persona (${slug})`;
            cleanDesc = cleanDesc.replace(/\|/g, '\\|');

            // Format title
            const displayName = slug
              .replace(/^agency-/, '')
              .split('-')
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');

            const normalizedSkillPath = skillFilePath.replace(/\\/g, '/');

            // Only add if not already present (local project wins over global)
            if (!agentMap.has(slug)) {
              agentMap.set(slug, {
                slug,
                displayName,
                description: cleanDesc,
                skillPath: normalizedSkillPath,
                directoryName: entry.name,
                sourceDir: baseDir
              });
            }
          } catch {}
        }
      } catch {}
    }

    // Return sorted alphabetically by slug
    return Array.from(agentMap.values()).sort((a, b) => a.slug.localeCompare(b.slug));
  }
}
