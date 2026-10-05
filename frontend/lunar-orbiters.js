import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const lunarMissions = [
    { name: "Lunar Orbiter 1", aliases: ["LO-1"], agency: "NASA", agencyFilters: ["NASA"], country: "United States", flag: "🇺🇸", region: "USA", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "1966-08-10", status: "Historical", description: "Mapped the lunar surface to help identify safe landing sites for the Apollo program.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1966-073A" },
    { name: "Lunar Orbiter 2", aliases: ["LO-2"], agency: "NASA", agencyFilters: ["NASA"], country: "United States", flag: "🇺🇸", region: "USA", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "1966-11-06", status: "Historical", description: "Photographed candidate Apollo landing areas and returned detailed lunar surface imagery.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1966-100A" },
    { name: "Lunar Orbiter 3", aliases: ["LO-3"], agency: "NASA", agencyFilters: ["NASA"], country: "United States", flag: "🇺🇸", region: "USA", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "1967-02-05", status: "Historical", description: "Surveyed the Moon and supplied high-resolution photographs for Apollo site selection.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-008A" },
    { name: "Lunar Orbiter 4", aliases: ["LO-4"], agency: "NASA", agencyFilters: ["NASA"], country: "United States", flag: "🇺🇸", region: "USA", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "1967-05-04", status: "Historical", description: "Photographed most of the lunar near side and a large portion of the far side.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-041A" },
    { name: "Lunar Orbiter 5", aliases: ["LO-5"], agency: "NASA", agencyFilters: ["NASA"], country: "United States", flag: "🇺🇸", region: "USA", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "1967-08-01", status: "Historical", description: "Completed the Lunar Orbiter photographic survey with close imaging of selected sites.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-075A" },
    { name: "Clementine", aliases: ["DSPSE"], agency: "NASA/DoD", agencyFilters: ["NASA/DoD"], country: "United States", flag: "🇺🇸", region: "USA", missionType: "Lunar Orbiter / Technology Demonstrator", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "1994-01-25", status: "Completed", description: "Joint NASA and U.S. Department of Defense mission that mapped the Moon and tested spacecraft technologies.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1994-004A" },
    { name: "Lunar Prospector", aliases: ["LP"], agency: "NASA", agencyFilters: ["NASA"], country: "United States", flag: "🇺🇸", region: "USA", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "1998-01-07", status: "Completed", description: "Mapped lunar composition, gravity, magnetic fields, and evidence for polar hydrogen.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1998-001A" },
    { name: "Lunar Reconnaissance Orbiter (LRO)", aliases: ["LRO", "Lunar Reconnaissance Orbiter"], agency: "NASA", agencyFilters: ["NASA"], country: "United States", flag: "🇺🇸", region: "USA", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit", launchDate: "2009-06-18", status: "Active", description: "Studies the lunar surface, environment, and resources while supporting future exploration planning.", source: "https://science.nasa.gov/mission/lro/" },
    { name: "ARTEMIS P1", aliases: ["THEMIS B", "ARTEMIS 1"], agency: "NASA", agencyFilters: ["NASA"], country: "United States", flag: "🇺🇸", region: "USA", missionType: "Lunar Orbiter / Heliophysics", destination: "Moon", location: "Lunar Orbit", launchDate: "2007-02-17", status: "Active", description: "One of two repurposed THEMIS spacecraft studying the solar wind and the Moon’s space environment.", source: "https://themis.igpp.ucla.edu/artemis/" },
    { name: "ARTEMIS P2", aliases: ["THEMIS C", "ARTEMIS 2"], agency: "NASA", agencyFilters: ["NASA"], country: "United States", flag: "🇺🇸", region: "USA", missionType: "Lunar Orbiter / Heliophysics", destination: "Moon", location: "Lunar Orbit", launchDate: "2007-02-17", status: "Active", description: "Partner spacecraft to ARTEMIS P1, investigating lunar plasma and solar-wind interactions.", source: "https://themis.igpp.ucla.edu/artemis/" },
    { name: "Chandrayaan-1", aliases: ["Chandrayaan 1"], agency: "ISRO", agencyFilters: ["ISRO"], country: "India", flag: "🇮🇳", region: "India", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "2008-10-22", status: "Completed", description: "India’s first lunar mission mapped the Moon and contributed observations of lunar water signatures.", source: "https://www.isro.gov.in/Chandrayaan_1.html" },
    { name: "Chandrayaan-2 Orbiter", aliases: ["Chandrayaan-2", "Chandrayaan 2", "CH-2 Orbiter"], agency: "ISRO", agencyFilters: ["ISRO"], country: "India", flag: "🇮🇳", region: "India", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit", launchDate: "2019-07-22", status: "Active", description: "The orbiter studies lunar topography, mineralogy, exosphere, and surface-water distribution.", source: "https://www.isro.gov.in/Chandrayaan2.html" },
    { name: "Kaguya (SELENE)", aliases: ["Kaguya", "SELENE"], agency: "JAXA", agencyFilters: ["JAXA"], country: "Japan", flag: "🇯🇵", region: "Japan", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "2007-09-14", status: "Completed", description: "Japan’s SELENE mission mapped lunar gravity, surface, and geologic properties with multiple instruments.", source: "https://global.jaxa.jp/projects/sas/selene/" },
    { name: "Hiten", aliases: ["MUSES-A"], agency: "JAXA", agencyFilters: ["JAXA"], country: "Japan", flag: "🇯🇵", region: "Japan", missionType: "Lunar Orbiter / Technology Demonstrator", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "1990-01-24", status: "Completed", description: "Japan’s first lunar spacecraft tested lunar swingby and capture techniques and deployed the Hagoromo subsatellite.", source: "https://global.jaxa.jp/projects/sas/muses_a/" },
    { name: "SMART-1", aliases: ["SMART 1"], agency: "ESA", agencyFilters: ["ESA"], country: "Europe", flag: "🇪🇺", region: "Europe", missionType: "Lunar Orbiter / Technology Demonstrator", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "2003-09-27", status: "Completed", description: "ESA’s technology demonstrator used solar-electric propulsion on its journey to lunar orbit and mapped the Moon.", source: "https://www.esa.int/Science_Exploration/Space_Science/SMART-1" },
    { name: "Luna 10", aliases: ["Lunik 10"], agency: "Soviet Union", agencyFilters: ["Soviet Union"], country: "Soviet Union", flag: "☭", region: "Soviet Union", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "1966-03-31", status: "Historical", description: "The first spacecraft to orbit the Moon, returning scientific measurements of the lunar environment.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1966-027A" },
    { name: "Luna 11", aliases: ["Lunik 11"], agency: "Soviet Union", agencyFilters: ["Soviet Union"], country: "Soviet Union", flag: "☭", region: "Soviet Union", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "1966-08-24", status: "Historical", description: "A Soviet lunar orbiter that studied the Moon and its near-space environment.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1966-078A" },
    { name: "Luna 12", aliases: ["Lunik 12"], agency: "Soviet Union", agencyFilters: ["Soviet Union"], country: "Soviet Union", flag: "☭", region: "Soviet Union", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "1966-10-22", status: "Historical", description: "Photographed the lunar surface from orbit and returned observations of the Moon’s environment.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1966-094A" },
    { name: "Luna 14", aliases: ["Lunik 14"], agency: "Soviet Union", agencyFilters: ["Soviet Union"], country: "Soviet Union", flag: "☭", region: "Soviet Union", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "1968-04-07", status: "Historical", description: "A Soviet lunar orbiter that studied the Moon and tested communications and navigation systems.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1968-027A" },
    { name: "Chang'e 1", aliases: ["Chang'e-1", "CE-1"], agency: "CNSA", agencyFilters: ["CNSA"], country: "China", flag: "🇨🇳", region: "China", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "2007-10-24", status: "Completed", description: "China’s first lunar probe mapped the Moon and collected data about its surface and space environment.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2007-051A" },
    { name: "Chang'e 2", aliases: ["Chang'e-2", "CE-2"], agency: "CNSA", agencyFilters: ["CNSA"], country: "China", flag: "🇨🇳", region: "China", missionType: "Lunar Orbiter / Deep-Space Explorer", destination: "Moon and asteroid 4179 Toutatis", location: "Lunar Orbit — Historical", launchDate: "2010-10-01", status: "Completed", description: "Mapped the Moon before continuing to asteroid Toutatis and then into deep space.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2010-050A" },
    { name: "Chang'e 5 Orbiter", aliases: ["Chang'e-5", "CE-5 orbiter"], agency: "CNSA", agencyFilters: ["CNSA"], country: "China", flag: "🇨🇳", region: "China", missionType: "Lunar Orbiter / Sample-Return Support", destination: "Moon", location: "Lunar Orbit — Historical", launchDate: "2020-11-23", status: "Completed", description: "The service module supported the Chang’e 5 sample-return operation and later continued an extended mission.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-087A" },
    { name: "Danuri (KPLO)", aliases: ["Danuri", "KPLO", "Korea Pathfinder Lunar Orbiter"], agency: "KARI / KASA", agencyFilters: ["KASA"], country: "South Korea", flag: "🇰🇷", region: "South Korea", missionType: "Lunar Orbiter", destination: "Moon", location: "Lunar Orbit", launchDate: "2022-08-04", status: "Active", description: "South Korea’s first lunar orbiter studies the lunar surface and environment and supports future exploration planning.", source: "https://www.kari.re.kr/eng/contents/11" },
    { name: "Queqiao", aliases: ["Queqiao-1", "鹊桥"], agency: "CNSA", agencyFilters: ["CNSA"], country: "China", flag: "🇨🇳", region: "China", missionType: "Lunar Relay Satellite", destination: "Moon / Earth-Moon L2", location: "Earth-Moon L2 relay orbit — Historical", launchDate: "2018-05-20", status: "Historical", description: "Relay satellite that enabled communication with the far side of the Moon for Chang’e 4.", source: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2018-045A" },
    { name: "Queqiao-2", aliases: ["Queqiao 2", "鹊桥二号"], agency: "CNSA", agencyFilters: ["CNSA"], country: "China", flag: "🇨🇳", region: "China", missionType: "Lunar Relay Satellite", destination: "Moon / Earth-Moon L2", location: "Lunar relay orbit", launchDate: "2024-03-20", status: "Active", description: "Relay spacecraft supporting lunar far-side and south-pole exploration missions, including Chang’e 6.", source: "https://www.cnsa.gov.cn/english/" },
    { name: "Lunar Polar Exploration Mission", aliases: ["LUPEX"], agency: "JAXA / ISRO", agencyFilters: ["JAXA", "ISRO"], country: "Japan and India", flag: "🇯🇵 🇮🇳", region: "Japan / India", missionType: "Lunar South-Pole Lander and Rover (Planned)", destination: "Moon", location: "Not launched", launchDate: "Planned; date not confirmed", status: "Planned", description: "A planned Japan-India collaboration to investigate the lunar south-polar region using a lander and rover.", source: "https://global.jaxa.jp/projects/sas/lupex/" }
];

const sceneElement = document.getElementById("lunar-scene");
const detailsElement = document.getElementById("mission-details");
const searchElement = document.getElementById("lunar-search");
const agencyFilter = document.getElementById("agency-filter");
const countryFilter = document.getElementById("country-filter");
const statusFilter = document.getElementById("status-filter");
const resultCountElement = document.getElementById("lunar-result-count");
const resultsElement = document.getElementById("mission-results");
const tooltipElement = document.getElementById("lunar-tooltip");
const resetButton = document.getElementById("reset-view");

if (sceneElement && detailsElement && searchElement && agencyFilter && countryFilter && statusFilter && resultCountElement && resultsElement && tooltipElement && resetButton) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03070d);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const initialCameraPosition = new THREE.Vector3(0, 0.2, 5.05);
    camera.position.copy(initialCameraPosition);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(sceneElement.clientWidth || 900, sceneElement.clientHeight || 580, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-label", "Drag to rotate the Moon, scroll to zoom, and select mission markers.");
    sceneElement.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.minDistance = 1.35;
    controls.maxDistance = 8.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.18;

    const ambientLight = new THREE.HemisphereLight(0xd8e4f2, 0x222633, 0.9);
    scene.add(ambientLight);

    const sunlight = new THREE.DirectionalLight(0xfff5df, 2.15);
    sunlight.position.set(-4.5, 3.8, 5.5);
    scene.add(sunlight);

    const fillLight = new THREE.DirectionalLight(0x718baa, 0.42);
    fillLight.position.set(3, -2, -4);
    scene.add(fillLight);

    const lunarSystem = new THREE.Group();
    scene.add(lunarSystem);

    const moonMaterial = new THREE.MeshStandardMaterial({
        color: 0xd9d9d6,
        roughness: 0.97,
        metalness: 0,
        bumpScale: 0.032
    });
    const moonTextureUrl = "https://threejs.org/examples/textures/planets/moon_1024.jpg";
    const moonTexture = new THREE.TextureLoader().load(moonTextureUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        moonMaterial.map = texture;
        moonMaterial.bumpMap = texture;
        moonMaterial.needsUpdate = true;
    });
    moonTexture.colorSpace = THREE.SRGBColorSpace;

    const moon = new THREE.Mesh(new THREE.SphereGeometry(1, 112, 112), moonMaterial);
    moon.name = "Moon";
    moon.rotation.set(0.03, -0.35, 0.04);
    lunarSystem.add(moon);

    const lunarHaze = new THREE.Mesh(
        new THREE.SphereGeometry(1.055, 64, 64),
        new THREE.MeshBasicMaterial({ color: 0x8295aa, transparent: true, opacity: 0.055, side: THREE.BackSide, depthWrite: false })
    );
    lunarSystem.add(lunarHaze);

    const starCount = 1400;
    const starPositions = new Float32Array(starCount * 3);
    let seed = 94821;
    function seededRandom() {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    }

    for (let index = 0; index < starCount; index += 1) {
        const radius = 12 + seededRandom() * 32;
        const theta = seededRandom() * Math.PI * 2;
        const vertical = seededRandom() * 2 - 1;
        const spread = Math.sqrt(1 - vertical * vertical);
        starPositions[index * 3] = radius * spread * Math.cos(theta);
        starPositions[index * 3 + 1] = radius * vertical;
        starPositions[index * 3 + 2] = radius * spread * Math.sin(theta);
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xd9ecff, size: 0.045, transparent: true, opacity: 0.72, sizeAttenuation: true })));

    const orbitBands = [
        { radius: 1.34, rotation: [0.34, 0.18, 0.08] },
        { radius: 1.49, rotation: [1.03, -0.24, 0.16] },
        { radius: 1.64, rotation: [-0.78, 0.7, -0.12] }
    ];
    const orbitGroups = orbitBands.map((band) => {
        const group = new THREE.Group();
        group.rotation.set(...band.rotation);
        lunarSystem.add(group);
        return group;
    });

    const haloCanvas = document.createElement("canvas");
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const haloContext = haloCanvas.getContext("2d");
    const haloGradient = haloContext.createRadialGradient(64, 64, 3, 64, 64, 62);
    haloGradient.addColorStop(0, "rgba(168, 248, 255, 0.95)");
    haloGradient.addColorStop(0.18, "rgba(87, 220, 255, 0.46)");
    haloGradient.addColorStop(1, "rgba(58, 194, 255, 0)");
    haloContext.fillStyle = haloGradient;
    haloContext.fillRect(0, 0, 128, 128);
    const haloTexture = new THREE.CanvasTexture(haloCanvas);
    const haloMaterial = new THREE.SpriteMaterial({ map: haloTexture, color: 0x79eaff, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending });
    const coreGeometry = new THREE.SphereGeometry(0.035, 14, 14);
    const panelGeometry = new THREE.BoxGeometry(0.052, 0.018, 0.008);
    const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x7bcfe4, emissive: 0x155d78, emissiveIntensity: 0.65, metalness: 0.4, roughness: 0.4 });
    const orbitLineMaterial = new THREE.MeshBasicMaterial({ color: 0x65dafa, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false });
    const markers = [];
    const ringCounts = [0, 0, 0];
    const markerRaycaster = new THREE.Raycaster();
    const markerPointer = new THREE.Vector2();

    function createMarker(mission, index) {
        const bandIndex = index % orbitBands.length;
        const slot = ringCounts[bandIndex];
        const bandCount = Math.ceil((lunarMissions.length - bandIndex) / orbitBands.length);
        const angle = (slot / bandCount) * Math.PI * 2 + bandIndex * 0.22;
        ringCounts[bandIndex] += 1;

        const group = new THREE.Group();
        group.position.set(orbitBands[bandIndex].radius * Math.cos(angle), orbitBands[bandIndex].radius * Math.sin(angle), 0);
        group.rotation.z = angle;

        const halo = new THREE.Sprite(haloMaterial);
        halo.scale.set(0.2, 0.2, 1);
        group.add(halo);

        const coreMaterial = new THREE.MeshStandardMaterial({ color: 0xbdf8ff, emissive: 0x4bdcff, emissiveIntensity: 1.7, roughness: 0.26, metalness: 0.12 });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        group.add(core);

        const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        leftPanel.position.set(-0.066, 0, 0);
        group.add(leftPanel);
        const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        rightPanel.position.set(0.066, 0, 0);
        group.add(rightPanel);

        orbitGroups[bandIndex].add(group);
        const marker = { mission, group, core, halo, bandIndex, slot, angle, selected: false, searchMatch: false };
        core.userData.marker = marker;
        markers.push(marker);
    }

    lunarMissions.forEach(createMarker);

    function clearOrbitLines(group) {
        for (const child of [...group.children]) {
            if (child.userData.orbitLine) {
                group.remove(child);
                child.geometry.dispose();
            }
        }
    }

    function refreshOrbitLines() {
        orbitGroups.forEach(clearOrbitLines);
        orbitBands.forEach((band, bandIndex) => {
            const visibleMarkers = markers.filter((marker) => marker.bandIndex === bandIndex && marker.group.visible).sort((left, right) => left.slot - right.slot);
            if (visibleMarkers.length < 2) return;

            visibleMarkers.forEach((marker, index) => {
                const nextMarker = visibleMarkers[(index + 1) % visibleMarkers.length];
                let endAngle = nextMarker.angle;
                if (index === visibleMarkers.length - 1 || endAngle <= marker.angle) endAngle += Math.PI * 2;

                const curvePoints = [];
                const segments = Math.max(8, Math.ceil((endAngle - marker.angle) * 8));
                for (let segment = 0; segment <= segments; segment += 1) {
                    const angle = marker.angle + ((endAngle - marker.angle) * segment) / segments;
                    curvePoints.push(new THREE.Vector3(band.radius * Math.cos(angle), band.radius * Math.sin(angle), 0));
                }

                const curve = new THREE.CatmullRomCurve3(curvePoints, false, "centripetal");
                const line = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, 0.0027, 4, false), orbitLineMaterial);
                line.userData.orbitLine = true;
                orbitGroups[bandIndex].add(line);
            });
        });
    }

    const state = {
        query: "",
        agency: "all",
        region: "all",
        status: "all",
        selected: null,
        hovered: null,
        cameraTween: null,
        searchTimer: null,
        ignoreClick: false,
        pointerStart: null
    };

    function getMissionMatches(mission) {
        const query = state.query.trim().toLowerCase();
        const agencyMatches = state.agency === "all" || mission.agencyFilters.includes(state.agency);
        const regionMatches = state.region === "all" || mission.region.split(" / ").includes(state.region);
        const statusMatches = state.status === "all" || mission.status === state.status;
        const searchText = [mission.name, mission.agency, mission.country, mission.region, mission.location, ...mission.aliases].join(" ").toLowerCase();
        return agencyMatches && regionMatches && statusMatches && (!query || searchText.includes(query));
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
    }

    function renderDetails(mission) {
        if (!mission) {
            detailsElement.innerHTML = `
                <div class="lunar-details-empty">
                    <span class="lunar-details-kicker">MISSION FILE</span>
                    <h2>Select an orbiter</h2>
                    <p>Choose a glowing marker or a search result to inspect a lunar mission.</p>
                </div>
            `;
            return;
        }

        detailsElement.innerHTML = `
            <div class="lunar-details-content">
                <span class="lunar-details-kicker">MISSION FILE · ${escapeHTML(mission.flag)}</span>
                <h2>${escapeHTML(mission.name)}</h2>
                <dl class="lunar-mission-meta">
                    <div><dt>Agency</dt><dd>${escapeHTML(mission.agency)}</dd></div>
                    <div><dt>Country</dt><dd>${escapeHTML(mission.country)} ${escapeHTML(mission.flag)}</dd></div>
                    <div><dt>Mission Type</dt><dd>${escapeHTML(mission.missionType)}</dd></div>
                    <div><dt>Destination</dt><dd>${escapeHTML(mission.destination)}</dd></div>
                    <div><dt>Location</dt><dd>${escapeHTML(mission.location)}</dd></div>
                    <div><dt>Launch Date</dt><dd>${escapeHTML(mission.launchDate)}</dd></div>
                    <div><dt>Status</dt><dd class="lunar-status">${escapeHTML(mission.status)}</dd></div>
                </dl>
                <p class="lunar-description">${escapeHTML(mission.description)}</p>
                <a class="lunar-source-link" href="${escapeHTML(mission.source)}" target="_blank" rel="noreferrer">Mission reference ↗</a>
            </div>
        `;
    }

    function renderMissionResults(missions) {
        resultsElement.replaceChildren();

        if (!missions.length) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "lunar-no-results";
            emptyMessage.textContent = "No lunar missions match these filters.";
            resultsElement.appendChild(emptyMessage);
            return;
        }

        missions.forEach((mission) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `lunar-mission-result${state.selected === mission ? " selected" : ""}`;
            button.dataset.missionName = mission.name;
            button.setAttribute("aria-pressed", String(state.selected === mission));

            const dot = document.createElement("span");
            dot.className = "lunar-result-dot";
            dot.setAttribute("aria-hidden", "true");
            const name = document.createElement("span");
            name.textContent = mission.name;
            button.append(dot, name);
            resultsElement.appendChild(button);
        });
    }

    function updateMarkerVisuals() {
        markers.forEach((marker) => {
            const isHovered = state.hovered === marker;
            const isSelected = state.selected === marker.mission;
            marker.selected = isSelected;
            marker.searchMatch = state.query.trim() !== "" && marker.group.visible;
            const scale = isSelected ? 1.52 : isHovered ? 1.38 : marker.searchMatch ? 1.2 : 1;
            marker.group.scale.setScalar(scale);
            marker.halo.material.opacity = isSelected || isHovered ? 1 : marker.searchMatch ? 0.92 : 0.68;
            marker.core.material.emissiveIntensity = isSelected || isHovered ? 3 : marker.searchMatch ? 2.5 : 1.7;
        });

        resultsElement.querySelectorAll(".lunar-mission-result").forEach((button) => {
            const isSelected = button.dataset.missionName === state.selected?.name;
            button.classList.toggle("selected", isSelected);
            button.setAttribute("aria-pressed", String(isSelected));
        });
    }

    function setSelectedMission(mission, focusCamera = false) {
        state.selected = mission;
        renderDetails(mission);
        updateMarkerVisuals();
        const matchingResults = lunarMissions.filter(getMissionMatches);
        renderMissionResults(matchingResults);
        if (focusCamera && mission) {
            const marker = markers.find((item) => item.mission === mission);
            if (marker) animateCameraToMarker(marker);
        }
    }

    function applyFilters(searchFocus = false) {
        const matchingMissions = lunarMissions.filter(getMissionMatches);
        const visibleMissions = new Set(matchingMissions);
        markers.forEach((marker) => {
            marker.group.visible = visibleMissions.has(marker.mission);
        });

        const label = `${matchingMissions.length} mission${matchingMissions.length === 1 ? "" : "s"}`;
        resultCountElement.textContent = label;
        document.querySelector(".lunar-results-heading span").textContent = label;

        if (state.selected && !visibleMissions.has(state.selected)) {
            state.selected = null;
        }

        if (searchFocus && matchingMissions.length) {
            state.selected = matchingMissions[0];
            window.clearTimeout(state.searchTimer);
            state.searchTimer = window.setTimeout(() => {
                const marker = markers.find((item) => item.mission === matchingMissions[0]);
                if (marker) animateCameraToMarker(marker);
            }, 220);
        } else if (!state.selected && matchingMissions.length === 1) {
            state.selected = matchingMissions[0];
        }

        renderDetails(state.selected);
        renderMissionResults(matchingMissions);
        updateMarkerVisuals();
        refreshOrbitLines();
    }

    function animateCameraTo(position, target, resumeAutoRotate = true) {
        state.cameraTween = {
            fromPosition: camera.position.clone(),
            toPosition: position.clone(),
            fromTarget: controls.target.clone(),
            toTarget: target.clone(),
            startedAt: performance.now(),
            duration: 900,
            resumeAutoRotate
        };
        controls.autoRotate = false;
    }

    function animateCameraToMarker(marker) {
        marker.group.updateWorldMatrix(true, false);
        const worldPosition = marker.group.getWorldPosition(new THREE.Vector3());
        const outward = worldPosition.clone().normalize();
        const cameraPosition = worldPosition.clone().addScaledVector(outward, 1.65);
        animateCameraTo(cameraPosition, worldPosition, true);
    }

    function resetCamera() {
        window.clearTimeout(state.searchTimer);
        setSelectedMission(null);
        animateCameraTo(initialCameraPosition, new THREE.Vector3(0, 0, 0), true);
    }

    function markerAtPointer(event) {
        const bounds = renderer.domElement.getBoundingClientRect();
        markerPointer.set(
            ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
            -((event.clientY - bounds.top) / bounds.height) * 2 + 1
        );
        markerRaycaster.setFromCamera(markerPointer, camera);
        const intersects = markerRaycaster.intersectObjects(markers.map((marker) => marker.core), false);
        return intersects[0]?.object.userData.marker || null;
    }

    renderer.domElement.addEventListener("pointerdown", (event) => {
        state.pointerStart = { x: event.clientX, y: event.clientY };
    });

    renderer.domElement.addEventListener("pointermove", (event) => {
        const marker = markerAtPointer(event);
        if (state.hovered !== marker) {
            state.hovered = marker;
            updateMarkerVisuals();
        }
        if (marker) {
            const bounds = sceneElement.getBoundingClientRect();
            tooltipElement.textContent = marker.mission.name;
            tooltipElement.hidden = false;
            tooltipElement.style.left = `${Math.min(event.clientX - bounds.left + 15, bounds.width - 190)}px`;
            tooltipElement.style.top = `${Math.max(12, event.clientY - bounds.top - 36)}px`;
        } else {
            tooltipElement.hidden = true;
        }
    });

    renderer.domElement.addEventListener("pointerleave", () => {
        state.hovered = null;
        tooltipElement.hidden = true;
        updateMarkerVisuals();
    });

    renderer.domElement.addEventListener("pointerup", (event) => {
        if (!state.pointerStart) return;
        const moved = Math.hypot(event.clientX - state.pointerStart.x, event.clientY - state.pointerStart.y) > 5;
        state.ignoreClick = moved;
        state.pointerStart = null;
        if (moved) window.setTimeout(() => { state.ignoreClick = false; }, 0);
    });

    renderer.domElement.addEventListener("click", (event) => {
        if (state.ignoreClick) return;
        const marker = markerAtPointer(event);
        if (marker) setSelectedMission(marker.mission);
    });

    resultsElement.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-mission-name]");
        if (!button) return;
        const mission = lunarMissions.find((item) => item.name === button.dataset.missionName);
        if (mission) setSelectedMission(mission, true);
    });

    searchElement.addEventListener("input", () => {
        state.query = searchElement.value;
        applyFilters(Boolean(state.query.trim()));
    });

    agencyFilter.addEventListener("change", () => {
        state.agency = agencyFilter.value;
        applyFilters();
    });

    countryFilter.addEventListener("change", () => {
        state.region = countryFilter.value;
        applyFilters();
    });

    statusFilter.addEventListener("change", () => {
        state.status = statusFilter.value;
        applyFilters();
    });

    resetButton.addEventListener("click", resetCamera);

    function resizeScene() {
        const width = sceneElement.clientWidth || 900;
        const height = sceneElement.clientHeight || 580;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setSize(width, height, false);
    }

    const resizeObserver = new ResizeObserver(resizeScene);
    resizeObserver.observe(sceneElement);
    window.addEventListener("resize", resizeScene, { passive: true });

    resultsElement.setAttribute("aria-label", `${lunarMissions.length} lunar mission choices`);
    window.__lunarOrbitersState = { missionCount: lunarMissions.length, markers, orbitGroups, scene, camera, controls };
    applyFilters();

    function animate(now) {
        requestAnimationFrame(animate);
        if (state.cameraTween) {
            const tween = state.cameraTween;
            const progress = Math.min((now - tween.startedAt) / tween.duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased);
            controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased);
            if (progress >= 1) {
                state.cameraTween = null;
                controls.autoRotate = tween.resumeAutoRotate;
            }
        }
        controls.update();
        renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
}