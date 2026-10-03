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


        const matchesSearch =

            missionName.includes(searchText) ||

            agency.includes(searchText) ||

            destination.includes(searchText);


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

            mission.landingDate &&

            String(mission.landingDate).trim() !== ""

                ? mission.landingDate

                : "N/A";


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

            mission.landingDate &&

            String(
                mission.landingDate
            ).trim() !== ""

                ? mission.landingDate

                : "N/A";


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


        missionModal.style.display =
            "flex";


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


        missionModal.style.display =
            "flex";

    }

}


// ==================================================
// CLOSE MODAL
// ==================================================

closeMissionModal.addEventListener(
    "click",
    () => {

        missionModal.style.display =
            "none";

    }
);


const modalBackdrop =
    document.querySelector(
        ".mission-modal-backdrop"
    );


if (modalBackdrop) {

    modalBackdrop.addEventListener(
        "click",
        () => {

            missionModal.style.display =
                "none";

        }
    );

}


// ==================================================
// ESC KEY CLOSES MODAL
// ==================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {

            missionModal.style.display =
                "none";

        }

    }
);


// ==================================================
// ESCAPE HTML
// ==================================================

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
// START APPLICATION
// ==================================================

loadMissions();