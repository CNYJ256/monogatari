const SAFE_PATH_RE = /^(?!.*\.\.)\/?[\w\-./]+\.(ttf|otf|woff2)$/;

export async function loadFont(fontPath) {
  if (!SAFE_PATH_RE.test(fontPath)) {
    console.warn('loadFont: unsafe font path rejected');
    return false;
  }
  try {
    const font = new FontFace('MS PMincho', `url(${fontPath})`);
    const loaded = await font.load();
    document.fonts.add(loaded);
    return true;
  } catch {
    return false;
  }
}

export async function loadAllFonts(fontUrl = '/fonts/MS-PMincho-2.ttf') {
  const ok = await loadFont(fontUrl);
  return {
    success: ok,
    loadedFonts: ok ? ['MS PMincho'] : [],
  };
}

export function checkFontReady(fontFamily = '"MS PMincho"') {
  return document.fonts.check(`16px ${fontFamily}`);
}
