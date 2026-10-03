// ==================================================
// SPACE MISSION TRACKER
// BACKEND SERVER
// ==================================================

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");


// ==================================================
// EXPRESS APP
// ==================================================

const app = express();

const PORT = 3000;


// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());

app.use(express.json());


// ==================================================
// LOAD MISSION DATA
// ==================================================

const missionsFilePath =
    path.join(
        __dirname,
        "missions.json"
    );


let missions = [];


try {

    const missionsFile =
        fs.readFileSync(
            missionsFilePath,
            "utf8"
        );


    missions =
        JSON.parse(
            missionsFile
        );


    console.log(
        `Loaded ${missions.length} missions.`
    );


} catch (error) {

    console.error(
        "Error loading missions.json:",
        error
    );

}


// ==================================================
// ALLOWED COUNTRY CATEGORIES
// ==================================================

const allowedCountries = [
    "United States",
    "India",
    "Japan",
    "Europe",
    "International"
];


// ==================================================
// COUNTRY MAPPING
// ==================================================

const countryMap = {

    // ----------------------------------------------
    // UNITED STATES
    // ----------------------------------------------

    "Apollo 11":
        "United States",

    "Voyager 1":
        "United States",

    "Voyager 2":
        "United States",

    "Juno":
        "United States",

    "Europa Clipper":
        "United States",

    "Mars 2020 Perseverance Rover":
        "United States",

    "Curiosity":
        "United States",

    "MAVEN":
        "United States",

    "Mars Reconnaissance Orbiter":
        "United States",

    "Mars Odyssey":
        "United States",

    "New Horizons":
        "United States",

    "OSIRIS-REx":
        "United States",

    "Lucy":
        "United States",

    "Psyche":
        "United States",

    "DART":
        "United States",

    "Parker Solar Probe":
        "United States",

    "Solar Dynamics Observatory":
        "United States",

    "ACE":
        "United States",

    "GOES-U":
        "United States",

    "PACE":
        "United States",

    "Landsat 9":
        "United States",

    "ICESat-2":
        "United States",

    "GRACE-FO":
        "United States",

    "Terra":
        "United States",

    "Aqua":
        "United States",

    "Aura":
        "United States",

    "CYGNSS":
        "United States",

    "TESS":
        "United States",

    "Kepler / K2":
        "United States",

    "Chandra X-ray Observatory":
        "United States",

    "Fermi Gamma-ray Space Telescope":
        "United States",

    "NuSTAR":
        "United States",

    "NICER":
        "United States",

    "IXPE":
        "United States",

    "SPHEREx":
        "United States",

    "Artemis I":
        "United States",

    "Artemis II":
        "United States",

    "Dawn":
        "United States",

    "MESSENGER":
        "United States",

    "Magellan":
        "United States",

    "Mars Global Surveyor":
        "United States",

    "Mars Pathfinder":
        "United States",

    "InSight":
        "United States",


    // ----------------------------------------------
    // INDIA
    // ----------------------------------------------

    "Chandrayaan-1":
        "India",

    "Chandrayaan-2":
        "India",

    "Chandrayaan-3":
        "India",


    // ----------------------------------------------
    // JAPAN
    // ----------------------------------------------

    "Hayabusa2":
        "Japan",

    "Akatsuki":
        "Japan",


    // ----------------------------------------------
    // EUROPE
    // ----------------------------------------------

    "Mars Express":
        "Europe",

    "Solar Orbiter":
        "Europe",

    "Huygens":
        "Europe",

    "Galileo":
        "Europe",


    // ----------------------------------------------
    // INTERNATIONAL
    // ----------------------------------------------

    "James Webb Space Telescope":
        "International",

    "Hubble Space Telescope":
        "International",

    "SOHO":
        "International",

    "SWOT":
        "International",

    "NISAR":
        "International",

    "Global Precipitation Measurement":
        "International",

    "International Space Station":
        "International",

    "Cassini-Huygens":
        "International"

};


// ==================================================
// GET COUNTRY
// ==================================================

function getCountry(mission) {

    // If missions.json already contains a valid
    // country, use it.

    if (
        mission.country &&
        allowedCountries.includes(
            mission.country
        )
    ) {

        return mission.country;

    }


    // Otherwise use the mission mapping.

    if (
        countryMap[mission.name]
    ) {

        return countryMap[
            mission.name
        ];

    }


    // Try agency information.

    const agency =
        String(
            mission.agency || ""
        ).toLowerCase();


    if (
        agency.includes("isro")
    ) {

        return "India";

    }


    if (
        agency.includes("jaxa")
    ) {

        return "Japan";

    }


    if (
        agency.includes("esa")
    ) {

        return "Europe";

    }


    // If the mission is explicitly international,
    // keep it international.

    if (
        agency.includes(
            "international"
        )
    ) {

        return "International";

    }


    // Do not silently assign an unknown mission
    // to International.

    return "Unknown";

}


// ==================================================
// NORMALIZE STATUS
// ==================================================

function normalizeStatus(status) {

    const value =
        String(
            status || ""
        ).toLowerCase().trim();


    if (
        value === "upcoming"
    ) {

        return "upcoming";

    }


    if (
        value === "active" ||
        value === "ongoing" ||
        value === "in progress"
    ) {

        return "active";

    }


    if (
        value === "completed" ||
        value === "complete"
    ) {

        return "completed";

    }


    return "completed";

}


// ==================================================
// NORMALIZE MISSION
// ==================================================

function normalizeMission(mission) {

    return {

        ...mission,

        country:
            getCountry(mission),

        name:
            mission.name ||
            "Unnamed Mission",

        launchDate:
            mission.launchDate ||
            "N/A",

        destination:
            mission.destination ||
            "N/A",

        missionType:
            mission.missionType ||
            "N/A",

        landingDate:
            mission.landingDate ||
            "N/A",

        status:
            normalizeStatus(
                mission.status
            )

    };

}


// ==================================================
// GET ALL MISSIONS
// ==================================================

app.get(
    "/api/missions",
    (req, res) => {

        const normalizedMissions =
            missions.map(
                normalizeMission
            );


        res.json(
            normalizedMissions
        );

    }
);


// ==================================================
// GET ONE MISSION
// ==================================================

app.get(
    "/api/missions/:id",
    (req, res) => {

        const mission =
            missions.find(
                (item) =>
                    String(item.id) ===
                    String(req.params.id)
            );


        if (!mission) {

            return res
                .status(404)
                .json({
                    error:
                        "Mission not found"
                });

        }


        res.json(
            normalizeMission(
                mission
            )
        );

    }
);


// ==================================================
// ROOT ROUTE
// ==================================================

app.get(
    "/",
    (req, res) => {

        res.send(
            "Space Mission Tracker API is working!"
        );

    }
);


// ==================================================
// START SERVER
// ==================================================

app.listen(
    PORT,
    () => {

        console.log(
            `Space Mission Tracker API is running on port ${PORT}`
        );

    }
);