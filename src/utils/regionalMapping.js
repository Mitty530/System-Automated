// Regional mapping system for ADFD withdrawal requests
// Maps countries to their respective regional operations teams

export const REGIONS = {
  AFRICA: 'africa',
  ASIA: 'asia',
  EUROPE_LATIN_AMERICA: 'europe_latin_america'
};

export const REGIONAL_TEAMS = {
  [REGIONS.AFRICA]: {
    name: 'Africa Operations',
    code: 'AFR',
    description: 'Handles requests from African countries'
  },
  [REGIONS.ASIA]: {
    name: 'Asia Operations', 
    code: 'ASA',
    description: 'Handles requests from Asian countries'
  },
  [REGIONS.EUROPE_LATIN_AMERICA]: {
    name: 'Europe/Latin America Operations',
    code: 'ELA',
    description: 'Handles requests from European and Latin American countries'
  }
};

// Comprehensive country to region mapping based on geographical regions
export const COUNTRY_REGION_MAPPING = {
  // Africa
  'algeria': REGIONS.AFRICA,
  'angola': REGIONS.AFRICA,
  'benin': REGIONS.AFRICA,
  'botswana': REGIONS.AFRICA,
  'burkina-faso': REGIONS.AFRICA,
  'burundi': REGIONS.AFRICA,
  'cabo-verde': REGIONS.AFRICA,
  'cameroon': REGIONS.AFRICA,
  'central-african-republic': REGIONS.AFRICA,
  'chad': REGIONS.AFRICA,
  'comoros': REGIONS.AFRICA,
  'congo': REGIONS.AFRICA,
  'democratic-republic-of-congo': REGIONS.AFRICA,
  'djibouti': REGIONS.AFRICA,
  'egypt': REGIONS.AFRICA,
  'equatorial-guinea': REGIONS.AFRICA,
  'eritrea': REGIONS.AFRICA,
  'eswatini': REGIONS.AFRICA,
  'ethiopia': REGIONS.AFRICA,
  'gabon': REGIONS.AFRICA,
  'gambia': REGIONS.AFRICA,
  'ghana': REGIONS.AFRICA,
  'guinea': REGIONS.AFRICA,
  'guinea-bissau': REGIONS.AFRICA,
  'ivory-coast': REGIONS.AFRICA,
  'kenya': REGIONS.AFRICA,
  'lesotho': REGIONS.AFRICA,
  'liberia': REGIONS.AFRICA,
  'libya': REGIONS.AFRICA,
  'madagascar': REGIONS.AFRICA,
  'malawi': REGIONS.AFRICA,
  'mali': REGIONS.AFRICA,
  'mauritania': REGIONS.AFRICA,
  'mauritius': REGIONS.AFRICA,
  'morocco': REGIONS.AFRICA,
  'mozambique': REGIONS.AFRICA,
  'namibia': REGIONS.AFRICA,
  'niger': REGIONS.AFRICA,
  'nigeria': REGIONS.AFRICA,
  'rwanda': REGIONS.AFRICA,
  'sao-tome-and-principe': REGIONS.AFRICA,
  'senegal': REGIONS.AFRICA,
  'seychelles': REGIONS.AFRICA,
  'sierra-leone': REGIONS.AFRICA,
  'somalia': REGIONS.AFRICA,
  'south-africa': REGIONS.AFRICA,
  'south-sudan': REGIONS.AFRICA,
  'sudan': REGIONS.AFRICA,
  'tanzania': REGIONS.AFRICA,
  'togo': REGIONS.AFRICA,
  'tunisia': REGIONS.AFRICA,
  'uganda': REGIONS.AFRICA,
  'zambia': REGIONS.AFRICA,
  'zimbabwe': REGIONS.AFRICA,

  // Asia
  'afghanistan': REGIONS.ASIA,
  'armenia': REGIONS.ASIA,
  'azerbaijan': REGIONS.ASIA,
  'bahrain': REGIONS.ASIA,
  'bangladesh': REGIONS.ASIA,
  'bhutan': REGIONS.ASIA,
  'brunei': REGIONS.ASIA,
  'cambodia': REGIONS.ASIA,
  'china': REGIONS.ASIA,
  'cyprus': REGIONS.ASIA,
  'georgia': REGIONS.ASIA,
  'india': REGIONS.ASIA,
  'indonesia': REGIONS.ASIA,
  'iran': REGIONS.ASIA,
  'iraq': REGIONS.ASIA,
  'israel': REGIONS.ASIA,
  'japan': REGIONS.ASIA,
  'jordan': REGIONS.ASIA,
  'kazakhstan': REGIONS.ASIA,
  'kuwait': REGIONS.ASIA,
  'kyrgyzstan': REGIONS.ASIA,
  'laos': REGIONS.ASIA,
  'lebanon': REGIONS.ASIA,
  'malaysia': REGIONS.ASIA,
  'maldives': REGIONS.ASIA,
  'mongolia': REGIONS.ASIA,
  'myanmar': REGIONS.ASIA,
  'nepal': REGIONS.ASIA,
  'north-korea': REGIONS.ASIA,
  'oman': REGIONS.ASIA,
  'pakistan': REGIONS.ASIA,
  'palestine': REGIONS.ASIA,
  'philippines': REGIONS.ASIA,
  'qatar': REGIONS.ASIA,
  'saudi-arabia': REGIONS.ASIA,
  'singapore': REGIONS.ASIA,
  'south-korea': REGIONS.ASIA,
  'sri-lanka': REGIONS.ASIA,
  'syria': REGIONS.ASIA,
  'tajikistan': REGIONS.ASIA,
  'thailand': REGIONS.ASIA,
  'timor-leste': REGIONS.ASIA,
  'turkey': REGIONS.ASIA,
  'turkmenistan': REGIONS.ASIA,
  'united-arab-emirates': REGIONS.ASIA,
  'uzbekistan': REGIONS.ASIA,
  'vietnam': REGIONS.ASIA,
  'yemen': REGIONS.ASIA,

  // Europe & Latin America
  'albania': REGIONS.EUROPE_LATIN_AMERICA,
  'andorra': REGIONS.EUROPE_LATIN_AMERICA,
  'argentina': REGIONS.EUROPE_LATIN_AMERICA,
  'austria': REGIONS.EUROPE_LATIN_AMERICA,
  'belarus': REGIONS.EUROPE_LATIN_AMERICA,
  'belgium': REGIONS.EUROPE_LATIN_AMERICA,
  'bolivia': REGIONS.EUROPE_LATIN_AMERICA,
  'bosnia-and-herzegovina': REGIONS.EUROPE_LATIN_AMERICA,
  'brazil': REGIONS.EUROPE_LATIN_AMERICA,
  'bulgaria': REGIONS.EUROPE_LATIN_AMERICA,
  'chile': REGIONS.EUROPE_LATIN_AMERICA,
  'colombia': REGIONS.EUROPE_LATIN_AMERICA,
  'costa-rica': REGIONS.EUROPE_LATIN_AMERICA,
  'croatia': REGIONS.EUROPE_LATIN_AMERICA,
  'czech-republic': REGIONS.EUROPE_LATIN_AMERICA,
  'denmark': REGIONS.EUROPE_LATIN_AMERICA,
  'dominican-republic': REGIONS.EUROPE_LATIN_AMERICA,
  'ecuador': REGIONS.EUROPE_LATIN_AMERICA,
  'el-salvador': REGIONS.EUROPE_LATIN_AMERICA,
  'estonia': REGIONS.EUROPE_LATIN_AMERICA,
  'finland': REGIONS.EUROPE_LATIN_AMERICA,
  'france': REGIONS.EUROPE_LATIN_AMERICA,
  'germany': REGIONS.EUROPE_LATIN_AMERICA,
  'greece': REGIONS.EUROPE_LATIN_AMERICA,
  'guatemala': REGIONS.EUROPE_LATIN_AMERICA,
  'honduras': REGIONS.EUROPE_LATIN_AMERICA,
  'hungary': REGIONS.EUROPE_LATIN_AMERICA,
  'iceland': REGIONS.EUROPE_LATIN_AMERICA,
  'ireland': REGIONS.EUROPE_LATIN_AMERICA,
  'italy': REGIONS.EUROPE_LATIN_AMERICA,
  'latvia': REGIONS.EUROPE_LATIN_AMERICA,
  'liechtenstein': REGIONS.EUROPE_LATIN_AMERICA,
  'lithuania': REGIONS.EUROPE_LATIN_AMERICA,
  'luxembourg': REGIONS.EUROPE_LATIN_AMERICA,
  'malta': REGIONS.EUROPE_LATIN_AMERICA,
  'mexico': REGIONS.EUROPE_LATIN_AMERICA,
  'moldova': REGIONS.EUROPE_LATIN_AMERICA,
  'monaco': REGIONS.EUROPE_LATIN_AMERICA,
  'montenegro': REGIONS.EUROPE_LATIN_AMERICA,
  'netherlands': REGIONS.EUROPE_LATIN_AMERICA,
  'nicaragua': REGIONS.EUROPE_LATIN_AMERICA,
  'north-macedonia': REGIONS.EUROPE_LATIN_AMERICA,
  'norway': REGIONS.EUROPE_LATIN_AMERICA,
  'panama': REGIONS.EUROPE_LATIN_AMERICA,
  'paraguay': REGIONS.EUROPE_LATIN_AMERICA,
  'peru': REGIONS.EUROPE_LATIN_AMERICA,
  'poland': REGIONS.EUROPE_LATIN_AMERICA,
  'portugal': REGIONS.EUROPE_LATIN_AMERICA,
  'romania': REGIONS.EUROPE_LATIN_AMERICA,
  'russia': REGIONS.EUROPE_LATIN_AMERICA,
  'san-marino': REGIONS.EUROPE_LATIN_AMERICA,
  'serbia': REGIONS.EUROPE_LATIN_AMERICA,
  'slovakia': REGIONS.EUROPE_LATIN_AMERICA,
  'slovenia': REGIONS.EUROPE_LATIN_AMERICA,
  'spain': REGIONS.EUROPE_LATIN_AMERICA,
  'sweden': REGIONS.EUROPE_LATIN_AMERICA,
  'switzerland': REGIONS.EUROPE_LATIN_AMERICA,
  'ukraine': REGIONS.EUROPE_LATIN_AMERICA,
  'united-kingdom': REGIONS.EUROPE_LATIN_AMERICA,
  'uruguay': REGIONS.EUROPE_LATIN_AMERICA,
  'vatican-city': REGIONS.EUROPE_LATIN_AMERICA,
  'venezuela': REGIONS.EUROPE_LATIN_AMERICA
};

/**
 * Get the region for a given country
 * @param {string} country - Country value (e.g., 'seychelles', 'malaysia', 'italy')
 * @returns {string} - Region code (africa, asia, europe_latin_america)
 */
export const getRegionForCountry = (country) => {
  if (!country) return null;
  
  const normalizedCountry = country.toLowerCase().trim();
  return COUNTRY_REGION_MAPPING[normalizedCountry] || null;
};

/**
 * Get regional team information for a country
 * @param {string} country - Country value
 * @returns {object} - Regional team information
 */
export const getRegionalTeamForCountry = (country) => {
  const region = getRegionForCountry(country);
  if (!region) return null;
  
  return REGIONAL_TEAMS[region];
};

/**
 * Get all countries for a specific region
 * @param {string} region - Region code
 * @returns {array} - Array of country codes for the region
 */
export const getCountriesForRegion = (region) => {
  return Object.keys(COUNTRY_REGION_MAPPING).filter(
    country => COUNTRY_REGION_MAPPING[country] === region
  );
};

/**
 * Validate if a country is supported
 * @param {string} country - Country value
 * @returns {boolean} - True if country is supported
 */
export const isCountrySupported = (country) => {
  return getRegionForCountry(country) !== null;
};
