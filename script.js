// Initialize click sound
let clickSound;
function initClickSound() {
    clickSound = new Audio('audio/computer-mouse-click-351398.mp3');
    clickSound.volume = 0.3; // Set volume to 30%
    
    // Add click sound to all clickable elements
    document.addEventListener('click', (e) => {
        // Don't play sound for text inputs, textareas, or contenteditable elements
        if ((e.target.tagName === 'INPUT' && (e.target.type === 'text' || e.target.type === 'email')) || 
            e.target.tagName === 'TEXTAREA' ||
            e.target.isContentEditable) {
            return;
        }
        
        // Play sound
        if (clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(err => {
                // Ignore autoplay errors (browser may block autoplay)
            });
        }
    }, true);
}

// Initialize code rain background
function initCodeRain() {
    const container = document.getElementById('code-rain');
    const chars = "01{}[]();<>/\\|&^%$#@!~`";
    const fontSize = 14;
    const columns = Math.floor(window.innerWidth / fontSize);
    const rows = Math.floor(window.innerHeight / fontSize);
    
    for (let i = 0; i < columns; i++) {
        const column = document.createElement('div');
        column.className = 'code-column';
        column.style.position = 'absolute';
        column.style.top = '0';
        column.style.left = `${i * fontSize}px`;
        column.style.width = `${fontSize}px`;
        column.style.height = '100%';
        column.style.color = '#dfffc7';
        column.style.fontFamily = 'monospace';
        column.style.fontSize = `${fontSize}px`;
        column.style.lineHeight = `${fontSize}px`;
        column.style.textAlign = 'center';
        column.style.opacity = Math.random() * 0.5 + 0.1;
        
        container.appendChild(column);
        
        animateColumn(column, rows);
    }
}

function animateColumn(column, rows) {
    let position = 0;
    const delay = Math.random() * 2000;
    const speed = Math.random() * 50 + 50;
    
    setTimeout(() => {
        const interval = setInterval(() => {
            if (position >= rows) {
                position = 0;
                column.textContent = '';
            }
            
            const char = Math.random() > 0.7 
                ? chars[Math.floor(Math.random() * chars.length)] 
                : ' ';
            
            column.textContent += char;
            position++;
            
            // Fade out older characters
            if (column.textContent.length > rows / 2) {
                column.textContent = column.textContent.substring(1);
            }
        }, speed);
        
        // Cleanup on unmount
        column.dataset.interval = interval;
    }, delay);
}

// Window management
let zIndex = 10;
let windowsContainer;
let openWindows = new Map(); // Track open windows: title -> {element, taskbarItem}

function getWindowsContainer() {
    if (!windowsContainer) {
        windowsContainer = document.getElementById('windows-container');
    }
    return windowsContainer;
}

function createWindow(title, content, width = 600, height = 400) {
    const container = getWindowsContainer();
    if (!container) {
        console.error('Windows container not found');
        return null;
    }
    
    // Check if window is already open
    if (openWindows.has(title)) {
        const existing = openWindows.get(title);
        if (existing && existing.element) {
            existing.element.style.zIndex = zIndex++;
            existing.element.classList.remove('minimized');
            updateTaskbarActive(title);
            return existing.element;
        }
    }
    
    const windowElement = document.createElement('div');
    windowElement.className = 'window opening';
    windowElement.dataset.windowTitle = title;
    windowElement.style.width = `${width}px`;
    windowElement.style.height = `${height}px`;
    windowElement.style.zIndex = zIndex++;
    // Set initial position (centered with slight offset for multiple windows)
    const offset = (zIndex % 3) * 30;
    windowElement.style.top = `${100 + offset}px`;
    windowElement.style.left = `${100 + offset}px`;
    
    windowElement.innerHTML = `
        <div class="window-header">
            <div class="title">
                <span>${title}</span>
            </div>
            <div class="window-controls">
                <div class="window-control minimize-btn" title="Minimize">
                    <img src="public/minimize.png" alt="Minimize">
                </div>
                <div class="window-control maximize-btn" title="Maximize">
                    <img src="public/maximize.png" alt="Maximize" class="maximize-icon">
                </div>
                <div class="window-control close-btn" title="Close">
                    <img src="public/close.png" alt="Close">
                </div>
            </div>
        </div>
        <div class="window-content">
            ${content}
        </div>
    `;
    
    container.appendChild(windowElement);
    
    // Remove opening class after animation and ensure it's visible
    setTimeout(() => {
        windowElement.classList.remove('opening');
        windowElement.style.opacity = '1';
        windowElement.style.transform = 'scale(1) translateY(0)';
    }, 400);
    
    // Make draggable
    makeDraggable(windowElement);
    
    // Add controls
    const minimizeBtn = windowElement.querySelector('.minimize-btn');
    const maximizeBtn = windowElement.querySelector('.maximize-btn');
    const closeBtn = windowElement.querySelector('.close-btn');
    
    minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        minimizeWindow(title);
    });
    
    maximizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        maximizeWindow(title);
        // Update icon
        const icon = maximizeBtn.querySelector('img');
        if (windowElement.classList.contains('maximized')) {
            icon.src = 'public/unmaximize.png';
            icon.alt = 'Restore';
        } else {
            icon.src = 'public/maximize.png';
            icon.alt = 'Maximize';
        }
    });
    
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        closeWindow(title);
    });
    
    // Track window first (taskbarItem will be set by addToTaskbar)
    openWindows.set(title, { element: windowElement, taskbarItem: null });
    
    // Add to taskbar (this will update the taskbarItem in the map)
    addToTaskbar(title, windowElement);
    
    // Update taskbar
    updateTaskbarActive(title);
    
    return windowElement;
}

