import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

// const SOCIALS = [
//   {
//     label: "Spotify",
//     url: "https://open.spotify.com/artist/3hYg2vNvfFrBMLUlvOtlos?si=nABONu72RxG00iDb3EfCkw",
//     icon: (
//       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
//         <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
//       </svg>
//     ),
//   },
//   {
//     label: "TikTok",
//     url: "https://www.tiktok.com/@1legenddon",
//     icon: (
//       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
//         <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46 6.3 6.3 0 001.86-4.49V8.73a8.19 8.19 0 004.72 1.49V6.77a4.83 4.83 0 01-1-.08z" />
//       </svg>
//     ),
//   },
//   {
//     label: "YouTube",
//     url: "https://www.youtube.com/@1legendmusicz",
//     icon: (
//       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
//         <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
//       </svg>
//     ),
//   },
//   {
//     label: "Instagram",
//     url: "https://www.instagram.com/1legend876",
//     icon: (
//       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
//         <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
//       </svg>
//     ),
//   },
// ];

export default function Footer() {
  return (
    <footer className="bg-jamaica-black text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img
                src={logo}
                alt="Party Spot JA"
                className="w-10 h-10 rounded-lg"
              />
              <div className="flex items-center gap-1">
                <span className="text-jamaica-gold font-extrabold text-lg">
                  PARTYSPOT
                </span>
                <span className="text-jamaica-green font-bold text-lg">JA</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Jamaica's premier event platform. Create, discover, and experience
              unforgettable moments.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
              Quick Links
            </h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link
                to="/"
                className="hover:text-jamaica-gold transition-colors w-fit"
              >
                Home
              </Link>
              <Link
                to="/login"
                className="hover:text-jamaica-gold transition-colors w-fit"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="hover:text-jamaica-gold transition-colors w-fit"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">
              Follow 1Legend
            </h4>
            <div className="flex items-start gap-4">
              <a
                href="https://open.spotify.com/artist/3hYg2vNvfFrBMLUlvOtlos?si=nABONu72RxG00iDb3EfCkw"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 group"
              >
                <img
                  src="/legend.jpeg"
                  alt="1Legend"
                  className="w-20 h-20 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-jamaica-gold/40 transition-all duration-300"
                />
              </a>
              <div>
                <p className="text-sm text-gray-300 font-semibold mb-0.5">
                  1Legend
                </p>
                <p className="text-xs text-gray-500 mb-3">Dancehall Artist</p>
                <div className="flex gap-2">
                  {SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-white/5 hover:bg-jamaica-gold/20 rounded-lg flex items-center justify-center text-gray-400 hover:text-jamaica-gold transition-all"
                      title={s.label}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div> */}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Party Spot JA. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
