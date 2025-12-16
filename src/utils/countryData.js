import { getCountries, getCountryCallingCode } from 'libphonenumber-js';

/**
 * Get all countries with calling codes
 * Returns array sorted by country name for better UX
 * Format: { code: '+1', label: '+1 (US/CA)', countryCode: 'US' }
 */
let countriesCache = null;

export const getCountryOptions = () => {
  // Use cache to avoid re-computing on every render
  if (countriesCache) return countriesCache;

  try {
    const countries = getCountries();
    
    const options = countries
      .map((country) => {
        try {
          const callingCode = getCountryCallingCode(country);
          // Get country name (using intl API for localization)
          const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
          const countryName = regionNames.of(country) || country;
          
          return {
            code: `+${callingCode}`,
            label: `+${callingCode} (${country})`,
            countryCode: country,
            countryName: countryName,
            callingCode: callingCode,
          };
        } catch (err) {
          return null;
        }
      })
      .filter(Boolean)
      // Remove duplicates (some countries share calling codes)
      .reduce((acc, curr) => {
        const exists = acc.find((item) => item.code === curr.code);
        if (!exists) {
          acc.push(curr);
        }
        return acc;
      }, [])
      // Sort by calling code then by country name for consistency
      .sort((a, b) => {
        const codeA = parseInt(a.callingCode, 10);
        const codeB = parseInt(b.callingCode, 10);
        if (codeA !== codeB) return codeA - codeB;
        return a.countryName.localeCompare(b.countryName);
      });

    countriesCache = options;
    return options;
  } catch (err) {
    console.error('Error loading country options:', err);
    // Fallback to a basic list if library fails
    return getFallbackCountryOptions();
  }
};

/**
 * Fallback country list if libphonenumber-js fails
 * Includes most common countries
 */
const getFallbackCountryOptions = () => [
  { code: '+1', label: '+1 (US/CA)', countryCode: 'US' },
  { code: '+44', label: '+44 (UK)', countryCode: 'GB' },
  { code: '+61', label: '+61 (AU)', countryCode: 'AU' },
  { code: '+65', label: '+65 (SG)', countryCode: 'SG' },
  { code: '+91', label: '+91 (IN)', countryCode: 'IN' },
  { code: '+81', label: '+81 (JP)', countryCode: 'JP' },
  { code: '+82', label: '+82 (KR)', countryCode: 'KR' },
  { code: '+33', label: '+33 (FR)', countryCode: 'FR' },
  { code: '+49', label: '+49 (DE)', countryCode: 'DE' },
  { code: '+39', label: '+39 (IT)', countryCode: 'IT' },
  { code: '+34', label: '+34 (ES)', countryCode: 'ES' },
  { code: '+31', label: '+31 (NL)', countryCode: 'NL' },
  { code: '+46', label: '+46 (SE)', countryCode: 'SE' },
  { code: '+47', label: '+47 (NO)', countryCode: 'NO' },
  { code: '+41', label: '+41 (CH)', countryCode: 'CH' },
  { code: '+971', label: '+971 (AE)', countryCode: 'AE' },
  { code: '+974', label: '+974 (QA)', countryCode: 'QA' },
  { code: '+966', label: '+966 (SA)', countryCode: 'SA' },
  { code: '+92', label: '+92 (PK)', countryCode: 'PK' },
  { code: '+880', label: '+880 (BD)', countryCode: 'BD' },
  { code: '+62', label: '+62 (ID)', countryCode: 'ID' },
  { code: '+63', label: '+63 (PH)', countryCode: 'PH' },
  { code: '+64', label: '+64 (NZ)', countryCode: 'NZ' },
  { code: '+86', label: '+86 (CN)', countryCode: 'CN' },
  { code: '+852', label: '+852 (HK)', countryCode: 'HK' },
  { code: '+60', label: '+60 (MY)', countryCode: 'MY' },
  { code: '+20', label: '+20 (EG)', countryCode: 'EG' },
  { code: '+27', label: '+27 (ZA)', countryCode: 'ZA' },
  { code: '+55', label: '+55 (BR)', countryCode: 'BR' },
  { code: '+52', label: '+52 (MX)', countryCode: 'MX' },
  { code: '+54', label: '+54 (AR)', countryCode: 'AR' },
  { code: '+57', label: '+57 (CO)', countryCode: 'CO' },
];

/**
 * Search/filter country options
 */
export const searchCountries = (query, options = getCountryOptions()) => {
  if (!query) return options;
  
  const searchTerm = query.toLowerCase().trim();
  return options.filter(
    (opt) =>
      opt.code.includes(searchTerm) ||
      opt.label.toLowerCase().includes(searchTerm) ||
      opt.countryCode.toLowerCase().includes(searchTerm) ||
      (opt.countryName && opt.countryName.toLowerCase().includes(searchTerm))
  );
};

/**
 * Get a specific country by calling code
 */
export const getCountryByCode = (code, options = getCountryOptions()) => {
  return options.find((opt) => opt.code === code);
};
