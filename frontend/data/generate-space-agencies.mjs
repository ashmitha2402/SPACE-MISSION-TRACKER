import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {Record<string, Partial<Agency>>} */
const enrichments = {
  nasa: {
    founded: "1958",
    website: "https://www.nasa.gov",
    organizationType: "Official space agency",
    description:
      "NASA leads U.S. civil space exploration, aeronautics research, and Earth science through robotic and human spaceflight programmes.",
    responsibilities: ["Human spaceflight", "Planetary science", "Earth observation", "Aeronautics research"],
    majorMissions: ["Apollo", "Artemis", "James Webb Space Telescope", "Mars rovers"]
  },
  isro: {
    fullName: "Indian Space Research Organisation",
    latitude: 13.0352,
    longitude: 77.5665,
    founded: "1969",
    website: "https://www.isro.gov.in",
    organizationType: "Official space agency",
    description:
      "ISRO develops launch vehicles, satellites, and planetary missions for India, including lunar and interplanetary exploration.",
    responsibilities: ["Launch services", "Satellite programmes", "Planetary exploration"],
    majorMissions: ["Chandrayaan", "Mangalyaan", "Gaganyaan", "PSLV / GSLV"]
  },
  cnsa: { founded: "1993", website: "http://www.cnsa.gov.cn", organizationType: "Official space agency", description: "CNSA coordinates China's civil space programmes, including crewed spaceflight, lunar exploration, and BeiDou navigation.", majorMissions: ["Tiangong", "Chang'e", "Tianwen", "BeiDou"] },
  jaxa: { founded: "2003", website: "https://global.jaxa.jp", organizationType: "Official space agency", description: "JAXA conducts space science, Earth observation, exploration, and ISS partnership missions for Japan.", majorMissions: ["Hayabusa", "SLIM", "HTV", "H-IIA / H3"] },
  esa: { founded: "1975", website: "https://www.esa.int", organizationType: "Regional organization", description: "ESA is Europe's intergovernmental space agency, developing launchers, science missions, Earth observation, and navigation systems.", majorMissions: ["Ariane", "Copernicus", "Galileo", "Rosetta"] },
  roscosmos: { founded: "1992", website: "https://www.roscosmos.ru", organizationType: "Official space agency", description: "Roscosmos manages Russia's space programme, including crewed flights, launch services, and scientific spacecraft.", majorMissions: ["Soyuz", "Progress", "GLONASS", "Luna programme"] },
  csa: { founded: "1989", website: "https://www.asc-csa.gc.ca", organizationType: "Official space agency", description: "The Canadian Space Agency supports robotics, Earth observation, and human spaceflight contributions such as Canadarm.", majorMissions: ["Canadarm3", "RADARSAT", "Artemis Gateway robotics"] },
  cnes: { founded: "1961", website: "https://cnes.fr", organizationType: "Official space agency", description: "CNES is France's space agency, active in launch systems, Earth observation, exploration, and science.", majorMissions: ["Ariane", "Spot", "CFOSAT"] },
  dlr: { founded: "1969", website: "https://www.dlr.de", organizationType: "Research organization", description: "DLR is Germany's aerospace research centre, covering space systems, robotics, and aeronautics.", majorMissions: ["TerraSAR-X", "Eu:CROPIS", "Mars Express collaboration"] },
  uksa: { founded: "2010", website: "https://www.gov.uk/government/organisations/uk-space-agency", organizationType: "Official space agency", description: "The UK Space Agency funds civil space programmes, commercial growth, and ESA partnership activities.", majorMissions: ["Skynet", "OneWeb support", "Artemis participation"] },
  kasa: { founded: "2024", website: "https://www.kasa.go.kr", organizationType: "Official space agency", description: "KASA is South Korea's aerospace administration, overseeing satellites, launch, and space industry policy.", majorMissions: ["Nuri (KSLV-II)", "Danuri", "KOMPSAT"] },
  uaesa: { founded: "2014", website: "https://www.space.gov.ae", organizationType: "Official space agency", description: "The UAE Space Agency leads national space policy, Mars missions, and commercial space development.", majorMissions: ["Hope (Emirates Mars Mission)", "MBRSC programmes"] },
  sansa: { founded: "2010", website: "https://www.sansa.org.za", organizationType: "Official space agency", description: "SANSA provides space operations, Earth observation, and space science services for South Africa.", majorMissions: ["SANSA Space Operations", "Earth observation data services"] },
  "asa-au": { founded: "2018", website: "https://www.space.gov.au", organizationType: "Official space agency", description: "The Australian Space Agency coordinates national space policy, industry growth, and international partnerships.", majorMissions: ["Artemis Accords", "National space industry roadmap"] },
  afsa: { founded: "2023", website: "https://africanspaceagency.org", organizationType: "Regional organization", description: "The African Space Agency coordinates continental space policy and programmes under the African Union.", majorMissions: ["AU space policy implementation", "Regional satellite cooperation"] },
  philsa: { founded: "2019", website: "https://philsa.gov.ph", organizationType: "Official space agency", description: "PhilSA leads the Philippines' national space programme and satellite applications.", majorMissions: ["Diwata", "MULA", "STAMINA4Space collaboration"] }
};

