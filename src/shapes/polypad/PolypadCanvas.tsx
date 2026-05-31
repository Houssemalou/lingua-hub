import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Polypad: any;
    __polypadLoaded: boolean;
  }
}

let scriptLoadAttempted = false;

interface PolypadProps {
  hidden?: boolean;
  /** Called with a function that returns a Promise<string> (SVG data URI) */
  onExportReady?: (exportFn: () => Promise<string>) => void;
}

const brandStyleId = "polypad-brand-override";

function injectBrandOverride() {
  if (document.getElementById(brandStyleId)) return;
  const s = document.createElement("style");
  s.id = brandStyleId;
  s.textContent = `
    x-polypad-sidebar .credit,
    x-polypad-sidebar [class*="credit"],
    x-polypad .credit,
    [class*="powered"],
    a[href*="polypad"],
    a[href*="mathigon"],
    a[href*="amplify"] { display: none !important; }
  `;
  document.head.appendChild(s);
}

export const PolypadCanvas: React.FC<PolypadProps> = ({
  hidden,
  onExportReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const polypadRef = useRef<any>(null);
  const createdRef = useRef(false);
  const [error, setError] = useState("");

  // Load Polypad script once
  useEffect(() => {
    if (window.Polypad) { window.__polypadLoaded = true; return; }
    if (scriptLoadAttempted) {
      const poll = setInterval(() => {
        if (window.Polypad) {
          window.__polypadLoaded = true;
          clearInterval(poll);
        }
      }, 300);
      return () => clearInterval(poll);
    }
    scriptLoadAttempted = true;
    const s = document.createElement("script");
    s.src = "https://static.mathigon.org/api/polypad-en-v5.0.5.js";
    s.async = true;
    s.onload = () => { window.__polypadLoaded = true; };
    s.onerror = () => setError("Impossible de charger Polypad");
    document.body.appendChild(s);
  }, []);

  // Create Polypad instance — retries until script is ready
  useEffect(() => {
    if (!window.Polypad || !containerRef.current || createdRef.current) return;
    createdRef.current = true;
    let cancelled = false;

    injectBrandOverride();

    (async () => {
      try {
        const instance = await window.Polypad.create(containerRef.current, {
          apiKey: "test",
        });
        if (cancelled) { try { instance.destroy(); } catch {} return; }
        polypadRef.current = instance;

        instance.setTool("move");

        if (onExportReady) {
          onExportReady(() => instance.image(1920, 1080, "svg"));
        }

        // Force resize after creation to ensure layout
        setTimeout(() => {
          if (polypadRef.current) try { polypadRef.current.resize?.(); } catch {}
        }, 100);
      } catch (e: any) {
        if (!cancelled) setError("Erreur: " + (e?.message ?? ""));
      }
    })();

    const resize = () => { if (polypadRef.current) try { polypadRef.current.resize?.(); } catch {} };
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    if (containerRef.current.parentElement) ro.observe(containerRef.current.parentElement);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", resize);
      ro.disconnect();
      document.getElementById(brandStyleId)?.remove();
      if (polypadRef.current) {
        try { polypadRef.current.destroy(); } catch {}
        polypadRef.current = null;
      }
      createdRef.current = false;
    };
  }, []);

  // Resize instance when becoming visible
  useEffect(() => {
    if (hidden) return;
    const t = setTimeout(() => {
      if (polypadRef.current) try { polypadRef.current.resize?.(); } catch {}
    }, 80);
    return () => clearTimeout(t);
  }, [hidden]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {error && (
        <div style={{ padding: 16, color: "#c00", fontSize: 14 }}>{error}</div>
      )}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 0,
          overflow: "hidden",
          background: "#fff",
        }}
      />
    </div>
  );
};
