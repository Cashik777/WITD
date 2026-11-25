import type { Locale } from './locale'

// Fit, materials and care instructions come straight from admin-managed
// product data, but in practice the whole 34-product catalog only uses a
// handful of distinct values (5 fits, 9 materials, 2 care strings) — small
// enough to translate as a fixed lookup rather than per-product DB fields,
// same reasoning as colorLabels.ts. Falls back to the English original for
// any value not in the dictionary (a new one added later in the admin).
const FIT_LABELS: Record<'fr' | 'de' | 'es', Record<string, string>> = {
  fr: {
    'Unisex, true to size': 'Unisexe, taille normale',
    'Relaxed, elastic waistband with drawcord': 'Coupe ample, ceinture élastique à cordon',
    'Adjustable strap, one size': 'Sangle ajustable, taille unique',
    'Adjustable snapback, one size': 'Snapback ajustable, taille unique',
    'One size, cuffed': 'Taille unique, à revers',
  },
  de: {
    'Unisex, true to size': 'Unisex, entspricht der Größentabelle',
    'Relaxed, elastic waistband with drawcord': 'Entspannte Passform, elastischer Bund mit Kordelzug',
    'Adjustable strap, one size': 'Verstellbarer Riemen, eine Größe',
    'Adjustable snapback, one size': 'Verstellbarer Snapback, eine Größe',
    'One size, cuffed': 'Eine Größe, mit Umschlag',
  },
  es: {
    'Unisex, true to size': 'Unisex, talla real',
    'Relaxed, elastic waistband with drawcord': 'Corte relajado, cintura elástica con cordón',
    'Adjustable strap, one size': 'Correa ajustable, talla única',
    'Adjustable snapback, one size': 'Snapback ajustable, talla única',
    'One size, cuffed': 'Talla única, con vuelta',
  },
}

const MATERIALS_LABELS: Record<'fr' | 'de' | 'es', Record<string, string>> = {
  fr: {
    '100% combed ring-spun cotton (heather colors may contain polyester)':
      '100% coton peigné filé à l’anneau (les coloris chinés peuvent contenir du polyester)',
    'Cotton/poly fleece blend': 'Molleton mélangé coton/polyester',
    '100% cotton, garment-dyed': '100% coton, teint à la pièce',
    '100% cotton twill': '100% coton sergé',
    'Cotton twill front, mesh back': 'Devant en sergé de coton, dos en mesh',
    'Acrylic knit': 'Tricot acrylique',
    '100% cotton, pigment-dyed': '100% coton, teinté par pigmentation',
    '100% cotton, 10oz fleece': '100% coton, molleton 10oz',
    '100% combed ring-spun cotton': '100% coton peigné filé à l’anneau',
  },
  de: {
    '100% combed ring-spun cotton (heather colors may contain polyester)':
      '100% gekämmte, ringgesponnene Baumwolle (melierte Farben können Polyester enthalten)',
    'Cotton/poly fleece blend': 'Baumwoll-/Polyester-Fleece-Mix',
    '100% cotton, garment-dyed': '100% Baumwolle, garment-dyed',
    '100% cotton twill': '100% Baumwoll-Twill',
    'Cotton twill front, mesh back': 'Vorderseite aus Baumwoll-Twill, Rücken aus Mesh',
    'Acrylic knit': 'Acryl-Strick',
    '100% cotton, pigment-dyed': '100% Baumwolle, pigmentgefärbt',
    '100% cotton, 10oz fleece': '100% Baumwolle, 10oz Fleece',
    '100% combed ring-spun cotton': '100% gekämmte, ringgesponnene Baumwolle',
  },
  es: {
    '100% combed ring-spun cotton (heather colors may contain polyester)':
      '100% algodón peinado de hilado de anillo (los colores jaspeados pueden contener poliéster)',
    'Cotton/poly fleece blend': 'Mezcla de felpa de algodón/poliéster',
    '100% cotton, garment-dyed': '100% algodón, teñido en prenda',
    '100% cotton twill': '100% sarga de algodón',
    'Cotton twill front, mesh back': 'Frente de sarga de algodón, espalda de malla',
    'Acrylic knit': 'Tejido acrílico',
    '100% cotton, pigment-dyed': '100% algodón, teñido por pigmento',
    '100% cotton, 10oz fleece': '100% algodón, felpa de 10oz',
    '100% combed ring-spun cotton': '100% algodón peinado de hilado de anillo',
  },
}

const CARE_LABELS: Record<'fr' | 'de' | 'es', Record<string, string>> = {
  fr: {
    'Machine wash cold, inside out. Tumble dry low. Do not iron directly on print.':
      'Lavage en machine à froid, à l’envers. Séchage en tambour à basse température. Ne pas repasser directement sur l’impression.',
    'Machine wash cold, inside out. Do not iron on print/embroidery.':
      'Lavage en machine à froid, à l’envers. Ne pas repasser sur l’impression/la broderie.',
  },
  de: {
    'Machine wash cold, inside out. Tumble dry low. Do not iron directly on print.':
      'Maschinenwäsche kalt, auf links gedreht. Niedrig im Trockner trocknen. Nicht direkt auf den Druck bügeln.',
    'Machine wash cold, inside out. Do not iron on print/embroidery.':
      'Maschinenwäsche kalt, auf links gedreht. Nicht auf Druck/Stickerei bügeln.',
  },
  es: {
    'Machine wash cold, inside out. Tumble dry low. Do not iron directly on print.':
      'Lavar a máquina en frío, al revés. Secar a baja temperatura. No planchar directamente sobre el estampado.',
    'Machine wash cold, inside out. Do not iron on print/embroidery.':
      'Lavar a máquina en frío, al revés. No planchar sobre el estampado/bordado.',
  },
}

function lookup(dict: Record<'fr' | 'de' | 'es', Record<string, string>>, value: string, locale: Locale): string {
  if (locale === 'en') return value
  return dict[locale][value] ?? value
}

export const translateFit = (value: string, locale: Locale) => lookup(FIT_LABELS, value, locale)
export const translateMaterials = (value: string, locale: Locale) => lookup(MATERIALS_LABELS, value, locale)
export const translateCare = (value: string, locale: Locale) => lookup(CARE_LABELS, value, locale)
