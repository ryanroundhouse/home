/*
  Ryan Graham — Terminal/Console JS
  ------------------------------------------------
  - Terminal modal/panel (focus trap, history, commands)
  - Matrix rain animation (terminal background)
  - Filesystem navigation (cd, ls, cat)
*/

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  /* -----------------------------
   * Filesystem
   * ---------------------------*/
  let currentDir = '/user/ryan';
  const homeDir = '/user/ryan';

  // Embedded filesystem data (works with both file:// and http:// protocols)
  const filesystemData = {
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

  const filesystem = filesystemData['/'];

  const resolvePath = (path) => {
    if (!path) return currentDir;
    
    // Handle ~ expansion
    if (path.startsWith('~')) {
      path = path.replace('~', homeDir);
    }
    
    // Handle absolute paths
    if (path.startsWith('/')) {
      return normalizePath(path);
    }
    
    // Handle relative paths
    return normalizePath(currentDir + '/' + path);
  };

  const normalizePath = (path) => {
    const parts = path.split('/').filter(p => p !== '' && p !== '.');
    const result = [];
    
    for (const part of parts) {
      if (part === '..') {
        if (result.length > 0) {
          result.pop();
        }
      } else {
        result.push(part);
      }
    }
    
    return '/' + result.join('/');
  };

  const getNode = (path) => {
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
  };

  const getDirectoryContents = (path) => {
    const node = getNode(path);
    if (!node || node.type !== 'directory' || !node.contents) {
      return null;
    }
    
    return Object.values(node.contents);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month} ${day} ${hours}:${minutes}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes.toString();
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'K';
    return (bytes / (1024 * 1024)).toFixed(1) + 'M';
  };

  /* -----------------------------
   * Terminal modal
   * ---------------------------*/
  const initTerminal = () => {
    const overlay = $('#terminalOverlay');
    const dialog = $('#terminalDialog');
    const openBtns = $$('[data-open-terminal]');
    const closeBtn = $('#terminalClose');
    const out = $('#terminalOutput');
    const input = $('#terminalInput');
    const chip = $('#terminalHint');
    if (!overlay || !dialog || !out || !input || !closeBtn) return;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    let lastFocus = null;
    let history = [];
    let historyIndex = -1;
    let matrixOn = false;
    let matrixAnimationId = null;
    let matrixCanvas = null;
    let matrixResizeObserver = null;

    // LocalStorage keys
    const STORAGE_KEY_HISTORY = 'rg_terminal_history';
    const STORAGE_KEY_OUTPUT = 'rg_terminal_output';
    const STORAGE_KEY_DIR = 'rg_terminal_dir';
    const STORAGE_KEY_FIRST_BOOT = 'rg_terminal_first_boot';

    // Load from localStorage
    const loadFromStorage = () => {
      try {
        const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (savedHistory) {
          history = JSON.parse(savedHistory);
          historyIndex = history.length;
        }
        
        const savedDir = localStorage.getItem(STORAGE_KEY_DIR);
        if (savedDir) {
          currentDir = savedDir;
        }
      } catch (e) {
        console.warn('Failed to load terminal state from localStorage:', e);
      }
    };

    // Save to localStorage
    const saveToStorage = () => {
      try {
        localStorage.setItem(STORAGE_KEY_OUTPUT, out.innerHTML);
        localStorage.setItem(STORAGE_KEY_DIR, currentDir);
      } catch (e) {
        console.warn('Failed to save terminal state to localStorage:', e);
      }
    };

    // Load initial state
    loadFromStorage();

    const scrollToBottom = () => {
      out.scrollTop = out.scrollHeight;
    };

    const line = (text, cls = 'ok') => {
      const p = document.createElement('div');
      p.className = `term-line ${cls}`;
      p.textContent = text;
      out.appendChild(p);
      scrollToBottom();
      // Save output to localStorage after adding line
      saveToStorage();
    };

    const lineHTML = (html, cls = 'ok') => {
      const p = document.createElement('div');
      p.className = `term-line ${cls}`;
      p.innerHTML = html;
      out.appendChild(p);
      scrollToBottom();
      // Save output to localStorage after adding line
      saveToStorage();
    };

    const clearOutput = () => {
      out.innerHTML = '';
      saveToStorage();
    };

    const setChip = (text) => {
      if (!chip) return;
      chip.textContent = text;
    };

    const updatePrompt = () => {
      const prompt = $('.prompt', dialog);
      if (prompt) {
        const dir = currentDir === homeDir ? '~' : currentDir;
        prompt.textContent = `rg@arcade:${dir}$`;
      }
    };

    const normalize = (s) => String(s || '').trim();

    const openPage = (page) => {
      const p = page.toLowerCase();
      const map = {
        home: 'index.html',
        about: 'about.html',
        projects: 'projects.html',
        contact: 'contact.html',
        links: 'links.html',
      };
      const dest = map[p];
      if (!dest) return false;
      window.location.href = dest;
      return true;
    };

    const stopMatrix = () => {
      matrixOn = false;
      if (matrixAnimationId) {
        cancelAnimationFrame(matrixAnimationId);
        matrixAnimationId = null;
      }
      if (matrixResizeObserver) {
        matrixResizeObserver.disconnect();
        matrixResizeObserver = null;
      }
      if (matrixCanvas) {
        const ctx = matrixCanvas.getContext('2d');
        ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        matrixCanvas.remove();
        matrixCanvas = null;
      }
      setChip('type: help');
      line('matrix: disabled', 'ok');
    };

    const startMatrix = () => {
      if (prefersReducedMotion) {
        line('matrix: blocked by prefers-reduced-motion', 'err');
        return;
      }
      matrixOn = true;
      setChip('matrix: ON');
      line('matrix: enabled (terminal background)', 'ok');

      // Create canvas element
      matrixCanvas = document.createElement('canvas');
      matrixCanvas.id = 'matrixCanvas';
      matrixCanvas.setAttribute('aria-hidden', 'true');
      matrixCanvas.style.position = 'absolute';
      matrixCanvas.style.inset = '0';
      matrixCanvas.style.pointerEvents = 'none';
      matrixCanvas.style.zIndex = '0';
      dialog.appendChild(matrixCanvas);

      const ctx = matrixCanvas.getContext('2d');
      
      // Set canvas size to match dialog
      const resizeCanvas = () => {
        if (!matrixCanvas) return;
        matrixCanvas.width = dialog.offsetWidth;
        matrixCanvas.height = dialog.offsetHeight;
      };
      resizeCanvas();

      // Handle resize
      matrixResizeObserver = new ResizeObserver(() => {
        if (matrixCanvas && matrixOn) {
          resizeCanvas();
        }
      });
      matrixResizeObserver.observe(dialog);

      const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const fontSize = 14;
      let columns = Math.floor(matrixCanvas.width / fontSize);
      let drops = Array(columns).fill(1);
      let frameCount = 0;

      const draw = () => {
        if (!matrixCanvas || !matrixOn) return;

        frameCount++;
        // Slow down by 80%: only draw every 5th frame (20% speed)
        if (frameCount % 5 !== 0) {
          if (matrixOn) {
            matrixAnimationId = requestAnimationFrame(draw);
          }
          return;
        }

        // Update columns if canvas size changed
        const newColumns = Math.floor(matrixCanvas.width / fontSize);
        if (newColumns !== columns) {
          columns = newColumns;
          drops = Array(columns).fill(1);
        }

        // Semi-transparent black to create fade effect
        ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
        ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

        ctx.fillStyle = '#00ff41';
        ctx.font = `${fontSize}px "Courier New", monospace`;

        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          ctx.fillText(char, x, y);

          // Reset drop randomly or when it reaches bottom
          if (y > matrixCanvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }

          drops[i]++;
        }

        if (matrixOn) {
          matrixAnimationId = requestAnimationFrame(draw);
        }
      };

      draw();
    };

    const toggleMatrix = () => {
      if (matrixOn) stopMatrix();
      else startMatrix();
    };

    const printHelp = () => {
      line('commands:', 'ok');
      line('  help        - list commands', 'ok');
      line('  whoami      - identify the meat popsicle', 'ok');
      line('  projects    - show featured projects', 'ok');
      line('  open <page> - open one of: home, about, projects, contact, links', 'ok');
      line('  theme       - dark-only (locked)', 'ok');
      line('  clear       - clear the terminal', 'ok');
      line('  matrix      - toggle terminal-only matrix rain', 'ok');
      line('  cd <dir>    - change directory (use ~ for home, .. for parent)', 'ok');
      line('  ls [dir]    - list directory contents', 'ok');
      line('  cat <file>  - display file contents', 'ok');
      line('  pwd         - print working directory', 'ok');
    };

    const cmdCd = (arg) => {
      // If no argument, go to home directory
      const targetPath = arg ? arg : '~';
      const resolved = resolvePath(targetPath);
      const node = getNode(resolved);
      
      if (!node) {
        line(`cd: ${targetPath}: No such file or directory`, 'err');
        return;
      }
      
      if (node.type !== 'directory') {
        line(`cd: ${targetPath}: Not a directory`, 'err');
        return;
      }
      
      currentDir = resolved;
      updatePrompt();
      saveToStorage();
    };

    const cmdLs = (arg) => {
      const targetPath = arg ? resolvePath(arg) : currentDir;
      const contents = getDirectoryContents(targetPath);
      
      if (contents === null) {
        const node = getNode(targetPath);
        if (!node) {
          line(`ls: ${arg || currentDir}: No such file or directory`, 'err');
        } else {
          line(`ls: ${arg || currentDir}: Not a directory`, 'err');
        }
        return;
      }
      
      // Sort: directories first, then files, both alphabetically
      const sorted = contents.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
      
      // Format like Linux ls -l
      for (const item of sorted) {
        const date = formatDate(item.modified);
        const size = formatFileSize(item.size);
        const name = item.type === 'directory' ? item.name + '/' : item.name;
        const lineText = `${item.permissions} ${String(item.size).padStart(8)} ${date} ${name}`;
        line(lineText, 'ok');
      }
    };

    const cmdCat = (arg) => {
      if (!arg) {
        line('cat: missing file operand', 'err');
        line('usage: cat <file>', 'err');
        return;
      }
      
      const resolved = resolvePath(arg);
      const node = getNode(resolved);
      
      if (!node) {
        line(`cat: ${arg}: No such file or directory`, 'err');
        return;
      }
      
      if (node.type === 'directory') {
        line(`cat: ${arg}: Is a directory`, 'err');
        return;
      }
      
      if (node.content) {
        const lines = node.content.split('\n');
        for (const lineText of lines) {
          line(lineText, 'ok');
        }
      } else {
        line(node.content || '(empty file)', 'ok');
      }
    };

    const cmdPwd = () => {
      line(currentDir, 'ok');
    };

    const printProjects = () => {
      lineHTML(
        `Featured projects:
<br>1) <a href="https://moodful.ca" target="_self" rel="noopener">Moodful.ca</a> — mood tracking app
<br>2) <a href="https://github.com/USERNAME/REPO1" target="_self" rel="noopener">GitHub Repo 1</a> — placeholder blurb
<br>3) <a href="https://github.com/USERNAME/REPO2" target="_self" rel="noopener">GitHub Repo 2</a> — placeholder blurb`,
        'ok'
      );
    };

    const unknown = (cmd) => {
      line(`ERR: "${cmd}" not found in this timeline. Try "help".`, 'err');
    };

    const run = (raw) => {
      const text = normalize(raw);
      if (!text) return;

      // echo the command
      line(`> ${text}`, 'cmd');

      // Save history
      history.push(text);
      history = history.slice(-50);
      historyIndex = history.length;
      // Note: output is saved by line()/lineHTML() calls, but save history here
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
        localStorage.setItem(STORAGE_KEY_DIR, currentDir);
      } catch (e) {
        console.warn('Failed to save terminal history to localStorage:', e);
      }

      const [head, ...rest] = text.split(/\s+/);
      const cmd = (head || '').toLowerCase();
      const arg = rest.join(' ');

      switch (cmd) {
        case 'help':
          printHelp();
          break;
        case 'whoami':
          line('Ryan Graham — Meat Popsicle', 'ok');
          break;
        case 'projects':
          printProjects();
          break;
        case 'open':
          if (!arg) {
            line('usage: open <home|about|projects|contact|links>', 'err');
            break;
          }
          if (!openPage(arg)) {
            line(`unknown page "${arg}". Try: home, about, projects, contact, links`, 'err');
          }
          break;
        case 'theme':
          line('dark-only (locked)', 'ok');
          break;
        case 'clear':
          clearOutput();
          break;
        case 'matrix':
          toggleMatrix();
          break;
        case 'cd':
          cmdCd(arg);
          break;
        case 'ls':
          cmdLs(arg);
          break;
        case 'cat':
          cmdCat(arg);
          break;
        case 'pwd':
          cmdPwd();
          break;
        default:
          unknown(cmd);
      }
    };

    const trapFocus = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = $$(focusableSelector, dialog);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const close = () => {
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeydownGlobal, true);
      dialog.removeEventListener('keydown', trapFocus);
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    };

    const open = () => {
      lastFocus = document.activeElement;
      overlay.hidden = false;
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKeydownGlobal, true);
      dialog.addEventListener('keydown', trapFocus);

      // Ensure directory is loaded and prompt is updated
      loadFromStorage();
      updatePrompt();

      // Restore output from localStorage if available
      if (!out.dataset.booted) {
        out.dataset.booted = 'true';
        try {
          const savedOutput = localStorage.getItem(STORAGE_KEY_OUTPUT);
          const hasSeenGreeting = localStorage.getItem(STORAGE_KEY_FIRST_BOOT) === 'true';
          
          if (savedOutput && savedOutput.trim() && hasSeenGreeting) {
            // Restore previous session
            out.innerHTML = savedOutput;
            scrollToBottom();
            // Update prompt again after restoring (in case directory changed)
            updatePrompt();
          } else {
            // First time ever - show greeting
            line('Welcome to RG/OS v0.1', 'ok');
            updatePrompt();
            line('Filesystem loaded. Type "help" to list commands.', 'ok');
            if (prefersReducedMotion) line('Motion reduced: parallax/matrix kept minimal.', 'ok');
            localStorage.setItem(STORAGE_KEY_FIRST_BOOT, 'true');
          }
        } catch (e) {
          // Fallback to greeting if restore fails
          line('Welcome to RG/OS v0.1', 'ok');
          updatePrompt();
          line('Filesystem loaded. Type "help" to list commands.', 'ok');
          if (prefersReducedMotion) line('Motion reduced: parallax/matrix kept minimal.', 'ok');
        }
      }

      // Focus input after render
      window.setTimeout(() => input.focus(), 0);
    };

    const onKeydownGlobal = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };

    // Openers
    openBtns.forEach((b) => b.addEventListener('click', open));
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = input.value;
        input.value = '';
        run(value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length === 0) return;
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = history[historyIndex] || '';
        input.setSelectionRange(input.value.length, input.value.length);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (history.length === 0) return;
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value = history[historyIndex] || '';
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });

    // Helpful chip initial
    setChip(prefersReducedMotion ? 'motion: reduced' : 'type: help');

    // Expose a tiny hook for CTA buttons on the home page, etc.
    window.__RG_OPEN_TERMINAL__ = open;
  };

  /* -----------------------------
   * Boot
   * ---------------------------*/
  document.addEventListener('DOMContentLoaded', () => {
    initTerminal();
  });
})();

