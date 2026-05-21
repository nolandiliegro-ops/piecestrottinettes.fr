import { Helmet } from "react-helmet-async";
import { useBrandAsset } from "@/hooks/useBrandAssets";

/**
 * Injects brand-driven head tags (favicon, apple-touch-icon, og:image,
 * twitter:image) using the current values from the brand_assets table.
 *
 * Mounted once at the root so every route benefits.
 * Falls back automatically to static defaults via useBrandAsset.
 */
const BrandHelmet = () => {
  const favicon = useBrandAsset("favicon");
  const appleTouch = useBrandAsset("apple_touch_icon");
  const ogImage = useBrandAsset("og_image");

  return (
    <Helmet>
      <link rel="icon" type="image/png" href={favicon.url} />
      <link rel="apple-touch-icon" sizes="180x180" href={appleTouch.url} />
      <meta property="og:image" content={ogImage.url} />
      <meta name="twitter:image" content={ogImage.url} />
    </Helmet>
  );
};

export default BrandHelmet;
