// State and DOM elements
let isScrolling = false;
let currentSection = 0;
let wheelDelta = 0;
let wheelTimeout = null;
let touchStartY = 0;
let touchEndY = 0;

const sections = document.querySelectorAll('.section');
const totalSections = sections.length;
const indicatorBar = document.querySelector('.indicator-bar');
const flowingLogoContainer = document.querySelector('.flowing-logo-container');
const flowingLogo = document.querySelector('.flowing-logo');
const flowingViewportBg = document.querySelector('.flowing-viewport-bg');
const dots = document.querySelectorAll('.dot');
const sectionNumber = document.querySelector('.section-number');
const disSpan = flowingLogo?.querySelector('.dis');
const inventedSpan = flowingLogo?.querySelector('.invented');

const WHEEL_THRESHOLD = 100;
const SWIPE_THRESHOLD = 50;
const SCROLL_COOLDOWN = 800;
const UPDATE_INTERVAL = 50;

// Update scroll indicator and UI
function updateScrollIndicator() {
    indicatorBar.style.width = `${((currentSection + 1) / totalSections) * 100}%`;
    dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSection));
    if (sectionNumber) sectionNumber.textContent = String(currentSection + 1).padStart(2, '0');
}

// Scroll to section
function scrollToSection(index) {
    if (index < 0 || index >= totalSections) return;
    currentSection = index;
    sections[currentSection].scrollIntoView({ behavior: 'smooth', block: 'start' });
    sections.forEach((section, i) => section.classList.toggle('active', i === currentSection));
    updateScrollIndicator();
}

// Wheel event handler with accumulation
function handleWheel(e) {
    e.preventDefault();
    if (isScrolling) return;

    wheelDelta += e.deltaY;
    clearTimeout(wheelTimeout);

    wheelTimeout = setTimeout(() => {
        if (Math.abs(wheelDelta) > WHEEL_THRESHOLD) {
            isScrolling = true;
            const direction = wheelDelta > 0 ? 1 : -1;
            const nextSection = currentSection + direction;
            if (nextSection >= 0 && nextSection < totalSections) {
                scrollToSection(nextSection);
            }
            wheelDelta = 0;
            setTimeout(() => isScrolling = false, SCROLL_COOLDOWN);
        }
    }, UPDATE_INTERVAL);
}

// Touch event handlers
function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
    if (isScrolling) return;

    touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
        isScrolling = true;
        const direction = diff > 0 ? 1 : -1;
        const nextSection = currentSection + direction;
        if (nextSection >= 0 && nextSection < totalSections) {
            scrollToSection(nextSection);
        }
        setTimeout(() => isScrolling = false, 1000);
    }
}

// Keyboard navigation
function handleKeydown(e) {
    if (isScrolling) return;

    const keyActions = {
        'ArrowDown': () => currentSection < totalSections - 1 && scrollToSection(currentSection + 1),
        'PageDown': () => currentSection < totalSections - 1 && scrollToSection(currentSection + 1),
        ' ': () => currentSection < totalSections - 1 && scrollToSection(currentSection + 1),
        'ArrowUp': () => currentSection > 0 && scrollToSection(currentSection - 1),
        'PageUp': () => currentSection > 0 && scrollToSection(currentSection - 1),
        'Home': () => scrollToSection(0),
        'End': () => scrollToSection(totalSections - 1)
    };

    const action = keyActions[e.key];
    if (action) {
        e.preventDefault();
        action();
    }
}

// Intersection Observer for tracking current section
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            currentSection = parseInt(entry.target.dataset.section) - 1;
            updateScrollIndicator();
            sections.forEach((section, i) => section.classList.toggle('active', i === currentSection));
        }
    });
}, { root: null, threshold: 0.5 });

sections.forEach(section => observer.observe(section));

