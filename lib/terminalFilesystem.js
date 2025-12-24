/**
 * Filesystem data and operations for the in-browser terminal.
 * Embedded filesystem data (works with both file:// and http:// protocols).
 */

import { normalizePath } from './terminalPaths.js';

// Embedded filesystem data (works with both file:// and http:// protocols)
export const filesystemData = {
  "/": {
    "type": "directory",
    "name": "/",
    "permissions": "drwxr-xr-x",
    "owner": "root",
    "group": "root",
    "size": 4096,
    "modified": "2024-01-15T10:00:00Z",
    "contents": {
      "home": {
        "type": "directory",
        "name": "home",
        "permissions": "drwxr-xr-x",
        "owner": "root",
        "group": "root",
        "size": 4096,
        "modified": "2024-01-15T10:00:00Z",
        "contents": {
          "rg": {
            "type": "directory",
            "name": "rg",
            "permissions": "drwxr-xr-x",
            "owner": "rg",
            "group": "rg",
            "size": 4096,
            "modified": "2024-01-15T10:00:00Z",
            "contents": {
              "bin": {
                "type": "directory",
                "name": "bin",
                "permissions": "drwxr-xr-x",
                "owner": "rg",
                "group": "rg",
                "size": 4096,
                "modified": "2024-01-15T10:00:00Z",
                "contents": {
                  "backup.sh": {
                    "type": "file",
                    "name": "backup.sh",
                    "permissions": "-rwxr-xr-x",
                    "owner": "rg",
                    "group": "rg",
                    "size": 1024,
                    "modified": "2024-01-14T08:30:00Z",
                    "content": "#!/bin/bash\n# Personal backup script\necho 'Backing up important files...'\n# backup logic here"
                  },
                  "deploy.sh": {
                    "type": "file",
                    "name": "deploy.sh",
                    "permissions": "-rwxr-xr-x",
                    "owner": "rg",
                    "group": "rg",
                    "size": 2048,
                    "modified": "2024-01-13T15:20:00Z",
                    "content": "#!/bin/bash\n# Deployment script\necho 'Deploying to production...'\n# deployment logic"
                  },
                  "decrypt": {
                    "type": "file",
                    "name": "decrypt",
                    "permissions": "-rwxr-xr-x",
                    "owner": "rg",
                    "group": "rg",
                    "size": 61440,
                    "modified": "2024-01-14T22:04:00Z",
                    "content": "Binary executable"
                  }
                }
              },
              "Documents": {
                "type": "directory",
                "name": "Documents",
                "permissions": "drwxr-xr-x",
                "owner": "rg",
                "group": "rg",
                "size": 4096,
                "modified": "2024-01-15T09:00:00Z",
                "contents": {
                  "notes.txt": {
                    "type": "file",
                    "name": "notes.txt",
                    "permissions": "-rw-r--r--",
                    "owner": "rg",
                    "group": "rg",
                    "size": 512,
                    "modified": "2024-01-15T08:45:00Z",
                    "content": "TODO:\n- Finish terminal filesystem\n- Add more commands\n- Test navigation"
                  },
                  "ideas.md": {
                    "type": "file",
                    "name": "ideas.md",
                    "permissions": "-rw-r--r--",
                    "owner": "rg",
                    "group": "rg",
                    "size": 2048,
                    "modified": "2024-01-14T16:30:00Z",
                    "content": "# Project Ideas\n\n1. Terminal-based portfolio site\n2. Retro arcade game\n3. AI-powered automation tools"
                  }
                }
              },
              "vault.txt": {
                "type": "file",
                "name": "vault.txt",
                "permissions": "-rw-------",
                "owner": "rg",
                "group": "rg",
                "size": 1024,
                "modified": "2024-02-02T03:14:15Z",
                "encrypted": true,
                "content": "RG/OPS — PERSONAL\n-----------------\n\nIf you're reading this, you timed the injection correctly.\n\nNext steps:\n- check /home/rg/.bashrc\n- grep \"unlock\" in ~\n\nReminder: don't store keys in plaintext.\n"
              },
              ".bashrc": {
                "type": "file",
                "name": ".bashrc",
                "permissions": "-rw-r--r--",
                "owner": "rg",
                "group": "rg",
                "size": 1536,
                "modified": "2024-01-10T12:00:00Z",
                "content": "# ~/.bashrc\n# Personal bash configuration\nexport EDITOR=vim\nalias ll='ls -la'\nalias la='ls -A'"
              },
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "rg",
                "group": "rg",
                "size": 256,
                "modified": "2024-01-10T12:00:00Z",
                "content": "# ~/.profile\n# Personal profile settings\nPATH=$PATH:$HOME/bin"
              },
              "TODO.md": {
                "type": "file",
                "name": "TODO.md",
                "permissions": "-rw-r--r--",
                "owner": "rg",
                "group": "rg",
                "size": 512,
                "modified": "2024-02-06T16:45:00Z",
                "content": "# TODO\n\nNo active quests.\n"
              },
              "DONE.md": {
                "type": "file",
                "name": "DONE.md",
                "permissions": "-rw-r--r--",
                "owner": "rg",
                "group": "rg",
                "size": 256,
                "modified": "2024-02-06T17:10:00Z",
                "content": "# DONE\n\nNothing completed yet.\n"
              }
            }
          }
        }
      },
      "usr": {
        "type": "directory",
        "name": "usr",
        "permissions": "drwxr-xr-x",
        "owner": "root",
        "group": "root",
        "size": 4096,
        "modified": "2024-01-15T10:00:00Z",
        "contents": {
          "bin": {
            "type": "directory",
            "name": "bin",
            "permissions": "drwxr-xr-x",
            "owner": "root",
            "group": "root",
            "size": 4096,
            "modified": "2024-01-15T10:00:00Z",
            "contents": {
              "help": {
                "type": "file",
                "name": "help",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 24576,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "whoami": {
                "type": "file",
                "name": "whoami",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 16384,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "projects": {
                "type": "file",
                "name": "projects",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 28672,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "open": {
                "type": "file",
                "name": "open",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 32768,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "theme": {
                "type": "file",
                "name": "theme",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 20480,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "clear": {
                "type": "file",
                "name": "clear",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 12288,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "matrix": {
                "type": "file",
                "name": "matrix",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 45056,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "cd": {
                "type": "file",
                "name": "cd",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 4096,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "ls": {
                "type": "file",
                "name": "ls",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 133792,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "cat": {
                "type": "file",
                "name": "cat",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 35840,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "pwd": {
                "type": "file",
                "name": "pwd",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 14336,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "ssh": {
                "type": "file",
                "name": "ssh",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 81920,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "exit": {
                "type": "file",
                "name": "exit",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 4096,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "reboot": {
                "type": "file",
                "name": "reboot",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 24576,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "rm": {
                "type": "file",
                "name": "rm",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 90112,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "grep": {
                "type": "file",
                "name": "grep",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 186496,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "bbs": {
                "type": "file",
                "name": "bbs",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 57344,
                "modified": "2024-02-08T23:10:00Z",
                "content": "Binary executable"
              }
            }
          }
        }
      },
      "bin": {
        "type": "directory",
        "name": "bin",
        "permissions": "drwxr-xr-x",
        "owner": "root",
        "group": "root",
        "size": 4096,
        "modified": "2024-01-15T10:00:00Z",
        "contents": {
          "sh": {
            "type": "file",
            "name": "sh",
            "permissions": "-rwxr-xr-x",
            "owner": "root",
            "group": "root",
            "size": 121464,
            "modified": "2024-01-01T00:00:00Z",
            "content": "Binary executable"
          },
          "bash": {
            "type": "file",
            "name": "bash",
            "permissions": "-rwxr-xr-x",
            "owner": "root",
            "group": "root",
            "size": 1396520,
            "modified": "2024-01-01T00:00:00Z",
            "content": "Binary executable"
          }
        }
      },
      "etc": {
        "type": "directory",
        "name": "etc",
        "permissions": "drwxr-xr-x",
        "owner": "root",
        "group": "root",
        "size": 4096,
        "modified": "2024-01-15T10:00:00Z",
        "contents": {
          "passwd": {
            "type": "file",
            "name": "passwd",
            "permissions": "-rw-r--r--",
            "owner": "root",
            "group": "root",
            "size": 3072,
            "modified": "2024-01-01T00:00:00Z",
            "content": "root:x:0:0:root:/root:/bin/bash\nrg:x:1000:1000:Ryan Graham:/home/rg:/bin/bash"
          }
        }
      }
    }
  }
};

export const moodfulFilesystemData = {
  "/": {
    "type": "directory",
    "name": "/",
    "permissions": "drwxr-xr-x",
    "owner": "root",
    "group": "root",
    "size": 4096,
    "modified": "2024-01-15T10:00:00Z",
    "contents": {
      "usr": {
        "type": "directory",
        "name": "usr",
        "permissions": "drwxr-xr-x",
        "owner": "root",
        "group": "root",
        "size": 4096,
        "modified": "2024-01-15T10:00:00Z",
        "contents": {
          "bin": {
            "type": "directory",
            "name": "bin",
            "permissions": "drwxr-xr-x",
            "owner": "root",
            "group": "root",
            "size": 4096,
            "modified": "2024-01-15T10:00:00Z",
            "contents": {
              "ssh": {
                "type": "file",
                "name": "ssh",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 81920,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "exit": {
                "type": "file",
                "name": "exit",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 4096,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "reboot": {
                "type": "file",
                "name": "reboot",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 24576,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "rm": {
                "type": "file",
                "name": "rm",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 90112,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              }
            }
          }
        }
      },
      "home": {
        "type": "directory",
        "name": "home",
        "permissions": "drwxr-xr-x",
        "owner": "root",
        "group": "root",
        "size": 4096,
        "modified": "2024-01-15T10:00:00Z",
        "contents": {
          "root": {
            "type": "directory",
            "name": "root",
            "permissions": "drwx------",
            "owner": "root",
            "group": "root",
            "size": 4096,
            "modified": "2024-01-15T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "root",
                "group": "root",
                "size": 128,
                "modified": "2024-01-15T10:00:00Z",
                "content": "# /home/root/.profile\nexport PS1='root@moodful.ca:\\w$ '\n"
              },
              "README.txt": {
                "type": "file",
                "name": "README.txt",
                "permissions": "-rw-r--r--",
                "owner": "root",
                "group": "root",
                "size": 256,
                "modified": "2024-01-15T10:00:00Z",
                "content": "Moodful test box. This is a simulated host for the website terminal.\n"
              }
            }
          }
        }
      },
      "etc": {
        "type": "directory",
        "name": "etc",
        "permissions": "drwxr-xr-x",
        "owner": "root",
        "group": "root",
        "size": 4096,
        "modified": "2024-01-15T10:00:00Z",
        "contents": {
          "passwd": {
            "type": "file",
            "name": "passwd",
            "permissions": "-rw-r--r--",
            "owner": "root",
            "group": "root",
            "size": 512,
            "modified": "2024-01-01T00:00:00Z",
            "content": "root:x:0:0:root:/home/root:/bin/bash\n"
          }
        }
      }
    }
  }
};

// Minimal simulated host filesystem: fantasy-football-league.com
export const fantasyFootballFilesystemData = {
  "/": {
    "type": "directory",
    "name": "/",
    "permissions": "drwxr-xr-x",
    "owner": "root",
    "group": "root",
    "size": 4096,
    "modified": "2024-01-15T10:00:00Z",
    "contents": {
      "usr": {
        "type": "directory",
        "name": "usr",
        "permissions": "drwxr-xr-x",
        "owner": "root",
        "group": "root",
        "size": 4096,
        "modified": "2024-01-15T10:00:00Z",
        "contents": {
          "bin": {
            "type": "directory",
            "name": "bin",
            "permissions": "drwxr-xr-x",
            "owner": "root",
            "group": "root",
            "size": 4096,
            "modified": "2024-01-15T10:00:00Z",
            "contents": {
              "ssh": {
                "type": "file",
                "name": "ssh",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 81920,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "exit": {
                "type": "file",
                "name": "exit",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 4096,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "reboot": {
                "type": "file",
                "name": "reboot",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 24576,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              },
              "rm": {
                "type": "file",
                "name": "rm",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 90112,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              }
            }
          }
        }
      },
      "home": {
        "type": "directory",
        "name": "home",
        "permissions": "drwxr-xr-x",
        "owner": "root",
        "group": "root",
        "size": 4096,
        "modified": "2024-01-15T10:00:00Z",
        "contents": {
          "parker": {
            "type": "directory",
            "name": "parker",
            "permissions": "drwxr-xr-x",
            "owner": "parker",
            "group": "parker",
            "size": 4096,
            "modified": "2024-01-15T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "parker",
                "group": "parker",
                "size": 256,
                "modified": "2024-01-10T12:00:00Z",
                "content": "# ~/.profile\n# default profile\n"
              }
            }
          }
        }
      },
      "etc": {
        "type": "directory",
        "name": "etc",
        "permissions": "drwxr-xr-x",
        "owner": "root",
        "group": "root",
        "size": 4096,
        "modified": "2024-01-15T10:00:00Z",
        "contents": {
          "passwd": {
            "type": "file",
            "name": "passwd",
            "permissions": "-rw-r--r--",
            "owner": "root",
            "group": "root",
            "size": 512,
            "modified": "2024-01-01T00:00:00Z",
            "content": "root:x:0:0:root:/home/root:/bin/bash\nparker:x:1001:1001:parker:/home/parker:/bin/bash\n"
          }
        }
      }
    }
  }
};

export const filesystem = filesystemData['/'];

export const hostFilesystems = {
  arcade: filesystemData['/'],
  'moodful.ca': moodfulFilesystemData['/'],
  'fantasy-football-league.com': fantasyFootballFilesystemData['/'],
};

let activeHost = 'arcade';

export function getActiveHost() {
  return activeHost;
}

export function setActiveHost(host) {
  if (!host || typeof host !== 'string') return false;
  if (!hostFilesystems[host]) return false;
  activeHost = host;
  return true;
}

function getActiveFilesystemRoot() {
  return hostFilesystems[activeHost] || hostFilesystems.arcade || null;
}

export function getNode(path) {
  const fsRoot = getActiveFilesystemRoot();
  if (!fsRoot) return null;
  
  const normalized = normalizePath(path);
  const parts = normalized.split('/').filter(p => p);
  
  let node = fsRoot;
  for (const part of parts) {
    if (node.contents && node.contents[part]) {
      node = node.contents[part];
    } else {
      return null;
    }
  }
  
  return node;
}

export function getDirectoryContents(path) {
  const node = getNode(path);
  if (!node || node.type !== 'directory' || !node.contents) {
    return null;
  }
  
  return Object.values(node.contents);
}
