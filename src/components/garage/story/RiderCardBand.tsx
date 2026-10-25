/**
 * Garage (25/10/2026, retour Nolan : « la carte doit être plus visible ») : la carte Story en grand, comme sur
 * l'accueil — le texte à gauche, la carte à droite —, ses commentaires, et le choix des 5 + 5 juste à côté.
 */
import RiderCardStory from "./RiderCardStory";
import RiderCardComments from "./RiderCardComments";
import RiderCardPicker from "./RiderCardPicker";
import { useRiderCardData } from "@/hooks/useRiderCardData";
import { useCardComments } from "@/hooks/useRiderCardComments";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const SOFT = "#8FBF9C";

const RiderCardBand = () => {
  const { data } = useRiderCardData();
  const { data: comments = [] } = useCardComments(data?.profile.id);
  if (!data) return null;
  const name = data.profile.display_name || "Rider";
  const scrollToComments = () => document.getElementById("ma-carte-commentaires")?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <section id="ma-carte" aria-labelledby="ma-carte-titre" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 items-start">
      <div className="grid gap-5 min-w-0">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: SOFT }}>Ta carte Rider</p>
          <h2 id="ma-carte-titre" className="mt-1 text-[30px] lg:text-5xl uppercase leading-[0.95] text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", textShadow: "0 2px 18px rgba(0,0,0,0.45)" }}>
            Ton garage<br />en une carte.
          </h2>
          <p className="mt-3 max-w-xl text-base text-white/90" style={{ fontFamily: FONT, textShadow: "0 1px 10px rgba(0,0,0,0.5)" }}>
            Tes trotts, tes coups de cœur, ton décor. Partage-la en story, les riders la commentent.
          </p>
        </div>
        <div className="hidden lg:block"><RiderCardPicker machines={data.machines} /></div>
      </div>
      <div className="grid gap-4 justify-items-center lg:justify-items-stretch min-w-0">
        <RiderCardStory data={data} commentCount={comments.length} onOpenComments={scrollToComments} />
        <div className="w-full max-w-[360px]"><RiderCardComments id="ma-carte-commentaires" ownerId={data.profile.id} ownerName={name} /></div>
      </div>
      <div className="lg:hidden"><RiderCardPicker machines={data.machines} /></div>
    </section>
  );
};

export default RiderCardBand;
