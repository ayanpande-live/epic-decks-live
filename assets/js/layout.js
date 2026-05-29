const header = document.getElementById("site-header");
const footer = document.getElementById("site-footer");

if (header) {
  header.innerHTML = `
    <nav>
      <a href="/" class="nav-logo">
        <img src="/images/logo.webp" alt="Epic Decks NL Logo">
        EPIC <span>DECKS NL</span>
      </a>

      <button class="nav-hamburger" aria-label="Toggle menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>

      <ul class="nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/#inventory">Shop</a></li>
        <li><a href="/commitments.html">Commitments</a></li>
        <li><a href="/double-legends-packs.html">Double Legends</a></li>
      </ul>

      <a href="https://www.whatnot.com/user/epicdecksnl/shop" class="nav-cta" target="_blank" rel="noopener noreferrer">
        Shop Live
      </a>
    </nav>
  `;

  const hamburger = header.querySelector('.nav-hamburger');
  const navLinks = header.querySelector('.nav-links');
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('nav-open');
    hamburger.setAttribute('aria-expanded', open);
  });
}

if (footer) {
  footer.innerHTML = `
    <footer>
      <div>
        <a href="/legal/privacy-policy.html">Privacy Policy</a> |
        <a href="/legal/legal-notice.html">Legal Notice</a> |
        <a href="/legal/cookie-policy.html">Cookie Policy</a>
      </div>
      <div style="margin-top:10px;">
        © ${new Date().getFullYear()} Epic Decks NL · Made with ♥ for the collector community
      </div>
    </footer>
  `;
}
