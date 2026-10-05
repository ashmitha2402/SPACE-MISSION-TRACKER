import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const viewButtons = [...document.querySelectorAll(".view-option")];
const regionFilterButtons = [...document.querySelectorAll("[data-region]")];
const agencySearchInput = document.getElementById("agency-search");
const agencyDetailCard = document.getElementById("agency-detail-card");
const globeCanvas = document.getElementById("globe-canvas");
const globeStatusMessage = document.getElementById("globe-status-message");
const liveStatus = document.getElementById("live-status");
const lastUpdated = document.getElementById("last-updated");
const trackedObjectsList = document.getElementById("tracked-objects-list");
const missionReferenceList = document.getElementById("mission-reference-list");
const liveBadge = document.getElementById("globe-live-badge");

if (!globeCanvas || !globeStatusMessage || !liveStatus || !lastUpdated || !trackedObjectsList || !missionReferenceList || !liveBadge) {
    console.warn("Live Globe page is missing required UI elements.");
} else {
    const EARTH_RADIUS_KM = 6371;
    const EARTH_SCENE_RADIUS = 1.7;

    const state = {
        view: "earth",
        region: "all",
        agencySearch: "",
        renderer: null,
        scene: null,
        camera: null,
        controls: null,
        bodyGroup: null,
        bodyMeshes: new Map(),
        starField: null,
        satelliteGroup: null,
        satelliteMesh: null,
        locationGroup: null,
        locationMeshes: [],
        earthSatelliteData: [],
        cameraDesired: new THREE.Vector3(0, 0.6, 4.7),
        cameraTarget: new THREE.Vector3(0, 0, 0),
        activeSatelliteInfo: null,
        raycaster: new THREE.Raycaster(),
        pointer: new THREE.Vector2()
    };

    function updateCameraFrame() {
        if (!state.camera || !state.controls) return;

        const activeBody = state.bodyMeshes.get(state.view);
        if (!activeBody) return;

        const radius = activeBody.geometry?.boundingSphere?.radius ?? 1.7;
        const lookAtTarget = new THREE.Vector3(0, 0, 0);
        const distanceMap = {
            earth: 4.8,
            moon: 3.4,
            mars: 7.2
        };
        const baseDistance = distanceMap[state.view] ?? 5;
        const distance = Math.max(baseDistance, radius * 3.1);
        const offset = new THREE.Vector3(0, radius * 0.75, distance);

        state.cameraDesired.copy(offset);
        state.cameraTarget.copy(lookAtTarget);
        state.controls.target.lerp(lookAtTarget, 0.1);
    }

    function setViewState(nextView) {
        state.view = nextView;
        viewButtons.forEach((button) => {
            const isActive = button.dataset.view === nextView;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", String(isActive));
        });

        if (state.bodyMeshes) {
            for (const [key, mesh] of state.bodyMeshes.entries()) {
                mesh.visible = key === nextView;
            }
        }

        if (state.satelliteGroup) {
            state.satelliteGroup.visible = nextView === "earth";
        }

        if (state.locationGroup) {
            state.locationGroup.visible = nextView === "earth";
        }

        const viewMap = {
            earth: { position: new THREE.Vector3(0, 0.7, 4.8), target: new THREE.Vector3(0, 0, 0) },
            moon: { position: new THREE.Vector3(0, 0.9, 3.4), target: new THREE.Vector3(0, 0, 0) },
            mars: { position: new THREE.Vector3(0, 1.2, 7.2), target: new THREE.Vector3(0, 0, 0) }
        };
        const config = viewMap[nextView] || viewMap.earth;
        state.cameraDesired.copy(config.position);
        state.cameraTarget.copy(config.target);
        updateCameraFrame();
    }

    function setGlobalStatus(message, isLive = false) {
        globeStatusMessage.textContent = message;
        liveBadge.classList.toggle("hidden", !isLive);
    }

    function renderList(items, listNode) {
        listNode.innerHTML = "";

        if (!items.length) {
            const emptyItem = document.createElement("li");
            emptyItem.textContent = "No entries available.";
            listNode.appendChild(emptyItem);
            return;
        }

        items.forEach((item) => {
            const listItem = document.createElement("li");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "tracked-object-button";
            button.textContent = item.label;
            button.addEventListener("click", () => {
                if (item.detail) {
                    liveStatus.textContent = item.detail.title || item.label;
                    lastUpdated.textContent = item.detail.description || "";
                    globeStatusMessage.textContent = item.detail.message || item.label;
                }
            });
            listItem.appendChild(button);
            listNode.appendChild(listItem);
        });
    }

    function formatTimestamp(value) {
        if (!value) return "timestamp unavailable";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString();
    }

    const spaceAgencyData = [
        { name: "NASA", abbreviation: "NASA", country: "United States", region: "North & South America", latitude: 38.8816, longitude: -77.0910, headquarters: "Washington, D.C., United States", flag: "🇺🇸" },
        { name: "Canadian Space Agency", abbreviation: "CSA", country: "Canada", region: "North & South America", latitude: 45.5120, longitude: -73.4150, headquarters: "Saint-Hubert, Quebec, Canada", flag: "🇨🇦" },
        { name: "Agencia Espacial Mexicana", abbreviation: "AEM", country: "Mexico", region: "North & South America", latitude: 19.4326, longitude: -99.1332, headquarters: "Mexico City, Mexico", flag: "🇲🇽" },
        { name: "Brazilian Space Agency", abbreviation: "AEB", country: "Brazil", region: "North & South America", latitude: -15.7801, longitude: -47.9292, headquarters: "Brasília, Brazil", flag: "🇧🇷" },
        { name: "National Space Activities Commission", abbreviation: "CONAE", country: "Argentina", region: "North & South America", latitude: -31.4201, longitude: -64.1888, headquarters: "Córdoba, Argentina", flag: "🇦🇷" },
        { name: "AChE", abbreviation: "AChE", country: "Chile", region: "North & South America", latitude: -33.4489, longitude: -70.6693, headquarters: "Santiago, Chile", flag: "🇨🇱" },
        { name: "CONIDA", abbreviation: "CONIDA", country: "Peru", region: "North & South America", latitude: -12.0464, longitude: -77.0428, headquarters: "Lima, Peru", flag: "🇵🇪" },
        { name: "Colombian Space Commission", abbreviation: "Colombian Space Commission", country: "Colombia", region: "North & South America", latitude: 4.7110, longitude: -74.0721, headquarters: "Bogotá, Colombia", flag: "🇨🇴" },
        { name: "ABAE", abbreviation: "ABAE", country: "Venezuela", region: "North & South America", latitude: 10.4806, longitude: -66.9036, headquarters: "Caracas, Venezuela", flag: "🇻🇪" },
        { name: "Bolivian Space Agency", abbreviation: "Bolivian Space Agency", country: "Bolivia", region: "North & South America", latitude: -16.4958, longitude: -68.1462, headquarters: "La Paz, Bolivia", flag: "🇧🇴" },
        { name: "Ecuadorian Civil Space Agency", abbreviation: "Ecuadorian Civil Space Agency", country: "Ecuador", region: "North & South America", latitude: -0.1807, longitude: -78.4678, headquarters: "Quito, Ecuador", flag: "🇪🇨" },
        { name: "Paraguayan Space Agency", abbreviation: "Paraguayan Space Agency", country: "Paraguay", region: "North & South America", latitude: -25.2637, longitude: -57.5759, headquarters: "Asunción, Paraguay", flag: "🇵🇾" },
        { name: "Uruguayan Space Programme", abbreviation: "Uruguayan Space Programme", country: "Uruguay", region: "North & South America", latitude: -34.9011, longitude: -56.1645, headquarters: "Montevideo, Uruguay", flag: "🇺🇾" },
        { name: "Costa Rican Space Programme", abbreviation: "Costa Rican Space Programme", country: "Costa Rica", region: "North & South America", latitude: 9.9281, longitude: -84.0907, headquarters: "San José, Costa Rica", flag: "🇨🇷" },
        { name: "ISRO", abbreviation: "ISRO", country: "India", region: "Asia", latitude: 12.9716, longitude: 77.5946, headquarters: "Bengaluru, India", flag: "🇮🇳" },
        { name: "China National Space Administration", abbreviation: "CNSA", country: "China", region: "Asia", latitude: 39.9042, longitude: 116.4074, headquarters: "Beijing, China", flag: "🇨🇳" },
        { name: "JAXA", abbreviation: "JAXA", country: "Japan", region: "Asia", latitude: 35.6762, longitude: 139.6503, headquarters: "Tokyo, Japan", flag: "🇯🇵" },
        { name: "Korea Aerospace Administration", abbreviation: "KASA", country: "South Korea", region: "Asia", latitude: 36.3504, longitude: 127.3845, headquarters: "Daejeon, South Korea", flag: "🇰🇷" },
        { name: "National Aerospace Technology Administration", abbreviation: "NATA", country: "North Korea", region: "Asia", latitude: 39.0392, longitude: 125.7625, headquarters: "Pyongyang, North Korea", flag: "🇰🇵" },
        { name: "National Research and Innovation Agency", abbreviation: "BRIN", country: "Indonesia", region: "Asia", latitude: -6.2088, longitude: 106.8456, headquarters: "Jakarta, Indonesia", flag: "🇮🇩" },
        { name: "Malaysian Space Agency", abbreviation: "MYSA", country: "Malaysia", region: "Asia", latitude: 3.1390, longitude: 101.6869, headquarters: "Kuala Lumpur, Malaysia", flag: "🇲🇾" },
        { name: "Philippine Space Agency", abbreviation: "PhilSA", country: "Philippines", region: "Asia", latitude: 14.6760, longitude: 121.0437, headquarters: "Quezon City, Philippines", flag: "🇵🇭" },
        { name: "Geo-Informatics and Space Technology Development Agency", abbreviation: "GISTDA", country: "Thailand", region: "Asia", latitude: 13.7563, longitude: 100.5018, headquarters: "Bangkok, Thailand", flag: "🇹🇭" },
        { name: "Vietnam National Space Center", abbreviation: "VNSC", country: "Vietnam", region: "Asia", latitude: 21.0278, longitude: 105.8342, headquarters: "Hanoi, Vietnam", flag: "🇻🇳" },
        { name: "SUPARCO", abbreviation: "SUPARCO", country: "Pakistan", region: "Asia", latitude: 33.6844, longitude: 73.0479, headquarters: "Islamabad, Pakistan", flag: "🇵🇰" },
        { name: "SPARRSO", abbreviation: "SPARRSO", country: "Bangladesh", region: "Asia", latitude: 23.8103, longitude: 90.4125, headquarters: "Dhaka, Bangladesh", flag: "🇧🇩" },
        { name: "Iranian Space Agency", abbreviation: "ISA", country: "Iran", region: "Asia", latitude: 35.6892, longitude: 51.3890, headquarters: "Tehran, Iran", flag: "🇮🇷" },
        { name: "Israel Space Agency", abbreviation: "ISA", country: "Israel", region: "Asia", latitude: 32.0853, longitude: 34.7818, headquarters: "Tel Aviv, Israel", flag: "🇮🇱" },
        { name: "Saudi Space Agency", abbreviation: "SSA", country: "Saudi Arabia", region: "Asia", latitude: 24.7136, longitude: 46.6753, headquarters: "Riyadh, Saudi Arabia", flag: "🇸🇦" },
        { name: "UAE Space Agency", abbreviation: "UAESA", country: "United Arab Emirates", region: "Asia", latitude: 24.4539, longitude: 54.3773, headquarters: "Abu Dhabi, United Arab Emirates", flag: "🇦🇪" },
        { name: "Turkish Space Agency", abbreviation: "TUA", country: "Türkiye", region: "Asia", latitude: 39.9334, longitude: 32.8597, headquarters: "Ankara, Türkiye", flag: "🇹🇷" },
        { name: "Office for Space Technology & Industry", abbreviation: "OSTIn", country: "Singapore", region: "Asia", latitude: 1.3521, longitude: 103.8198, headquarters: "Singapore", flag: "🇸🇬" },
        { name: "Taiwan Space Agency", abbreviation: "TSA", country: "Taiwan", region: "Asia", latitude: 25.0330, longitude: 121.5654, headquarters: "Taipei, Taiwan", flag: "🇹🇼" },
        { name: "Kazakh National Space Programme", abbreviation: "Kazakhstan Space Programme", country: "Kazakhstan", region: "Asia", latitude: 51.1694, longitude: 71.4491, headquarters: "Astana, Kazakhstan", flag: "🇰🇿" },
        { name: "Azercosmos", abbreviation: "Azercosmos", country: "Azerbaijan", region: "Asia", latitude: 40.4093, longitude: 49.8671, headquarters: "Baku, Azerbaijan", flag: "🇦🇿" },
        { name: "Uzbekistan Space Programme", abbreviation: "Uzbekistan Space Programme", country: "Uzbekistan", region: "Asia", latitude: 41.2995, longitude: 69.2401, headquarters: "Tashkent, Uzbekistan", flag: "🇺🇿" },
        { name: "Arthur C. Clarke Institute for Modern Technologies", abbreviation: "ACClarke", country: "Sri Lanka", region: "Asia", latitude: 6.9271, longitude: 79.8612, headquarters: "Colombo, Sri Lanka", flag: "🇱🇰" },
        { name: "European Space Agency", abbreviation: "ESA", country: "European Union", region: "Europe", latitude: 48.8566, longitude: 2.3522, headquarters: "Paris, France", flag: "🇪🇺" },
        { name: "Roscosmos", abbreviation: "Roscosmos", country: "Russia", region: "Europe", latitude: 55.7558, longitude: 37.6173, headquarters: "Moscow, Russia", flag: "🇷🇺" },
        { name: "Centre National d'Études Spatiales", abbreviation: "CNES", country: "France", region: "Europe", latitude: 43.6047, longitude: 1.4442, headquarters: "Toulouse, France", flag: "🇫🇷" },
        { name: "German Aerospace Center", abbreviation: "DLR", country: "Germany", region: "Europe", latitude: 50.7374, longitude: 7.0982, headquarters: "Bonn, Germany", flag: "🇩🇪" },
        { name: "Italian Space Agency", abbreviation: "ASI", country: "Italy", region: "Europe", latitude: 41.9028, longitude: 12.4964, headquarters: "Rome, Italy", flag: "🇮🇹" },
        { name: "UK Space Agency", abbreviation: "UKSA", country: "United Kingdom", region: "Europe", latitude: 51.5072, longitude: -0.1276, headquarters: "London, United Kingdom", flag: "🇬🇧" },
        { name: "Agencia Estatal de Espacio", abbreviation: "AEE", country: "Spain", region: "Europe", latitude: 40.4168, longitude: -3.7038, headquarters: "Madrid, Spain", flag: "🇪🇸" },
        { name: "Belgian Science Policy Office", abbreviation: "BELSPO", country: "Belgium", region: "Europe", latitude: 50.8503, longitude: 4.3517, headquarters: "Brussels, Belgium", flag: "🇧🇪" },
        { name: "Netherlands Space Office", abbreviation: "NSO", country: "Netherlands", region: "Europe", latitude: 52.0705, longitude: 4.3007, headquarters: "The Hague, Netherlands", flag: "🇳🇱" },
        { name: "Swedish National Space Agency", abbreviation: "SNSA", country: "Sweden", region: "Europe", latitude: 59.3293, longitude: 18.0686, headquarters: "Stockholm, Sweden", flag: "🇸🇪" },
        { name: "Swiss Space Office", abbreviation: "Swiss Space Office", country: "Switzerland", region: "Europe", latitude: 46.9480, longitude: 7.4474, headquarters: "Bern, Switzerland", flag: "🇨🇭" },
        { name: "Austrian Space Agency", abbreviation: "ASA", country: "Austria", region: "Europe", latitude: 48.2082, longitude: 16.3738, headquarters: "Vienna, Austria", flag: "🇦🇹" },
        { name: "Norwegian Space Agency", abbreviation: "NOSA", country: "Norway", region: "Europe", latitude: 59.9139, longitude: 10.7522, headquarters: "Oslo, Norway", flag: "🇳🇴" },
        { name: "Danish Agency for Science, Technology and Innovation", abbreviation: "DASTI", country: "Denmark", region: "Europe", latitude: 55.6761, longitude: 12.5683, headquarters: "Copenhagen, Denmark", flag: "🇩🇰" },
        { name: "Finnish Space Agency", abbreviation: "FSA", country: "Finland", region: "Europe", latitude: 60.1699, longitude: 24.9384, headquarters: "Helsinki, Finland", flag: "🇫🇮" },
        { name: "Polish Space Agency", abbreviation: "POLSA", country: "Poland", region: "Europe", latitude: 52.2297, longitude: 21.0122, headquarters: "Warsaw, Poland", flag: "🇵🇱" },
        { name: "Portugal Space", abbreviation: "Portugal Space", country: "Portugal", region: "Europe", latitude: 38.7223, longitude: -9.1393, headquarters: "Lisbon, Portugal", flag: "🇵🇹" },
        { name: "Romanian Space Agency", abbreviation: "ROSA", country: "Romania", region: "Europe", latitude: 44.4268, longitude: 26.1025, headquarters: "Bucharest, Romania", flag: "🇷🇴" },
        { name: "State Space Agency of Ukraine", abbreviation: "SSAU", country: "Ukraine", region: "Europe", latitude: 50.4501, longitude: 30.5234, headquarters: "Kyiv, Ukraine", flag: "🇺🇦" },
        { name: "Czech Space Office", abbreviation: "CSO", country: "Czech Republic", region: "Europe", latitude: 50.0755, longitude: 14.4378, headquarters: "Prague, Czech Republic", flag: "🇨🇿" },
        { name: "Hungarian to Orbit", abbreviation: "H2O", country: "Hungary", region: "Europe", latitude: 47.4979, longitude: 19.0402, headquarters: "Budapest, Hungary", flag: "🇭🇺" },
        { name: "Irish Space Industry Group", abbreviation: "ISI", country: "Ireland", region: "Europe", latitude: 53.3498, longitude: -6.2603, headquarters: "Dublin, Ireland", flag: "🇮🇪" },
        { name: "Hellenic Space Center", abbreviation: "HSC", country: "Greece", region: "Europe", latitude: 37.9838, longitude: 23.7275, headquarters: "Athens, Greece", flag: "🇬🇷" },
        { name: "Luxembourg Space Agency", abbreviation: "LSA", country: "Luxembourg", region: "Europe", latitude: 49.6116, longitude: 6.1319, headquarters: "Luxembourg City, Luxembourg", flag: "🇱🇺" },
        { name: "Estonian Space Office", abbreviation: "ESO", country: "Estonia", region: "Europe", latitude: 59.4370, longitude: 24.7536, headquarters: "Tallinn, Estonia", flag: "🇪🇪" },
        { name: "Lithuanian Space Office", abbreviation: "LSO", country: "Lithuania", region: "Europe", latitude: 54.6872, longitude: 25.2797, headquarters: "Vilnius, Lithuania", flag: "🇱🇹" },
        { name: "Slovenian Space Agency", abbreviation: "SNSA", country: "Slovenia", region: "Europe", latitude: 46.0569, longitude: 14.5058, headquarters: "Ljubljana, Slovenia", flag: "🇸🇮" },
        { name: "Slovak Space Programme", abbreviation: "Slovak Space Programme", country: "Slovakia", region: "Europe", latitude: 48.1486, longitude: 17.1077, headquarters: "Bratislava, Slovakia", flag: "🇸🇰" },
        { name: "African Space Agency", abbreviation: "AfSA", country: "African Union", region: "Africa", latitude: 8.9806, longitude: 38.7578, headquarters: "Addis Ababa, Ethiopia", flag: "🌍" },
        { name: "Agence Spatiale Algérienne", abbreviation: "ASAL", country: "Algeria", region: "Africa", latitude: 36.7538, longitude: 3.0588, headquarters: "Algiers, Algeria", flag: "🇩🇿" },
        { name: "Egyptian Space Agency", abbreviation: "EgSA", country: "Egypt", region: "Africa", latitude: 30.0444, longitude: 31.2357, headquarters: "Cairo, Egypt", flag: "🇪🇬" },
        { name: "South African National Space Agency", abbreviation: "SANSA", country: "South Africa", region: "Africa", latitude: -25.7479, longitude: 28.2293, headquarters: "Pretoria, South Africa", flag: "🇿🇦" },
        { name: "National Space Research and Development Agency", abbreviation: "NASRDA", country: "Nigeria", region: "Africa", latitude: 9.0765, longitude: 7.3986, headquarters: "Abuja, Nigeria", flag: "🇳🇬" },
        { name: "Moroccan Royal Centre for Remote Sensing", abbreviation: "CRTS", country: "Morocco", region: "Africa", latitude: 33.9716, longitude: -6.8498, headquarters: "Rabat, Morocco", flag: "🇲🇦" },
        { name: "Kenya Space Agency", abbreviation: "KSA", country: "Kenya", region: "Africa", latitude: -1.2864, longitude: 36.8172, headquarters: "Nairobi, Kenya", flag: "🇰🇪" },
        { name: "Rwanda Space Agency", abbreviation: "RSA", country: "Rwanda", region: "Africa", latitude: -1.9700, longitude: 30.1044, headquarters: "Kigali, Rwanda", flag: "🇷🇼" },
        { name: "Ethiopian Space Science and Technology Institute", abbreviation: "ESSTI", country: "Ethiopia", region: "Africa", latitude: 8.9806, longitude: 38.7578, headquarters: "Addis Ababa, Ethiopia", flag: "🇪🇹" },
        { name: "GGPEN", abbreviation: "GGPEN", country: "Angola", region: "Africa", latitude: -8.8390, longitude: 13.2894, headquarters: "Luanda, Angola", flag: "🇦🇴" },
        { name: "Sudan Space Research Institute", abbreviation: "SSRI", country: "Sudan", region: "Africa", latitude: 15.5007, longitude: 32.5599, headquarters: "Khartoum, Sudan", flag: "🇸🇩" },
        { name: "Australian Space Agency", abbreviation: "ASA", country: "Australia", region: "Oceania / Pacific", latitude: -34.9285, longitude: 138.6007, headquarters: "Adelaide, Australia", flag: "🇦🇺" },
        { name: "New Zealand Space Agency", abbreviation: "NZSA", country: "New Zealand", region: "Oceania / Pacific", latitude: -43.5321, longitude: 172.6362, headquarters: "Christchurch, New Zealand", flag: "🇳🇿" },
        { name: "Papua New Guinea Space Programme", abbreviation: "PNGSP", country: "Papua New Guinea", region: "Oceania / Pacific", latitude: -9.4438, longitude: 147.1803, headquarters: "Port Moresby, Papua New Guinea", flag: "🇵🇬" },
        { name: "Fiji Space Programme", abbreviation: "FSP", country: "Fiji", region: "Oceania / Pacific", latitude: -18.1248, longitude: 178.4501, headquarters: "Suva, Fiji", flag: "🇫🇯" }
    ];

    function geodeticToScenePosition(latitude, longitude, altitudeKm, radiusScale = EARTH_SCENE_RADIUS) {
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(altitudeKm)) {
            return null;
        }

        const latRad = (latitude * Math.PI) / 180;
        const lonRad = (longitude * Math.PI) / 180;
        const scaledAltitude = Math.max(0, altitudeKm) / EARTH_RADIUS_KM;
        const radius = radiusScale * (1 + scaledAltitude * 1.8);
        const x = radius * Math.cos(latRad) * Math.cos(lonRad);
        const y = radius * Math.sin(latRad);
        const z = radius * Math.cos(latRad) * Math.sin(lonRad);
        return new THREE.Vector3(x, y, z);
    }

    function createStars() {
        const geometry = new THREE.BufferGeometry();
        const starCount = 1800;
        const positions = new Float32Array(starCount * 3);

        for (let index = 0; index < starCount; index += 1) {
            const radius = 12 + Math.random() * 18;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[index * 3 + 1] = radius * Math.cos(phi);
            positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0xdfe8ff,
            size: 0.04,
            transparent: true,
            opacity: 0.9
        });
        return new THREE.Points(geometry, material);
    }

    function createCelestialBody(name, color, textureOrUrl, emissiveColor, emissiveIntensity = 0.2, radius = EARTH_SCENE_RADIUS) {
        const texture = textureOrUrl instanceof THREE.Texture ? textureOrUrl : (textureOrUrl ? new THREE.TextureLoader().load(textureOrUrl) : null);
        const material = new THREE.MeshStandardMaterial({
            color,
            emissive: emissiveColor,
            emissiveIntensity,
            roughness: 0.92,
            metalness: 0.08,
            map: texture || undefined,
            envMapIntensity: 0.6
        });

        const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 96), material);
        mesh.name = name;
        mesh.visible = false;
        return mesh;
    }

    async function fetchJson(url) {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Request failed (${response.status})`);
        }
        return response.json();
    }

    async function fetchActiveSatelliteData() {
        const payload = await fetchJson("http://localhost:3000/api/live-globe/satellites");
        const satellites = Array.isArray(payload?.satellites) ? payload.satellites : [];
        const satelliteLib = await import("https://cdn.jsdelivr.net/npm/satellite.js@6.0.1/+esm");
        const now = new Date();
        const dataset = [];

        for (const item of satellites) {
            const { name, line1, line2 } = item || {};
            if (!name || !line1 || !line2) continue;

            try {
                const satrec = satelliteLib.twoline2satrec(line1, line2);
                const propagation = satelliteLib.propagate(satrec, now);
                const position = propagation.position;
                const velocity = propagation.velocity;
                const gmst = satelliteLib.gstime(now);
                const geodetic = satelliteLib.eciToGeodetic(position, gmst);

                if (!position || !velocity || !Number.isFinite(geodetic.latitude) || !Number.isFinite(geodetic.longitude)) {
                    continue;
                }

                const latitude = (geodetic.latitude * 180) / Math.PI;
                const longitude = (geodetic.longitude * 180) / Math.PI;
                const altitudeKm = Number(geodetic.height) || 0;
                const velocityKms = Math.hypot(velocity.x, velocity.y, velocity.z);

                dataset.push({
                    name,
                    latitude,
                    longitude,
                    altitudeKm,
                    velocityKms,
                    status: "Tracking",
                    lastUpdated: now.toISOString(),
                    source: "CelesTrak TLE + SGP4"
                });
            } catch (error) {
                continue;
            }
        }

        return dataset;
    }

    function createEarthSatelliteMesh(entries) {
        if (!entries.length) return null;

        const geometry = new THREE.SphereGeometry(0.032, 12, 12);
        const material = new THREE.MeshBasicMaterial({
            color: 0x76d8ff,
            transparent: true,
            opacity: 0.9
        });

        const mesh = new THREE.InstancedMesh(geometry, material, entries.length);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        entries.forEach((entry, index) => {
            const position = geodeticToScenePosition(entry.latitude, entry.longitude, entry.altitudeKm, EARTH_SCENE_RADIUS);
            if (!position) return;
            const matrix = new THREE.Matrix4();
            matrix.setPosition(position);
            mesh.setMatrixAt(index, matrix);
        });

        mesh.instanceMatrix.needsUpdate = true;
        mesh.userData.entries = entries;
        return mesh;
    }

    function getVisibleAgencyEntries() {
        const query = (state.agencySearch || "").trim().toLowerCase();
        return spaceAgencyData.filter((entry) => {
            const matchesRegion = state.region === "all" || entry.region === state.region;
            if (!matchesRegion) return false;
            if (!query) return true;
            const haystack = [entry.name, entry.abbreviation, entry.country, entry.region, entry.headquarters].join(" ").toLowerCase();
            return haystack.includes(query);
        });
    }

    function buildEarthAgencyMarkers() {
        if (!state.locationGroup) return [];

        const entries = getVisibleAgencyEntries();

        state.locationMeshes.forEach((mesh) => {
            state.locationGroup.remove(mesh);
            mesh.geometry?.dispose?.();
            mesh.material?.dispose?.();
        });
        state.locationMeshes = [];

        const markerGeometry = new THREE.SphereGeometry(0.045, 16, 16);
        const regionColors = {
            "North & South America": 0x7ed8ff,
            Asia: 0x7ff7c4,
            Europe: 0xffd975,
            Africa: 0xff9ed8,
            "Oceania / Pacific": 0xc8a4ff
        };

        entries.forEach((entry) => {
            const color = regionColors[entry.region] || 0x8ecbff;
            const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false });
            const mesh = new THREE.Mesh(markerGeometry, material);
            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(0.07, 16, 16),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, depthWrite: false })
            );
            const position = geodeticToScenePosition(entry.latitude, entry.longitude, 0.05, EARTH_SCENE_RADIUS);
            if (!position) return;
            mesh.position.copy(position);
            glow.position.copy(position);
            mesh.userData.agency = entry;
            glow.userData.agency = entry;
            state.locationGroup.add(mesh, glow);
            state.locationMeshes.push(mesh, glow);
        });

        return entries;
    }

    function clearSatelliteMarkers() {
        if (!state.satelliteGroup) return;
        if (state.satelliteMesh) {
            state.satelliteGroup.remove(state.satelliteMesh);
            state.satelliteMesh.geometry.dispose();
            state.satelliteMesh.material.dispose();
            state.satelliteMesh = null;
        }
        state.earthSatelliteData = [];
    }

    function renderEarthSatelliteMarkers(entries) {
        clearSatelliteMarkers();
        if (!entries.length || !state.satelliteGroup) return;

        const validEntries = entries.filter((entry) => {
            const validLatitude = Number.isFinite(entry.latitude);
            const validLongitude = Number.isFinite(entry.longitude);
            const validAltitude = Number.isFinite(entry.altitudeKm);
            return validLatitude && validLongitude && validAltitude;
        });

        const skipped = entries.length - validEntries.length;
        console.info("[LiveGlobe] Mode: Earth", {
            received: entries.length,
            valid: validEntries.length,
            rendered: validEntries.length,
            skipped,
            reason: skipped ? "missing latitude/longitude/altitude" : "none"
        });

        if (!validEntries.length) {
            globeStatusMessage.textContent = "Position unavailable • no valid Earth coordinates were returned.";
            return;
        }

        const mesh = createEarthSatelliteMesh(validEntries);
        if (!mesh) return;

        state.satelliteMesh = mesh;
        state.earthSatelliteData = validEntries;
        state.satelliteGroup.add(mesh);
    }

    function showSatelliteDetail(info) {
        const altitudeLabel = Number.isFinite(info.altitudeKm) ? `${Number(info.altitudeKm).toFixed(1)} km` : "unavailable";
        const latitudeLabel = Number.isFinite(info.latitude) ? `${Number(info.latitude).toFixed(2)}°` : "unavailable";
        const longitudeLabel = Number.isFinite(info.longitude) ? `${Number(info.longitude).toFixed(2)}°` : "unavailable";
        const velocityLabel = Number.isFinite(info.velocityKms) ? `${Number(info.velocityKms).toFixed(2)} km/s` : "unavailable";
        const statusValue = info.status || "Unknown";
        const updatedLabel = info.lastUpdated ? formatTimestamp(info.lastUpdated) : "timestamp unavailable";

        liveStatus.textContent = `Satellite: ${info.name}`;
        lastUpdated.textContent = `Altitude: ${altitudeLabel} | Latitude: ${latitudeLabel} | Longitude: ${longitudeLabel} | Velocity: ${velocityLabel}`;
        globeStatusMessage.textContent = `Status: ${statusValue} • Last updated: ${updatedLabel}`;
    }

    function hideAgencyDetail() {
        if (agencyDetailCard) {
            agencyDetailCard.classList.add("hidden");
            agencyDetailCard.innerHTML = "";
        }
    }

    function showAgencyDetail(agency) {
        if (!agencyDetailCard) return;
        agencyDetailCard.classList.remove("hidden");
        agencyDetailCard.innerHTML = `
            <div class="agency-detail-header">
                <div class="agency-detail-flag">${agency.flag || "🌍"}</div>
                <div>
                    <div class="agency-detail-abbrev">${agency.abbreviation || agency.name}</div>
                    <h3>${agency.name}</h3>
                </div>
            </div>
            <div class="agency-detail-body">
                <p><strong>${agency.country}</strong></p>
                <p>Headquarters: ${agency.headquarters}</p>
                <p>Region: ${agency.region}</p>
            </div>
        `;
    }

    function handlePointerDown(event) {
        if (state.view !== "earth") return;

        const rect = globeCanvas.getBoundingClientRect();
        state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        state.raycaster.setFromCamera(state.pointer, state.camera);

        const intersects = state.raycaster.intersectObjects(state.locationMeshes, false);
        if (!intersects.length) {
            hideAgencyDetail();
            return;
        }

        const hit = intersects[0].object;
        const agency = hit?.userData?.agency;
        if (agency) {
            showAgencyDetail(agency);
        }
    }

    async function loadMissionReferences() {
        try {
            const missions = await fetchJson("http://localhost:3000/api/missions");
            const viewTerms = {
                moon: ["moon", "lunar", "artemis", "chandrayaan"],
                mars: ["mars", "martian", "perseverance", "curiosity", "insight"]
            };
            const terms = viewTerms[state.view] || [];
            const matches = missions.filter((mission) => {
                const name = String(mission.name || "");
                const destination = String(mission.destination || "");
                const combined = `${name} ${destination}`.toLowerCase();
                return terms.some((term) => combined.includes(term));
            });
            const names = matches.slice(0, 8).map((mission) => mission.name || "Mission reference");
            renderList(names.length ? names.map((name) => ({ label: name })) : [{ label: "No mission references are currently available for this view." }], missionReferenceList);
        } catch (error) {
            console.warn("Mission reference lookup failed:", error);
            renderList([{ label: "Mission reference data is temporarily unavailable." }], missionReferenceList);
        }
    }

    async function loadTrackingForView() {
        trackedObjectsList.innerHTML = "";
        lastUpdated.textContent = "Awaiting timestamp...";

        if (state.view === "earth") {
            const entries = buildEarthAgencyMarkers();
            const filteredEntries = entries.slice();
            setGlobalStatus("Space agency markers active", false);
            liveStatus.textContent = state.region === "all" ? "EARTH • SPACE AGENCIES" : `EARTH • ${state.region.toUpperCase()}`;
            lastUpdated.textContent = filteredEntries.length ? `${filteredEntries.length} agencies visible.` : "No agencies match the current search or region.";
            globeStatusMessage.textContent = filteredEntries.length ? `${filteredEntries.length} agency markers displayed on Earth.` : "No agency markers match the current view.";

            const listItems = filteredEntries.map((entry) => ({
                label: `${entry.flag || "🌍"} ${entry.abbreviation} • ${entry.country}`,
                detail: {
                    title: entry.name,
                    description: `${entry.country} • ${entry.region} | Headquarters: ${entry.headquarters}`,
                    message: `${entry.abbreviation} • ${entry.country} • ${entry.region}`
                }
            }));

            renderList(listItems.length ? listItems : [{ label: "No agencies match the current search or region." }], trackedObjectsList);
            return;
        }

        if (state.view === "moon") {
            clearSatelliteMarkers();
            setGlobalStatus("Position unavailable", false);
            liveStatus.textContent = "Position unavailable";
            lastUpdated.textContent = "No reliable lunar surface tracking data is currently available.";
            renderList([{ label: "Position unavailable" }], trackedObjectsList);
            return;
        }

        clearSatelliteMarkers();
        setGlobalStatus("Position unavailable", false);
        liveStatus.textContent = "Position unavailable";
        lastUpdated.textContent = "No reliable Martian surface tracking data is currently available.";
        renderList([{ label: "Position unavailable" }], trackedObjectsList);
    }

    function createScene() {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020711);

        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
        camera.position.set(0, 0.6, 4.7);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setSize(globeCanvas.clientWidth || 800, globeCanvas.clientHeight || 560, false);
        globeCanvas.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.rotateSpeed = 0.7;
        controls.zoomSpeed = 0.9;
        controls.dampingFactor = 0.08;
        controls.minDistance = 1.8;
        controls.maxDistance = 18;

        const ambient = new THREE.AmbientLight(0xcfe0ff, 0.8);
        scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xfff0cf, 1.4);
        keyLight.position.set(4, 2, 5);
        scene.add(keyLight);

        const group = new THREE.Group();
        scene.add(group);
        scene.add(createStars());

        const earthTexture = new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg");
        const moonTexture = new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/moon_1024.jpg");
        const marsTexture = new THREE.TextureLoader().load("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mars_1k_color.jpg");

        const earth = createCelestialBody("earth", 0x89b7ff, earthTexture, 0x335bd6, 0.2, EARTH_SCENE_RADIUS);
        const moon = createCelestialBody("moon", 0xdde5ee, moonTexture, 0x8590a7, 0.1, EARTH_SCENE_RADIUS * 0.42);
        const mars = createCelestialBody("mars", 0xd97d4d, marsTexture, 0x8b3d20, 0.4, EARTH_SCENE_RADIUS * 0.7);

        group.add(earth, moon, mars);

        const satelliteGroup = new THREE.Group();
        scene.add(satelliteGroup);
        state.bodyGroup = group;
        state.bodyMeshes.set("earth", earth);
        state.bodyMeshes.set("moon", moon);
        state.bodyMeshes.set("mars", mars);
        state.satelliteGroup = satelliteGroup;
        state.locationGroup = new THREE.Group();
        earth.add(state.locationGroup);
        state.renderer = renderer;
        state.scene = scene;
        state.camera = camera;
        state.controls = controls;
        window.__liveGlobeState = state;

        const animate = () => {
            requestAnimationFrame(animate);
            const active = state.bodyMeshes.get(state.view);
            if (active) {
                active.rotation.y += 0.003;
            }

            if (state.camera && state.controls) {
                state.camera.position.lerp(state.cameraDesired, 0.08);
                state.controls.target.lerp(state.cameraTarget, 0.08);
            }

            if (state.locationMeshes.length && state.camera) {
                const cameraDistance = state.camera.position.length();
                state.locationMeshes.forEach((mesh) => {
                    const isVisible = cameraDistance < 8.5;
                    mesh.visible = isVisible;
                    if (mesh.material) {
                        mesh.material.opacity = isVisible ? (mesh.scale.x > 0.1 ? 0.95 : 0.65) : 0.1;
                    }
                });
            }

            state.controls.update();
            state.renderer.render(state.scene, state.camera);
        };
        animate();

        const resize = () => {
            const width = globeCanvas.clientWidth || 800;
            const height = globeCanvas.clientHeight || 560;
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            state.camera.aspect = width / height;
            state.camera.updateProjectionMatrix();
            state.renderer.setPixelRatio(pixelRatio);
            state.renderer.setSize(width, height, false);
        };

        window.addEventListener("resize", resize, { passive: true });
        resize();
        globeCanvas.addEventListener("pointerdown", handlePointerDown);
    }

    function handleViewSwitch(nextView) {
        setViewState(nextView);

        if (nextView === "earth") {
            setGlobalStatus("Checking Earth surface tracking...", false);
            liveStatus.textContent = "Checking Earth locations...";
            lastUpdated.textContent = "Awaiting timestamp...";
        }

        if (nextView === "moon") {
            setGlobalStatus("Position unavailable", false);
            liveStatus.textContent = "Position unavailable";
            lastUpdated.textContent = "No reliable lunar tracking data is currently available.";
        }

        if (nextView === "mars") {
            setGlobalStatus("Position unavailable", false);
            liveStatus.textContent = "Position unavailable";
            lastUpdated.textContent = "No reliable Martian surface tracking data is currently available.";
        }

        loadTrackingForView();
        loadMissionReferences();
    }

    viewButtons.forEach((button) => {
        button.addEventListener("click", () => {
            handleViewSwitch(button.dataset.view);
        });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const requestedView = urlParams.get("view");
    const requestedRegion = urlParams.get("region");

    if (requestedView && ["earth", "moon", "mars"].includes(requestedView)) {
        state.view = requestedView;
    }

    if (requestedRegion && ["all", "North & South America", "Asia", "Europe", "Africa", "Oceania / Pacific"].includes(requestedRegion)) {
        state.region = requestedRegion;
    }

    regionFilterButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.region === state.region);
        button.addEventListener("click", () => {
            state.region = button.dataset.region || "all";
            regionFilterButtons.forEach((item) => item.classList.toggle("active", item === button));
            if (state.view === "earth") {
                loadTrackingForView();
            }
        });
    });

    if (agencySearchInput) {
        agencySearchInput.addEventListener("input", (event) => {
            state.agencySearch = event.target.value;
            if (state.view === "earth") {
                loadTrackingForView();
            }
        });
    }

    createScene();
    setViewState(state.view);
    handleViewSwitch(state.view);
}
