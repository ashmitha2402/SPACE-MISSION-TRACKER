import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const EARTH_RADIUS_KM = 6371;
const EARTH_SCENE_RADIUS = 1.7;

const globeCanvas = document.getElementById("agencies-globe-canvas");
const detailsPanel = document.getElementById("agency-details-panel");
const searchInput = document.getElementById("agency-search");
const filterStatus = document.getElementById("agency-filter-status");
const hoverTooltip = document.getElementById("agency-hover-tooltip");
const regionButtons = [...document.querySelectorAll(".region-filters [data-region]")];

const state = {
    agencies: [],
    region: "all",
    search: "",
    selectedId: null,
    markerRecords: [],
    renderer: null,
    labelRenderer: null,
    scene: null,
    camera: null,
    controls: null,
    earth: null,
    markerGroup: null,
    animationId: null
};

function geodeticToScenePosition(latitude, longitude, altitudeKm = 0.05, radiusScale = EARTH_SCENE_RADIUS) {
    const latRad = (latitude * Math.PI) / 180;
    const lonRad = (longitude * Math.PI) / 180;
    const scaledAltitude = Math.max(0, altitudeKm) / EARTH_RADIUS_KM;
    const radius = radiusScale * (1 + scaledAltitude * 1.8);
    const x = radius * Math.cos(latRad) * Math.cos(lonRad);
    const y = radius * Math.sin(latRad);
    const z = radius * Math.cos(latRad) * Math.sin(lonRad);
    return new THREE.Vector3(x, y, z);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function loadAgencies() {
    const sources = [
        "http://localhost:3000/api/space-agencies",
        "data/space-agencies.json"
    ];

    for (const url of sources) {
        try {
            const response = await fetch(url, { cache: "no-store" });
            if (!response.ok) continue;
            const payload = await response.json();
            const list = Array.isArray(payload) ? payload : payload.agencies;
            if (Array.isArray(list) && list.length) {
                return list;
            }
        } catch {
            continue;
        }
    }

    throw new Error("Unable to load space agency data.");
}

function agencyMatchesFilter(agency) {
    const regionOk = state.region === "all" || agency.region === state.region;
    if (!regionOk) return false;

    const query = state.search.trim().toLowerCase();
    if (!query) return true;

    const haystack = [
        agency.name,
        agency.fullName,
        agency.country,
        agency.region,
        agency.headquarters,
        agency.organizationType
    ]
        .join(" ")
        .toLowerCase();

    return haystack.includes(query);
}

function updateFilterStatus() {
    if (!filterStatus) return;
    const visible = state.agencies.filter(agencyMatchesFilter).length;
    const total = state.agencies.length;
    filterStatus.textContent =
        state.search || state.region !== "all"
            ? `${visible} of ${total} agencies match your filters.`
            : `${total} agencies on the globe. Select a marker to learn more.`;
}

function renderPlaceholderPanel() {
    if (!detailsPanel) return;
    detailsPanel.innerHTML = `
        <div class="agency-details-placeholder">
            <h2>🌍 Explore Space Agencies</h2>
            <p>Select a 📍 marker on Earth to explore space agencies around the world.</p>
        </div>
    `;
}

function renderAgencyPanel(agency) {
    if (!detailsPanel || !agency) return;

    const missions =
        Array.isArray(agency.majorMissions) && agency.majorMissions.length
            ? `<h3>Major missions / programmes</h3><ul class="agency-detail-list">${agency.majorMissions
                  .map((item) => `<li>${escapeHtml(item)}</li>`)
                  .join("")}</ul>`
            : "";

    const responsibilities =
        Array.isArray(agency.responsibilities) && agency.responsibilities.length
            ? `<h3>Main responsibilities</h3><ul class="agency-detail-list">${agency.responsibilities
                  .map((item) => `<li>${escapeHtml(item)}</li>`)
                  .join("")}</ul>`
            : "";

    const website = agency.website
        ? `<p class="agency-detail-website"><strong>Website:</strong> <a href="${escapeHtml(agency.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(agency.website)}</a></p>`
        : "";

    detailsPanel.innerHTML = `
        <div class="agency-detail-header">
            <div class="agency-detail-flag">${escapeHtml(agency.flag || "🌍")}</div>
            <div>
                <div class="agency-detail-title">${escapeHtml(agency.name)}</div>
                <h2>${escapeHtml(agency.fullName)}</h2>
            </div>
        </div>
        <span class="agency-detail-type">${escapeHtml(agency.organizationType || "Space organization")}</span>
        <dl class="agency-detail-meta">
            <dt>Country</dt><dd>${escapeHtml(agency.country)}</dd>
            <dt>Region</dt><dd>${escapeHtml(agency.region)}</dd>
            <dt>Headquarters</dt><dd>${escapeHtml(agency.headquarters)}</dd>
            ${agency.founded ? `<dt>Founded</dt><dd>${escapeHtml(agency.founded)}</dd>` : ""}
        </dl>
        <p class="agency-detail-description">${escapeHtml(agency.description)}</p>
        ${responsibilities}
        ${missions}
        ${website}
    `;
}

function selectAgency(agencyId) {
    state.selectedId = agencyId;
    const agency = state.agencies.find((item) => item.id === agencyId);
    if (agency) {
        renderAgencyPanel(agency);
    }

    state.markerRecords.forEach(({ button, agency: markerAgency }) => {
        const matches = agencyMatchesFilter(markerAgency);
        button.classList.toggle("selected", markerAgency.id === agencyId);
        button.classList.toggle("highlighted", matches && (state.search || state.region !== "all"));
        button.classList.toggle("dimmed", !matches);
    });
}

function updateMarkerVisuals() {
    const hasActiveFilter = Boolean(state.search.trim()) || state.region !== "all";

    state.markerRecords.forEach(({ button, agency }) => {
        const matches = agencyMatchesFilter(agency);
        button.classList.toggle("dimmed", !matches);
        button.classList.toggle("highlighted", matches && hasActiveFilter);
        button.classList.toggle("selected", agency.id === state.selectedId);
        button.tabIndex = matches ? 0 : -1;
    });

    updateFilterStatus();
}

function createStars() {
    const geometry = new THREE.BufferGeometry();
    const starCount = 1600;
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

function buildMarkers() {
    if (!state.markerGroup) return;

    state.markerRecords.forEach(({ label }) => {
        state.markerGroup.remove(label);
    });
    state.markerRecords = [];

    state.agencies.forEach((agency) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "agency-pin";
        button.style.pointerEvents = "auto";
        button.textContent = "📍";
        button.setAttribute("aria-label", `${agency.name}, ${agency.country}`);
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            selectAgency(agency.id);
        });
        button.addEventListener("mouseenter", () => {
            if (!hoverTooltip) return;
            hoverTooltip.textContent = `${agency.flag || ""} ${agency.name} • ${agency.country}`.trim();
            hoverTooltip.classList.remove("hidden");
        });
        button.addEventListener("mouseleave", () => {
            hoverTooltip?.classList.add("hidden");
        });
        button.addEventListener("focus", () => {
            if (!hoverTooltip) return;
            hoverTooltip.textContent = `${agency.flag || ""} ${agency.name} • ${agency.country}`.trim();
            hoverTooltip.classList.remove("hidden");
        });
        button.addEventListener("blur", () => {
            hoverTooltip?.classList.add("hidden");
        });

        const label = new CSS2DObject(button);
        const position = geodeticToScenePosition(agency.latitude, agency.longitude, 0.05, EARTH_SCENE_RADIUS);
        label.position.copy(position);
        state.markerGroup.add(label);
        state.markerRecords.push({ agency, button, label });
    });

    updateMarkerVisuals();
}

