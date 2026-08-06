import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useRiderCardData } from "@/hooks/useRiderCardData";
import RiderCard from "@/components/garage/RiderCard";
import Header from "@/components/Header";

/** Route publique /rider/:username — carte partageable. */
const RiderPublicCard = () => {
  const { username } = useParams<{ username: string }>();
  const { data, isLoading } = useRiderCardData({ username });

  const name = data?.profile.display_name ?? username ?? "Rider";

  return (
    <div className="min-h-screen bg-[#12151A]">
      <Helmet>
        <title>{`Carte rider de ${name} | Pièces Trottinettes`}</title>
        <meta
          name="description"
          content={`Découvre le garage et les pièces montées par ${name} sur sa carte rider.`}
        />
        <meta property="og:title" content={`Carte rider de ${name}`} />
        <meta property="og:description" content={`Le garage de ${name} en une carte.`} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Header />

      <main className="flex flex-col items-center gap-8 px-4 py-12">
        <h1 className="text-center font-black uppercase tracking-tight text-white text-2xl">
          Carte rider de {name}
        </h1>

        {isLoading ? (
          <div className="h-[520px] w-[320px] animate-pulse rounded-2xl bg-white/5" />
        ) : data ? (
          <RiderCard mode="public" data={data} />
        ) : (
          <p className="text-center text-sm text-white/60">
            Cette carte rider n'existe pas ou n'est pas publique.
          </p>
        )}

        <Link
          to="/catalogue"
          className="rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
        >
          Construire mon garage
        </Link>
      </main>
    </div>
  );
};

export default RiderPublicCard;
