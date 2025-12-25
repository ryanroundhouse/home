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
                    "name": "guidance.txt",
                    "permissions": "-rw-r--r--",
                    "owner": "rg",
                    "group": "rg",
                    "size": 512,
                    "modified": "2024-01-15T08:45:00Z",
                    "content": "TODO:\n- Check for new mail with the mail command.\n- Check new posts on the bbs.\n"
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
              "themes": {
                "type": "file",
                "name": "themes",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 24576,
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
              },
              "get": {
                "type": "file",
                "name": "get",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 32768,
                "modified": "2024-12-24T00:00:00Z",
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
              },
              "get": {
                "type": "file",
                "name": "get",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 32768,
                "modified": "2024-12-24T00:00:00Z",
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
              },
              "get": {
                "type": "file",
                "name": "get",
                "permissions": "-rwxr-xr-x",
                "owner": "root",
                "group": "root",
                "size": 32768,
                "modified": "2024-12-24T00:00:00Z",
                "content": "Binary executable"
              }
            }
          }
        }
      },
      "fantasy-football-scores": {
        "type": "directory",
        "name": "fantasy-football-scores",
        "permissions": "drwx------",
        "owner": "root",
        "group": "root",
        "size": 4096,
        "modified": "2024-02-10T10:00:00Z",
        "contents": {
          "current-scores.md": {
            "type": "file",
            "name": "current-scores.md",
            "permissions": "-rw-------",
            "owner": "root",
            "group": "root",
            "size": 2048,
            "modified": "2024-02-10T10:00:00Z",
            "content": "# Current week — head-to-head\n\nWeek 14 (in progress)\n\n| Matchup | Score |\n|---|---:|\n| parker vs alex | 71–64 |\n| blake vs casey | 82–79 |\n| devon vs ellis | 68–73 |\n| finn vs harper | 90–88 |\n| jordan vs logan | 75–61 |\n| morgan vs riley | 66–69 |\n"
          },
          "last-week-scores.md": {
            "type": "file",
            "name": "last-week-scores.md",
            "permissions": "-rw-------",
            "owner": "root",
            "group": "root",
            "size": 2048,
            "modified": "2024-02-08T23:59:00Z",
            "content": "# Last week — final scores\n\nWeek 13 (final)\n\n| Matchup | Final |\n|---|---:|\n| parker vs morgan | 66–67 |\n| alex vs blake | 74–70 |\n| casey vs devon | 81–76 |\n| ellis vs finn | 62–84 |\n| harper vs jordan | 77–73 |\n| logan vs riley | 69–60 |\n"
          },
          "historical-scores.md": {
            "type": "file",
            "name": "historical-scores.md",
            "permissions": "-rw-------",
            "owner": "root",
            "group": "root",
            "size": 4096,
            "modified": "2024-02-01T12:00:00Z",
            "content": "# Historical — matchup archive\n\n## Week 12\n- parker vs blake — 58–72\n- alex vs devon — 80–77\n- casey vs finn — 66–65\n- ellis vs jordan — 71–74\n- harper vs logan — 88–83\n- morgan vs riley — 61–69\n\n## Week 11\n- parker vs riley — 79–74\n- alex vs finn — 63–91\n- blake vs devon — 70–68\n- casey vs ellis — 75–76\n- harper vs morgan — 82–64\n- jordan vs logan — 67–62\n"
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
            "modified": "2024-02-10T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-------",
                "owner": "root",
                "group": "root",
                "size": 256,
                "modified": "2024-02-10T10:00:00Z",
                "content": "# /home/root/.profile\nexport PS1='root@fantasy-football-league.com:\\w$ '\n"
              }
            }
          },
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
          },
          "alex": {
            "type": "directory",
            "name": "alex",
            "permissions": "drwxr-xr-x",
            "owner": "alex",
            "group": "alex",
            "size": 4096,
            "modified": "2024-02-10T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "alex",
                "group": "alex",
                "size": 256,
                "modified": "2024-02-10T10:00:00Z",
                "content": "# ~/.profile\n# default profile\n"
              }
            }
          },
          "blake": {
            "type": "directory",
            "name": "blake",
            "permissions": "drwxr-xr-x",
            "owner": "blake",
            "group": "blake",
            "size": 4096,
            "modified": "2024-02-10T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "blake",
                "group": "blake",
                "size": 256,
                "modified": "2024-02-10T10:00:00Z",
                "content": "# ~/.profile\n# default profile\n"
              }
            }
          },
          "casey": {
            "type": "directory",
            "name": "casey",
            "permissions": "drwxr-xr-x",
            "owner": "casey",
            "group": "casey",
            "size": 4096,
            "modified": "2024-02-10T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "casey",
                "group": "casey",
                "size": 256,
                "modified": "2024-02-10T10:00:00Z",
                "content": "# ~/.profile\n# default profile\n"
              }
            }
          },
          "devon": {
            "type": "directory",
            "name": "devon",
            "permissions": "drwxr-xr-x",
            "owner": "devon",
            "group": "devon",
            "size": 4096,
            "modified": "2024-02-10T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "devon",
                "group": "devon",
                "size": 256,
                "modified": "2024-02-10T10:00:00Z",
                "content": "# ~/.profile\n# default profile\n"
              }
            }
          },
          "ellis": {
            "type": "directory",
            "name": "ellis",
            "permissions": "drwxr-xr-x",
            "owner": "ellis",
            "group": "ellis",
            "size": 4096,
            "modified": "2024-02-10T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "ellis",
                "group": "ellis",
                "size": 256,
                "modified": "2024-02-10T10:00:00Z",
                "content": "# ~/.profile\n# default profile\n"
              }
            }
          },
          "finn": {
            "type": "directory",
            "name": "finn",
            "permissions": "drwxr-xr-x",
            "owner": "finn",
            "group": "finn",
            "size": 4096,
            "modified": "2024-02-10T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "finn",
                "group": "finn",
                "size": 256,
                "modified": "2024-02-10T10:00:00Z",
                "content": "# ~/.profile\n# default profile\n"
              }
            }
          },
          "harper": {
            "type": "directory",
            "name": "harper",
            "permissions": "drwxr-xr-x",
            "owner": "harper",
            "group": "harper",
            "size": 4096,
            "modified": "2024-02-10T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "harper",
                "group": "harper",
                "size": 256,
                "modified": "2024-02-10T10:00:00Z",
                "content": "# ~/.profile\n# default profile\n"
              }
            }
          },
          "jordan": {
            "type": "directory",
            "name": "jordan",
            "permissions": "drwxr-xr-x",
            "owner": "jordan",
            "group": "jordan",
            "size": 4096,
            "modified": "2024-02-10T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "jordan",
                "group": "jordan",
                "size": 256,
                "modified": "2024-02-10T10:00:00Z",
                "content": "# ~/.profile\n# default profile\n"
              }
            }
          },
          "logan": {
            "type": "directory",
            "name": "logan",
            "permissions": "drwxr-xr-x",
            "owner": "logan",
            "group": "logan",
            "size": 4096,
            "modified": "2024-02-10T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "logan",
                "group": "logan",
                "size": 256,
                "modified": "2024-02-10T10:00:00Z",
                "content": "# ~/.profile\n# default profile\n"
              }
            }
          },
          "morgan": {
            "type": "directory",
            "name": "morgan",
            "permissions": "drwxr-xr-x",
            "owner": "morgan",
            "group": "morgan",
            "size": 4096,
            "modified": "2024-02-10T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "morgan",
                "group": "morgan",
                "size": 256,
                "modified": "2024-02-10T10:00:00Z",
                "content": "# ~/.profile\n# default profile\n"
              }
            }
          },
          "riley": {
            "type": "directory",
            "name": "riley",
            "permissions": "drwxr-xr-x",
            "owner": "riley",
            "group": "riley",
            "size": 4096,
            "modified": "2024-02-10T10:00:00Z",
            "contents": {
              ".profile": {
                "type": "file",
                "name": ".profile",
                "permissions": "-rw-r--r--",
                "owner": "riley",
                "group": "riley",
                "size": 256,
                "modified": "2024-02-10T10:00:00Z",
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
            "content": "root:x:0:0:root:/home/root:/bin/bash\nparker:x:1001:1001:parker:/home/parker:/bin/bash\nalex:x:1002:1002:alex:/home/alex:/bin/bash\nblake:x:1003:1003:blake:/home/blake:/bin/bash\ncasey:x:1004:1004:casey:/home/casey:/bin/bash\ndevon:x:1005:1005:devon:/home/devon:/bin/bash\nellis:x:1006:1006:ellis:/home/ellis:/bin/bash\nfinn:x:1007:1007:finn:/home/finn:/bin/bash\nharper:x:1008:1008:harper:/home/harper:/bin/bash\njordan:x:1009:1009:jordan:/home/jordan:/bin/bash\nlogan:x:1010:1010:logan:/home/logan:/bin/bash\nmorgan:x:1011:1011:morgan:/home/morgan:/bin/bash\nriley:x:1012:1012:riley:/home/riley:/bin/bash\n"
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
