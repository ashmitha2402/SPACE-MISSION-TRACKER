import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

(() => {
    const mount = document.getElementById("space3d-canvas");
    const status = document.getElementById("space3d-status");
    const missionLabel = document.getElementById("space3d-mission-label");
    const infoPanel = document.getElementById("space3d-object-panel");
    const panelName = document.getElementById("space3d-object-name");
    const panelDistance = document.getElementById("space3d-object-distance");
    const panelMissions = document.getElementById("space3d-object-missions");

    if (!mount || !status || !missionLabel || !infoPanel || !panelName || !panelDistance || !panelMissions) {
        console.error("Planetarium viewer markup is incomplete.");
        return;
    }

    const closePanel = document.getElementById("space3d-panel-close");
    const resetButton = document.getElementById("space3d-reset");
    const AU_KM = 149597870.7;
    const OBLIQUITY = 23.439291111 * Math.PI / 180;
    const TWO_PI = Math.PI * 2;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch (error) {
        status.textContent = "WebGL is unavailable. The mission tracker remains available.";
        console.error("Three.js renderer initialization failed:", error);
        return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040b);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.01, 1200);
    camera.position.set(0, 0, 0.001);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, -1);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.minDistance = 0.001;
    controls.maxDistance = 36;
    controls.rotateSpeed = 0.42;
    controls.zoomSpeed = 0.72;

    scene.add(new THREE.AmbientLight(0x68758c, 0.42));
    const planetLight = new THREE.DirectionalLight(0xffe5c0, 1.45);
    scene.add(planetLight);

    const sky = new THREE.Group();
    scene.add(sky);

    const planetObjects = new Map();
    const missionMarkers = new Map();
    const selectable = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let missionData = Array.isArray(window.__spaceMissionData) ? window.__spaceMissionData : [];
    let astronomySnapshot = null;
    let focusAnimation = null;
    let animationFrame = null;
    let lastAstronomyUpdate = 0;

    const spacecraftCatalog = [
        { pattern: /\bvoyager\s*1\b/i, aliases: ["Voyager 1"], name: "Voyager 1", provider: "horizons", targetId: "-31" },
        { pattern: /\bvoyager\s*2\b/i, aliases: ["Voyager 2"], name: "Voyager 2", provider: "horizons", targetId: "-32" },
        { pattern: /\bchandrayaan[- ]?3\b/i, aliases: ["Chandrayaan", "Chandrayaan-3"], name: "Vikram lander / Pragyan rover", provider: "unavailable" },
        { pattern: /\bchandrayaan[- ]?2\b/i, aliases: ["Chandrayaan", "Chandrayaan-2"], name: "Chandrayaan-2 spacecraft", provider: "unavailable" },
        { pattern: /\bchandrayaan[- ]?1\b/i, aliases: ["Chandrayaan", "Chandrayaan-1"], name: "Chandrayaan-1 spacecraft", provider: "unavailable" },
        { pattern: /\bartemis\s*(?:ii|2)\b/i, aliases: ["Artemis II"], name: "Orion spacecraft (Artemis II)", provider: "unavailable" },
        { pattern: /\bartemis\s*(?:i|1)\b/i, aliases: ["Artemis I"], name: "Orion spacecraft (Artemis I)", provider: "unavailable" },
        { pattern: /parker\s+solar\s+probe/i, aliases: ["Parker", "Parker Solar Probe"], name: "Parker Solar Probe", provider: "horizons", targetId: "-96" },
        { pattern: /\bjuno\b/i, aliases: ["Juno"], name: "Juno", provider: "horizons", targetId: "-61" },
        { pattern: /new\s+horizons/i, aliases: ["New Horizons"], name: "New Horizons", provider: "horizons", targetId: "-98" },
        { pattern: /osiris[- ]?rex/i, aliases: ["OSIRIS", "OSIRIS-REx"], name: "OSIRIS-REx", provider: "horizons", targetId: "-64" },
        { pattern: /\biss\b|international\s+space\s+station/i, aliases: ["ISS", "International Space Station"], name: "International Space Station", provider: "celestrak", catalogId: "25544" }
    ];

    const planetDefinitions = [
        { name: "Sun", size: 0.105, color: 0xffc86a, element: null },
        { name: "Mercury", size: 0.047, color: 0xb8aea1, element: ["Mercury", 0.3871, 0.2056, 7.00, 252.25, 77.46, 48.33, 87.97] },
        { name: "Venus", size: 0.072, color: 0xe6c99a, element: ["Venus", 0.7233, 0.0068, 3.39, 181.98, 131.60, 76.68, 224.70] },
        { name: "Earth", size: 0.09, color: 0x78aaff, element: ["Earth", 1.0000, 0.0167, 0.00, 100.46, 102.94, 0.00, 365.256], observer: true },
        { name: "Moon", size: 0.054, color: 0xc8ccd3, element: null },
        { name: "Mars", size: 0.064, color: 0xe47e61, element: ["Mars", 1.5237, 0.0934, 1.85, 355.45, 336.04, 49.56, 686.98] },
        { name: "Jupiter", size: 0.10, color: 0xd5b18d, element: ["Jupiter", 5.2028, 0.0485, 1.30, 34.40, 14.75, 100.47, 4332.59] },
        { name: "Saturn", size: 0.09, color: 0xd6c291, element: ["Saturn", 9.5388, 0.0555, 2.49, 49.94, 92.43, 113.66, 10759.22] },
        { name: "Uranus", size: 0.073, color: 0x91d8dc, element: ["Uranus", 19.1914, 0.0463, 0.77, 313.23, 170.96, 74.01, 30688.5] },
        { name: "Neptune", size: 0.073, color: 0x668cff, element: ["Neptune", 30.0611, 0.0095, 1.77, 304.88, 44.97, 131.78, 60182] }
    ];

    const planetTextures = {
        Earth: "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
        Moon: "https://threejs.org/examples/textures/planets/moon_1024.jpg"
    };
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    function seededRandomFactory(seedValue) {
        let seed = seedValue;
        return () => {
            seed = seed * 16807 % 2147483647;
            return (seed - 1) / 2147483646;
        };
    }

    function daysSinceJ2000(date) {
        return (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
    }

    function solveEccentricAnomaly(meanAnomaly, eccentricity) {
        let anomaly = meanAnomaly;
        for (let i = 0; i < 8; i++) {
            anomaly -= (anomaly - eccentricity * Math.sin(anomaly) - meanAnomaly) /
                (1 - eccentricity * Math.cos(anomaly));
        }
        return anomaly;
    }

    // Approximate J2000 Kepler elements are used for planet directions and distances.
    function heliocentricEcliptic(element, date) {
        const [, axis, eccentricity, inclination, longitude, perihelion, node, period] = element;
        const rad = Math.PI / 180;
        const mean = ((longitude - perihelion) * rad + daysSinceJ2000(date) * TWO_PI / period) % TWO_PI;
        const E = solveEccentricAnomaly(mean, eccentricity);
        const x = axis * (Math.cos(E) - eccentricity);
        const y = axis * Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(E);
        const argument = (perihelion - node) * rad;
        const inc = inclination * rad;
        const asc = node * rad;
        const px = x * Math.cos(argument) - y * Math.sin(argument);
        const py = x * Math.sin(argument) + y * Math.cos(argument);

        return new THREE.Vector3(
            px * Math.cos(asc) - py * Math.sin(asc) * Math.cos(inc),
            py * Math.sin(inc),
            px * Math.sin(asc) + py * Math.cos(asc) * Math.cos(inc)
        );
    }

    function eclipticToEquatorial(vector) {
        return new THREE.Vector3(
            vector.x,
            vector.z * Math.cos(OBLIQUITY) - vector.y * Math.sin(OBLIQUITY),
            vector.z * Math.sin(OBLIQUITY) + vector.y * Math.cos(OBLIQUITY)
        );
    }

    function lunarGeocentricEcliptic(date) {
        const days = daysSinceJ2000(date);
        const rad = Math.PI / 180;
        const meanLongitude = (218.316 + 13.176396 * days) * rad;
        const meanAnomaly = (134.963 + 13.064993 * days) * rad;
        const argumentLatitude = (93.272 + 13.229350 * days) * rad;
        const longitude = meanLongitude + 6.289 * rad * Math.sin(meanAnomaly);
        const latitude = 5.128 * rad * Math.sin(argumentLatitude);
        const distanceKm = 385001 - 20905 * Math.cos(meanAnomaly);
        const distanceAU = distanceKm / AU_KM;
        const cosLatitude = Math.cos(latitude);
        return {
            vector: new THREE.Vector3(
                distanceAU * cosLatitude * Math.cos(longitude),
                distanceAU * Math.sin(latitude),
                distanceAU * cosLatitude * Math.sin(longitude)
            ),
            distanceKm
        };
    }

    function displayRadius(distanceKm) {
        return 1.1 + 0.58 * Math.log1p(Math.max(0, distanceKm) / 1000);
    }

    function skyPosition(geocentricEquatorial, distanceKm) {
        const direction = geocentricEquatorial.clone().normalize();
        return direction.multiplyScalar(displayRadius(distanceKm));
    }

    function makeCanvasTexture(draw, width = 256, height = 256) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        draw(canvas.getContext("2d"), width, height);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    const glowTexture = makeCanvasTexture((ctx, width, height) => {
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 2, width / 2, height / 2, width / 2);
        gradient.addColorStop(0, "rgba(255,255,255,0.92)");
        gradient.addColorStop(0.12, "rgba(255,255,255,0.46)");
        gradient.addColorStop(0.42, "rgba(255,255,255,0.08)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    });

    function addObjectLabel(text, parent, offset) {
        const texture = makeCanvasTexture((ctx, width, height) => {
            ctx.font = "bold 30px Georgia, serif";
            ctx.fillStyle = "rgba(231,239,255,0.96)";
            ctx.textAlign = "center";
            ctx.shadowColor = "rgba(0,0,0,0.9)";
            ctx.shadowBlur = 8;
            ctx.fillText(text, width / 2, height * 0.67);
        });
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false
        }));
        sprite.scale.set(0.72, 0.22, 1);
        sprite.position.copy(offset);
        parent.add(sprite);
    }

    function makePlanetObject(definition) {
        const group = new THREE.Group();
        group.userData = { kind: "planet", name: definition.name };

        const hitTarget = new THREE.Mesh(
            new THREE.SphereGeometry(Math.max(definition.size * 2.6, 0.17), 12, 10),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, colorWrite: false, depthWrite: false })
        );
        hitTarget.userData = group.userData;
        group.add(hitTarget);

        const material = new THREE.MeshStandardMaterial({
            color: planetTextures[definition.name] ? 0xffffff : definition.color,
            roughness: 0.84,
            metalness: 0,
            emissive: definition.name === "Sun" ? 0xffa73b : definition.color,
            emissiveIntensity: definition.name === "Sun" ? 1.2 : 0.16
        });
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(definition.size, 24, 18),
            definition.name === "Sun" ? new THREE.MeshBasicMaterial({ color: definition.color }) : material
        );
        sphere.userData = group.userData;
        group.add(sphere);
        selectable.push(hitTarget);

        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTexture,
            color: definition.name === "Sun" ? 0xffbd58 : definition.color,
            transparent: true,
            opacity: definition.name === "Sun" ? 0.42 : 0.24,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        }));
        const glowSize = definition.name === "Sun" ? 0.62 : 0.35;
        glow.scale.set(glowSize, glowSize, 1);
        group.add(glow);

        if (definition.name === "Saturn") {
            const rings = new THREE.Mesh(
                new THREE.RingGeometry(definition.size * 1.45, definition.size * 2.15, 48),
                new THREE.MeshBasicMaterial({
                    color: 0xc7b18b,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.62,
                    depthWrite: false
                })
            );
            rings.rotation.x = Math.PI / 2.5;
            group.add(rings);
        }

        if (planetTextures[definition.name]) {
            textureLoader.load(planetTextures[definition.name], (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                sphere.material.map = texture;
                sphere.material.color.set(0xffffff);
                sphere.material.needsUpdate = true;
            }, undefined, () => {});
        }

        if (definition.name !== "Earth") {
            addObjectLabel(definition.name, group, new THREE.Vector3(0, definition.size + 0.12, 0));
        } else {
            addObjectLabel("Earth · observer", group, new THREE.Vector3(0, 0.16, 0));
        }

        sky.add(group);
        planetObjects.set(definition.name, { definition, group, hitTarget, sphere, position: new THREE.Vector3(), distanceKm: 0 });
        return planetObjects.get(definition.name);
    }

    const planetRecords = planetDefinitions.map(makePlanetObject);

    function computePlanetPositions(date = new Date()) {
        const earthDefinition = planetDefinitions.find(body => body.name === "Earth");
        const earthSunVector = heliocentricEcliptic(earthDefinition.element, date);
        const positions = new Map();

        for (const definition of planetDefinitions) {
            if (definition.name === "Earth") {
                positions.set("Earth", {
                    position: new THREE.Vector3(0, -0.36, 0),
                    distanceKm: 0,
                    heliocentric: earthSunVector
                });
                continue;
            }

            if (definition.name === "Moon") {
                const moon = lunarGeocentricEcliptic(date);
                const equatorial = eclipticToEquatorial(moon.vector);
                positions.set("Moon", {
                    position: skyPosition(equatorial, moon.distanceKm),
                    distanceKm: moon.distanceKm,
                    heliocentric: earthSunVector.clone().add(moon.vector)
                });
                continue;
            }

            if (definition.name === "Sun") {
                const geocentric = earthSunVector.clone().negate();
                const distanceKm = geocentric.length() * AU_KM;
                positions.set("Sun", {
                    position: skyPosition(eclipticToEquatorial(geocentric), distanceKm),
                    distanceKm,
                    heliocentric: new THREE.Vector3()
                });
                continue;
            }

            const heliocentric = heliocentricEcliptic(definition.element, date);
            const geocentric = heliocentric.clone().sub(earthSunVector);
            const distanceKm = geocentric.length() * AU_KM;
            positions.set(definition.name, {
                position: skyPosition(eclipticToEquatorial(geocentric), distanceKm),
                distanceKm,
                heliocentric
            });
        }

        return { date, earthSunVector, positions };
    }

    function updatePlanetPositions(date = new Date()) {
        astronomySnapshot = computePlanetPositions(date);
        for (const [name, data] of astronomySnapshot.positions) {
            const record = planetObjects.get(name);
            if (!record) continue;
            record.position.copy(data.position);
            record.distanceKm = data.distanceKm;
            record.group.position.copy(data.position);
        }

        const sunPosition = planetObjects.get("Sun")?.position;
        if (sunPosition) planetLight.position.copy(sunPosition).multiplyScalar(18);
        lastAstronomyUpdate = performance.now();

        if (infoPanel.dataset.planetName) {
            const current = planetObjects.get(infoPanel.dataset.planetName);
            if (current) showPlanetInfo(current);
        }
    }

    updatePlanetPositions();

    function createStars() {
        const count = 14500;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const random = seededRandomFactory(82171);
        const hotColors = [0.54, 0.59, 0.09, 0.13, 0.02];

        for (let i = 0; i < count; i++) {
            let direction;
            if (random() < 0.38) {
                const longitude = random() * TWO_PI;
                const latitude = (random() - 0.5) * 0.5;
                direction = new THREE.Vector3(
                    Math.cos(latitude) * Math.sin(longitude),
                    Math.sin(latitude),
                    -Math.cos(latitude) * Math.cos(longitude)
                );
            } else {
                const y = random() * 2 - 1;
                const longitude = random() * TWO_PI;
                const radial = Math.sqrt(1 - y * y);
                direction = new THREE.Vector3(radial * Math.sin(longitude), y, -radial * Math.cos(longitude));
            }

            const radius = 175 + random() * 270;
            direction.multiplyScalar(radius);
            direction.toArray(positions, i * 3);

            const bright = random() < 0.035;
            const lightness = bright ? 0.72 + random() * 0.25 : 0.38 + random() * 0.36;
            const hue = hotColors[Math.floor(random() * hotColors.length)] + (random() - 0.5) * 0.025;
            new THREE.Color().setHSL((hue + 1) % 1, 0.18 + random() * 0.18, lightness).toArray(colors, i * 3);
            sizes[i] = bright ? 2.4 + random() * 2.0 : 0.65 + random() * 1.35;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
        const material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute vec3 aColor;
                attribute float aSize;
                varying vec3 vColor;
                void main() {
                    vColor = aColor;
                    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = clamp(aSize * (245.0 / max(1.0, -viewPosition.z)), 1.0, 7.0);
                    gl_Position = projectionMatrix * viewPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    float radius = distance(gl_PointCoord, vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.2, 0.5, radius);
                    if (alpha < 0.02) discard;
                    gl_FragColor = vec4(vColor, alpha * 0.88);
                }
            `
        });
        scene.add(new THREE.Points(geometry, material));
    }

    createStars();

    function raDecDirection(hours, degrees) {
        const ra = hours * 15 * Math.PI / 180;
        const dec = degrees * Math.PI / 180;
        return new THREE.Vector3(
            Math.cos(dec) * Math.sin(ra),
            Math.sin(dec),
            -Math.cos(dec) * Math.cos(ra)
        );
    }

    function addConstellation(name, stars) {
        const radius = 260;
        const vectors = stars.map(([ra, dec]) => raDecDirection(ra, dec).multiplyScalar(radius));
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(vectors),
            new THREE.LineBasicMaterial({ color: 0x7ba5d9, transparent: true, opacity: 0.19, depthWrite: false })
        );
        line.userData = { kind: "constellation", name };
        scene.add(line);
    }

    addConstellation("Ursa Major", [
        [11.062, 61.75], [11.031, 56.38], [11.897, 53.69], [12.257, 57.03],
        [12.900, 55.96], [13.399, 54.93], [13.792, 49.31]
    ]);
    addConstellation("Orion", [
        [5.919, 7.41], [5.419, 6.35], [5.679, -1.94], [5.604, -1.20],
        [5.533, -0.30], [5.242, -8.20], [5.796, -9.67], [5.919, 7.41]
    ]);

    const positionCache = new Map();
    const pendingPositionRequests = new Map();
    let satelliteLibraryPromise;

    function validPosition(position) {
        return position?.frame === "heliocentric-au" &&
            [position.x, position.y, position.z].every(Number.isFinite);
    }

    function missionKey(mission) {
        return String(mission.id ?? mission.missionName ?? mission.name ?? "mission");
    }

    function resolveSpacecraft(mission) {
        const text = [mission?.name, mission?.missionName, mission?.spacecraftName].filter(Boolean).join(" ");
        return spacecraftCatalog.find(entry => entry.pattern.test(text)) || null;
    }

    function isMissionAlias(query) {
        const normalized = String(query || "").trim().toLowerCase();
        return spacecraftCatalog.some(entry => entry.aliases.some(alias => alias.toLowerCase() === normalized));
    }

    function matchesMission(mission, query) {
        const normalized = String(query || "").trim().toLowerCase();
        if (!normalized) return false;
        const craft = resolveSpacecraft(mission);
        if (isMissionAlias(normalized)) {
            return Boolean(craft?.aliases.some(alias => alias.toLowerCase() === normalized));
        }
        return [mission?.name, mission?.missionName, mission?.spacecraftName, ...(craft?.aliases || [])]
            .filter(Boolean)
            .some(value => String(value).toLowerCase().includes(normalized));
    }

    function cachedPosition(key, load) {
        const cached = positionCache.get(key);
        if (cached && Date.now() - cached.fetchedAt < 5 * 60 * 1000) return Promise.resolve(cached.value);
        if (pendingPositionRequests.has(key)) return pendingPositionRequests.get(key);
        const request = load().then(value => {
            positionCache.set(key, { value, fetchedAt: Date.now() });
            return value;
        }).finally(() => pendingPositionRequests.delete(key));
        pendingPositionRequests.set(key, request);
        return request;
    }

    function fetchHorizonsPosition(targetId) {
        return cachedPosition(`horizons:${targetId}`, async () => {
            const response = await fetch(
                `http://localhost:3000/api/spacecraft/${encodeURIComponent(targetId)}/ephemeris`,
                { signal: AbortSignal.timeout(25000) }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Horizons position unavailable");
            if (!validPosition(data.position)) throw new Error("Horizons returned invalid coordinates");
            return data;
        });
    }

    function precessTemeToJ2000(position, date) {
        const jd = date.getTime() / 86400000 + 2440587.5;
        const T = (jd - 2451545) / 36525;
        const arcsec = Math.PI / (180 * 3600);
        const zeta = (2306.2181 * T + 0.30188 * T ** 2 + 0.017998 * T ** 3) * arcsec;
        const z = (2306.2181 * T + 1.09468 * T ** 2 + 0.018203 * T ** 3) * arcsec;
        const theta = (2004.3109 * T - 0.42665 * T ** 2 - 0.041833 * T ** 3) * arcsec;
        const rz = (v, angle) => ({
            x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
            y: v.x * Math.sin(angle) + v.y * Math.cos(angle),
            z: v.z
        });
        const ry = (v, angle) => ({
            x: v.x * Math.cos(angle) + v.z * Math.sin(angle),
            y: v.y,
            z: -v.x * Math.sin(angle) + v.z * Math.cos(angle)
        });
        return rz(ry(rz(position, -z), theta), -zeta);
    }

    function equatorialToEcliptic(vector) {
        return {
            x: vector.x,
            y: vector.y * Math.cos(OBLIQUITY) + vector.z * Math.sin(OBLIQUITY),
            z: -vector.y * Math.sin(OBLIQUITY) + vector.z * Math.cos(OBLIQUITY)
        };
    }

    function fetchIssPosition(catalogId) {
        return cachedPosition(`celestrak:${catalogId}`, async () => {
            const [tleResponse, earth] = await Promise.all([
                fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${catalogId}&FORMAT=TLE`, {
                    cache: "no-store",
                    signal: AbortSignal.timeout(15000)
                }),
                fetchHorizonsPosition("earth")
            ]);
            if (!tleResponse.ok) throw new Error(`CelesTrak returned HTTP ${tleResponse.status}`);
            const lines = (await tleResponse.text()).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
            const line1 = lines.find(line => line.startsWith("1 "));
            const line2 = lines.find(line => line.startsWith("2 "));
            if (!line1 || !line2 || line1.slice(2, 7).trim() !== catalogId) throw new Error("Invalid ISS TLE");

            satelliteLibraryPromise ||= import("https://cdn.jsdelivr.net/npm/satellite.js@6.0.1/+esm");
            const satellite = await satelliteLibraryPromise;
            const satrec = satellite.twoline2satrec(line1, line2);
            const now = new Date();
            const earthPosition = earth.position;

            function propagatedAt(date) {
                const state = satellite.propagate(satrec, date);
                const teme = state?.position;
                if (!teme || ![teme.x, teme.y, teme.z].every(Number.isFinite)) return null;
                const eqJ2000 = precessTemeToJ2000(teme, date);
                const eclipticKm = equatorialToEcliptic(eqJ2000);
                return {
                    frame: "heliocentric-au",
                    x: earthPosition.x + eclipticKm.x / AU_KM,
                    y: earthPosition.y + eclipticKm.y / AU_KM,
                    z: earthPosition.z + eclipticKm.z / AU_KM,
                    relativeTo: "Earth",
                    geocentricEclipticKm: eclipticKm,
                    epoch: date.toISOString()
                };
            }

            const position = propagatedAt(now);
            if (!position) throw new Error("SGP4 could not propagate ISS TLE");
            const trajectory = [];
            for (let minute = -45; minute <= 45; minute += 5) {
                const point = propagatedAt(new Date(now.getTime() + minute * 60000));
                if (point) trajectory.push(point);
            }

            const epoch = line1.slice(18, 32).trim();
            const shortYear = Number(epoch.slice(0, 2));
            const year = shortYear >= 57 ? 1900 + shortYear : 2000 + shortYear;
            const updated = new Date(Date.UTC(year, 0, 1) + (Number(epoch.slice(2)) - 1) * 86400000);
            return {
                spacecraftName: "International Space Station",
                position,
                trajectory,
                lastUpdated: Number.isFinite(updated.getTime()) ? updated.toISOString() : null,
                source: "CelesTrak TLE + SGP4; NASA/JPL Horizons Earth state"
            };
        });
    }

    function positionToSky(position, earthVector) {
        let geocentric;
        let distanceKm;
        if (position.relativeTo === "Earth" && position.geocentricEclipticKm) {
            const g = position.geocentricEclipticKm;
            geocentric = new THREE.Vector3(g.x, g.z, g.y);
            distanceKm = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z);
        } else {
            const heliocentric = new THREE.Vector3(position.x, position.y, position.z);
            const earth = earthVector || astronomySnapshot.earthSunVector;
            geocentric = heliocentric.sub(earth);
            distanceKm = geocentric.length() * AU_KM;
        }
        const eq = eclipticToEquatorial(geocentric);
        return skyPosition(eq, distanceKm);
    }

    function removeMissionMarker(key) {
        const record = missionMarkers.get(key);
        if (!record) return;
        sky.remove(record.group);
        const index = selectable.indexOf(record.hitTarget);
        if (index >= 0) selectable.splice(index, 1);
        record.group.traverse(object => {
            object.geometry?.dispose?.();
            if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
            else object.material?.dispose?.();
        });
        missionMarkers.delete(key);
    }

    function addMissionMarker(mission, ephemeris) {
        const key = missionKey(mission);
        removeMissionMarker(key);
        const name = mission.name || mission.missionName || ephemeris.spacecraftName || "Unnamed mission";
        const position = ephemeris.position || mission.position;
        if (!validPosition(position)) return null;

        const group = new THREE.Group();
        group.position.copy(positionToSky(position, ephemeris.earthPosition));
        group.userData = { kind: "mission", key, name };

        const hitTarget = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 12, 10),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, colorWrite: false, depthWrite: false })
        );
        hitTarget.userData = group.userData;
        group.add(hitTarget);

        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.045, 14, 10),
            new THREE.MeshBasicMaterial({ color: 0x7feaff })
        );
        marker.userData = group.userData;
        group.add(marker);

        const halo = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0x54dfff,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        }));
        halo.scale.set(0.3, 0.3, 1);
        group.add(halo);

        const selection = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0xffd56a,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        }));
        selection.scale.set(0.6, 0.6, 1);
        group.add(selection);

        const trajectoryPoints = Array.isArray(ephemeris.trajectory) ? ephemeris.trajectory : [];
        let trajectory = null;
        if (trajectoryPoints.length > 1 && trajectoryPoints.every(validPosition)) {
            const earthVector = ephemeris.earthTrajectory;
            const positions = trajectoryPoints.map((point, index) => {
                const earth = Array.isArray(earthVector) ? earthVector[index] : ephemeris.earthPosition;
                return positionToSky(point, earth);
            });
            trajectory = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(positions),
                new THREE.LineBasicMaterial({ color: 0x6adbf0, transparent: true, opacity: 0.42, depthWrite: false })
            );
            sky.add(trajectory);
        }

        sky.add(group);
        selectable.push(hitTarget);
        const record = { group, hitTarget, selection, trajectory, mission, ephemeris };
        missionMarkers.set(key, record);
        return record;
    }

    function getPlanetMissions(planetName) {
        const patterns = {
            Sun: /solar|\bsun\b|heliophysics|parker|soho/i,
            Mercury: /\bmercury\b|messenger|bepicolombo/i,
            Venus: /\bvenus\b|akatsuki|magellan/i,
            Earth: /\bearth\b|low earth orbit|geostationary|earth orbit|space station|\biss\b|earth observation/i,
            Moon: /\bmoon\b|\blunar\b|chandrayaan|apollo|artemis|\bluna\b|gateway/i,
            Mars: /\bmars\b|perseverance|curiosity|maven|ingenuity|tianwen|hope orbiter/i,
            Jupiter: /\bjupiter\b|juno|europa|ganymede|juice|galileo/i,
            Saturn: /\bsaturn\b|cassini|huygens|titan/i,
            Uranus: /\buranus\b/i,
            Neptune: /\bneptune\b/i
        };
        const pattern = patterns[planetName];
        if (!pattern) return [];
        const seen = new Set();
        return missionData.filter(mission => {
            const targetFields = [
                mission.name,
                mission.missionName,
                mission.spacecraftName,
                mission.destination,
                mission.target,
                mission.missionType
            ].filter(Boolean).join(" ");
            const name = mission.name || mission.missionName || "Unnamed mission";
            const hasTargetMetadata = [mission.destination, mission.target]
                .some(value => value && String(value).trim() && String(value).toLowerCase() !== "n/a");
            const matches = pattern.test(targetFields) ||
                (!hasTargetMetadata && pattern.test(String(mission.description || "")));
            if (!matches || seen.has(name)) return false;
            seen.add(name);
            return true;
        });
    }

    function formatEarthDistance(distanceKm, planetName) {
        if (planetName === "Earth" || distanceKm < 1) return "0 km (observer)";
        if (distanceKm < 1000000) return `${Math.round(distanceKm).toLocaleString()} km`;
        return `${(distanceKm / 1000000).toFixed(1)} million km`;
    }

    function showPlanetInfo(planet) {
        const name = planet.definition.name;
        panelName.textContent = name.toUpperCase();
        panelDistance.textContent = formatEarthDistance(planet.distanceKm, name);
        panelMissions.replaceChildren();

        const missions = getPlanetMissions(name);
        if (missions.length === 0) {
            const item = document.createElement("li");
            item.textContent = "No missions found";
            panelMissions.appendChild(item);
        } else {
            for (const mission of missions) {
                const item = document.createElement("li");
                item.textContent = mission.name || mission.missionName || "Unnamed mission";
                panelMissions.appendChild(item);
            }
        }

        infoPanel.dataset.planetName = name;
        infoPanel.hidden = false;
    }

    function resolveMissionPlanet(mission) {
        const text = [mission?.destination, mission?.target, mission?.missionType, mission?.name]
            .filter(Boolean).join(" ").toLowerCase();
        const order = ["Moon", "Mars", "Jupiter", "Saturn", "Venus", "Mercury", "Uranus", "Neptune", "Sun", "Earth"];
        return order.find(name => {
            if (name === "Moon") return /moon|lunar|chandrayaan|apollo|artemis/.test(text);
            if (name === "Sun") return /sun|solar|heliophysics|parker/.test(text);
            return text.includes(name.toLowerCase());
        }) || null;
    }

    function focusPlanet(name) {
        const planet = planetObjects.get(String(name || ""));
        if (!planet) return false;
        infoPanel.hidden = true;
        missionLabel.hidden = true;
        focusObject(planet.group);
        return true;
    }

    function focusObject(object) {
        const target = object.getWorldPosition(new THREE.Vector3());
        const direction = camera.position.clone().sub(controls.target);
        if (direction.lengthSq() < 0.0001) direction.set(0, 0, 1);
        direction.normalize();
        const distance = object.userData.kind === "mission" ? 0.42 : Math.max(0.5, Math.min(3.2, target.length() * 0.24));
        focusAnimation = {
            started: performance.now(),
            duration: 1050,
            startTarget: controls.target.clone(),
            startPosition: camera.position.clone(),
            target,
            endPosition: target.clone().addScaledVector(direction, distance)
        };
        controls.enabled = false;
    }

    async function focusMission(mission) {
        if (!mission) return;
        infoPanel.hidden = true;
        delete infoPanel.dataset.planetName;
        missionLabel.hidden = true;
        for (const marker of missionMarkers.values()) marker.selection.material.opacity = 0;

        const spacecraft = resolveSpacecraft(mission);
        const providedPosition = mission.position || mission.ephemeris?.position;
        if (providedPosition && validPosition(providedPosition)) {
            const [earth, ephemeris] = await Promise.all([
                spacecraft?.provider === "horizons" ? fetchHorizonsPosition("earth").catch(() => null) : Promise.resolve(null),
                Promise.resolve(mission.ephemeris || mission)
            ]);
            const record = addMissionMarker(mission, {
                ...ephemeris,
                position: providedPosition,
                earthPosition: earth?.position
            });
            if (record) {
                record.selection.material.opacity = 0.85;
                status.textContent = `Last updated: ${mission.lastUpdated || "timestamp unavailable"}`;
                focusObject(record.group);
                return;
            }
        }

        if (spacecraft?.provider === "unavailable") {
            status.textContent = `${spacecraft.name}: Verified spacecraft position unavailable.`;
        }

        if (spacecraft && spacecraft.provider !== "unavailable") {
            try {
                status.textContent = `Retrieving verified position for ${spacecraft.name}…`;
                let ephemeris;
                let earth;
                if (spacecraft.provider === "horizons") {
                    [ephemeris, earth] = await Promise.all([
                        fetchHorizonsPosition(spacecraft.targetId),
                        fetchHorizonsPosition("earth")
                    ]);
                    ephemeris.earthPosition = earth.position;
                    ephemeris.earthTrajectory = earth.trajectory;
                } else {
                    ephemeris = await fetchIssPosition(spacecraft.catalogId);
                }

                const displayMission = {
                    ...mission,
                    name: mission.name || spacecraft.name,
                    spacecraftName: ephemeris.spacecraftName || spacecraft.name,
                    position: ephemeris.position,
                    trajectory: ephemeris.trajectory,
                    lastUpdated: ephemeris.lastUpdated,
                    source: ephemeris.source,
                    ephemeris
                };
                const record = addMissionMarker(displayMission, ephemeris);
                if (!record) throw new Error("Provider coordinates could not be plotted");
                record.selection.material.opacity = 0.85;
                status.textContent = `Last updated: ${ephemeris.lastUpdated ? new Date(ephemeris.lastUpdated).toLocaleString() : "timestamp unavailable"} · ${ephemeris.source}`;
                focusObject(record.group);
                return;
            } catch (error) {
                console.warn("Spacecraft ephemeris unavailable:", error);
                status.textContent = `${spacecraft.name}: Verified spacecraft position unavailable.`;
            }
        }

        const targetName = resolveMissionPlanet(mission);
        const target = targetName ? planetObjects.get(targetName) : null;
        if (target) focusObject(target.group);
    }

    function setMissions(missions) {
        missionData = Array.isArray(missions) ? missions : [];
        window.__spaceMissionData = missionData;
        const validIds = new Set(missionData.map(missionKey));
        for (const mission of missionData) {
            const ephemeris = mission.ephemeris || mission;
            if (validPosition(ephemeris.position)) addMissionMarker(mission, ephemeris);
        }
        for (const key of missionMarkers.keys()) {
            if (!validIds.has(key)) removeMissionMarker(key);
        }
    }

    function activeMissionSummary() {
        return [...missionMarkers.values()].map(({ mission, trajectory }) => ({
            missionName: mission.name || mission.missionName || "Unnamed mission",
            spacecraftName: mission.spacecraftName || mission.name || "Spacecraft",
            hasTrajectory: Boolean(trajectory),
            source: mission.source || mission.positionSource || null,
            lastUpdated: mission.lastUpdated || null
        }));
    }

    function getViewState() {
        return {
            cameraPosition: camera.position.toArray(),
            target: controls.target.toArray(),
            distance: camera.position.distanceTo(controls.target),
            navigationEnabled: controls.enabled
        };
    }

    function getPlanetStates() {
        const bounds = renderer.domElement.getBoundingClientRect();
        return [...planetObjects.values()].map(record => {
            const projected = record.group.getWorldPosition(new THREE.Vector3()).project(camera);
            return {
                name: record.definition.name,
                distanceKm: record.distanceKm,
                screenPosition: {
                    x: bounds.left + (projected.x + 1) * 0.5 * bounds.width,
                    y: bounds.top + (1 - projected.y) * 0.5 * bounds.height,
                    visible: projected.z >= -1 && projected.z <= 1
                }
            };
        });
    }

    function animateSkyFocusFrame(now) {
        animationFrame = requestAnimationFrame(animateSkyFocusFrame);
        if (focusAnimation) {
            const progress = Math.min((now - focusAnimation.started) / focusAnimation.duration, 1);
            const eased = progress * progress * (3 - 2 * progress);
            controls.target.copy(focusAnimation.startTarget).lerp(focusAnimation.target, eased);
            camera.position.copy(focusAnimation.startPosition).lerp(focusAnimation.endPosition, eased);
            camera.lookAt(controls.target);
            if (progress >= 1) {
                focusAnimation = null;
                controls.enabled = true;
                controls.update();
            }
        } else {
            controls.update();
        }

        if (now - lastAstronomyUpdate > 60000) updatePlanetPositions();
        renderer.render(scene, camera);
    }

    function resize() {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let pointerOrigin = null;
    renderer.domElement.addEventListener("pointerdown", event => {
        pointerOrigin = { x: event.clientX, y: event.clientY };
    });
    renderer.domElement.addEventListener("pointerup", event => {
        if (!pointerOrigin || Math.hypot(event.clientX - pointerOrigin.x, event.clientY - pointerOrigin.y) > 5) {
            pointerOrigin = null;
            return;
        }
        pointerOrigin = null;
        const bounds = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(selectable, false)[0]?.object;
        if (!hit) return;

        const data = hit.userData;
        if (data.kind === "planet") {
            missionLabel.hidden = true;
            showPlanetInfo(planetObjects.get(data.name));
            for (const marker of missionMarkers.values()) marker.selection.material.opacity = 0;
        } else if (data.kind === "mission") {
            infoPanel.hidden = true;
            delete infoPanel.dataset.planetName;
            missionLabel.textContent = data.name;
            missionLabel.hidden = false;
            for (const marker of missionMarkers.values()) marker.selection.material.opacity = 0;
            const record = missionMarkers.get(data.key);
            if (record) record.selection.material.opacity = 0.95;
            status.textContent = "";
        }
        focusObject(data.kind === "planet" ? planetObjects.get(data.name).group : missionMarkers.get(data.key).group);
    });

    closePanel?.addEventListener("click", () => {
        infoPanel.hidden = true;
        delete infoPanel.dataset.planetName;
    });
    resetButton?.addEventListener("click", () => {
        focusAnimation = null;
        controls.enabled = true;
        missionLabel.hidden = true;
        infoPanel.hidden = true;
        delete infoPanel.dataset.planetName;
        controls.target.set(0, 0, -1);
        camera.position.set(0, 0, 0.001);
    });

    window.addEventListener("pagehide", () => {
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        controls.dispose();
        renderer.dispose();
    }, { once: true });

    window.Space3D = {
        setMissions,
        focusMission,
        focusPlanet,
        matchesMission,
        isMissionAlias,
        showPlanetInfo,
        getActiveMissions: activeMissionSummary,
        getPlanetStates,
        getViewState,
        registry: spacecraftCatalog
    };

    if (Array.isArray(window.__spaceMissionData)) setMissions(window.__spaceMissionData);
    updatePlanetPositions();
    animateSkyFocusFrame(performance.now());
})();
