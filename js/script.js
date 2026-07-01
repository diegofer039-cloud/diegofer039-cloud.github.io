(function () {

  // ===== THREE.JS TRON GRID =====
  const tronContainer = document.getElementById('tron-bg')
  if (tronContainer && typeof THREE !== 'undefined') {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    tronContainer.appendChild(renderer.domElement)

    const gridColor = new THREE.Color(0x58a6ff)
    const gridColor2 = new THREE.Color(0x1a3a6a)

    const gridHelper = new THREE.GridHelper(40, 30, gridColor, gridColor2)
    gridHelper.position.y = -2
    scene.add(gridHelper)

    const pointsGeo = new THREE.BufferGeometry()
    const pointsCount = 400
    const posArray = new Float32Array(pointsCount * 3)
    for (let i = 0; i < pointsCount; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * 40
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 15 - 2
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 40
    }
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    const pointsMat = new THREE.PointsMaterial({
      color: 0x58a6ff,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })
    const pointCloud = new THREE.Points(pointsGeo, pointsMat)
    scene.add(pointCloud)

    camera.position.set(0, 6, 12)
    camera.lookAt(0, 0, 0)

    let mouseX = 0, mouseY = 0
    let targetX = 0, targetY = 0

    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    })

    function animateThree() {
      requestAnimationFrame(animateThree)

      targetX += (mouseX - targetX) * 0.05
      targetY += (mouseY - targetY) * 0.05

      camera.position.x = targetX * 4
      camera.position.y = 6 - targetY * 1.5
      camera.position.z = 12 - Math.abs(targetX) * 2
      camera.lookAt(0, -1, 0)

      pointCloud.rotation.y += 0.0005

      renderer.render(scene, camera)
    }
    animateThree()

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  // ===== SCROLL PATH =====
  const pathCanvas = document.getElementById('scroll-path')
  if (pathCanvas) {
    const ctx = pathCanvas.getContext('2d')
    let pathW, pathH

    function resizePath() {
      pathW = window.innerWidth
      pathH = window.innerHeight
      pathCanvas.width = pathW
      pathCanvas.height = pathH
      drawPath()
    }

    const points = [
      { x: 0.15, y: 0.08 },
      { x: 0.75, y: 0.15 },
      { x: 0.45, y: 0.28 },
      { x: 0.8, y: 0.42 },
      { x: 0.25, y: 0.55 },
      { x: 0.7, y: 0.7 },
      { x: 0.35, y: 0.82 },
      { x: 0.65, y: 0.95 },
    ]

    function getBezierPoint(t, pts) {
      const n = pts.length - 1
      let x = 0, y = 0
      for (let i = 0; i <= n; i++) {
        const coeff = binomial(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i)
        x += coeff * pts[i].x
        y += coeff * pts[i].y
      }
      return { x, y }
    }

    function binomial(n, k) {
      if (k < 0 || k > n) return 0
      let c = 1
      for (let i = 1; i <= k; i++) c = c * (n - k + i) / i
      return c
    }

    let currentProgress = 0

    function drawPath() {
      ctx.clearRect(0, 0, pathW, pathH)

      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollY = window.scrollY
      const progress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0
      currentProgress += (progress - currentProgress) * 0.1

      const segments = 200
      const drawTo = Math.floor(segments * currentProgress)

      if (drawTo < 2) return

      const pts = points.map(p => ({ x: p.x * pathW, y: p.y * pathH }))

      for (let s = 0; s <= drawTo; s++) {
        const t1 = s / segments
        const t2 = Math.min((s + 1) / segments, 1)
        const p1 = getBezierPoint(t1, pts)
        const p2 = getBezierPoint(t2, pts)

        const alpha = s / segments
        const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y)
        gradient.addColorStop(0, `rgba(88, 166, 255, ${alpha * 0.8})`)
        gradient.addColorStop(0.5, `rgba(188, 140, 255, ${alpha * 0.6})`)
        gradient.addColorStop(1, `rgba(88, 166, 255, ${alpha * 0.3})`)

        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 2.5
        ctx.stroke()

        if (s < drawTo) {
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = `rgba(88, 166, 255, ${alpha * 0.15})`
          ctx.lineWidth = 8
          ctx.stroke()
        }
      }

      if (drawTo > 1) {
        const lastT = drawTo / segments
        const tip = getBezierPoint(lastT, pts)
        const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 15)
        glow.addColorStop(0, 'rgba(188, 140, 255, 0.8)')
        glow.addColorStop(1, 'rgba(188, 140, 255, 0)')

        ctx.beginPath()
        ctx.arc(tip.x, tip.y, 15, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        ctx.beginPath()
        ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#bc8cff'
        ctx.fill()
      }
    }

    window.addEventListener('scroll', drawPath)
    window.addEventListener('resize', resizePath)
    resizePath()
  }

  // ===== TYPING EFFECT =====
  const typingEl = document.getElementById('typing-text')
  if (typingEl) {
    const words = ['Desarrollador Frontend', 'Creador Web', 'Apasionado del Código']
    let wordIndex = 0
    let charIndex = 0
    let isDeleting = false
    let isPaused = false

    function typeEffect() {
      const currentWord = words[wordIndex]
      if (isPaused) {
        setTimeout(typeEffect, 2000)
        isPaused = false
        return
      }

      if (!isDeleting) {
        typingEl.textContent = currentWord.substring(0, charIndex + 1)
        charIndex++
        if (charIndex === currentWord.length) {
          isPaused = true
          isDeleting = true
          setTimeout(typeEffect, 2000)
          return
        }
        setTimeout(typeEffect, 60)
      } else {
        typingEl.textContent = currentWord.substring(0, charIndex - 1)
        charIndex--
        if (charIndex === 0) {
          isDeleting = false
          wordIndex = (wordIndex + 1) % words.length
          setTimeout(typeEffect, 300)
          return
        }
        setTimeout(typeEffect, 30)
      }
    }

    setTimeout(typeEffect, 500)
  }

  // ===== MOUSE TRAIL =====
  const trailCanvas = document.getElementById('mouse-trail')
  if (trailCanvas) {
    const tCtx = trailCanvas.getContext('2d')
    let trailW, trailH
    const particles = []
    const maxParticles = 30

    function resizeTrail() {
      trailW = window.innerWidth
      trailH = window.innerHeight
      trailCanvas.width = trailW
      trailCanvas.height = trailH
    }

    let lastMouseX = -100, lastMouseY = -100
    let mouseActive = false

    document.addEventListener('mousemove', (e) => {
      lastMouseX = e.clientX
      lastMouseY = e.clientY
      mouseActive = true
      particles.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 1,
        life: 1,
        size: Math.random() * 4 + 2,
        hue: Math.random() < 0.5 ? 210 : 260
      })
      if (particles.length > maxParticles) particles.shift()
    })

    document.addEventListener('mouseleave', () => { mouseActive = false })

    function animateTrail() {
      requestAnimationFrame(animateTrail)
      tCtx.clearRect(0, 0, trailW, trailH)

      if (!mouseActive && particles.length === 0) return

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.vx *= 0.98
        p.life -= 0.025

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        const alpha = p.life * 0.6
        tCtx.beginPath()
        tCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        const c = p.hue === 210 ? '88, 166, 255' : '188, 140, 255'
        tCtx.fillStyle = `rgba(${c}, ${alpha})`
        tCtx.fill()
      }

      if (mouseActive && particles.length > 0) {
        const last = particles[particles.length - 1]
        tCtx.beginPath()
        tCtx.arc(last.x, last.y, 6, 0, Math.PI * 2)
        const gradient = tCtx.createRadialGradient(last.x, last.y, 0, last.x, last.y, 6)
        gradient.addColorStop(0, 'rgba(188, 140, 255, 0.4)')
        gradient.addColorStop(1, 'rgba(188, 140, 255, 0)')
        tCtx.fillStyle = gradient
        tCtx.fill()
      }
    }

    window.addEventListener('resize', resizeTrail)
    resizeTrail()
    animateTrail()
  }

  // ===== HERO PARTICLE NETWORK =====
  const heroParticlesCanvas = document.getElementById('hero-particles')
  if (heroParticlesCanvas) {
    const hCtx = heroParticlesCanvas.getContext('2d')
    let hpW, hpH
    const particles = []
    const COUNT = 55
    const CONNECT_DIST = 130
    const MOUSE_RADIUS = 160

    let hpMouseX = null, hpMouseY = null

    function resizeHeroParticles() {
      const hero = heroParticlesCanvas.parentElement
      hpW = hero.offsetWidth
      hpH = hero.offsetHeight
      heroParticlesCanvas.width = hpW
      heroParticlesCanvas.height = hpH
    }

    class HeroParticle {
      constructor() {
        this.reset()
      }
      reset() {
        this.x = Math.random() * hpW
        this.y = Math.random() * hpH
        this.vx = (Math.random() - 0.5) * 0.6
        this.vy = (Math.random() - 0.5) * 0.6
        this.r = Math.random() * 2 + 1.2
        this.isBlue = Math.random() < 0.6
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        if (this.x < 0 || this.x > hpW) { this.vx *= -1; this.x = Math.max(0, Math.min(hpW, this.x)) }
        if (this.y < 0 || this.y > hpH) { this.vy *= -1; this.y = Math.max(0, Math.min(hpH, this.y)) }

        if (hpMouseX !== null && hpMouseY !== null) {
          const dx = this.x - hpMouseX
          const dy = this.y - hpMouseY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 2.5
            this.vx += (dx / dist) * force * 0.08
            this.vy += (dy / dist) * force * 0.08
          }
        }

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
        if (speed > 1.2) {
          this.vx = (this.vx / speed) * 1.2
          this.vy = (this.vy / speed) * 1.2
        }
      }
      draw() {
        const alpha = 0.7
        hCtx.beginPath()
        hCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        hCtx.fillStyle = this.isBlue ? `rgba(88, 166, 255, ${alpha})` : `rgba(188, 140, 255, ${alpha})`
        hCtx.fill()
      }
    }

    for (let i = 0; i < COUNT; i++) {
      particles.push(new HeroParticle())
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.4
            hCtx.beginPath()
            hCtx.moveTo(particles[i].x, particles[i].y)
            hCtx.lineTo(particles[j].x, particles[j].y)
            hCtx.strokeStyle = `rgba(88, 166, 255, ${alpha})`
            hCtx.lineWidth = 0.8
            hCtx.stroke()
          }
        }
      }
    }

    function animateHeroParticles() {
      hCtx.clearRect(0, 0, hpW, hpH)
      for (const p of particles) p.update()
      drawConnections()
      for (const p of particles) p.draw()
      requestAnimationFrame(animateHeroParticles)
    }

    heroParticlesCanvas.addEventListener('mousemove', (e) => {
      const rect = heroParticlesCanvas.getBoundingClientRect()
      hpMouseX = e.clientX - rect.left
      hpMouseY = e.clientY - rect.top
    })
    heroParticlesCanvas.addEventListener('mouseleave', () => {
      hpMouseX = null
      hpMouseY = null
    })

    window.addEventListener('resize', resizeHeroParticles)
    resizeHeroParticles()
    animateHeroParticles()
  }

  // ===== SECTION REVEAL (CLIP-PATH) =====
  const sections = document.querySelectorAll('.seccion, .hero')
  if (sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.15 })
    sections.forEach(s => observer.observe(s))
  }

  // ===== CARD 3D TILT =====
  const cards = document.querySelectorAll('.tarjeta-proyecto')
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      card.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`
    })
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0px)'
    })
  })

  // ===== BUTTON RIPPLE =====
  document.querySelectorAll('.btn, .btn-chico').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect()
      const ripple = document.createElement('span')
      ripple.className = 'ripple'
      const size = Math.max(rect.width, rect.height)
      ripple.style.width = ripple.style.height = size + 'px'
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px'
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px'
      this.appendChild(ripple)
      setTimeout(() => ripple.remove(), 600)
    })
  })

  // ===== MAGNETIC BUTTONS =====
  document.querySelectorAll('.hero-botones .btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      const dist = Math.sqrt(x * x + y * y)
      const maxDist = 100
      const strength = Math.max(0, 1 - dist / maxDist)
      btn.style.transform = `translate(${x * strength * 0.2}px, ${y * strength * 0.2}px)`
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = ''
    })
  })

  // ===== NAV ACTIVE TRACKING =====
  const navLinks = document.querySelectorAll('.nav-links a')
  const allSections = document.querySelectorAll('section[id]')

  function updateActiveNav() {
    let current = ''
    allSections.forEach(section => {
      const top = section.offsetTop - 100
      if (window.scrollY >= top) {
        current = section.getAttribute('id')
      }
    })
    navLinks.forEach(link => {
      link.classList.remove('nav-active')
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('nav-active')
      }
    })
  }

  window.addEventListener('scroll', updateActiveNav)
  updateActiveNav()

})()
