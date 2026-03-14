import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogType?: string;
    ogImage?: string;
    canonicalPath?: string;
}

/**
 * Reusable SEO component for managing page metadata
 */
export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    ogType = 'website',
    ogImage,
    canonicalPath,
}) => {
    const siteTitle = 'Frota2026';
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const defaultDescription = 'Frota2026: Sistema SaaS completo para gestão de frotas, controle de combustível, manutenção e telemetria.';
    const metaDescription = description || defaultDescription;
    const url = window.location.origin + (canonicalPath || window.location.pathname);

    return (
        <Helmet>
            {/* Standard metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:title" content={ogTitle || fullTitle} />
            <meta property="og:description" content={ogDescription || metaDescription} />
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={url} />
            {ogImage && <meta property="og:image" content={ogImage} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={ogTitle || fullTitle} />
            <meta name="twitter:description" content={ogDescription || metaDescription} />
            {ogImage && <meta name="twitter:image" content={ogImage} />}

            {/* v1.2.0 - SEO Enhancement Integrated */}
        </Helmet>
    );
};
