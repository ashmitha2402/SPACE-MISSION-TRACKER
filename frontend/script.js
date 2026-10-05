// ==================================================
// SPACE MISSION TRACKER
// FRONTEND JAVASCRIPT
// ==================================================


// ==================================================
// GLOBAL VARIABLES
// ==================================================

let missions = [];

let activeFilter = "all";

let activeCountry = "";


// ==================================================
// DOM ELEMENTS
// ==================================================

const missionList =
    document.getElementById("mission-list");

const searchInput =
    document.getElementById("mission-search");

const emptyState =
    document.getElementById("empty-state");

const loadingScreen =
    document.getElementById("loading-screen");


const filterButtons =
    document.querySelectorAll(".filter-button");

const countryButtons =
    document.querySelectorAll(".country-button");


const totalMissions =
    document.getElementById("total-missions");

const upcomingMissions =
    document.getElementById("upcoming-missions");

const activeMissions =
    document.getElementById("active-missions");

const completedMissions =
    document.getElementById("completed-missions");


const missionModal =
    document.getElementById("mission-details-modal");

const missionDetailsContent =
    document.getElementById("mission-details-content");

const closeMissionModal =
    document.getElementById("close-mission-modal");

const missionMapPanel =
    document.querySelector(".mission-map-panel");

const mapFullscreenOverlay =
    document.getElementById("map-fullscreen-overlay");

const mapFullscreenSlot =
    document.getElementById("map-fullscreen-slot");

const mapFullscreenOpen =
    document.getElementById("map-fullscreen-open");

const mapFullscreenClose =
    document.getElementById("map-fullscreen-close");

const appMain =
    document.querySelector("main");

let mapPlaceholder = null;
let mapReturnFocus = null;
let previousBodyOverflow = "";
let previousMainInert = false;


// ==================================================
// LOAD MISSIONS FROM BACKEND
// ==================================================

async function loadMissions() {

    try {

        const response = await fetch(
            "http://localhost:3000/api/missions"
        );


        if (!response.ok) {

            throw new Error(
                "Failed to load missions"
            );

        }


        missions = await response.json();

        window.__spaceMissionData = missions;
        window.Space3D?.setMissions(missions);


        console.log(
            "Missions loaded:",
            missions
        );


        if (loadingScreen) {

            loadingScreen.remove();

        }


        updateStats();

        renderMissions();


    } catch (error) {

        console.error(
            "Error loading missions:",
            error
        );


        if (loadingScreen) {

            loadingScreen.innerHTML = `

                <div class="error-message">

                    <h3>
                        Unable to load missions
                    </h3>

                    <p>
                        Make sure the Node.js backend
                        is running on
                        <strong>
                            http://localhost:3000
                        </strong>.
                    </p>

                </div>

            `;

        }

    }

}


// ==================================================
// FILTER MISSIONS
// ==================================================

function getFilteredMissions() {

    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    return missions.filter((mission) => {


        // ------------------------------------------
        // SEARCH
        // ------------------------------------------

        const missionName =
            String(mission.name || "")
                .toLowerCase();


        const agency =
            String(mission.agency || "")
                .toLowerCase();


        const destination =
            String(mission.destination || "")
                .toLowerCase();


        const isSpacecraftAlias = window.Space3D?.isMissionAlias(searchText);

        const matchesSearch = isSpacecraftAlias

            ? Boolean(window.Space3D?.matchesMission(mission, searchText))

            : missionName.includes(searchText) ||
                agency.includes(searchText) ||
                destination.includes(searchText) ||
                Boolean(window.Space3D?.matchesMission(mission, searchText));


        // ------------------------------------------
        // STATUS
        // ------------------------------------------

        const missionStatus =
            String(mission.status || "")
                .toLowerCase();


        const matchesStatus =

            activeFilter === "all" ||

            missionStatus === activeFilter;


        // ------------------------------------------
        // COUNTRY
        // ------------------------------------------

        const missionCountry =
            mission.country || "Unknown";


        const matchesCountry =

            activeCountry === "" ||

            missionCountry === activeCountry;


        return (

            matchesSearch &&

            matchesStatus &&

            matchesCountry

        );

    });

}


// ==================================================
// RENDER MISSION LIST
// ==================================================

