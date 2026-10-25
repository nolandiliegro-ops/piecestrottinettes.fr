/** Fil de commentaires de la carte Rider Story (25/10/2026). Riders connectés, 280 caractères, 10 par jour. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAddCardComment, useCardComments, useDeleteCardComment } from "@/hooks/useRiderCardComments";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const ch = (c: number) => `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;

const RiderCardComments = ({ ownerId, ownerName, id }: { ownerId: string; ownerName: string; id?: string }) => {
  const { user } = useAuthContext();
  const { data: comments = [], isLoading } = useCardComments(ownerId);
  const add = useAddCardComment();
  const del = useDeleteCardComment();
  const [text, setText] = useState("");

  return (
    <section id={id} className="w-full p-4 bg-white" style={{ clipPath: ch(14), fontFamily: FONT }} aria-label="Commentaires">
      <h3 className="text-base uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>
        Commentaires <span className="text-sm not-italic font-bold" style={{ fontFamily: FONT, color: "#6B7280" }}>{comments.length}</span>
      </h3>

      {user ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            add.mutate({ ownerId, body: text }, { onSuccess: () => setText("") });
          }}
        >
          <label htmlFor="story-comment" className="sr-only">Écrire un commentaire</label>
          <input
            id="story-comment"
            value={text}
            maxLength={280}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Un mot pour ${ownerName}…`}
            className="flex-1 min-w-0 min-h-[44px] px-3 text-[15px] border focus:outline-none focus:ring-2 focus:ring-green-600"
            style={{ borderColor: LINE }}
          />
          <button type="submit" disabled={add.isPending || !text.trim()} className="min-h-[44px] px-4 text-sm font-extrabold text-white disabled:opacity-50" style={{ background: CARBON, clipPath: ch(8) }}>
            Envoyer
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm" style={{ color: "#4B5563" }}>
          <Link to="/login" className="font-bold underline" style={{ color: GREEN }}>Connecte-toi</Link> pour laisser un commentaire.
        </p>
      )}

      <ul className="mt-3 grid gap-2.5">
        {isLoading && <li className="text-sm" style={{ color: "#6B7280" }}>Chargement…</li>}
        {!isLoading && comments.length === 0 && <li className="text-sm" style={{ color: "#6B7280" }}>Pas encore de commentaire. Lance la discussion.</li>}
        {comments.map((c) => {
          const author = c.author?.display_name || "Rider";
          const canDelete = !!user && (user.id === c.author_id || user.id === ownerId);
          return (
            <li key={c.id} className="flex items-start gap-2.5">
              <div className="min-w-0 flex-1 text-[15px] leading-snug" style={{ color: CARBON }}>
                {c.author?.username ? <Link to={`/rider/${c.author.username}`} className="font-extrabold">{author}</Link> : <b className="font-extrabold">{author}</b>}{" "}
                <span className="break-words">{c.body}</span>
                <span className="block text-sm" style={{ color: "#6B7280" }}>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: fr })}</span>
              </div>
              {canDelete && (
                <button type="button" onClick={() => del.mutate({ id: c.id, ownerId })} aria-label="Supprimer ce commentaire" className="w-11 h-11 shrink-0 inline-flex items-center justify-center" style={{ color: "#6B7280" }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default RiderCardComments;
