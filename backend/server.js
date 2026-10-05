// ==================================================
// SPACE MISSION TRACKER
// BACKEND SERVER
// ==================================================

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");


// ==================================================
// EXPRESS APP
// ==================================================

const app = express();

const PORT = 3000;
const LIVE_TRACKING_API_KEY = process.env.LIVE_TRACKING_API_KEY || "";
let nodemailer = null;

if (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASSWORD
) {
    nodemailer = require("nodemailer");
}

const horizonsTargets = new Map([
    ["-31", "Voyager 1"],
    ["-32", "Voyager 2"],
    ["-61", "Juno"],
    ["-64", "OSIRIS-REx"],
    ["-96", "Parker Solar Probe"],
    ["-98", "New Horizons"],
    ["earth", "Earth"]
]);

const ephemerisCache = new Map();
const EPHEMERIS_CACHE_MS = 5 * 60 * 1000;
const resetTokens = new Map();
const accountRecords = new Map();
const knownAccountEmails = new Set(
    String(process.env.ACCOUNT_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
);

function hashToken(value) {
    return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${derived}`;
}

function verifyPassword(password, storedValue) {
    if (!storedValue || typeof storedValue !== "string") {
        return false;
    }

    const [salt, hash] = storedValue.split(":");
    if (!salt || !hash) {
        return false;
    }

    const computed = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(
        Buffer.from(hash, "hex"),
        Buffer.from(computed, "hex")
    );
}

function sendPasswordResetEmail(email, token) {
    if (!nodemailer) {
        console.warn(
            "Password reset email not sent because SMTP configuration is not set. Configure EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, and EMAIL_FROM."
        );
        return false;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: Number(process.env.EMAIL_PORT || 587) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const resetUrl = `http://localhost:8000/reset-password.html?token=${encodeURIComponent(token)}`;

    transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: "Reset your Space Mission Tracker password",
        html: `
            <p>We received a request to reset your password.</p>
            <p>Use the secure link below to continue:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link expires in 1 hour.</p>
        `
    }).catch((error) => {
        console.error("Password reset email send failed:", error);
    });

    return true;
}

