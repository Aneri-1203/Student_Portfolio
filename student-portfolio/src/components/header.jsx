function Header({ name, themeColor }) {
  return (
    <header className="header">
      <h1 style={{ color: themeColor }}>
        {name}
        <span className="cursor" style={{ color: themeColor }}></span>
      </h1>
      <div className="header-underline" style={{ background: themeColor }}></div>
    </header>
  );
}

export default Header;