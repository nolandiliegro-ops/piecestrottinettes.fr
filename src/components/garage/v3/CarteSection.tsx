/**
 * Garage v3 — écran « Ma carte », version épurée (25/10/2026, retour Nolan : « un peu chargé… j'aimais bien qu'on voie
 * bien le wallpaper, que ce soit fluide »). La carte seule sur le wallpaper, trois boutons dessous ; les commentaires et
 * le choix des 5 + 5 s'ouvrent dans un volet, à la demande.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal, MessageSquare, ExternalLink, Wallpaper, UserPen } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import RiderCardStory, { cardRows } from "../story/RiderCardStory";
import StandTrott from "./StandTrott";
import RiderCardComments from "../story/RiderCardComments";
import RiderCardPicker from "../story/RiderCardPicker";
import { useRiderCardData } from "@/hooks/useRiderCardData";
import { useCardComments } from "@/hooks/useRiderCardComments";
import { FONT, UNB, CARBON, GREEN, LINE, SOFT, cut } from "./ui";

type Panel = null | "modifier" | "commentaires";

const CarteSection = ({ onTheme, onEditProfile }: { onTheme: () => void; onEditProfile: () => void }) => {
  const { data, isLoading } = useRiderCardData();
  const { data: comments = [] } = useCardComments(data?.profile.id);
  const [panel, setPanel] = useState<Panel>(null);
  // Ordinateur : la trott choisie sur la carte est posée sur l'estrade du wallpaper, et la carte ne répète pas le wallpaper.
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const [selId, setSelId] = useState<string | null>(null);
  const stand = useMemo(() => {
    if (!data) return null;
    const { mine, liked } = cardRows(data.machines);
    const all = [...mine, ...liked];
    return all.find((m) => m.id === selId) ?? mine.find((m) => m.is_featured) ?? mine[0] ?? liked[0] ?? null;
  }, [data, selId]);

  const btn = "flex-1 min-w-0 flex items-center justify-center gap-2 min-h-[48px] px-3 text-[15px] font-extrabold whitespace-nowrap";

  // Ordinateur : l'écran garde la hauteur de la fenêtre, sinon le pied de page remonte sur l'estrade (carte compacte).
  return (
    <div className="flex flex-col items-center lg:items-end lg:min-h-[calc(100vh-150px)]">
      {desktop && <StandTrott src={stand?.model?.image_url ?? stand?.custom_photo_url} alt={stand?.model?.name ?? ""} />}
      <p className="mb-3 w-full max-w-[360px] text-sm font-bold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: SOFT, textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>Ma carte Rider</p>

      {isLoading || !data ? (
        <div className="w-full max-w-[360px] h-[640px] animate-pulse" style={{ background: "rgba(26,26,26,0.35)", clipPath: cut(22) }} />
      ) : (
        <>
          <RiderCardStory data={data} commentCount={comments.length} onOpenComments={() => setPanel("commentaires")} selectedId={stand?.id ?? null} onSelect={(m) => setSelId(m.id)} bare={desktop} />
          <div className="mt-3 w-full max-w-[360px] flex gap-2">
            <button type="button" onClick={() => setPanel("modifier")} className={btn} style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(10), fontFamily: FONT }}>
              <SlidersHorizontal className="w-[18px] h-[18px]" style={{ color: GREEN }} /> Modifier
            </button>
            <button type="button" onClick={() => setPanel("commentaires")} className={btn} style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(10), fontFamily: FONT }}>
              <MessageSquare className="w-[18px] h-[18px]" style={{ color: GREEN }} /> {comments.length}
            </button>
            {data.profile.username && (
              <Link to={`/rider/${data.profile.username}`} aria-label="Voir mon garage public" className={btn} style={{ background: CARBON, color: "#FFFFFF", clipPath: cut(10), fontFamily: FONT }}>
                <ExternalLink className="w-[18px] h-[18px]" /> Public
              </Link>
            )}
          </div>
          {!data.profile.is_public && (
            <Link to="/garage/reglages" className="mt-2 w-full max-w-[360px] px-3 py-2 text-sm font-semibold" style={{ background: "#FFF7ED", color: "#9A3412", clipPath: cut(8) }}>
              Ton garage est privé : personne d'autre ne voit ta carte. L'activer →
            </Link>
          )}

          <Sheet open={panel !== null} onOpenChange={(o) => !o && setPanel(null)}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-[#FAFAF8] p-4" style={{ fontFamily: FONT }}>
              <SheetHeader>
                <SheetTitle className="text-left uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>
                  {panel === "commentaires" ? "Commentaires" : "Modifier ma carte"}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid gap-4">
                {panel === "commentaires" ? (
                  <RiderCardComments ownerId={data.profile.id} ownerName={data.profile.display_name || "Rider"} />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => { setPanel(null); onTheme(); }} className="flex items-center gap-2 min-h-[48px] px-3 text-sm font-extrabold bg-white" style={{ clipPath: cut(8), boxShadow: `inset 0 0 0 1px ${LINE}`, color: CARBON }}>
                        <Wallpaper className="w-5 h-5" style={{ color: GREEN }} /> Wallpaper
                      </button>
                      <button type="button" onClick={() => { setPanel(null); onEditProfile(); }} className="flex items-center gap-2 min-h-[48px] px-3 text-sm font-extrabold bg-white" style={{ clipPath: cut(8), boxShadow: `inset 0 0 0 1px ${LINE}`, color: CARBON }}>
                        <UserPen className="w-5 h-5" style={{ color: GREEN }} /> Mon profil
                      </button>
                    </div>
                    {data.machines.length > 0 ? (
                      <RiderCardPicker machines={data.machines} />
                    ) : (
                      <p className="text-[15px]" style={{ color: "#374151" }}>
                        Ajoute d'abord tes trotts : <Link to="/trottinettes" className="font-bold underline" style={{ color: GREEN }}>choisir ma trottinette</Link>.
                      </p>
                    )}
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
};

export default CarteSection;
