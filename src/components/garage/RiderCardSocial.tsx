interface RiderCardSocialProps {
  likes: number;
  liked: boolean;
  canLike: boolean;
  sharing: boolean;
  onLike: () => void;
  onShare: () => void;
}

const RiderCardSocial = ({ likes, liked, canLike, sharing, onLike, onShare }: RiderCardSocialProps) => (
  <div className="rcv7-social" data-rcv7-hide-on-export="true">
    <button
      type="button"
      className={`rcv7-so rcv7-like ${liked ? "rcv7-on" : ""}`}
      disabled={!canLike}
      aria-pressed={liked}
      aria-label={liked ? "Retirer mon like" : "Liker cette carte"}
      onClick={onLike}
    >
      <span className="rcv7-e">{liked ? "❤️" : "🤍"}</span> {likes}
    </button>
    <button
      type="button"
      className="rcv7-so rcv7-share"
      disabled={sharing}
      onClick={onShare}
      aria-label="Partager ma carte"
    >
      <span className="rcv7-e">⚡</span> {sharing ? "…" : "Partager"}
    </button>
  </div>
);

export default RiderCardSocial;