/**
 * @typedef Agency
 * @property {string} id
 * @property {string} name
 * @property {string} fullName
 * @property {string} organizationType
 * @property {string} country
 * @property {string} flag
 * @property {string} region
 * @property {string} headquarters
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} [founded]
 * @property {string} description
 * @property {string[]} [responsibilities]
 * @property {string[]} [majorMissions]
 * @property {string} [website]
 */

/** @type {Omit<Agency, "description" | "organizationType"> & { abbreviation?: string }}[] */
const base = [
  { id: "nasa", name: "NASA", fullName: "National Aeronautics and Space Administration", country: "United States", flag: "🇺🇸", region: "Americas", latitude: 38.8829, longitude: -77.0152, headquarters: "Washington, D.C., United States" },
  { id: "csa", name: "CSA", fullName: "Canadian Space Agency", country: "Canada", flag: "🇨🇦", region: "Americas", latitude: 45.512, longitude: -73.415, headquarters: "Longueuil, Quebec, Canada" },
  { id: "aem", name: "AEM", fullName: "Agencia Espacial Mexicana", country: "Mexico", flag: "🇲🇽", region: "Americas", latitude: 19.4326, longitude: -99.1332, headquarters: "Mexico City, Mexico" },
  { id: "aeb", name: "AEB", fullName: "Brazilian Space Agency", country: "Brazil", flag: "🇧🇷", region: "Americas", latitude: -15.7801, longitude: -47.9292, headquarters: "Brasília, Brazil" },
  { id: "conae", name: "CONAE", fullName: "Comisión Nacional de Actividades Espaciales", country: "Argentina", flag: "🇦🇷", region: "Americas", latitude: -31.4201, longitude: -64.1888, headquarters: "Córdoba, Argentina" },
  { id: "ache", name: "AChE", fullName: "Agencia Chilena del Espacio", country: "Chile", flag: "🇨🇱", region: "Americas", latitude: -33.4489, longitude: -70.6693, headquarters: "Santiago, Chile" },
  { id: "conida", name: "CONIDA", fullName: "Comisión Nacional de Investigación y Desarrollo Aeroespacial", country: "Peru", flag: "🇵🇪", region: "Americas", latitude: -12.0464, longitude: -77.0428, headquarters: "Lima, Peru" },
  { id: "colombia-space", name: "Colombian Space Commission", fullName: "Comisión Colombiana del Espacio", country: "Colombia", flag: "🇨🇴", region: "Americas", latitude: 4.711, longitude: -74.0721, headquarters: "Bogotá, Colombia" },
  { id: "abae", name: "ABAE", fullName: "Agencia Bolivariana para Actividades Espaciales", country: "Venezuela", flag: "🇻🇪", region: "Americas", latitude: 10.4806, longitude: -66.9036, headquarters: "Caracas, Venezuela" },
  { id: "bolivia-space", name: "Bolivian Space Agency", fullName: "Agencia Boliviana Espacial", country: "Bolivia", flag: "🇧🇴", region: "Americas", latitude: -16.4958, longitude: -68.1462, headquarters: "La Paz, Bolivia" },
  { id: "exa", name: "Ecuadorian Civil Space Agency", fullName: "Agencia Espacial Civil Ecuatoriana (EXA)", country: "Ecuador", flag: "🇪🇨", region: "Americas", latitude: -0.1807, longitude: -78.4678, headquarters: "Quito, Ecuador" },
  { id: "paraguay-space", name: "Paraguayan Space Agency", fullName: "Agencia Espacial del Paraguay", country: "Paraguay", flag: "🇵🇾", region: "Americas", latitude: -25.2637, longitude: -57.5759, headquarters: "Asunción, Paraguay" },
  { id: "uruguay-space", name: "Uruguayan space programme", fullName: "National space programme coordination (Uruguay)", country: "Uruguay", flag: "🇺🇾", region: "Americas", latitude: -34.9011, longitude: -56.1645, headquarters: "Montevideo, Uruguay" },
  { id: "costa-rica-space", name: "Costa Rican space programme", fullName: "National space and aerospace development coordination", country: "Costa Rica", flag: "🇨🇷", region: "Americas", latitude: 9.9281, longitude: -84.0907, headquarters: "San José, Costa Rica" },
  { id: "isro", name: "ISRO", fullName: "Indian Space Research Organisation", country: "India", flag: "🇮🇳", region: "Asia", latitude: 13.0352, longitude: 77.5665, headquarters: "Bengaluru, India" },
  { id: "cnsa", name: "CNSA", fullName: "China National Space Administration", country: "China", flag: "🇨🇳", region: "Asia", latitude: 39.9042, longitude: 116.4074, headquarters: "Beijing, China" },
  { id: "jaxa", name: "JAXA", fullName: "Japan Aerospace Exploration Agency", country: "Japan", flag: "🇯🇵", region: "Asia", latitude: 35.6712, longitude: 139.4137, headquarters: "Chofu, Tokyo, Japan" },
  { id: "kasa", name: "KASA", fullName: "Korea Aerospace Administration", country: "South Korea", flag: "🇰🇷", region: "Asia", latitude: 36.3504, longitude: 127.3845, headquarters: "Daejeon, South Korea" },
  { id: "nata", name: "NATA", fullName: "National Aerospace Technology Administration", country: "North Korea", flag: "🇰🇵", region: "Asia", latitude: 39.0392, longitude: 125.7625, headquarters: "Pyongyang, North Korea" },
  { id: "brin", name: "BRIN", fullName: "National Research and Innovation Agency (Indonesia)", country: "Indonesia", flag: "🇮🇩", region: "Asia", latitude: -6.2088, longitude: 106.8456, headquarters: "Jakarta, Indonesia" },
  { id: "mysa", name: "MYSA", fullName: "Malaysian Space Agency", country: "Malaysia", flag: "🇲🇾", region: "Asia", latitude: 3.139, longitude: 101.6869, headquarters: "Kuala Lumpur, Malaysia" },
  { id: "philsa", name: "PhilSA", fullName: "Philippine Space Agency", country: "Philippines", flag: "🇵🇭", region: "Asia", latitude: 14.676, longitude: 121.0437, headquarters: "Quezon City, Philippines" },
  { id: "gistda", name: "GISTDA", fullName: "Geo-Informatics and Space Technology Development Agency", country: "Thailand", flag: "🇹🇭", region: "Asia", latitude: 13.7563, longitude: 100.5018, headquarters: "Bangkok, Thailand" },
  { id: "vnsc", name: "VNSC", fullName: "Vietnam National Space Center", country: "Vietnam", flag: "🇻🇳", region: "Asia", latitude: 21.0278, longitude: 105.8342, headquarters: "Hanoi, Vietnam" },
  { id: "suparco", name: "SUPARCO", fullName: "Space and Upper Atmosphere Research Commission", country: "Pakistan", flag: "🇵🇰", region: "Asia", latitude: 33.6844, longitude: 73.0479, headquarters: "Islamabad, Pakistan" },
  { id: "sparro", name: "SPARRSO", fullName: "Space Research and Remote Sensing Organization", country: "Bangladesh", flag: "🇧🇩", region: "Asia", latitude: 23.8103, longitude: 90.4125, headquarters: "Dhaka, Bangladesh" },
  { id: "isa-iran", name: "Iranian Space Agency", fullName: "Iranian Space Agency", country: "Iran", flag: "🇮🇷", region: "Asia", latitude: 35.6892, longitude: 51.389, headquarters: "Tehran, Iran" },
  { id: "isa-israel", name: "Israel Space Agency", fullName: "Israel Space Agency", country: "Israel", flag: "🇮🇱", region: "Asia", latitude: 32.0853, longitude: 34.7818, headquarters: "Tel Aviv, Israel" },
  { id: "ssa", name: "Saudi Space Agency", fullName: "Saudi Space Agency", country: "Saudi Arabia", flag: "🇸🇦", region: "Asia", latitude: 24.7136, longitude: 46.6753, headquarters: "Riyadh, Saudi Arabia" },
  { id: "uaesa", name: "UAE Space Agency", fullName: "UAE Space Agency", country: "United Arab Emirates", flag: "🇦🇪", region: "Asia", latitude: 24.4539, longitude: 54.3773, headquarters: "Abu Dhabi, United Arab Emirates" },
  { id: "tua", name: "Turkish Space Agency", fullName: "Turkish Space Agency", country: "Türkiye", flag: "🇹🇷", region: "Asia", latitude: 39.9334, longitude: 32.8597, headquarters: "Ankara, Türkiye" },
  { id: "ostin", name: "OSTIn", fullName: "Office for Space Technology & Industry", country: "Singapore", flag: "🇸🇬", region: "Asia", latitude: 1.3521, longitude: 103.8198, headquarters: "Singapore" },
  { id: "tsa", name: "TSA", fullName: "Taiwan Space Agency", country: "Taiwan", flag: "🇹🇼", region: "Asia", latitude: 25.033, longitude: 121.5654, headquarters: "Taipei, Taiwan" },
  { id: "kazakhstan-space", name: "Kazakhstan national space programme", fullName: "Kazakhstan national space programme (Kazcosmos coordination)", country: "Kazakhstan", flag: "🇰🇿", region: "Asia", latitude: 51.1694, longitude: 71.4491, headquarters: "Astana, Kazakhstan" },
  { id: "azercosmos", name: "Azercosmos", fullName: "Azercosmos Open Joint Stock Company", country: "Azerbaijan", flag: "🇦🇿", region: "Asia", latitude: 40.4093, longitude: 49.8671, headquarters: "Baku, Azerbaijan" },
  { id: "uzbekistan-space", name: "Uzbekistan space programme", fullName: "Uzbekistan Agency for Space Research and Technology", country: "Uzbekistan", flag: "🇺🇿", region: "Asia", latitude: 41.2995, longitude: 69.2401, headquarters: "Tashkent, Uzbekistan" },
  { id: "accimt", name: "ACCIMT", fullName: "Arthur C. Clarke Institute for Modern Technologies", country: "Sri Lanka", flag: "🇱🇰", region: "Asia", latitude: 6.9271, longitude: 79.8612, headquarters: "Colombo, Sri Lanka" },
  { id: "esa", name: "ESA", fullName: "European Space Agency", country: "Europe (multinational)", flag: "🇪🇺", region: "Europe", latitude: 48.8566, longitude: 2.3522, headquarters: "Paris, France" },
  { id: "roscosmos", name: "Roscosmos", fullName: "State Space Corporation Roscosmos", country: "Russia", flag: "🇷🇺", region: "Europe", latitude: 55.7558, longitude: 37.6173, headquarters: "Moscow, Russia" },
  { id: "cnes", name: "CNES", fullName: "Centre National d'Études Spatiales", country: "France", flag: "🇫🇷", region: "Europe", latitude: 43.6047, longitude: 1.4442, headquarters: "Toulouse, France" },
  { id: "dlr", name: "DLR", fullName: "German Aerospace Center", country: "Germany", flag: "🇩🇪", region: "Europe", latitude: 50.7374, longitude: 7.0982, headquarters: "Cologne, Germany" },
  { id: "asi", name: "ASI", fullName: "Italian Space Agency", country: "Italy", flag: "🇮🇹", region: "Europe", latitude: 41.9028, longitude: 12.4964, headquarters: "Rome, Italy" },
  { id: "uksa", name: "UK Space Agency", fullName: "UK Space Agency", country: "United Kingdom", flag: "🇬🇧", region: "Europe", latitude: 51.5072, longitude: -0.1276, headquarters: "London, United Kingdom" },
  { id: "aee", name: "AEE", fullName: "Agencia Estatal de Espacio", country: "Spain", flag: "🇪🇸", region: "Europe", latitude: 40.4168, longitude: -3.7038, headquarters: "Madrid, Spain" },
  { id: "belspo", name: "BELSPO", fullName: "Federal Science Policy Office (Belgium)", country: "Belgium", flag: "🇧🇪", region: "Europe", latitude: 50.8503, longitude: 4.3517, headquarters: "Brussels, Belgium" },
  { id: "nso", name: "NSO", fullName: "Netherlands Space Office", country: "Netherlands", flag: "🇳🇱", region: "Europe", latitude: 52.0705, longitude: 4.3007, headquarters: "The Hague, Netherlands" },
  { id: "snsa-se", name: "SNSA", fullName: "Swedish National Space Agency", country: "Sweden", flag: "🇸🇪", region: "Europe", latitude: 59.3293, longitude: 18.0686, headquarters: "Stockholm, Sweden" },
  { id: "sso", name: "Swiss Space Office", fullName: "Swiss Space Office", country: "Switzerland", flag: "🇨🇭", region: "Europe", latitude: 46.948, longitude: 7.4474, headquarters: "Bern, Switzerland" },
  { id: "asa-at", name: "ASA", fullName: "Austrian Space Agency", country: "Austria", flag: "🇦🇹", region: "Europe", latitude: 48.2082, longitude: 16.3738, headquarters: "Vienna, Austria" },
  { id: "nosa", name: "NOSA", fullName: "Norwegian Space Agency", country: "Norway", flag: "🇳🇴", region: "Europe", latitude: 59.9139, longitude: 10.7522, headquarters: "Oslo, Norway" },
  { id: "dasti", name: "DASTI", fullName: "Danish Agency for Science, Technology and Innovation", country: "Denmark", flag: "🇩🇰", region: "Europe", latitude: 55.6761, longitude: 12.5683, headquarters: "Copenhagen, Denmark" },
  { id: "fsa", name: "Finnish Space Agency", fullName: "Finnish Space Agency (Business Finland)", country: "Finland", flag: "🇫🇮", region: "Europe", latitude: 60.1699, longitude: 24.9384, headquarters: "Helsinki, Finland" },
  { id: "polsa", name: "POLSA", fullName: "Polish Space Agency", country: "Poland", flag: "🇵🇱", region: "Europe", latitude: 52.2297, longitude: 21.0122, headquarters: "Warsaw, Poland" },
  { id: "portugal-space", name: "Portugal Space", fullName: "Portugal Space", country: "Portugal", flag: "🇵🇹", region: "Europe", latitude: 38.7223, longitude: -9.1393, headquarters: "Lisbon, Portugal" },
  { id: "rosa", name: "ROSA", fullName: "Romanian Space Agency", country: "Romania", flag: "🇷🇴", region: "Europe", latitude: 44.4268, longitude: 26.1025, headquarters: "Bucharest, Romania" },
  { id: "ssau", name: "SSAU", fullName: "State Space Agency of Ukraine", country: "Ukraine", flag: "🇺🇦", region: "Europe", latitude: 50.4501, longitude: 30.5234, headquarters: "Kyiv, Ukraine" },
  { id: "cso", name: "CSO", fullName: "Czech Space Office", country: "Czech Republic", flag: "🇨🇿", region: "Europe", latitude: 50.0755, longitude: 14.4378, headquarters: "Prague, Czech Republic" },
  { id: "h2o", name: "Hungarian to Orbit", fullName: "Hungarian space programme (HUNOR / H2O initiative)", country: "Hungary", flag: "🇭🇺", region: "Europe", latitude: 47.4979, longitude: 19.0402, headquarters: "Budapest, Hungary" },
  { id: "isi", name: "Irish space programme", fullName: "Irish Space Industry Group / national space coordination", country: "Ireland", flag: "🇮🇪", region: "Europe", latitude: 53.3498, longitude: -6.2603, headquarters: "Dublin, Ireland" },
  { id: "hsc", name: "HSC", fullName: "Hellenic Space Center", country: "Greece", flag: "🇬🇷", region: "Europe", latitude: 37.9838, longitude: 23.7275, headquarters: "Athens, Greece" },
  { id: "lsa", name: "LSA", fullName: "Luxembourg Space Agency", country: "Luxembourg", flag: "🇱🇺", region: "Europe", latitude: 49.6116, longitude: 6.1319, headquarters: "Luxembourg City, Luxembourg" },
  { id: "eso-ee", name: "Estonian Space Office", fullName: "Estonian Space Office", country: "Estonia", flag: "🇪🇪", region: "Europe", latitude: 59.437, longitude: 24.7536, headquarters: "Tallinn, Estonia" },
  { id: "lso", name: "Lithuanian Space Office", fullName: "Lithuanian Space Office", country: "Lithuania", flag: "🇱🇹", region: "Europe", latitude: 54.6872, longitude: 25.2797, headquarters: "Vilnius, Lithuania" },
  { id: "snsa-si", name: "Slovenian Space Agency", fullName: "Slovenian Space Agency", country: "Slovenia", flag: "🇸🇮", region: "Europe", latitude: 46.0569, longitude: 14.5058, headquarters: "Ljubljana, Slovenia" },
  { id: "slovak-space", name: "Slovak space programme", fullName: "Slovak space programme coordination", country: "Slovakia", flag: "🇸🇰", region: "Europe", latitude: 48.1486, longitude: 17.1077, headquarters: "Bratislava, Slovakia" },
  { id: "afsa", name: "AfSA", fullName: "African Space Agency", country: "African Union", flag: "🌍", region: "Africa", latitude: 8.9806, longitude: 38.7578, headquarters: "Addis Ababa, Ethiopia" },
  { id: "asal", name: "ASAL", fullName: "Agence Spatiale Algérienne", country: "Algeria", flag: "🇩🇿", region: "Africa", latitude: 36.7538, longitude: 3.0588, headquarters: "Algiers, Algeria" },
  { id: "egsa", name: "EgSA", fullName: "Egyptian Space Agency", country: "Egypt", flag: "🇪🇬", region: "Africa", latitude: 30.0444, longitude: 31.2357, headquarters: "Cairo, Egypt" },
  { id: "sansa", name: "SANSA", fullName: "South African National Space Agency", country: "South Africa", flag: "🇿🇦", region: "Africa", latitude: -25.7479, longitude: 28.2293, headquarters: "Pretoria, South Africa" },
  { id: "nasrda", name: "NASRDA", fullName: "National Space Research and Development Agency", country: "Nigeria", flag: "🇳🇬", region: "Africa", latitude: 9.0765, longitude: 7.3986, headquarters: "Abuja, Nigeria" },
  { id: "crts", name: "CRTS", fullName: "Royal Centre for Remote Sensing (Morocco)", country: "Morocco", flag: "🇲🇦", region: "Africa", latitude: 33.9716, longitude: -6.8498, headquarters: "Rabat, Morocco" },
  { id: "ksa-ke", name: "Kenya Space Agency", fullName: "Kenya Space Agency", country: "Kenya", flag: "🇰🇪", region: "Africa", latitude: -1.2864, longitude: 36.8172, headquarters: "Nairobi, Kenya" },
  { id: "rsa-rw", name: "Rwanda Space Agency", fullName: "Rwanda Space Agency", country: "Rwanda", flag: "🇷🇼", region: "Africa", latitude: -1.97, longitude: 30.1044, headquarters: "Kigali, Rwanda" },
  { id: "essti", name: "ESSTI", fullName: "Ethiopian Space Science and Technology Institute", country: "Ethiopia", flag: "🇪🇹", region: "Africa", latitude: 9.032, longitude: 38.7469, headquarters: "Addis Ababa, Ethiopia" },
  { id: "ggpen", name: "GGPEN", fullName: "National Space Management Office (Angola)", country: "Angola", flag: "🇦🇴", region: "Africa", latitude: -8.839, longitude: 13.2894, headquarters: "Luanda, Angola" },
  { id: "ssri", name: "SSRI", fullName: "Sudan Space Research Institute", country: "Sudan", flag: "🇸🇩", region: "Africa", latitude: 15.5007, longitude: 32.5599, headquarters: "Khartoum, Sudan" },
  { id: "asa-au", name: "Australian Space Agency", fullName: "Australian Space Agency", country: "Australia", flag: "🇦🇺", region: "Oceania", latitude: -34.9285, longitude: 138.6007, headquarters: "Adelaide, Australia" },
  { id: "nzsa", name: "NZSA", fullName: "New Zealand Space Agency", country: "New Zealand", flag: "🇳🇿", region: "Oceania", latitude: -43.5321, longitude: 172.6362, headquarters: "Christchurch, New Zealand" },
  { id: "png-space", name: "Papua New Guinea space programme", fullName: "National space programme coordination (Papua New Guinea)", country: "Papua New Guinea", flag: "🇵🇬", region: "Oceania", latitude: -9.4438, longitude: 147.1803, headquarters: "Port Moresby, Papua New Guinea" },
  { id: "fiji-space", name: "Fiji space programme", fullName: "National space and satellite coordination (Fiji)", country: "Fiji", flag: "🇫🇯", region: "Oceania", latitude: -18.1248, longitude: 178.4501, headquarters: "Suva, Fiji" }
];

