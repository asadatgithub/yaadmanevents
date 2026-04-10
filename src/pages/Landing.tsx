import { useEffect, useState } from "react";

import EventCard from "../components/EventCard";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  address_1: string | null;
  address_2: string | null;
  parish: string | null;
  organizer_name: string | null;
  banner_url: string | null;
}

export default function Landing() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("events")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true });
    setEvents(data || []);
    setLoading(false);
  };

  const filtered = events.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      (e.parish || "").toLowerCase().includes(q) ||
      (e.organizer_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative overflow-hidden min-h-[90vh] flex items-center hero-gradient">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="hero-grid" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32 w-full">
          <div className="text-center max-w-3xl mx-auto">
            <div className="animate-fade-up">
              <div className="relative inline-block mb-8">
                <img
                  src={logo}
                  alt="Party Spot JA"
                  className="w-28 h-28 md:w-36 md:h-36 mx-auto animate-float drop-shadow-[0_20px_50px_rgba(254,209,0,0.2)]"
                />
                <div className="absolute inset-0 rounded-full bg-jamaica-gold/10 blur-2xl scale-150 animate-pulse" />
              </div>
            </div>

            <div className="animate-fade-up delay-100">
              <div className="inline-flex items-center gap-2.5 bg-white/[0.04] backdrop-blur-sm px-5 py-2 rounded-full text-sm text-jamaica-gold font-medium mb-8 border border-jamaica-gold/15 shadow-[0_0_20px_rgba(254,209,0,0.05)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jamaica-gold opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-jamaica-gold" />
                </span>
                Jamaica's #1 Event Platform
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 leading-[1.05] tracking-tight animate-fade-up delay-200">
              Discover
              <br />
              <span className="text-shimmer">PartySpot</span> JA
            </h1>

            <p className="text-base md:text-lg text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed animate-fade-up delay-300">
              Your gateway to the best events across Jamaica.
              <br className="hidden sm:block" />
              Find, create, and experience unforgettable moments.
            </p>

            <div className="max-w-xl mx-auto animate-fade-up delay-400">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-jamaica-green/20 via-jamaica-gold/10 to-jamaica-green/20 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-500" />
                <div className="relative flex items-center bg-white/[0.06] backdrop-blur-md rounded-xl border border-white/10 focus-within:border-jamaica-green/40 transition-colors">
                  <svg
                    className="ml-4 w-5 h-5 text-gray-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search events, venues, organizers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-4 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm md:text-base"
                  />
                </div>
              </div>
            </div>

            {!user && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-500">
                <Link
                  to="/signup"
                  className="relative group bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,155,58,0.3)] hover:-translate-y-0.5"
                >
                  <span className="relative z-10">Get Started Free</span>
                </Link>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white font-medium transition-all duration-300 border border-white/10 hover:border-white/25 px-7 py-3.5 rounded-xl hover:bg-white/[0.03]"
                >
                  Sign In
                </Link>
              </div>
            )}

            <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto animate-fade-up delay-600">
              <div className="stat-glow text-center bg-white/[0.03] backdrop-blur-sm rounded-xl py-4 px-3 border border-white/[0.06] transition-all duration-300 hover:border-white/10">
                <p className="text-2xl md:text-3xl font-extrabold text-white">
                  {events.length}+
                </p>
                <p className="text-[11px] text-gray-500 mt-1.5 uppercase tracking-widest font-medium">
                  Events
                </p>
              </div>
              <div className="stat-glow text-center bg-white/[0.03] backdrop-blur-sm rounded-xl py-4 px-3 border border-white/[0.06] transition-all duration-300 hover:border-white/10">
                <p className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-jamaica-green to-jamaica-gold">
                  JA
                </p>
                <p className="text-[11px] text-gray-500 mt-1.5 uppercase tracking-widest font-medium">
                  Island Wide
                </p>
              </div>
              <div className="stat-glow text-center bg-white/[0.03] backdrop-blur-sm rounded-xl py-4 px-3 border border-white/[0.06] transition-all duration-300 hover:border-white/10">
                <p className="text-2xl md:text-3xl font-extrabold text-white">
                  24/7
                </p>
                <p className="text-[11px] text-gray-500 mt-1.5 uppercase tracking-widest font-medium">
                  Access
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {search ? "Search Results" : "Upcoming Events"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-sm text-jamaica-green hover:text-jamaica-green-dark font-medium transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-jamaica-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 animate-scale-in">
            <div className="text-5xl mb-4">🎶</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No events found
            </h3>
            <p className="text-gray-500">
              Check back soon for upcoming events!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event, i) => (
              <div
                key={event.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 100, 600)}ms` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