async function fetchActiveSatelliteCatalog() {
    const response = await fetch(
        "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE",
        {
            headers: {
                "User-Agent": "Mozilla/5.0",
                Accept: "text/plain"
            },
            signal: AbortSignal.timeout(30000)
        }
    );

    if (!response.ok) {
        throw new Error(`CelesTrak returned HTTP ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const satellites = [];

    for (let index = 0; index + 2 < lines.length; index += 3) {
        const nameLine = lines[index];
        const line1 = lines[index + 1];
        const line2 = lines[index + 2];

        if (!nameLine || !line1 || !line2 || !line1.startsWith("1 ") || !line2.startsWith("2 ")) {
            continue;
        }

        satellites.push({
            name: nameLine.trim() || `Satellite ${line1.slice(2, 7).trim()}`,
            line1,
            line2,
            catalogId: line1.slice(2, 7).trim(),
            source: "CelesTrak active TLE"
        });
    }

    return satellites;
}


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


function normalizeLandingDate(value) {

    if (typeof value !== "string") {
        return null;
    }

    const landingDate = value.trim();

    return landingDate && landingDate.toLowerCase() !== "n/a"
        ? landingDate
        : null;

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
            normalizeLandingDate(
                mission.landingDate
            ),

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
// AUTH / PASSWORD RESET
// ==================================================

app.get(
    "/api/auth/config",
    (req, res) => {

        res.json({
            emailConfigured: Boolean(nodemailer),
            emailProviderRequired: !nodemailer,
            requiredEnvironment: [
                "EMAIL_HOST",
                "EMAIL_PORT",
                "EMAIL_USER",
                "EMAIL_PASSWORD",
                "EMAIL_FROM"
            ]
        });

    }
);

app.post(
    "/api/auth/forgot-password",
    (req, res) => {

        const email = String(req.body?.email || "").trim().toLowerCase();

        if (!email || !email.includes("@")) {
            return res.status(400).json({
                message: "A valid email address is required."
            });
        }

        const accountExists =
            accountRecords.has(email) ||
            knownAccountEmails.has(email);

        if (!accountExists) {
            return res.json({
                message: "If an account exists for that email, a password reset link has been sent."
            });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = hashToken(token);
        const expiresAt = Date.now() + 60 * 60 * 1000;

        resetTokens.set(tokenHash, {
            email,
            expiresAt
        });

        sendPasswordResetEmail(email, token);

        return res.json({
            message: "If an account exists for that email, a password reset link has been sent."
        });

    }
);

app.post(
    "/api/auth/reset-password",
    (req, res) => {

        const token = String(req.body?.token || "").trim();
        const password = String(req.body?.password || "");
        const confirmPassword = String(req.body?.confirmPassword || "");

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({
                message: "Missing reset token or new password."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match."
            });
        }

        const tokenHash = hashToken(token);
        const resetRecord = resetTokens.get(tokenHash);

        if (!resetRecord) {
            return res.status(400).json({
                message: "The password reset link is invalid or has expired."
            });
        }

        if (Date.now() > resetRecord.expiresAt) {
            resetTokens.delete(tokenHash);
            return res.status(400).json({
                message: "The password reset link is invalid or has expired."
            });
        }

        const passwordHash = hashPassword(password);
        accountRecords.set(resetRecord.email, {
            passwordHash,
            updatedAt: new Date().toISOString()
        });

        resetTokens.delete(tokenHash);

        return res.json({
            message: "Your password has been reset successfully."
        });

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
// GET VERIFIED HELIOCENTRIC SPACECRAFT EPHEMERIS
// ==================================================

app.get(
    "/api/spacecraft/:targetId/ephemeris",
    async (req, res) => {

        const targetId = String(req.params.targetId);
        const spacecraftName = horizonsTargets.get(targetId);
        const horizonsCommand = targetId === "earth" ? "399" : targetId;

        if (!spacecraftName) {
            return res
                .status(404)
                .json({ error: "No supported Horizons target for this spacecraft." });
        }

        const cached = ephemerisCache.get(targetId);
        if (cached && Date.now() - cached.fetchedAt < EPHEMERIS_CACHE_MS) {
            return res.json(cached.data);
        }

        const now = new Date();
        const startTime = now.toISOString().replace("T", " ").slice(0, 16);
        const stopTime = new Date(now.getTime() + 30 * 86400000)
            .toISOString()
            .replace("T", " ")
            .slice(0, 16);
        const parameters = new URLSearchParams({
            format: "json",
            COMMAND: `'${horizonsCommand}'`,
            OBJ_DATA: "'NO'",
            MAKE_EPHEM: "'YES'",
            EPHEM_TYPE: "'VECTORS'",
            CENTER: "'500@10'",
            START_TIME: `'${startTime}'`,
            STOP_TIME: `'${stopTime}'`,
            STEP_SIZE: "'1 d'",
            OUT_UNITS: "'AU-D'",
            REF_PLANE: "'ECLIPTIC'",
            VEC_TABLE: "'2'",
            CSV_FORMAT: "'YES'"
        });

        try {
            const response = await fetch(
                `https://ssd.jpl.nasa.gov/api/horizons.api?${parameters}`,
                { signal: AbortSignal.timeout(20000) }
            );

            if (!response.ok) {
                throw new Error(`Horizons returned HTTP ${response.status}`);
            }

            const payload = await response.json();
            const result = String(payload.result || "");
            const vectorBlock = result.match(/\$\$SOE([\s\S]*?)\$\$EOE/);

            if (payload.error || !vectorBlock) {
                throw new Error(payload.error || "Horizons returned no vector data");
            }

            const trajectory = vectorBlock[1]
                .split(/\r?\n/)
                .map((line) => {
                    const columns = line.split(",").map((column) => column.trim());
                    const x = Number(columns[2]);
                    const y = Number(columns[3]);
                    const z = Number(columns[4]);

                    if (![x, y, z].every(Number.isFinite)) return null;
                    return {
                        frame: "heliocentric-au",
                        x,
                        y,
                        z,
                        epoch: columns[1]
                    };
                })
                .filter(Boolean);

            if (!trajectory.length) {
                throw new Error("Horizons returned invalid vector coordinates");
            }

            const data = {
                spacecraftName,
                position: trajectory[0],
                trajectory,
                lastUpdated: new Date().toISOString(),
                source: "NASA/JPL Horizons",
                referenceFrame: "Ecliptic J2000"
            };

            ephemerisCache.set(targetId, { fetchedAt: Date.now(), data });
            res.json(data);
        } catch (error) {
            console.error(`Horizons lookup failed for ${spacecraftName}:`, error);
            res.status(502).json({
                error: "Verified spacecraft position is temporarily unavailable."
            });
        }
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
// LIVE GLOBE STATUS
// ==================================================

app.get(
    "/api/live-globe/status",
    (req, res) => {

        res.json({
            source: "CelesTrak active TLE feed (currently blocked in this environment)",
            apiKeyRequired: false,
            apiKeyConfigured: Boolean(LIVE_TRACKING_API_KEY),
            liveEarthTrackingAvailable: false,
            liveMoonTrackingAvailable: false,
            liveSolarTrackingAvailable: false,
            note: "The app does not claim live Earth tracking when the upstream active-satellite source is unavailable. The current environment returns HTTP 403 from CelesTrak, so the globe intentionally shows an unavailable state instead of fabricated coordinates."
        });

    }
);

app.get(
    "/api/live-globe/satellites",
    async (req, res) => {
        try {
            const satellites = await fetchActiveSatelliteCatalog();
            res.json({
                source: "CelesTrak active TLE",
                updatedAt: new Date().toISOString(),
                count: satellites.length,
                satellites
            });
        } catch (error) {
            console.error("CelesTrak active satellite feed failed:", error);
            res.status(502).json({
                error: "Live satellite catalog is temporarily unavailable."
            });
        }
    }
);


// ==================================================
// FRONTEND + SPACE AGENCIES
// ==================================================

const frontendPath = path.join(__dirname, "..", "frontend");
const spaceAgenciesDataPath = path.join(frontendPath, "data", "space-agencies.json");

app.use(express.static(frontendPath));

app.get("/space-agencies", (req, res) => {
    res.sendFile(path.join(frontendPath, "space-agencies.html"));
});

app.get("/api/space-agencies", (req, res) => {
    try {
        const raw = fs.readFileSync(spaceAgenciesDataPath, "utf8");
        res.json(JSON.parse(raw));
    } catch (error) {
        console.error("Space agencies data read failed:", error);
        res.status(500).json({ error: "Space agency data is unavailable." });
    }
});


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