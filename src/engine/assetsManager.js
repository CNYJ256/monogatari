const SAFE_PATH_RE = /^(?!.*\.\.)\/?[\w\-./]+\.(ttf|otf|woff2|ttc)$/;

const FONT_REGISTRY = [
  { path: '/fonts/MS-PMincho-2.ttf', family: 'MS PMincho' },
  { path: '/fonts/DFSso3_0.ttc', family: 'DFS Song' },
  { path: '/fonts/HGPMINCB.TTF', family: 'HG Mincho B' },
];

export async function loadFont(fontPath, fontFamily) {
  if (!SAFE_PATH_RE.test(fontPath)) {
    console.warn('loadFont: unsafe font path rejected');
    return false;
  }
  try {
    const font = new FontFace(fontFamily, `url(${fontPath})`);
    const loaded = await font.load();
    document.fonts.add(loaded);
    return true;
  } catch {
    return false;
  }
}

export async function loadAllFonts(baseUrl = '') {
  const results = await Promise.all(
    FONT_REGISTRY.map(({ path, family }) =>
      loadFont(`${baseUrl}${path}`, family).then((ok) => (ok ? family : null)),
    ),
  );
  const loadedFonts = results.filter(Boolean);
  return { success: loadedFonts.length > 0, loadedFonts };
}

export function checkFontReady(fontFamily = '"MS PMincho"') {
  return document.fonts.check(`16px ${fontFamily}`);
}

export function getFontFamilies() {
  return FONT_REGISTRY.map((f) => f.family);
}
