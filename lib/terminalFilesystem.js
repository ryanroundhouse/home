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
              "grep": {
                "type": "file",
                "name": "grep",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 186496,
                "modified": "2024-01-01T00:00:00Z",
                "content": "Binary executable"
              }
            }
          }
        }
      },
      "user": {
        "type": "directory",
        "name": "user",
        "permissions": "drwxr-xr-x",
        "owner": "root",
        "group": "root",
        "size": 4096,
        "modified": "2024-01-15T10:00:00Z",
        "contents": {
          "ryan": {
            "type": "directory",
            "name": "ryan",
            "permissions": "drwxr-xr-x",
            "owner": "ryan",
            "group": "ryan",
            "size": 4096,
            "modified": "2024-01-15T10:00:00Z",
            "contents": {
              "projects": {
                "type": "directory",
                "name": "projects",
                "permissions": "drwxr-xr-x",
                "owner": "ryan",
                "group": "ryan",
                "size": 4096,
                "modified": "2024-01-15T09:30:00Z",
                "contents": {
                  "moodful": {
                    "type": "directory",
                    "name": "moodful",
                    "permissions": "drwxr-xr-x",
                    "owner": "ryan",
                    "group": "ryan",
                    "size": 4096,
                    "modified": "2024-01-12T14:20:00Z",
                    "contents": {
                      "README.md": {
                        "type": "file",
                        "name": "README.md",
                        "permissions": "-rw-r--r--",
                        "owner": "ryan",
                        "group": "ryan",
                        "size": 3072,
                        "modified": "2024-01-12T14:20:00Z",
                        "content": "# Moodful\n\nA mood tracking app designed for daily clarity and gentle habit loops.\n\nBuilt with modern web technologies."
                      }
                    }
                  },
                  "punk-mud": {
                    "type": "directory",
                    "name": "punk-mud",
                    "permissions": "drwxr-xr-x",
                    "owner": "ryan",
                    "group": "ryan",
                    "size": 4096,
                    "modified": "2024-01-10T11:00:00Z",
                    "contents": {
                      "README.md": {
                        "type": "file",
                        "name": "README.md",
                        "permissions": "-rw-r--r--",
                        "owner": "ryan",
                        "group": "ryan",
                        "size": 2048,
                        "modified": "2024-01-10T11:00:00Z",
                        "content": "# Punk MUD\n\nA multiplayer text-based adventure game built with Node.js, Express, and WebSockets."
                      }
                    }
                  }
                }
              },
              "resume.txt": {
                "type": "file",
                "name": "resume.txt",
                "permissions": "-rw-r--r--",
                "owner": "ryan",
                "group": "ryan",
                "size": 8192,
                "modified": "2024-01-15T08:00:00Z",
                "content": "Ryan Graham\n===========\n\nSoftware Developer\nTech enthusiast, builder, and problem solver.\n\nExperience:\n- Built production systems\n- Created lifestyle automations\n- Shipped side projects\n\nSkills: JavaScript, Node.js, Python, Web Development"
              },
              "bio.txt": {
                "type": "file",
                "name": "bio.txt",
                "permissions": "-rw-r--r--",
                "owner": "ryan",
                "group": "ryan",
                "size": 1024,
                "modified": "2024-01-14T10:00:00Z",
                "content": "I build software, games, and experiments for fun and profit.\n\nI've shipped production systems, life-style automations, and side projects like Moodful, usually by poking at tech until it does something interesting.\n\nThis site is my lab: half serious, half playful, fully curious."
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
            "content": "root:x:0:0:root:/root:/bin/bash\nrg:x:1000:1000:Ryan Graham:/home/rg:/bin/bash\nryan:x:1001:1001:Ryan:/user/ryan:/bin/bash"
          }
        }
      }
    }
  }
};

export const filesystem = filesystemData['/'];

export function getNode(path) {
  if (!filesystem) return null;
  
  const normalized = normalizePath(path);
  const parts = normalized.split('/').filter(p => p);
  
  let node = filesystem;
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