const typeDefaults = {
  Americas: "Official space agency or national space programme",
  Asia: "Official space agency or national space programme",
  Europe: "Official space agency or space office",
  Africa: "Official space agency or research institute",
  Oceania: "Official space agency or national space programme"
};

function defaultDescription(entry) {
  return `${entry.fullName} supports ${entry.country}'s space activities, including satellite applications, research, and international cooperation where applicable.`;
}

const agencies = base.map((entry) => {
  const extra = enrichments[entry.id] || {};
  const organizationType =
    extra.organizationType ||
    (entry.fullName.toLowerCase().includes("programme") || entry.fullName.toLowerCase().includes("coordination")
      ? "Government space programme"
      : entry.fullName.toLowerCase().includes("institute") || entry.fullName.toLowerCase().includes("research")
        ? "Research organization"
        : entry.fullName.toLowerCase().includes("office")
          ? "Space office"
          : entry.id === "afsa"
            ? "Regional organization"
            : typeDefaults[entry.region] || "Space organization");

  return {
    ...entry,
    ...extra,
    organizationType,
    description: extra.description || defaultDescription(entry),
    responsibilities: extra.responsibilities || ["Space policy coordination", "Satellite applications", "International cooperation"],
    majorMissions: extra.majorMissions || []
  };
});

const outPath = path.join(__dirname, "space-agencies.json");
fs.writeFileSync(outPath, JSON.stringify({ updatedAt: new Date().toISOString(), agencies }, null, 2), "utf8");
console.log(`Wrote ${agencies.length} agencies to ${outPath}`);
