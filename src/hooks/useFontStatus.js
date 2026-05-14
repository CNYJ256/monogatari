import { useEffect } from 'react';
import { loadAllFonts, checkFontReady } from '../engine/assetsManager.js';
import { useFrameStore } from '../state/frameStore.js';

export default function useFontStatus() {
  const fontsLoaded = useFrameStore((s) => s.config.assets.fontsLoaded);

  const segmenterAvailable =
    typeof Intl !== 'undefined' && typeof Intl.Segmenter !== 'undefined';

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL;

    // Fonts may already be cached from a previous visit
    if (checkFontReady('"MS PMincho"')) {
      useFrameStore.getState().setConfig('assets.fontsLoaded', true);
      return;
    }

    loadAllFonts(baseUrl).then(({ success }) => {
      if (!success) return;

      document.fonts.ready.then(() => {
        if (checkFontReady('"MS PMincho"')) {
          useFrameStore.getState().setConfig('assets.fontsLoaded', true);
        }
      });
    });
  }, []);

  return { fontsLoaded, segmenterAvailable };
}
