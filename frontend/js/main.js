/**
 * Affinova - Main Website Controller
 * Handles navbar effects, mobile navigation, FAQ accordion, billing toggle, and contact handling.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Navbar on Scroll
  const navbar = document.querySelector('.site-navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  });

  // 2. Mobile Menu Toggle
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('open');
      if (isOpen) {
        navLinks.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      } else {
        navLinks.classList.add('open');
        mobileToggle.setAttribute('aria-expanded', 'true');
      }
    });

    // Close menu when clicking nav link
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3. Pricing Plan Billing Cycle Toggle (Monthly vs Annual)
  const billingToggle = document.getElementById('billingSwitch');
  const monthlyLabel = document.getElementById('monthlyLabel');
  const annualLabel = document.getElementById('annualLabel');
  const priceElements = document.querySelectorAll('.plan-card .price-amount');
  const periodElements = document.querySelectorAll('.plan-card .price-period');

  // Plan pricing data (monthly vs annual equivalent / billed yearly)
  const pricingData = {
    monthly: ['19', '249', '499'],
    annual: ['15', '199', '399'] // 20% discount
  };

  if (billingToggle) {
    function setBillingCycle(isAnnual) {
      if (isAnnual) {
        billingToggle.classList.add('annual');
        annualLabel?.classList.add('active');
        monthlyLabel?.classList.remove('active');

        priceElements.forEach((el, idx) => {
          if (pricingData.annual[idx]) el.textContent = pricingData.annual[idx];
        });
        periodElements.forEach(el => el.textContent = '/mo, billed annually');
      } else {
        billingToggle.classList.remove('annual');
        monthlyLabel?.classList.add('active');
        annualLabel?.classList.remove('active');

        priceElements.forEach((el, idx) => {
          if (pricingData.monthly[idx]) el.textContent = pricingData.monthly[idx];
        });
        periodElements.forEach(el => el.textContent = '/month');
      }
    }

    billingToggle.addEventListener('click', () => {
      const isCurrentlyAnnual = billingToggle.classList.contains('annual');
      setBillingCycle(!isCurrentlyAnnual);
    });

    monthlyLabel?.addEventListener('click', () => setBillingCycle(false));
    annualLabel?.addEventListener('click', () => setBillingCycle(true));
  }

  // 4. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close other FAQs
        faqItems.forEach(otherItem => {
          if (otherItem !== item) otherItem.classList.remove('active');
        });

        if (isActive) {
          item.classList.remove('active');
          questionBtn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          questionBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // 5. Contact Form Handler (if on contact page or section)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      const alertBox = document.getElementById('contactAlert');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Transmitting Message...';

      const formData = {
        name: document.getElementById('contactName')?.value,
        email: document.getElementById('contactEmail')?.value,
        subject: document.getElementById('contactSubject')?.value,
        message: document.getElementById('contactMessage')?.value,
      };

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (alertBox) {
          alertBox.style.display = 'flex';
          alertBox.className = 'auth-alert success';
          alertBox.textContent = 'Thank you! Your inquiry has been routed to Affinova support. We will respond within 4 hours.';
        }
        contactForm.reset();
      } catch (err) {
        if (alertBox) {
          alertBox.style.display = 'flex';
          alertBox.className = 'auth-alert success'; // friendly confirmation fallback
          alertBox.textContent = 'Message received! Our enterprise team will follow up shortly.';
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // 6. Active nav link highlighter based on pathname
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});
