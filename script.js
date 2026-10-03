document.addEventListener('DOMContentLoaded', () => {

    // =========================================
    //  ANIMATED HERO — Parallax + reveal
    // =========================================
    const heroBg = document.getElementById('heroBg');
    const animatedItems = document.querySelectorAll('[data-animate="fade-up"]');

    // Subtle parallax on scroll (mirrors framer-motion scroll integration)
    if (heroBg) {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            // Shift bg slightly slower than scroll = parallax
            heroBg.style.transform = `translateY(${scrollY * 0.3}px)`;
        }, { passive: true });
    }

    // If user has reduced motion, remove animations
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animatedItems.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.animation = 'none';
        });
    }


    // Mobile Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    const toggleMenu = () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    };

    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    // Also close menu when mobile CTA button is clicked
    const mobileCta = document.querySelector('.mobile-cta');
    if (mobileCta) {
        mobileCta.addEventListener('click', () => {
            if (mobileMenu.classList.contains('active')) toggleMenu();
        });
    }

    // Sticky Navbar
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // WhatsApp Enquiry Form
    const enquiryForm = document.getElementById('enquiry-form');
    if (enquiryForm) {
        enquiryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // Format the message for WhatsApp
            const whatsappText = `Hi Gopika, I'm ${name} (${email}).%0A%0A${message}`;
            
            // WhatsApp number with country code
            const whatsappNumber = '916383893357'; 
            
            // Open WhatsApp in a new tab
            window.open(`https://wa.me/${whatsappNumber}?text=${whatsappText}`, '_blank');
        });
    }

    // Counter Animation (triggered when stats scroll into view)
    const counters = document.querySelectorAll('.counter');

    const animateCounter = (el) => {
        const target = parseInt(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const step = target / (duration / 16);
        let current = 0;

        const update = () => {
            current += step;
            if (current < target) {
                el.textContent = Math.floor(current) + suffix;
                requestAnimationFrame(update);
            } else {
                el.textContent = target + suffix;
            }
        };
        update();
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    counters.forEach(counter => counterObserver.observe(counter));
});

// =========================================
//  CONTACT GLOBE (D3.js wireframe)
// =========================================
(function initContactGlobe() {
    const svgEl = document.getElementById('contact-globe');
    if (!svgEl) return;

    // Wait for D3 to be available
    const tryInit = setInterval(() => {
        if (typeof d3 === 'undefined' || typeof topojson === 'undefined') return;
        clearInterval(tryInit);

        const wrap = svgEl.parentElement;
        const W = wrap.offsetWidth;
        const H = wrap.offsetHeight;

        const svg = d3.select(svgEl)
            .attr('width', W)
            .attr('height', H);

        const radius   = Math.min(W, H) * 0.85;
        let rotation   = [20, -15];
        let isDragging = false;
        let lastMouse  = [0, 0];

        const projection = d3.geoOrthographic()
            .scale(radius / 2)
            .translate([W / 2, H / 2])
            .rotate(rotation)
            .clipAngle(90);

        const path = d3.geoPath().projection(projection);

        // Sphere outline
        svg.append('path')
            .datum({ type: 'Sphere' })
            .attr('class', 'globe-sphere')
            .attr('fill', 'none')
            .attr('stroke', 'currentColor')
            .attr('stroke-width', 1)
            .attr('opacity', 0.35);

        // Graticule
        const graticule = d3.geoGraticule();
        svg.append('path')
            .datum(graticule())
            .attr('class', 'globe-graticule')
            .attr('fill', 'none')
            .attr('stroke', 'currentColor')
            .attr('stroke-width', 0.4)
            .attr('opacity', 0.18);

        // Countries group
        const countryGroup = svg.append('g').attr('class', 'globe-countries');

        // Load world data
        fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
            .then(r => r.json())
            .then(world => {
                const countries = topojson.feature(world, world.objects.countries).features;

                countryGroup.selectAll('path')
                    .data(countries)
                    .enter()
                    .append('path')
                    .attr('fill', 'none')
                    .attr('stroke', 'currentColor')
                    .attr('stroke-width', 0.55)
                    .attr('opacity', 0.85);

                render();
                startAutoRotate();
            });

        function render() {
            projection.rotate(rotation);
            svg.selectAll('.globe-sphere').attr('d', path({ type: 'Sphere' }));
            svg.selectAll('.globe-graticule').attr('d', path(graticule()));
            countryGroup.selectAll('path').attr('d', d => path(d) || '');
        }

        // Auto-rotate
        let animFrame;
        function startAutoRotate() {
            if (isDragging) return;
            animFrame = requestAnimationFrame(() => {
                rotation[0] += 0.35;
                render();
                startAutoRotate();
            });
        }

        // Drag interaction
        svgEl.addEventListener('mousedown', e => {
            isDragging = true;
            cancelAnimationFrame(animFrame);
            lastMouse = [e.clientX, e.clientY];
        });

        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            const dx = e.clientX - lastMouse[0];
            const dy = e.clientY - lastMouse[1];
            rotation[0] += dx * 0.35;
            rotation[1] = Math.max(-70, Math.min(70, rotation[1] - dy * 0.35));
            lastMouse = [e.clientX, e.clientY];
            render();
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            startAutoRotate();
        });

        // Touch support
        svgEl.addEventListener('touchstart', e => {
            isDragging = true;
            cancelAnimationFrame(animFrame);
            lastMouse = [e.touches[0].clientX, e.touches[0].clientY];
        }, { passive: true });

        svgEl.addEventListener('touchmove', e => {
            if (!isDragging) return;
            const dx = e.touches[0].clientX - lastMouse[0];
            const dy = e.touches[0].clientY - lastMouse[1];
            rotation[0] += dx * 0.35;
            rotation[1] = Math.max(-70, Math.min(70, rotation[1] - dy * 0.35));
            lastMouse = [e.touches[0].clientX, e.touches[0].clientY];
            render();
        }, { passive: true });

        svgEl.addEventListener('touchend', () => {
            isDragging = false;
            startAutoRotate();
        });

    }, 100);
})();