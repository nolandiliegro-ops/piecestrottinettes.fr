import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  canonical?: string;
}

const SEO = ({ title, description, image, noindex = false, canonical }: SEOProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {image && <meta property="og:image" content={image} />}
    {noindex && <meta name="robots" content="noindex, nofollow" />}
    {canonical && <link rel="canonical" href={canonical} />}
  </Helmet>
);

export default SEO;
