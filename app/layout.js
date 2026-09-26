import "./globals.css";

export const metadata = {
  title: "Kettle Room",
  description: "A small room that turns over every hour.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="wrap">
          <header className="top">
            <a className="mark" href="/">
              kettle <span>room</span>
            </a>
            <nav>
              <a href="/">Floor</a>
              <a href="/desk">Desk</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