// Continuous logo and viewport background flow
function updateFlowingLogo() {
    if (!flowingLogoContainer || !flowingViewportBg) return;

    // Get current scroll position
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;

    // Section 1: Full screen
    const section1 = document.querySelector('.section-1');
    const section1Top = section1.offsetTop;
    const section1Bottom = section1Top + section1.offsetHeight;

    // Calculate which section we're in
    let targetDevice = null;
    let progress = 0;

    // Find target device based on scroll position
    const deviceContainers = document.querySelectorAll('.device-container');
    deviceContainers.forEach(container => {
        const section = container.closest('.section');
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        const sectionMiddle = sectionTop + (section.offsetHeight / 2);

        // Check if we're in or near this section
        const distanceToMiddle = Math.abs(scrollTop + (viewportHeight / 2) - sectionMiddle);

        if (distanceToMiddle < viewportHeight * 0.6) {
            const deviceScreen = container.querySelector('.device-screen');
            if (deviceScreen) {
                targetDevice = deviceScreen;
                progress = 1 - (distanceToMiddle / (viewportHeight * 0.6));
            }
        }
    });

    // In section 1 - full size overlapping bottom
    if (scrollTop < section1Bottom - viewportHeight / 2) {
        const section1Progress = scrollTop / (section1Bottom - viewportHeight / 2);
        const scale = 1 - (section1Progress * 0.7); // Scale from 1 to 0.3

        // Keep at bottom 65% position on first page
        flowingLogoContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
        flowingLogoContainer.style.top = '65%';
        flowingLogoContainer.style.left = '50%';
        flowingLogoContainer.style.opacity = '1';

        // Viewport background follows logo
        flowingViewportBg.style.transform = 'translate(0, 0) scale(1)';
        flowingViewportBg.style.opacity = '1';
        flowingViewportBg.style.clipPath = 'none';
        flowingViewportBg.style.borderRadius = '0';

        // Moving toward a device
    } else if (targetDevice) {
        const rect = targetDevice.getBoundingClientRect();

        // Get border/bezel width from device type first
        const deviceContainer = targetDevice.closest('.device-container');
        let bezelPadding = 0;
        let borderRadius = '0px';

        if (deviceContainer) {
            if (deviceContainer.classList.contains('monitor-container')) {
                bezelPadding = 20; // 20px border
                borderRadius = '8px';
            } else if (deviceContainer.classList.contains('theater-container')) {
                bezelPadding = 30; // 30px border
                borderRadius = '0px';
            } else if (deviceContainer.classList.contains('lcd-container')) {
                bezelPadding = 35; // 35px border
                borderRadius = '12px';
            } else if (deviceContainer.classList.contains('crt-container')) {
                bezelPadding = 50; // 50px border
                borderRadius = '30px';
            } else if (deviceContainer.classList.contains('bw-container')) {
                bezelPadding = 60; // 60px border
                borderRadius = '40px';
            } else if (deviceContainer.classList.contains('frame-container')) {
                bezelPadding = 40; // 40px border
                borderRadius = '4px';
            } else if (deviceContainer.classList.contains('cave-container')) {
                bezelPadding = 0; // Full cave wall, no bezel
                borderRadius = '0';
            }
        }

        // Calculate inner dimensions (accounting for bezel on both sides)
        const innerWidth = rect.width - (bezelPadding * 2);
        const innerHeight = rect.height - (bezelPadding * 2);
        const innerCenterX = rect.left + rect.width / 2;
        const innerCenterY = rect.top + rect.height / 2;

        // Calculate logo scale to fit inside device (accounting for bezel)
        const logoWidth = flowingLogo.offsetWidth;
        const targetScale = Math.min((innerWidth * 0.65) / logoWidth, 0.3);

        // Position logo inside device screen
        flowingLogoContainer.style.transform = `translate(-50%, -50%) scale(${targetScale})`;
        flowingLogoContainer.style.top = `${innerCenterY}px`;
        flowingLogoContainer.style.left = `${innerCenterX}px`;
        flowingLogoContainer.style.opacity = progress;

        // Apply device-specific logo styling via CSS classes
        applyDeviceSpecificLogoStyling(deviceContainer);

        // Morph viewport background to fill device screen completely (inside bezel)
        const deviceScaleX = innerWidth / window.innerWidth;
        const deviceScaleY = innerHeight / window.innerHeight;

        // Position background to align with device screen center
        const translateX = innerCenterX - window.innerWidth / 2;
        const translateY = innerCenterY - window.innerHeight / 2;

        flowingViewportBg.style.transform = `translate(${translateX}px, ${translateY}px) scaleX(${deviceScaleX}) scaleY(${deviceScaleY})`;
        flowingViewportBg.style.transformOrigin = 'center center';
        flowingViewportBg.style.opacity = Math.min(1, progress * 1.2);
        flowingViewportBg.style.borderRadius = borderRadius;

    } else {
        // Default fallback - reset specific classes
        flowingLogoContainer.className = 'flowing-logo-container';

        flowingLogoContainer.style.opacity = '0.3';
        flowingViewportBg.style.opacity = '0.3';
    }
}