function renderMissions() {

    const filteredMissions =
        getFilteredMissions();


    // Remove old rows

    const existingRows =
        missionList.querySelectorAll(
            ".mission-row"
        );


    existingRows.forEach((row) => {

        row.remove();

    });


    // No missions

    if (filteredMissions.length === 0) {

        emptyState.style.display = "block";

        return;

    }


    emptyState.style.display = "none";


    // Create mission rows

    filteredMissions.forEach((mission) => {


        const row =
            document.createElement("div");


        row.className =
            "mission-row";


        const landingDate =
            formatMissionDate(mission.landingDate);


        row.innerHTML = `

            <div class="mission-name-cell">

                <button
                    class="mission-name-button"
                    data-id="${mission.id}"
                    type="button"
                >
                    ${escapeHTML(
                        mission.name ||
                        "Unnamed Mission"
                    )}
                </button>

            </div>


            <div class="mission-data-cell">

                ${escapeHTML(
                    mission.launchDate ||
                    "N/A"
                )}

            </div>


            <div class="mission-data-cell">

                ${escapeHTML(
                    mission.destination ||
                    "N/A"
                )}

            </div>


            <div class="mission-data-cell">

                ${escapeHTML(
                    mission.missionType ||
                    "N/A"
                )}

            </div>


            <div class="mission-data-cell">

                ${escapeHTML(
                    landingDate
                )}

            </div>

        `;


        missionList.appendChild(row);

    });


    // Add click event to mission names

    const missionButtons =
        document.querySelectorAll(
            ".mission-name-button"
        );


    missionButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const missionId =
                    button.dataset.id;

                const mission = missions.find(
                    (item) => String(item.id) === String(missionId)
                );

                window.Space3D?.focusMission(mission);
                document.getElementById("mission-map-layout")?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                showMissionDetails(
                    missionId
                );

            }
        );

    });

}


// ==================================================
// UPDATE STATISTICS
// ==================================================

function updateStats() {

    const total =
        missions.length;


    const upcoming =
        missions.filter(
            (mission) =>
                mission.status === "upcoming"
        ).length;


    const active =
        missions.filter(
            (mission) =>
                mission.status === "active"
        ).length;


    const completed =
        missions.filter(
            (mission) =>
                mission.status === "completed"
        ).length;


    totalMissions.textContent =
        total;


    upcomingMissions.textContent =
        upcoming;


    activeMissions.textContent =
        active;


    completedMissions.textContent =
        completed;

}


// ==================================================
// STATUS FILTER BUTTONS
// ==================================================

filterButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {


            filterButtons.forEach(
                (item) => {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            button.classList.add(
                "active"
            );


            activeFilter =
                button.dataset.filter;


            renderMissions();

        }
    );

});


// ==================================================
// COUNTRY BUTTONS
// ==================================================

countryButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {


            countryButtons.forEach(
                (item) => {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            button.classList.add(
                "active"
            );


            activeCountry =
                button.dataset.country;


            renderMissions();

        }
    );

});


// ==================================================
// SEARCH
// ==================================================

searchInput.addEventListener(
    "input",
    () => {

        renderMissions();

    }
);


// ==================================================
// SHOW MISSION DETAILS
// ==================================================

