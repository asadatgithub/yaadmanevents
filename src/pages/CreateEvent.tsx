import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const PROMO_LINKS = [
  {
    label: "Spotify",
    url: "https://open.spotify.com/artist/3hYg2vNvfFrBMLUlvOtlos?si=nABONu72RxG00iDb3EfCkw",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
    color: "bg-[#1DB954]",
  },
  {
    label: "New Music",
    url: "https://distrokid.com/hyperfollow/1legend2/system-radio-edit",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    ),
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
  },
  {
    label: "TikTok",
    url: "https://www.tiktok.com/@1legenddon",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46 6.3 6.3 0 001.86-4.49V8.73a8.19 8.19 0 004.72 1.49V6.77a4.83 4.83 0 01-1-.08z" />
      </svg>
    ),
    color: "bg-black",
  },
  {
    label: "YouTube",
    url: "https://www.youtube.com/@1legendmusicz",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    color: "bg-red-600",
  },
  {
    label: "Instagram",
    url: "https://www.instagram.com/1legend876",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    color: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400",
  },
];

export default function CreateEvent() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [parish, setParish] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setLoading(true);

    let bannerUrl = "";

    if (bannerFile) {
      const ext = bannerFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("event-banners")
        .upload(filePath, bannerFile);
      if (uploadError) {
        setError("Failed to upload banner image");
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("event-banners")
        .getPublicUrl(filePath);
      bannerUrl = urlData.publicUrl;
    }

    const { error: insertError } = await supabase.from("events").insert({
      name,
      date,
      venue,
      address_1: address1 || null,
      address_2: address2 || null,
      parish: parish || null,
      organizer_name: organizerName || null,
      banner_url: bannerUrl || null,
      user_id: user.id,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setCreated(true);
    setLoading(false);
  };

  if (created) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10">
            <div className="w-16 h-16 bg-jamaica-green/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-jamaica-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              Event Created!
            </h2>
            <p className="text-gray-500 mb-8">
              Your event has been created successfully. Contact the admin via
              WhatsApp to get your QR code.
            </p>
            <Link
              to="/dashboard"
              className="inline-block bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Go to Dashboard
            </Link>

            <div className="mt-10 pt-8 border-t border-gray-100">
              <div className="flex flex-col items-center gap-4 mb-5">
                <a
                  href="https://open.spotify.com/artist/3hYg2vNvfFrBMLUlvOtlos?si=nABONu72RxG00iDb3EfCkw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <img
                    src="/legend.jpeg"
                    alt="1Legend"
                    className="w-24 h-24 rounded-2xl object-cover ring-2 ring-gray-100 group-hover:ring-jamaica-gold/50 transition-all duration-300 shadow-sm"
                  />
                </a>
                <div className="text-center">
                  <p className="font-bold text-gray-900">1Legend</p>
                  <p className="text-xs text-gray-400">Dancehall Artist</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5">
                {PROMO_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${link.color} text-white px-4 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity`}
                  >
                    {link.icon}
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="text-sm text-jamaica-green hover:text-jamaica-green-dark font-medium inline-flex items-center gap-1 mb-4"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Create Event
          </h1>
          <p className="text-gray-500 mt-1">
            Fill in the details for your new event
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5"
        >
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Event Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20 transition-all"
              placeholder="e.g. Summer Vibes Concert"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Venue
            </label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20 transition-all"
              placeholder="e.g. Kingston Waterfront"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address 1 <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20 transition-all"
                placeholder="e.g. 12 Ocean Boulevard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address 2 <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20 transition-all"
                placeholder="e.g. Suite 4"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Parish <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={parish}
              onChange={(e) => setParish(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20 transition-all"
              placeholder="e.g. Kingston"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Organizer Name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-jamaica-green focus:ring-2 focus:ring-jamaica-green/20 transition-all"
              placeholder="e.g. Island Productions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Banner Image
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-jamaica-green/50 transition-colors">
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBannerFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                  >
                    x
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block py-4">
                  <svg
                    className="w-10 h-10 text-gray-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">
                    Click to upload banner image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG, WEBP up to 5MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-jamaica-green hover:bg-jamaica-green-dark text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Creating Event..." : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  );
}
