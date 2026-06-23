import { useParams, Navigate } from "react-router-dom";

// La fiche showroom a fusionné avec la fiche /scooter/:slug (page unique).
// On redirige définitivement pour consolider le SEO (canonical /scooter).
const Showroom = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/scooter/${slug}` : "/trottinettes"} replace />;
};

export default Showroom;