// Apply device-specific logo styling
function applyDeviceSpecificLogoStyling(deviceContainer) {
    if (!deviceContainer) return;

    // reset base class
    flowingLogoContainer.classList.remove('connected-bw', 'connected-crt', 'connected-frame', 'connected-cave');

    if (deviceContainer.classList.contains('bw-container')) {
        flowingLogoContainer.classList.add('connected-bw');
    } else if (deviceContainer.classList.contains('crt-container')) {
        flowingLogoContainer.classList.add('connected-crt');
    } else if (deviceContainer.classList.contains('frame-container')) {
        flowingLogoContainer.classList.add('connected-frame');
    } else if (deviceContainer.classList.contains('cave-container')) {
        flowingLogoContainer.classList.add('connected-cave');
    }
}

// Update device visibility based on scroll
function updateDeviceVisibility() {
    const viewportHeight = window.innerHeight;
    const deviceContainers = document.querySelectorAll('.device-container');

    deviceContainers.forEach(container => {
        const sectionRect = container.closest('.section').getBoundingClientRect();
        const visibilityProgress = Math.max(0, Math.min(1, 1 - (Math.abs(sectionRect.top) / viewportHeight)));

        container.style.transform = visibilityProgress > 0.2 ? `scale(${0.85 + visibilityProgress * 0.15})` : 'scale(0.85)';
        container.style.opacity = visibilityProgress > 0.2 ? Math.min(1, visibilityProgress * 1.2) : 0;
    });
}

// Scroll Hint Logic
const scrollHint = document.querySelector('.scroll-hint');
if (scrollHint) {
    scrollHint.addEventListener('click', () => scrollToSection(1));
}

function updateScrollHint() {
    if (!scrollHint) return;
    if (currentSection === 0) {
        scrollHint.style.opacity = '1';
        scrollHint.style.pointerEvents = 'auto';
    } else {
        scrollHint.style.opacity = '0';
        scrollHint.style.pointerEvents = 'none';
    }
}

// Combined update function
function updateAllAnimations() {
    updateFlowingLogo();
    updateDeviceVisibility();
    updateScrollHint();
}

// Optimized Animation Loop
let ticking = false;

function onScroll() {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateAllAnimations();
            ticking = false;
        });
        ticking = true;
    }
}

// Event listeners
window.addEventListener('wheel', handleWheel, { passive: false });
window.addEventListener('touchstart', handleTouchStart, { passive: true });
window.addEventListener('touchend', handleTouchEnd, { passive: true });
window.addEventListener('keydown', handleKeydown);
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });

// Dot navigation
dots.forEach(dot => {
    dot.addEventListener('click', () => scrollToSection(parseInt(dot.dataset.section)));
});

// Initialize
scrollToSection(0);
updateAllAnimations();
