// Shared decorative blob layer for the whole Home page. In the original
// demo (seam-demo/index_2.html) the 3 .blob elements are position:fixed
// directly on <body>, floating above the entire single-page layout with no
// section boundary to cross — that's *why* the demo never showed a seam.
//
// Splitting Home into two React components (HomeHeroDemo + HowItWorksDemo)
// introduced a boundary the demo never had: each component previously had
// its own local blobs, so the glow was computed/blurred independently per
// container and visibly "cut" where one component's DOM ended and the
// next began. Rendering one shared, page-level blob layer (mounted once in
// app/page.tsx, sibling to both sections) restores the demo's actual
// structure — a single continuous glow layer with nothing to seam.
export function HomeBlobLayer() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--nocturne-bg)" }}
    >
      <div
        className="absolute -left-36 -top-24 h-[480px] w-[480px] rounded-full blur-[90px]"
        style={{ background: "var(--color-home-hero-accent-1)", opacity: "var(--nocturne-blob-opacity)" }}
      />
      <div
        className="absolute -right-32 top-[55vh] h-[420px] w-[420px] rounded-full blur-[90px]"
        style={{ background: "var(--color-home-hero-accent-2)", opacity: "var(--nocturne-blob-opacity)" }}
      />
      <div
        className="absolute -left-44 top-[130vh] h-[500px] w-[500px] rounded-full blur-[90px]"
        style={{ background: "var(--color-home-hero-accent-3)", opacity: "var(--nocturne-blob-opacity)" }}
      />
    </div>
  );
}
