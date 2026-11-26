import { DEFAULT_FLAGSHIP_PRODUCT_IDS, ProductItem } from '../data/products';

export function resolveFlagshipDeals(params: {
  allProducts: ProductItem[];
  configuredIds?: string[];
  hiddenProductIds?: string[];
  includeHidden?: boolean;
}): ProductItem[] {
  const { allProducts, configuredIds, hiddenProductIds = [], includeHidden = false } = params;
  const visiblePool = allProducts.filter(
    (p) => includeHidden || !hiddenProductIds.includes(p.id)
  );

  if (Array.isArray(configuredIds) && configuredIds.length > 0) {
    const pickedFromConfig: ProductItem[] = [];
    for (const id of configuredIds) {
      const match = visiblePool.find((p) => p.id === id);
      if (match && !pickedFromConfig.some((x) => x.id === match.id)) {
        pickedFromConfig.push(match);
      }
    }
    if (pickedFromConfig.length > 0) {
      return pickedFromConfig;
    }
  }

  const picks: ProductItem[] = [];
  const pickFirst = (predicate: (p: ProductItem) => boolean) => {
    const found = visiblePool.find((p) => !picks.some((x) => x.id === p.id) && predicate(p));
    if (found) picks.push(found);
  };

  for (const defId of DEFAULT_FLAGSHIP_PRODUCT_IDS.slice(0, 3)) {
    pickFirst((p) => p.id === defId);
  }
  while (picks.length < 3) {
    const before = picks.length;
    pickFirst(
      (p) => p.category === 'rice_cooker_appliances' && p.name.toLowerCase().includes('cuckoo')
    );
    if (picks.length === before) break;
  }

  pickFirst((p) => p.id === 'prod-ferroli-ic4200bn');
  if (picks.filter((p) => p.category === 'kitchen_stoves').length === 0) {
    pickFirst((p) => p.category === 'kitchen_stoves');
  }

  pickFirst((p) => p.id === 'prod-atlantic-lona-lite-4000');
  if (picks.filter((p) => p.category === 'water_heaters').length === 0) {
    pickFirst((p) => p.category === 'water_heaters');
  }

  pickFirst((p) => p.id === 'prod-tivi-casper-43fga610');
  if (picks.filter((p) => p.category === 'televisions').length === 0) {
    pickFirst((p) => p.category === 'televisions');
  }

  for (const p of visiblePool) {
    if (picks.length >= 6) break;
    if (!picks.some((x) => x.id === p.id)) picks.push(p);
  }

  return picks;
}
