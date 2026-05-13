import { useEffect } from 'react';
import { loadFont, checkFontReady } from '../engine/assetsManager.js';
import { useFrameStore } from '../state/frameStore.js';

export default function useFontStatus() {
  // Derive fontsLoaded from the store (single source of truth)
  const fontsLoaded = useFrameStore((s) => s.config.assets.fontsLoaded);

  // Segmenter availability never changes at runtime — compute once
  const segmenterAvailable =
    typeof Intl !== 'undefined' && typeof Intl.Segmenter !== 'undefined';

  useEffect(() => {
    const fontFamily = '"MS PMincho"';

    // Font may already be cached from a previous visit
    if (checkFontReady(fontFamily)) {
      useFrameStore.getState().setConfig('assets.fontsLoaded', true);
      return;
    }

    // Initiate font loading — fire-and-forget, no cleanup needed
    loadFont(`${import.meta.env.BASE_URL}fonts/MS-PMincho-2.ttf`).then((ok) => {
      if (!ok) return;

      document.fonts.ready.then(() => {
        if (checkFontReady(fontFamily)) {
          useFrameStore.getState().setConfig('assets.fontsLoaded', true);
        }
      });
    });
  }, []);

  return { fontsLoaded, segmenterAvailable };
}