// Icon mapping for windows
const windowIcons = {
    'Projects.exe': 'public/projects.ico',
    'Skills.dll': 'public/skills.ico',
    'Resume.pdf': 'public/resume.ico',
    'Contact.bat': 'public/contact.ico'
};

function addToTaskbar(title, windowElement) {
    const taskbarItems = document.getElementById('taskbar-items');
    if (!taskbarItems) return;
    
    const iconPath = windowIcons[title] || 'public/projects.ico';
    
    const taskbarItem = document.createElement('div');
    taskbarItem.className = 'taskbar-item';
    taskbarItem.dataset.windowTitle = title;
    taskbarItem.style.pointerEvents = 'auto';
    taskbarItem.innerHTML = `
        <img src="${iconPath}" alt="${title}" class="taskbar-item-icon">
        <span class="taskbar-item-title">${title}</span>
        <button class="taskbar-close-btn" title="Close">
            <i data-feather="x"></i>
        </button>
    `;
    
    // Click on taskbar item (not close button) to restore/minimize
    taskbarItem.addEventListener('click', (e) => {
        // Don't trigger if clicking the close button
        if (e.target.closest('.taskbar-close-btn')) {
            return;
        }
        e.stopPropagation();
        
        // Toggle minimize/restore on click
        if (windowElement.classList.contains('minimized')) {
            restoreWindow(title);
        } else {
            // Minimize the window
            minimizeWindow(title);
        }
        updateTaskbarActive(title);
    });
    
    // Close button click handler
    const closeBtn = taskbarItem.querySelector('.taskbar-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            closeWindow(title);
        });
    }
    
    taskbarItems.appendChild(taskbarItem);
    feather.replace();
    
    // Update tracking
    const windowData = openWindows.get(title);
    if (windowData) {
        windowData.taskbarItem = taskbarItem;
    }
}

