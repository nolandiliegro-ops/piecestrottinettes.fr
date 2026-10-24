import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, Search } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAtelierVideos, type AtelierVideo } from "@/lib/atelier";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SITE = "https://piecestrottinettes.fr";
const PAGE = 24;

/* 24/10/2026 — « L'Atelier » / Vidéos : les tests vidéo déjà vérifiés des fiches « Tout savoir »,
   rangés par marque. Vignette légère, lecteur youtube-nocookie seulement au clic. */
const VideoCard = ({ v }: { v: AtelierVideo }) => {
  const [play, setPlay] = useState(false);
  return (
    <div className="rounded-2xl bg-white shadow-md overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-[#1A1A1A]">
        {play ? (
          <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1`} title={v.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <button type="button" onClick={() => setPlay(true)} className="absolute inset-0 w-full h-full group" aria-label={`Lire la vidéo : ${v.title}`}>
            <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy" className="w-full h-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Play className="w-6 h-6 ml-0.5" style={{ color: CARBON }} />
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: CARBON }}>{v.title}</p>
        <p className="mt-1 text-sm text-gray-500">{v.channel}</p>
        <Link to={`/scooter/${v.slug}`} className="mt-auto pt-2 min-h-[44px] inline-flex items-center text-sm font-bold" style={{ color: GREEN }}>
          {v.name} : fiche et pièces →
        </Link>
      </div>
    </div>
  );
};

const AtelierVideos = () => {
  const { data, isLoading, error } = useAtelierVideos();
  const [brand, setBrand] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);

  const brands = useMemo(() => {
    const m = new Map<string, number>();
    (data ?? []).forEach((v) => m.set(v.brand, (m.get(v.brand) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [data]);
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const list = (data ?? []).filter((v) => (!brand || v.brand === brand) && (!q || norm(`${v.name} ${v.title} ${v.channel}`).includes(norm(q))));

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8", fontFamily: FONT }}>
      <SEO
        title="Vidéos de trottinettes électriques : tests par modèle"
        description="Les tests vidéo des trottinettes électriques, rangés par marque et par modèle, avec la fiche technique et les pièces compatibles de chaque trottinette."
        canonical={`${SITE}/atelier/videos`}
      />
      <Header />
      <main className="flex-1 px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link to="/atelier" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-bold" style={{ color: GREEN }}>
            <ArrowLeft className="w-4 h-4" /> L'Atelier
          </Link>
          <h1 className="mt-2 text-3xl lg:text-5xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>
            Les vidéos
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[#374151]">Les tests qu'on a vérifiés, trottinette par trottinette. Chaque vidéo mène à la fiche et aux pièces compatibles.</p>

          <label className="relative block mt-6 max-w-md">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder="Cherche ta trottinette"
              aria-label="Chercher une trottinette"
              className="w-full min-h-[44px] pl-9 pr-3 rounded-lg border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-green-600" />
          </label>
          <div className="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:mx-0 md:px-0">
            {[[null, data?.length ?? 0] as [string | null, number], ...brands].map(([b, n]) => {
              const on = brand === b;
              return (
                <button key={b ?? "toutes"} type="button" onClick={() => { setBrand(b); setShown(PAGE); }} aria-pressed={on}
                  className={`shrink-0 min-h-[44px] px-4 rounded-full border text-sm font-semibold whitespace-nowrap ${on ? "bg-green-700 border-green-700 text-white" : "bg-white border-gray-300 text-[#1A1A1A]"}`}>
                  {b ?? "Toutes"} <span className={on ? "text-white/80" : "text-gray-500"}>{n}</span>
                </button>
              );
            })}
          </div>

          {isLoading && <p className="mt-8 text-base text-gray-500">Chargement des vidéos…</p>}
          {error && <p className="mt-8 text-base text-[#DC2626]">Les vidéos n'ont pas pu être chargées.</p>}
          {!isLoading && !error && list.length === 0 && <p className="mt-8 text-base text-gray-600">Aucune vidéo pour cette recherche.</p>}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.slice(0, shown).map((v) => <VideoCard key={`${v.slug}-${v.id}`} v={v} />)}
          </div>
          {list.length > shown && (
            <div className="mt-6 text-center">
              <button type="button" onClick={() => setShown((s) => s + PAGE)} className="min-h-[48px] px-6 rounded-lg font-semibold border border-gray-300 bg-white" style={{ color: CARBON }}>
                Afficher plus ({list.length - shown} restantes)
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AtelierVideos;
