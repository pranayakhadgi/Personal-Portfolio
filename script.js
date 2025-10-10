// Portfolio site JavaScript
// honestly this started simple and just kept growing...

document.addEventListener('DOMContentLoaded', function() {
    // fire everything up when the page loads
    setupIcons();
    setupCustomCursor();
    setupMobileMenu();
    setupSmoothScrolling();
    setupAnimations();
    setupContactForm();
    setupGitHubStuff();
});

// replace all those feather icons with actual SVGs
function setupIcons() {
    if (typeof feather !== 'undefined') {
        feather.replace();
    } else {
        console.log('feather icons not loaded, skipping...');
    }
}

// custom cursor that follows the mouse around
// probably overkill but looks cool
function setupCustomCursor() {
    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) {
        console.log('no custom cursor found, skipping...');
        return;
    }

    // track mouse movement
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.pageX + 'px';
        cursor.style.top = e.pageY + 'px';
    });

    // hide on mobile since it's annoying there
    if (window.innerWidth <= 768) {
        cursor.style.display = 'none';
    }
}

// mobile menu toggle - hamburger button stuff
function setupMobileMenu() {
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (!menuButton || !mobileMenu) {
        console.log('mobile menu elements not found');
        return;
    }

    // toggle menu when button is clicked
    menuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        mobileMenu.classList.toggle('show');
        
        // switch between hamburger and X icon
        if (typeof feather !== 'undefined') {
            menuButton.innerHTML = mobileMenu.classList.contains('hidden') ? 
                feather.icons.menu.toSvg() : feather.icons.x.toSvg();
        }
    });
    
    // close menu when user clicks a link
    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            mobileMenu.classList.remove('show');
            if (typeof feather !== 'undefined') {
                menuButton.innerHTML = feather.icons.menu.toSvg();
            }
        });
    });

    // close menu when clicking outside of it
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !menuButton.contains(e.target)) {
            mobileMenu.classList.add('hidden');
            mobileMenu.classList.remove('show');
            if (typeof feather !== 'undefined') {
                menuButton.innerHTML = feather.icons.menu.toSvg();
            }
        }
    });
}

// smooth scrolling for navigation links
// makes the page feel more polished
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// GSAP animations - makes everything feel more dynamic
function setupAnimations() {
    // make sure GSAP is actually loaded
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.log('GSAP not loaded, skipping animations');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    
    // fade in sections as they come into view
    gsap.utils.toArray('section').forEach(section => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: "top 80%",
                toggleActions: "play none none none"
            },
            opacity: 0,
            y: 50,
            duration: 1
        });
    });
    
    // stagger the project cards animation
    gsap.utils.toArray('#projects .bg-gray-800').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 80%",
                toggleActions: "play none none none"
            },
            opacity: 0,
            y: 50,
            duration: 0.5,
            delay: i * 0.1 // slight delay between each card
        });
    });

    // animate skill and interest items from the left
    gsap.utils.toArray('.skill-item, .interest-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: "top 90%",
                toggleActions: "play none none none"
            },
            opacity: 0,
            x: -20,
            duration: 0.3,
            delay: i * 0.05 // even smaller delay for these
        });
    });
}

// contact form handling
function setupContactForm() {
    const form = document.querySelector('form');
    if (!form) {
        console.log('no contact form found');
        return;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // grab the form data
        const formData = new FormData(form);
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');
        
        // basic validation - make sure they filled everything out
        if (!name || !email || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        // check if email looks valid
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // for now just show a success message
        // in a real app you'd send this to a server
        showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
        form.reset();
    });
}

// check if an email address looks valid
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// show a notification to the user
function showNotification(message, type = 'info') {
    // remove any existing notifications first
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // create the notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
    
    // style it based on the type
    switch (type) {
        case 'success':
            notification.classList.add('bg-green-600', 'text-white');
            break;
        case 'error':
            notification.classList.add('bg-red-600', 'text-white');
            break;
        default:
            notification.classList.add('bg-blue-600', 'text-white');
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // slide it in from the right
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// GitHub API stuff - not currently used but ready to go
function setupGitHubStuff() {
    // uncomment this and add your actual GitHub username to enable
    /*
    const githubUsername = 'yourgithubusername';
    
    if (githubUsername && githubUsername !== 'yourgithubusername') {
        fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=3`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('GitHub API request failed');
                }
                return response.json();
            })
            .then(data => {
                updateGitHubProjects(data);
            })
            .catch(error => {
                console.error('Error fetching GitHub data:', error);
            });
    }
    */
}

// update the GitHub projects section with real data
function updateGitHubProjects(repos) {
    const githubProjectCard = document.querySelector('#projects .bg-gray-800:last-child');
    if (!githubProjectCard || repos.length === 0) return;
    
    // use the most recent repo
    const repo = repos[0];
    
    const title = githubProjectCard.querySelector('h3');
    const description = githubProjectCard.querySelector('p');
    const githubLink = githubProjectCard.querySelector('a[href="#"]');
    
    if (title) title.textContent = repo.name;
    if (description) description.textContent = repo.description || 'Check out my GitHub for more projects and contributions';
    if (githubLink) githubLink.href = repo.html_url;
}

// utility function to debounce events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// handle window resize - hide cursor on mobile
window.addEventListener('resize', debounce(() => {
    const cursor = document.querySelector('.custom-cursor');
    if (cursor) {
        cursor.style.display = window.innerWidth <= 768 ? 'none' : 'block';
    }
}, 250));

// add loaded class when everything is ready
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// expose some functions globally in case we need them
window.Portfolio = {
    showNotification,
    isValidEmail,
    debounce
};
