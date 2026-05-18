
type NormalizeFeaturesOptions = {
  emptyAsUndefined?: boolean;
};

export function normalizeFeaturesValue(
  rawFeatures: unknown,
  options: NormalizeFeaturesOptions = {}
): string[] | undefined {
  if (rawFeatures === undefined || rawFeatures === null) return undefined;

  if (typeof rawFeatures === 'string') {
    const trimmedInput = rawFeatures.trim();
    if (!trimmedInput.length) return options.emptyAsUndefined ? undefined : [];

    try {
      const parsedValue = JSON.parse(trimmedInput);
      if (Array.isArray(parsedValue)) {
        const parsedFeatures = parsedValue.map((item) => String(item).trim()).filter(Boolean);
        return parsedFeatures.length ? parsedFeatures : (options.emptyAsUndefined ? undefined : []);
      }
    } catch {
      // fall back to comma-separated parsing
    }

    const commaSeparatedFeatures = trimmedInput.split(',').map((item) => item.trim()).filter(Boolean);
    return commaSeparatedFeatures.length ? commaSeparatedFeatures : (options.emptyAsUndefined ? undefined : []);
  }

  if (Array.isArray(rawFeatures)) {
    const arrayFeatures = rawFeatures.map((item) => String(item).trim()).filter(Boolean);
    return arrayFeatures.length ? arrayFeatures : (options.emptyAsUndefined ? undefined : []);
  }

  return undefined;
}

export function normalizeFeatures(targetObject: any): void {
  if (targetObject?.features === undefined) return;

  const normalizedFeatures = normalizeFeaturesValue(targetObject.features);
  if (normalizedFeatures === undefined) {
    delete targetObject.features;
    return;
  }
  targetObject.features = normalizedFeatures;
}
