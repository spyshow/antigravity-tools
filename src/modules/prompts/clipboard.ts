import { spawn } from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export interface CopyResult {
  success: boolean;
  method: string;
  message: string;
}

/**
 * Copies plain text to system clipboard across Windows, macOS, and Linux.
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  const platform = os.platform();

  if (platform === 'win32') {
    return copyWindows(text);
  } else if (platform === 'darwin') {
    return copyMac(text);
  } else {
    return copyLinux(text);
  }
}

/**
 * Windows clipboard copy using temporary UTF-8 file and PowerShell Set-Clipboard
 * for 100% reliable Unicode / multiline support.
 */
async function copyWindows(text: string): Promise<CopyResult> {
  const tempFile = path.join(os.tmpdir(), `agy_clip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.tmp`);

  try {
    // Write UTF-8 with BOM or UTF-8
    await fs.promises.writeFile(tempFile, text, { encoding: 'utf8' });

    await new Promise<void>((resolve, reject) => {
      const ps = spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `Get-Content -LiteralPath '${tempFile.replace(/'/g, "''")}' -Raw -Encoding utf8 | Set-Clipboard`
      ]);

      ps.on('error', reject);
      ps.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`PowerShell Set-Clipboard exited with code ${code}`));
      });
    });

    return {
      success: true,
      method: 'powershell-set-clipboard',
      message: 'Prompt successfully copied to Windows clipboard!'
    };
  } catch (primaryErr) {
    // Fallback to clip.exe via stdin
    try {
      await new Promise<void>((resolve, reject) => {
        const clip = spawn('clip.exe');
        clip.on('error', reject);
        clip.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`clip.exe exited with code ${code}`));
        });
        clip.stdin.write(text, 'utf8');
        clip.stdin.end();
      });

      return {
        success: true,
        method: 'clip.exe',
        message: 'Prompt copied to Windows clipboard via clip.exe'
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        method: 'failed',
        message: `Failed to copy to clipboard: ${fallbackErr?.message || primaryErr}`
      };
    }
  } finally {
    // Clean up temp file
    fs.promises.unlink(tempFile).catch(() => {});
  }
}

async function copyMac(text: string): Promise<CopyResult> {
  return new Promise((resolve) => {
    const pbcopy = spawn('pbcopy');
    pbcopy.on('error', (err) => {
      resolve({
        success: false,
        method: 'pbcopy',
        message: `pbcopy failed: ${err.message}`
      });
    });
    pbcopy.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          method: 'pbcopy',
          message: 'Prompt successfully copied to macOS clipboard!'
        });
      } else {
        resolve({
          success: false,
          method: 'pbcopy',
          message: `pbcopy exited with code ${code}`
        });
      }
    });
    pbcopy.stdin.write(text, 'utf8');
    pbcopy.stdin.end();
  });
}

async function copyLinux(text: string): Promise<CopyResult> {
  // Try wl-copy (Wayland), then xclip, then xsel
  const commands = [
    { cmd: 'wl-copy', args: [] },
    { cmd: 'xclip', args: ['-selection', 'clipboard'] },
    { cmd: 'xsel', args: ['--clipboard', '--input'] }
  ];

  for (const { cmd, args } of commands) {
    try {
      const res = await new Promise<boolean>((resolve) => {
        const proc = spawn(cmd, args);
        proc.on('error', () => resolve(false));
        proc.on('close', (code) => resolve(code === 0));
        proc.stdin.write(text, 'utf8');
        proc.stdin.end();
      });

      if (res) {
        return {
          success: true,
          method: cmd,
          message: `Prompt successfully copied to Linux clipboard via ${cmd}!`
        };
      }
    } catch {
      // try next
    }
  }

  return {
    success: false,
    method: 'linux-clipboard-missing',
    message: 'Could not copy to clipboard: no clipboard utility found (wl-copy, xclip, xsel).'
  };
}
