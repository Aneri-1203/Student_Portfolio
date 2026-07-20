function Footer() {
  return (
    <footer id="footer" className="footer">
      <p className="section-label">// contact</p>
      <p className="footer-links">
       <a href="https://mail.google.com/mail/?view=cm&fs=1&to=aneritpatel1203@gmail.com&su=Portfolio%20Contact"
        target="_blank"
        rel="noopener noreferrer">aneritpatel1203@gmail.com</a>
        <span className="dot">·</span>
        <a href="https://github.com/24AIML031-Aneri" target="_blank" rel="noopener noreferrer">
        GitHub
        </a>
        <span className="dot">·</span>
        <a href="https://www.linkedin.com/in/aneri-patel-7a3b43331/" target="_blank" rel="noopener noreferrer">
        LinkedIn
        </a>
      </p>
      <p>© {new Date().getFullYear()} All rights reserved </p>
    </footer>
  );
}

export default Footer;