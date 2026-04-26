const header = document.getElementById("site-header");
const footer = document.getElementById("site-footer");

if (header) {
  header.innerHTML = `
    <nav>
      <a href="/" class="nav-logo">
        <img src="/images/logo.webp" alt="Epic Decks Logo">
        EPIC <span>DECKS</span>
      </a>

      <ul class="nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/#inventory">Shop</a></li>
        <li><a href="/commitments.html">Commitments</a></li>
        <li><a href="/double-legends-pack.html">Double Legends</a></li>
      </ul>

      <a href="https://www.whatnot.com/user/epicdecksnl/shop" class="nav-cta" target="_blank" rel="noopener noreferrer">
        Shop Live
      </a>
    </nav>
  `;
}

if (footer) {
  footer.innerHTML = `
    <footer>
      <div>
        <a href="/privacy-policy.html">Privacy Policy</a> |
        <a href="/terms-and-conditions.html">Terms & Conditions</a> |
        <a href="/cookie-policy.html">Cookie Policy</a>
      </div>
      <div style="margin-top:10px;">
        © ${new Date().getFullYear()} Epic Decks NL · Made with ♥ for the collector community
      </div>
    </footer>
  `;
}