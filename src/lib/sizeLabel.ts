// Every size value is a universal, language-independent abbreviation (XS,
// S, M, L, 2XL...) except this one literal English phrase used for
// single-size accessories (caps, beanies).
export function sizeLabel(size: string, t: (key: string) => string): string {
  return size === 'One size' ? t('product.sizeOneSize') : size
}
