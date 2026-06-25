// Disinvented scroll-snap enhancement script.
// Runs on every page but only activates index-specific behavior when .section elements exist.

(function () {
const sections = document.querySelectorAll('.section');

// If there are no full-screen sections, this page doesn't need the scroll-snap enhancements.
if (sections.length === 0) {
    return;
}

let currentSection = 0;
const totalSections = sections.length;

const indicatorBar = document.querySelector('.indicator-bar');
const flowingLogoContainer = document.querySelector('.flowing-logo-container');
const flowingLogo = document.querySelector('.flowing-logo');
const flowingViewportBg = document.querySelector('.flowing-viewport-bg');
const dots = document.querySelectorAll('.dot');
const sectionNumber = document.querySelector('.section-number');
const sectionTotal = document.querySelector('.section-total');
const scrollHint = document.querySelector('.scroll-hint');


// Prefer reduced motion disables the fancy continuous effects.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Initialize section counter total from the actual DOM count.
if (sectionTotal) {
    sectionTotal.textContent = String(totalSections).padStart(2, '0');
}

// Update scroll indicator and UI
function updateScrollIndicator() {
    if (indicatorBar) {
        indicatorBar.style.width = `${((currentSection + 1) / totalSections) * 100}%`;
    }
    dots.forEach((dot, index) => {
        const isActive = index === currentSection;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
    if (sectionNumber) {
        sectionNumber.textContent = String(currentSection + 1).padStart(2, '0');
    }
}

// Scroll to section
function scrollToSection(index, behavior = null) {
    if (index < 0 || index >= totalSections) return;
    currentSection = index;
    const scrollBehavior = behavior || (prefersReducedMotion ? 'auto' : 'smooth');
    sections[currentSection].scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    sections.forEach((section, i) => section.classList.toggle('active', i === currentSection));
    updateScrollIndicator();
}

// Keyboard navigation (only Home/End; arrow/page/space are handled natively by scroll-snap)
function handleKeydown(e) {
    const keyActions = {
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

// Read bezel geometry from the rendered device screen so CSS remains the single source of truth.
function getBezelGeometry(deviceScreen) {
    const computed = window.getComputedStyle(deviceScreen);
    const borderWidth = parseFloat(computed.borderWidth) || 0;
    const borderRadius = computed.borderRadius || '0px';
    return { borderWidth, borderRadius };
}

// Continuous logo and viewport background flow
function updateFlowingLogo() {
    if (!flowingLogoContainer || !flowingViewportBg || !flowingLogo) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;

    const section1 = document.querySelector('.section-1');
    if (!section1) return;
    const section1Top = section1.offsetTop;
    const section1Bottom = section1Top + section1.offsetHeight;

    let targetDevice = null;
    let progress = 0;

    const deviceContainers = document.querySelectorAll('.device-container');
    deviceContainers.forEach(container => {
        const section = container.closest('.section');
        if (!section) return;
        const sectionTop = section.offsetTop;
        const sectionMiddle = sectionTop + (section.offsetHeight / 2);
        const distanceToMiddle = Math.abs(scrollTop + (viewportHeight / 2) - sectionMiddle);

        if (distanceToMiddle < viewportHeight * 0.6) {
            const deviceScreen = container.querySelector('.device-screen');
            if (deviceScreen) {
                targetDevice = deviceScreen;
                progress = 1 - (distanceToMiddle / (viewportHeight * 0.6));
            }
        }
    });

    if (scrollTop < section1Bottom - viewportHeight / 2) {
        const section1Progress = scrollTop / (section1Bottom - viewportHeight / 2);
        const scale = 1 - (section1Progress * 0.7);
        const opacity = 0.1 + (section1Progress * 0.9);

        flowingLogoContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
        flowingLogoContainer.style.top = '65%';
        flowingLogoContainer.style.left = '50%';
        flowingLogoContainer.style.opacity = Math.min(1, Math.max(0.1, opacity));

        flowingViewportBg.style.transform = 'translate(0, 0) scale(1)';
        flowingViewportBg.style.opacity = '1';
        flowingViewportBg.style.clipPath = 'none';
        flowingViewportBg.style.borderRadius = '0';
    } else if (targetDevice) {
        const rect = targetDevice.getBoundingClientRect();
        const { borderWidth, borderRadius } = getBezelGeometry(targetDevice);

        const innerWidth = rect.width - (borderWidth * 2);
        const innerHeight = rect.height - (borderWidth * 2);
        const innerCenterX = rect.left + rect.width / 2;
        const innerCenterY = rect.top + rect.height / 2;

        const logoWidth = flowingLogo.offsetWidth;
        const targetScale = Math.min((innerWidth * 0.65) / logoWidth, 0.3);

        flowingLogoContainer.style.transform = `translate(-50%, -50%) scale(${targetScale})`;
        flowingLogoContainer.style.top = `${innerCenterY}px`;
        flowingLogoContainer.style.left = `${innerCenterX}px`;
        flowingLogoContainer.style.opacity = progress;

        applyDeviceSpecificLogoStyling(targetDevice.closest('.device-container'));

        const deviceScaleX = innerWidth / window.innerWidth;
        const deviceScaleY = innerHeight / window.innerHeight;
        const translateX = innerCenterX - window.innerWidth / 2;
        const translateY = innerCenterY - window.innerHeight / 2;

        flowingViewportBg.style.transform = `translate(${translateX}px, ${translateY}px) scaleX(${deviceScaleX}) scaleY(${deviceScaleY})`;
        flowingViewportBg.style.transformOrigin = 'center center';
        flowingViewportBg.style.opacity = Math.min(1, progress * 1.2);
        flowingViewportBg.style.borderRadius = borderRadius;
    } else {
        const lastSection = document.querySelector('.section-8');
        const originTitle = lastSection?.querySelector('.static-logo');
        let headerTarget = null;

        if (originTitle) {
            const rect = originTitle.getBoundingClientRect();
            if (rect.top < viewportHeight && rect.bottom > 0) {
                const distanceToCenter = Math.abs((rect.top + rect.height / 2) - (viewportHeight / 2));
                if (distanceToCenter < viewportHeight * 0.4) {
                    headerTarget = originTitle;
                }
            }
        }

        if (headerTarget) {
            const rect = headerTarget.getBoundingClientRect();
            const centerX = window.innerWidth / 2;
            const centerY = rect.top + rect.height / 2;
            const logoWidth = flowingLogo.offsetWidth;
            const targetScale = (rect.width * 1.0) / logoWidth;

            flowingLogoContainer.style.transform = `translate(-50%, -50%) scale(${targetScale})`;
            flowingLogoContainer.style.top = `${centerY}px`;
            flowingLogoContainer.style.left = `${centerX}px`;
            flowingLogoContainer.style.opacity = '1';

            headerTarget.setAttribute('aria-hidden', 'true');
            flowingLogoContainer.className = 'flowing-logo-container connected-origin';
            flowingViewportBg.style.opacity = '0';
        } else {
            flowingLogoContainer.className = 'flowing-logo-container';
            flowingLogoContainer.style.opacity = '0.3';
            flowingLogoContainer.style.top = '50%';
            flowingLogoContainer.style.left = '50%';
            flowingViewportBg.style.opacity = '0.3';

            if (originTitle) originTitle.removeAttribute('aria-hidden');
        }
    }
}

// Apply device-specific logo styling
function applyDeviceSpecificLogoStyling(deviceContainer) {
    if (!deviceContainer) return;

    flowingLogoContainer.classList.remove('connected-bw', 'connected-crt', 'connected-frame', 'connected-cave', 'connected-theater');

    if (deviceContainer.classList.contains('bw-container')) {
        flowingLogoContainer.classList.add('connected-bw');
    } else if (deviceContainer.classList.contains('crt-container')) {
        flowingLogoContainer.classList.add('connected-crt');
    } else if (deviceContainer.classList.contains('frame-container')) {
        flowingLogoContainer.classList.add('connected-frame');
    } else if (deviceContainer.classList.contains('cave-container')) {
        flowingLogoContainer.classList.add('connected-cave');
    } else if (deviceContainer.classList.contains('theater-container')) {
        flowingLogoContainer.classList.add('connected-theater');
    }
}

// Update device visibility based on scroll
function updateDeviceVisibility() {
    const viewportHeight = window.innerHeight;
    const deviceContainers = document.querySelectorAll('.device-container');

    deviceContainers.forEach(container => {
        const section = container.closest('.section');
        if (!section) return;
        const sectionRect = section.getBoundingClientRect();
        const visibilityProgress = Math.max(0, Math.min(1, 1 - (Math.abs(sectionRect.top) / viewportHeight)));

        container.style.transform = visibilityProgress > 0.2 ? `scale(${0.85 + visibilityProgress * 0.15})` : 'scale(0.85)';
        container.style.opacity = visibilityProgress > 0.2 ? Math.min(1, visibilityProgress * 1.2) : 0;
    });
}

// Scroll Hint Logic
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

// Optimized animation loop
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
window.addEventListener('keydown', handleKeydown);
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });

// Dot navigation
dots.forEach(dot => {
    dot.addEventListener('click', () => scrollToSection(parseInt(dot.dataset.section)));
});

// Initialize without animating on load.
scrollToSection(0, 'auto');
updateAllAnimations();
})();