function initGlobe() {
    if (!globeCanvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020711);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
    camera.position.set(0, 0.6, 4.7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    globeCanvas.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.inset = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    globeCanvas.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.9;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.8;
    controls.maxDistance = 18;

    scene.add(new THREE.AmbientLight(0xcfe0ff, 0.85));
    const keyLight = new THREE.DirectionalLight(0xfff0cf, 1.35);
    keyLight.position.set(4, 2, 5);
    scene.add(keyLight);

    scene.add(createStars());

    const earthTexture = new THREE.TextureLoader().load(
        "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
    );
    const earthMaterial = new THREE.MeshStandardMaterial({
        color: 0x89b7ff,
        emissive: 0x335bd6,
        emissiveIntensity: 0.22,
        roughness: 0.92,
        metalness: 0.08,
        map: earthTexture
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_SCENE_RADIUS, 96, 96), earthMaterial);
    scene.add(earth);

    const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(EARTH_SCENE_RADIUS * 1.03, 64, 64),
        new THREE.MeshBasicMaterial({
            color: 0x6eb6ff,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide
        })
    );
    scene.add(atmosphere);

    const markerGroup = new THREE.Group();
    earth.add(markerGroup);

    state.scene = scene;
    state.camera = camera;
    state.renderer = renderer;
    state.labelRenderer = labelRenderer;
    state.controls = controls;
    state.earth = earth;
    state.markerGroup = markerGroup;

    buildMarkers();

    const animate = () => {
        state.animationId = requestAnimationFrame(animate);
        earth.rotation.y += 0.0015;
        controls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    };
    animate();

    const resize = () => {
        const width = globeCanvas.clientWidth || 800;
        const height = globeCanvas.clientHeight || 560;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        labelRenderer.setSize(width, height);
    };

    window.addEventListener("resize", resize, { passive: true });
    resize();
}

function bindControls() {
    regionButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.region = button.dataset.region || "all";
            regionButtons.forEach((item) => item.classList.toggle("active", item === button));
            updateMarkerVisuals();
        });
    });

    searchInput?.addEventListener("input", (event) => {
        state.search = event.target.value;
        updateMarkerVisuals();
    });
}

async function init() {
    if (!globeCanvas || !detailsPanel) {
        console.warn("Space Agencies page is missing required elements.");
        return;
    }

    renderPlaceholderPanel();

    try {
        state.agencies = await loadAgencies();
    } catch (error) {
        console.error(error);
        detailsPanel.innerHTML =
            "<p class=\"agency-detail-description\">Agency data could not be loaded. Start the backend server or open this page through the project server.</p>";
        return;
    }

    bindControls();
    initGlobe();
    updateFilterStatus();
}

init();
