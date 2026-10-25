/** Garage v3 — écran « Ma carte » : la carte Story en grand, ses commentaires, et tout ce qui la modifie. */
import { Link } from "react-router-dom";
import { ArrowRight, Wallpaper, UserPen, ExternalLink } from "lucide-react";
import RiderCardStory from "../story/RiderCardStory";
import RiderCardComments from "../story/RiderCardComments";
import RiderCardPicker from "../story/RiderCardPicker";
import { useRiderCardData } from "@/hooks/useRiderCardData";
import { useCardComments } from "@/hooks/useRiderCardComments";
import { SHOP_OPEN_PUBLIC } from "@/config/launch";
import { ScreenTitle, Box, BoxTitle, FONT, CARBON, GREEN, LINE, cut } from "./ui";

const CarteSection = ({ onTheme, onEditProfile }: { onTheme: () => void; onEditProfile: () => void }) => {
  const { data, isLoading } = useRiderCardData();
  const { data: comments = [] } = useCardComments(data?.profile.id);

  if (isLoading || !data) return <div className="h-[640px] max-w-[360px] animate-pulse" style={{ background: "rgba(250,250,248,0.2)", clipPath: cut(22) }} />;

  const name = data.profile.display_name || "Rider";
  const btn = "flex items-center gap-2.5 min-h-[48px] px-4 text-[15px] font-extrabold";
  const toComments = () => document.getElementById("v3-commentaires")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div>
      <ScreenTitle kicker="Ma carte Rider" title={<>Ton garage<br className="sm:hidden" /> en une carte.</>}>
        Partage-la en story : les riders la voient, te donnent du respect et la commentent.
      </ScreenTitle>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)] xl:gap-8 items-start">
        <div className="grid gap-4 justify-items-center xl:justify-items-stretch">
          <RiderCardStory data={data} commentCount={comments.length} onOpenComments={toComments} />
          <div className="w-full max-w-[360px] grid gap-2">
            <button type="button" onClick={onTheme} className={btn} style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(10), fontFamily: FONT }}>
              <Wallpaper className="w-5 h-5" style={{ color: GREEN }} /> Changer mon wallpaper
            </button>
            <button type="button" onClick={onEditProfile} className={btn} style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(10), fontFamily: FONT }}>
              <UserPen className="w-5 h-5" style={{ color: GREEN }} /> Pseudo, photo, ville, bio
            </button>
            {data.profile.username && (
              <Link to={`/rider/${data.profile.username}`} className={btn} style={{ background: CARBON, color: "#FFFFFF", clipPath: cut(10), fontFamily: FONT }}>
                <ExternalLink className="w-5 h-5" /> Voir mon garage public <ArrowRight className="w-5 h-5 ml-auto" />
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-5 min-w-0">
          {!SHOP_OPEN_PUBLIC && (
            <Link to="/garage/reglages" className="flex items-center gap-3 min-h-[56px] px-4 text-[15px] font-bold" style={{ background: "#FFFFFF", clipPath: cut(10), color: CARBON, fontFamily: FONT, boxShadow: `inset 4px 0 0 ${GREEN}` }}>
              <span className="min-w-0 flex-1">Ton code RIDER : <b>-20 % sur ta 1re commande</b> à l'ouverture du shop.</span>
              <ArrowRight className="w-5 h-5 shrink-0" />
            </Link>
          )}
          <RiderCardComments id="v3-commentaires" ownerId={data.profile.id} ownerName={name} />
          <div>
            <RiderCardPicker machines={data.machines} />
          </div>
          <Box>
            <BoxTitle>Comment ça marche</BoxTitle>
            <ul className="mt-2 grid gap-1.5 text-[15px]" style={{ color: "#374151" }}>
              <li>« À moi » : les trotts que tu as. « Je kiffe » : celles que tu aimes. 5 de chaque sur la carte.</li>
              <li>Ajoute une vraie photo de ta trott dans <Link to="/garage/trotts" className="font-bold underline" style={{ color: GREEN }}>Mes trotts</Link> : elle s'affiche quand on touche la carte.</li>
              <li>Ton garage public doit être activé dans <Link to="/garage/reglages" className="font-bold underline" style={{ color: GREEN }}>Réglages</Link> pour que les autres riders voient ta carte.</li>
            </ul>
          </Box>
          {!data.profile.is_public && (
            <p className="text-sm font-semibold px-3 py-2" style={{ background: "#FFF7ED", color: "#9A3412", border: `1px solid ${LINE}` }}>
              Ton garage est privé : personne d'autre ne voit ta carte. Active-le dans Réglages.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarteSection;