async function showMissionDetails(id) {

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/missions/${id}`
            );


        if (!response.ok) {

            throw new Error(
                "Mission not found"
            );

        }


        const mission =
            await response.json();


        const landingDate =
            formatMissionDate(mission.landingDate);


        missionDetailsContent.innerHTML = `

            <div class="mission-detail-header">

                <span class="mission-detail-country">

                    ${escapeHTML(
                        mission.country ||
                        "Unknown"
                    )}

                </span>


                <h2>

                    ${escapeHTML(
                        mission.name ||
                        "Unnamed Mission"
                    )}

                </h2>

            </div>


            <div class="mission-detail-grid">


                <!-- Mission Name -->

                <div class="detail-item">

                    <span class="detail-label">
                        Mission Name
                    </span>

                    <span class="detail-value">

                        ${escapeHTML(
                            mission.name ||
                            "N/A"
                        )}

                    </span>

                </div>


                <!-- Launch Date -->

                <div class="detail-item">

                    <span class="detail-label">
                        Launch Date
                    </span>

                    <span class="detail-value">

                        ${escapeHTML(
                            mission.launchDate ||
                            "N/A"
                        )}

                    </span>

                </div>


                <!-- Destination -->

                <div class="detail-item">

                    <span class="detail-label">
                        Destination
                    </span>

                    <span class="detail-value">

                        ${escapeHTML(
                            mission.destination ||
                            "N/A"
                        )}

                    </span>

                </div>


                <!-- Mission Type -->

                <div class="detail-item">

                    <span class="detail-label">
                        Mission Type
                    </span>

                    <span class="detail-value">

                        ${escapeHTML(
                            mission.missionType ||
                            "N/A"
                        )}

                    </span>

                </div>


                <!-- Landing Date -->

                <div class="detail-item">

                    <span class="detail-label">
                        Landing Date
                    </span>

                    <span class="detail-value">

                        ${escapeHTML(
                            landingDate
                        )}

                    </span>

                </div>


            </div>


            ${
                mission.description

                    ? `

                        <div class="mission-description">

                            <h3>
                                Description
                            </h3>

                            <p>

                                ${escapeHTML(
                                    mission.description
                                )}

                            </p>

                        </div>

                    `

                    : ""
            }


            ${
                mission.agency

                    ? `

                        <div class="mission-agency">

                            <strong>
                                Agency:
                            </strong>

                            ${escapeHTML(
                                mission.agency
                            )}

                        </div>

                    `

                    : ""
            }


            ${
                mission.sourceUrl

                    ? `

                        <a
                            class="mission-source"
                            href="${escapeHTML(
                                mission.sourceUrl
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View Mission Source ↗
                        </a>

                    `

                    : ""
            }

        `;


        missionModal.hidden = false;


    } catch (error) {

        console.error(
            "Error loading mission details:",
            error
        );


        missionDetailsContent.innerHTML = `

            <div class="error-message">

                <h3>
                    Unable to load mission details
                </h3>

                <p>
                    Please try again.
                </p>

            </div>

        `;


        missionModal.hidden = false;

    }

}


// ==================================================
// CLOSE MODAL
// ==================================================

closeMissionModal.addEventListener(
    "click",
    () => {

        missionModal.hidden = true;

    }
);


function openMapFullscreen() {
    if (!missionMapPanel || !mapFullscreenOverlay || !mapFullscreenSlot || !mapFullscreenOverlay.hidden) return;

    mapPlaceholder = document.createComment("Mission map location");
    missionMapPanel.parentNode.insertBefore(mapPlaceholder, missionMapPanel);
    mapReturnFocus = mapFullscreenOpen;
    previousBodyOverflow = document.body.style.overflow;
    previousMainInert = appMain.inert;
    document.body.style.overflow = "hidden";
    appMain.inert = true;
    mapFullscreenOverlay.hidden = false;
    mapFullscreenSlot.appendChild(missionMapPanel);
    mapFullscreenClose.focus();
}

function closeMapFullscreen() {
    if (!mapPlaceholder || !mapFullscreenOverlay) return;

    mapPlaceholder.parentNode.insertBefore(missionMapPanel, mapPlaceholder);
    mapPlaceholder.remove();
    mapPlaceholder = null;
    mapFullscreenOverlay.hidden = true;
    document.body.style.overflow = previousBodyOverflow;
    appMain.inert = previousMainInert;
    mapReturnFocus?.focus();
    mapReturnFocus = null;
}

mapFullscreenOpen.addEventListener("click", openMapFullscreen);
mapFullscreenClose.addEventListener("click", closeMapFullscreen);


// ==================================================
// ESC KEY CLOSES MODAL
// ==================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key !== "Escape") return;

        if (!mapFullscreenOverlay.hidden) {
            closeMapFullscreen();
        } else if (!missionModal.hidden) {
            missionModal.hidden = true;
        }

    }
);


// ==================================================
// ESCAPE HTML
// ==================================================

function formatMissionDate(value) {

    if (!value) {
        return "N/A";
    }

    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    }).format(date);

}


function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ==================================================
// SPACE FACTS
// ==================================================

const spaceFacts = [
    "A day on Venus is longer than a year on Venus.",
    "Sunlight takes about 8 minutes and 20 seconds to reach Earth.",
    "Saturn could float in water because its average density is lower than water.",
    "Voyager 1 is the most distant human-made object from Earth.",
    "The International Space Station orbits Earth approximately every 90 minutes.",
    "Neptune takes about 165 Earth years to orbit the Sun.",
    "Olympus Mons on Mars is the largest volcano in the Solar System.",
    "The Moon moves away from Earth by about 3.8 centimeters each year.",
    "A teaspoon of neutron star material would weigh about a billion tons on Earth.",
    "Jupiter's Great Red Spot is a storm that has been observed for centuries.",
    "Mercury has the most eccentric orbit of the eight major planets.",
    "One day on Mars lasts about 24 hours and 37 minutes.",
    "The Sun contains more than 99.8 percent of the Solar System's total mass.",
    "Uranus rotates on its side, with an axial tilt of about 98 degrees.",
    "Sound cannot travel through the vacuum of space because it needs a medium.",
    "There are more stars in the universe than grains of sand on all of Earth's beaches.",
    "The Milky Way galaxy is about 100,000 light-years across.",
    "A light-year is the distance light travels in one year, roughly 9.46 trillion kilometers.",
    "Black holes have gravitational pull so strong that not even light can escape beyond the event horizon.",
    "The coldest place in the Solar System is often near permanently shadowed lunar craters.",
    "Saturn's rings are mostly made of ice particles ranging from dust-sized to house-sized.",
    "Pluto has a heart-shaped glacier of nitrogen ice on its surface.",
    "The Apollo 11 crew left reflective panels on the Moon used for laser ranging experiments.",
    "Space begins at the Kármán line, commonly defined at 100 kilometers above sea level.",
    "The Hubble Space Telescope has observed galaxies more than 13 billion light-years away.",
    "Cosmic microwave background radiation is leftover glow from the early universe.",
    "A supernova can briefly outshine an entire galaxy.",
    "The Sun converts about 600 million tons of hydrogen into helium every second.",
    "Earth's core is as hot as the surface of the Sun.",
    "Mars has the largest canyon in the Solar System, Valles Marineris.",
    "Ganymede, a moon of Jupiter, is larger than the planet Mercury.",
    "Io, another Jovian moon, is the most volcanically active body in the Solar System.",
    "Titan, Saturn's largest moon, has lakes and rivers of liquid methane and ethane.",
    "The James Webb Space Telescope observes primarily in infrared light.",
    "Asteroid 16 Psyche may be the exposed metallic core of a protoplanet.",
    "The Oort Cloud is a distant shell of icy objects surrounding the Solar System.",
    "Halley's Comet returns to the inner Solar System about every 76 years.",
    "Pulsars are rapidly rotating neutron stars that emit beams of radiation.",
    "The Andromeda Galaxy is on a collision course with the Milky Way in billions of years.",
    "Exoplanets are planets that orbit stars outside our Solar System.",
    "The speed of light in a vacuum is about 299,792 kilometers per second.",
    "Without a spacesuit, a human would lose consciousness in seconds in the vacuum of space.",
    "The ISS travels at about 7.66 kilometers per second in low Earth orbit.",
    "Sputnik 1, launched in 1957, was the first artificial satellite to orbit Earth.",
    "Yuri Gagarin became the first human in space on 12 April 1961.",
    "The Apollo missions brought back about 382 kilograms of lunar rock and soil.",
    "Venus is the hottest planet in the Solar System due to a runaway greenhouse effect.",
    "Earth is the only known planet with stable bodies of liquid water on its surface.",
    "The largest known star, some red supergiants, could swallow Earth within the orbit of Jupiter.",
    "Dark matter makes up most of the matter in the universe but does not emit light.",
    "Neutrinos from the Sun pass through your body by the trillions every second.",
    "The Big Bang model describes the expansion of the universe from an extremely hot, dense state.",
    "A year on Mercury lasts only about 88 Earth days.",
    "Enceladus, a moon of Saturn, spews water vapor from geysers at its south pole.",
    "The Crab Nebula formed from a supernova observed on Earth in the year 1054.",
    "Gamma-ray bursts are the most energetic explosions known in the universe.",
    "The Parker Solar Probe has flown closer to the Sun than any previous spacecraft."
];

let currentSpaceFact = "";

function pickRandomSpaceFact(previousFact) {
    if (!spaceFacts.length) {
        return "";
    }

    if (spaceFacts.length === 1) {
        return spaceFacts[0];
    }

    let nextFact = previousFact;

    while (nextFact === previousFact) {
        const index = Math.floor(Math.random() * spaceFacts.length);
        nextFact = spaceFacts[index];
    }

    return nextFact;
}

function setSpaceFactText(factText, animate) {
    const factElement = document.getElementById("space-fact-text");

    if (!factElement) {
        return;
    }

    if (!animate) {
        factElement.textContent = factText;
        return;
    }

    factElement.classList.add("is-fading");

    window.setTimeout(() => {
        factElement.textContent = factText;
        factElement.classList.remove("is-fading");
    }, 280);
}

function initSpaceFacts() {
    const factElement = document.getElementById("space-fact-text");
    const nextButton = document.getElementById("space-fact-next");

    if (!factElement || !nextButton) {
        return;
    }

    currentSpaceFact = pickRandomSpaceFact("");
    setSpaceFactText(currentSpaceFact, false);

    nextButton.addEventListener("click", () => {
        const nextFact = pickRandomSpaceFact(currentSpaceFact);
        currentSpaceFact = nextFact;
        setSpaceFactText(nextFact, true);
    });
}


// ==================================================
// START APPLICATION
// ==================================================

loadMissions();