function updateTaskbarActive(activeTitle) {
    document.querySelectorAll('.taskbar-item').forEach(item => {
        if (item.dataset.windowTitle === activeTitle) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function closeWindow(title) {
    const windowData = openWindows.get(title);
    const container = getWindowsContainer();
    
    // Remove taskbar item first (always try to remove it)
    if (windowData && windowData.taskbarItem) {
        if (windowData.taskbarItem.parentNode) {
            windowData.taskbarItem.remove();
        }
    } else {
        // If not in map or taskbarItem not set, find and remove by title
        const taskbarItems = document.querySelectorAll('.taskbar-item');
        taskbarItems.forEach(item => {
            if (item.dataset.windowTitle === title) {
                item.remove();
            }
        });
    }
    
    // Remove window element
    if (windowData && windowData.element) {
        if (windowData.element.parentNode && container) {
            try {
                container.removeChild(windowData.element);
            } catch (e) {
                // Element might already be removed, that's okay
                console.log('Window element already removed');
            }
        }
    }
    
    // Remove from tracking
    if (windowData) {
        openWindows.delete(title);
    }
}

function minimizeWindow(title) {
    const windowData = openWindows.get(title);
    if (windowData) {
        windowData.element.classList.add('minimized');
        // Remove maximized state when minimizing
        windowData.element.classList.remove('maximized');
        // Reset maximize icon
        const maximizeBtn = windowData.element.querySelector('.maximize-btn');
        if (maximizeBtn) {
            const icon = maximizeBtn.querySelector('img');
            if (icon) {
                icon.src = 'public/maximize.png';
                icon.alt = 'Maximize';
            }
        }
        updateTaskbarActive(null);
    }
}

function maximizeWindow(title) {
    const windowData = openWindows.get(title);
    if (windowData) {
        const wasMaximized = windowData.element.classList.contains('maximized');
        windowData.element.classList.toggle('maximized');
        
        // Update maximize icon
        const maximizeBtn = windowData.element.querySelector('.maximize-btn');
        if (maximizeBtn) {
            const icon = maximizeBtn.querySelector('img');
            if (icon) {
                if (wasMaximized) {
                    icon.src = 'public/maximize.png';
                    icon.alt = 'Maximize';
                } else {
                    icon.src = 'public/unmaximize.png';
                    icon.alt = 'Restore';
                }
            }
        }
        
        updateTaskbarActive(title);
    }
}

function restoreWindow(title) {
    const windowData = openWindows.get(title);
    if (windowData) {
        windowData.element.classList.remove('minimized');
        windowData.element.style.zIndex = zIndex++;
        // Ensure window is visible (restore flex display)
        windowData.element.style.display = 'flex';
        windowData.element.style.visibility = 'visible';
        updateTaskbarActive(title);
    }
}

function makeDraggable(element) {
    const header = element.querySelector('.window-header');
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    header.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Set the element's new position
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Desktop icons will be initialized in DOMContentLoaded

// Window templates
function createProjectsWindow() {
    const content = `
        <div class="text-secondary-500 mb-4">
            <h2 class="text-xl font-bold mb-2">Projects.exe</h2>
            <p class="mb-4">Browse through my digital creations. Click to view details.</p>
            
            <div class="grid grid-cols-1 gap-4">
                <a href="https://github.com/pranayakhadgi/memory-garden" target="_blank" class="project-card bg-primary-500 p-4 rounded-lg cursor-pointer hover:bg-secondary-500 hover:text-primary-900 transition-all block">
                    <h3 class="font-bold text-lg mb-2">🌱 Memory Garden</h3>
                    <p class="text-sm mb-2"><strong>AI-Powered Journaling App | HackMidwest 2025</strong></p>
                    <p class="text-xs mb-2">Competed among <strong>325+ participants</strong> with an intelligent journaling platform featuring emotional coaching.</p>
                    <div class="flex flex-wrap gap-1 mt-2">
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">Node.js</span>
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">Express</span>
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">MongoDB</span>
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">OpenAI GPT-4</span>
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">React</span>
                    </div>
                </a>
                
                <a href="https://github.com/pranayakhadgi/truman-virtual" target="_blank" class="project-card bg-primary-500 p-4 rounded-lg cursor-pointer hover:bg-secondary-500 hover:text-primary-900 transition-all block">
                    <h3 class="font-bold text-lg mb-2">🏛️ Truman in the Virtual</h3>
                    <p class="text-sm mb-2"><strong>Immersive 3D Campus Tour | Research Project</strong></p>
                    <p class="text-xs mb-2">Browser-based 3D rendering with interactive navigation. Reduced deployment complexity by <strong>40%</strong>.</p>
                    <div class="flex flex-wrap gap-1 mt-2">
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">React 18</span>
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">Three.js</span>
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">PostgreSQL</span>
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">WebGL</span>
                    </div>
                </a>
                
                <a href="https://github.com/pranayakhadgi/wastenot" target="_blank" class="project-card bg-primary-500 p-4 rounded-lg cursor-pointer hover:bg-secondary-500 hover:text-primary-900 transition-all block">
                    <h3 class="font-bold text-lg mb-2">♻️ WasteNot</h3>
                    <p class="text-sm mb-2"><strong>Food Sharing Platform | Boeing x TruHacks 2025</strong></p>
                    <p class="text-xs mb-2">Designed PostgreSQL schema, implemented REST APIs. Demoed to <strong>50+ attendees</strong>.</p>
                    <div class="flex flex-wrap gap-1 mt-2">
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">React</span>
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">TypeScript</span>
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">Node.js</span>
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">PostgreSQL</span>
                    </div>
                </a>
                
                <a href="https://github.com/pranayakhadgi/carbon-calculator" target="_blank" class="project-card bg-primary-500 p-4 rounded-lg cursor-pointer hover:bg-secondary-500 hover:text-primary-900 transition-all block">
                    <h3 class="font-bold text-lg mb-2">🌍 Carbon Footprint Calculator</h3>
                    <p class="text-sm mb-2"><strong>🥇 1st Place TruHacks 2024 (Beginners)</strong></p>
                    <p class="text-xs mb-2">Calculate and visualize your carbon footprint with Google Maps integration.</p>
                    <div class="flex flex-wrap gap-1 mt-2">
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">Python</span>
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">Matplotlib</span>
                        <span class="text-xs bg-primary-900 px-2 py-1 rounded">Google Maps API</span>
                    </div>
                </a>
            </div>
        </div>
    `;
    
    createWindow('Projects.exe', content, 700, 600);
}

function createSkillsWindow() {
    const content = `
        <div class="text-secondary-500">
            <h2 class="text-xl font-bold mb-4">Skills.dll</h2>
            
            <div class="skill-category mb-6">
                <h3 class="font-bold mb-2">Frontend</h3>
                <div class="skill-item mb-2">
                    <div class="flex justify-between mb-1">
                        <span>React</span>
                        <span>90%</span>
                    </div>
                    <div class="w-full bg-primary-500 rounded-full h-2.5">
                        <div class="bg-secondary-500 h-2.5 rounded-full" style="width: 90%"></div>
                    </div>
                </div>
                <div class="skill-item mb-2">
                    <div class="flex justify-between mb-1">
                        <span>TypeScript</span>
                        <span>85%</span>
                    </div>
                    <div class="w-full bg-primary-500 rounded-full h-2.5">
                        <div class="bg-secondary-500 h-2.5 rounded-full" style="width: 85%"></div>
                    </div>
                </div>
                <div class="skill-item mb-2">
                    <div class="flex justify-between mb-1">
                        <span>CSS/SCSS</span>
                        <span>95%</span>
                    </div>
                    <div class="w-full bg-primary-500 rounded-full h-2.5">
                        <div class="bg-secondary-500 h-2.5 rounded-full" style="width: 95%"></div>
                    </div>
                </div>
            </div>
            
            <div class="skill-category mb-6">
                <h3 class="font-bold mb-2">Backend</h3>
                <div class="skill-item mb-2">
                    <div class="flex justify-between mb-1">
                        <span>Node.js</span>
                        <span>80%</span>
                    </div>
                    <div class="w-full bg-primary-500 rounded-full h-2.5">
                        <div class="bg-secondary-500 h-2.5 rounded-full" style="width: 80%"></div>
                    </div>
                </div>
                <div class="skill-item mb-2">
                    <div class="flex justify-between mb-1">
                        <span>Express</span>
                        <span>75%</span>
                    </div>
                    <div class="w-full bg-primary-500 rounded-full h-2.5">
                        <div class="bg-secondary-500 h-2.5 rounded-full" style="width: 75%"></div>
                    </div>
                </div>
            </div>
            
            <div class="text-xs italic">This portfolio is constantly in beta, just like me</div>
        </div>
    `;
    
    createWindow('Skills.dll', content, 500, 500);
}

function createResumeWindow() {
    const content = `
        <div style="height: 100%; display: flex; flex-direction: column;">
            <iframe src="public/resume_pranaya.pdf" style="width: 100%; height: 100%; border: none; flex: 1;"></iframe>
        </div>
    `;
    
    createWindow('Resume.pdf', content, 800, 600);
}

function createContactWindow() {
    const content = `
        <div class="text-secondary-500">
            <h2 class="text-xl font-bold mb-4">Contact.bat</h2>
            
            <form class="space-y-4">
                <div>
                    <label class="block mb-1">Name</label>
                    <input type="text" class="w-full bg-primary-500 border border-secondary-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500">
                </div>
                
                <div>
                    <label class="block mb-1">Email</label>
                    <input type="email" class="w-full bg-primary-500 border border-secondary-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500">
                </div>
                
                <div>
                    <label class="block mb-1">Message (max 140 chars)</label>
                    <textarea class="w-full bg-primary-500 border border-secondary-500 rounded px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-secondary-500" maxlength="140"></textarea>
                    <div class="text-xs text-right"><span id="char-count">140</span> characters left</div>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" id="human-check" class="mr-2">
                    <label for="human-check">I'm not a robot (probably)</label>
                </div>
                
                <button type="submit" class="bg-primary-500 hover:bg-secondary-500 text-secondary-500 hover:text-primary-900 font-bold py-2 px-4 rounded transition-all">
                    Send Message
                </button>
            </form>
            
            <div class="mt-6 text-sm">
                <div class="flex items-center mb-2">
                    <i data-feather="mail" class="mr-2"></i>
                    <a href="mailto:pranaya.khadgi99@gmail.com" class="hover:text-secondary-500">pranaya.khadgi99@gmail.com</a>
                </div>
                <div class="flex items-center mb-2">
                    <i data-feather="github" class="mr-2"></i>
                    <a href="https://github.com/pranayakhadgi" target="_blank" class="hover:text-secondary-500">github.com/pranayakhadgi</a>
                </div>
                <div class="flex items-center mb-2">
                    <i data-feather="linkedin" class="mr-2"></i>
                    <a href="https://linkedin.com/in/pranaya-khadgi-shahi" target="_blank" class="hover:text-secondary-500">linkedin.com/in/pranaya-khadgi-shahi</a>
                </div>
                <div class="flex items-center">
                    <i data-feather="phone" class="mr-2"></i>
                    <span>+1 (919) 224-6707</span>
                </div>
            </div>
        </div>
    `;
    
    const window = createWindow('Contact.bat', content);
    
    // Character counter
    const textarea = window.querySelector('textarea');
    const charCount = window.querySelector('#char-count');
    
    textarea.addEventListener('input', () => {
        const remaining = 140 - textarea.value.length;
        charCount.textContent = remaining;
        
        if (remaining < 20) {
            charCount.classList.add('text-red-500');
        } else {
            charCount.classList.remove('text-red-500');
        }
    });
}

// Start Menu functionality
function initStartMenu() {
    const startButton = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');
    
    // Toggle start menu
    startButton.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('hidden');
        startButton.classList.toggle('active');
    });
    
    // Close start menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
            startMenu.classList.add('hidden');
            startButton.classList.remove('active');
        }
    });
    
    // Start menu items
    document.querySelectorAll('.start-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            startMenu.classList.add('hidden');
            startButton.classList.remove('active');
            
            switch(action) {
                case 'projects':
                    createProjectsWindow();
                    break;
                case 'skills':
                    createSkillsWindow();
                    break;
                case 'resume':
                    createResumeWindow();
                    break;
                case 'contact':
                    createContactWindow();
                    break;
            }
        });
    });
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    initClickSound();
    initCodeRain();
    initStartMenu();
    
    // Wait for feather icons to be ready, then initialize desktop icons
    setTimeout(() => {
        feather.replace();
        
        // Initialize desktop icons
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const href = icon.getAttribute('href');
                if (href) {
                    const target = href.substring(1); // Remove #
                    
                    switch(target) {
                        case 'projects':
                            createProjectsWindow();
                            break;
                        case 'skills':
                            createSkillsWindow();
                            break;
                        case 'resume':
                            createResumeWindow();
                            break;
                        case 'contact':
                            createContactWindow();
                            break;
                    }
                }
            });
        });
    }, 100);
    
    // Easter egg - Konami code
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    
    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            
            if (konamiIndex === konamiCode.length) {
                // Easter egg triggered
                createWindow('Easter Egg', `
                    <div class="text-secondary-500 text-center p-4">
                        <h2 class="text-2xl font-bold mb-4">🎉 You found me! 🎉</h2>
                        <p class="mb-4">Here's a secret about me: I once built a website that only worked in IE6 for nostalgia's sake.</p>
                        <p>My hidden skill: I can recite the entire CSS2 spec from memory (not really).</p>
                    </div>
                `, 400, 300);
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });
    
});