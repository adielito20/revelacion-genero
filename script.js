import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

// --- CONFIGURACION DE FIREBASE ---

const firebaseConfig = {
    apiKey: "AIzaSyB4pcGE8OknW57nDyTUJRYIK_kTVu1_xsg",
    authDomain: "revelacion-genero-fc5ca.firebaseapp.com",
    projectId: "revelacion-genero-fc5ca",
    storageBucket: "revelacion-genero-fc5ca.firebasestorage.app",
    messagingSenderId: "382233768712",
    appId: "1:382233768712:web:a9c0ca5b7dd2e9e091b2bd",
    databaseURL: "https://revelacion-genero-fc5ca-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ── LOADER ──
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').classList.add('hide');
    }, 1400);
});

// ── CONFETI ──
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animId;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.size = Math.random() * 5 + 2;
        this.speedY = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 1.5;
        this.rot = Math.random() * 360;
        this.rotSpeed = (Math.random() - 0.5) * 3;
        const palettes = [
            ['#7BAFD4', '#5a9abf'],
            ['#E8A0B4', '#c97090'],
            ['#C9A96E', '#E8D5B0'],
            ['#ffffff', '#f0e8d8'],
        ];
        const p = palettes[Math.floor(Math.random() * palettes.length)];
        this.color = p[Math.floor(Math.random() * p.length)];
        this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
        this.opacity = Math.random() * 0.6 + 0.3;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rot += this.rotSpeed;
        if (this.y > canvas.height + 10) this.reset();
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot * Math.PI / 180);
        ctx.fillStyle = this.color;
        if (this.shape === 'rect') {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.5);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function startConfetti() {
    if (particles.length > 0) return;
    for (let i = 0; i < 120; i++) {
        const p = new Particle();
        p.y = Math.random() * canvas.height; // pre-distribute
        particles.push(p);
    }
    canvas.style.opacity = 0.6;
    animateConfetti();
}
function stopConfetti() {
    canvas.style.opacity = 0;
    setTimeout(() => { particles = []; cancelAnimationFrame(animId); }, 1000);
}
function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(animateConfetti);
}

// ── SCROLL REVEAL ──
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(el => revealObserver.observe(el));

// Finale reveal
const finaleObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('in-view');
            startConfetti();
        } else {
            stopConfetti();
        }
    });
}, { threshold: 0.3 });
finaleObserver.observe(document.getElementById('finale'));

// ── COUNTDOWN ──
const eventDate = new Date('2026-04-18T16:30:00'); // Fecha de la reve

function updateCountdown() {
    const now = new Date();
    const diff = eventDate - now;
    if (diff <= 0) {
        ['cd-days', 'cd-hours', 'cd-mins', 'cd-secs'].forEach(id => document.getElementById(id).textContent = '00');
        return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    const fmt = n => String(n).padStart(2, '0');
    const prevSecs = document.getElementById('cd-secs').textContent;

    document.getElementById('cd-days').textContent = fmt(days);
    document.getElementById('cd-hours').textContent = fmt(hours);
    document.getElementById('cd-mins').textContent = fmt(mins);
    const secsEl = document.getElementById('cd-secs');
    secsEl.textContent = fmt(secs);
    if (prevSecs !== fmt(secs)) {
        secsEl.classList.remove('tick');
        void secsEl.offsetWidth;
        secsEl.classList.add('tick');
    }
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ── VOTE ──
let votes = { boy: 0, girl: 0 };
let hasVoted = false;

// Check locally
try {
    hasVoted = !!localStorage.getItem('grHasVoted');
} catch (e) { }

const votesRef = ref(db, 'votes');

onValue(votesRef, (snapshot) => {
    const data = snapshot.val() || {};
    votes.boy = data.boy || 0;
    votes.girl = data.girl || 0;
    if (hasVoted) showResults();
});

window.castVote = function (choice) {
    if (hasVoted) return;
    hasVoted = true;
    try {
        localStorage.setItem('grHasVoted', '1');
    } catch (e) { }

    const btn = choice === 'boy'
        ? document.querySelector('.blue-vote')
        : document.querySelector('.pink-vote');
    btn.classList.add('selected');
    document.querySelectorAll('.vote-btn').forEach(b => b.classList.add('disabled'));

    // Safe sync increment
    runTransaction(ref(db, 'votes/' + choice), (current) => {
        return (current || 0) + 1;
    });

    setTimeout(showResults, 400);
}

function showResults() {
    const sum = votes.boy + votes.girl;
    const total = sum || 1; // Prevents division by zero
    const boyPct = Math.round(votes.boy / total * 100);
    const girlPct = Math.round(votes.girl / total * 100);

    document.getElementById('boyPct').textContent = boyPct + '%';
    document.getElementById('girlPct').textContent = girlPct + '%';
    document.getElementById('voteTotal').textContent = sum + (sum === 1 ? ' voto' : ' votos');

    const results = document.getElementById('voteResults');
    results.classList.add('show', 'visible');

    setTimeout(() => {
        document.getElementById('boyBar').style.width = boyPct + '%';
        document.getElementById('girlBar').style.width = girlPct + '%';
    }, 100);

    if (!hasVoted) return;
    document.querySelectorAll('.vote-btn').forEach(b => b.classList.add('disabled'));
}

// ── SLIDER ──
const track = document.getElementById('sliderTrack');
const slides = track.querySelectorAll('.slide');
const dotsContainer = document.getElementById('sliderDots');
let currentSlide = 0;
let isDragging = false, startX = 0, currentX = 0;

// Create dots
slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => { goToSlide(i); resetAutoSlide(); });
    dotsContainer.appendChild(dot);
});

function goToSlide(idx) {
    idx = Math.max(0, Math.min(idx, slides.length - 1));
    currentSlide = idx;
    const slideW = slides[0].offsetWidth + 20;
    const offset = currentSlide * slideW;
    track.style.transform = `translateX(-${offset}px)`;
    document.querySelectorAll('.slider-dot').forEach((d, i) => {
        d.classList.toggle('active', i === idx);
    });
}

document.getElementById('slidePrev').addEventListener('click', () => { goToSlide(currentSlide - 1); resetAutoSlide(); });
document.getElementById('slideNext').addEventListener('click', () => { goToSlide(currentSlide + 1); resetAutoSlide(); });

// Drag to slide
track.addEventListener('mousedown', e => { isDragging = true; startX = e.clientX; track.style.transition = 'none'; resetAutoSlide(); });
document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    currentX = e.clientX - startX;
});
document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = '';
    if (currentX < -60) goToSlide(currentSlide + 1);
    else if (currentX > 60) goToSlide(currentSlide - 1);
    else goToSlide(currentSlide);
    currentX = 0;
});
track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; resetAutoSlide(); }, { passive: true });
track.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - startX;
    if (diff < -50) goToSlide(currentSlide + 1);
    else if (diff > 50) goToSlide(currentSlide - 1);
}, { passive: true });

// Auto-slide
function resetAutoSlide() {
    if (window.autoSlideInterval) clearInterval(window.autoSlideInterval);
    window.autoSlideInterval = setInterval(() => goToSlide((currentSlide + 1) % slides.length), 4000);
}
resetAutoSlide();

// ── MAP ──
window.openMap = function () {

    window.open('https://www.google.com/maps/embed?pb=!4v1775259005455!6m8!1m7!1s-3lM90q0nUODa4vtKtu-Qg!2m2!1d-6.784079523208914!2d-79.85700066565609!3f170.74663940252927!4f21.122031522354646!5f0.7820865974627469', '_blank');
}

// ── SMOOTH SCROLL ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
