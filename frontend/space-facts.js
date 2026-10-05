const spaceFacts = [
    "A day on Venus lasts longer than its year: one rotation takes about 243 Earth days, while one orbit takes about 225.",
    "Sunlight takes about 8 minutes and 20 seconds to reach Earth.",
    "Mercury completes one orbit around the Sun in about 88 Earth days.",
    "A solar day on Mars lasts about 24 hours and 39 minutes.",
    "Neptune takes about 165 Earth years to complete one orbit around the Sun.",
    "Uranus rotates with an axial tilt of about 98 degrees, so it spins nearly on its side.",
    "Jupiter is the largest planet in the Solar System by both diameter and mass.",
    "Saturn's rings are made mostly of water ice, mixed with rocky material and dust.",
    "The Sun contains about 99.8 percent of the Solar System's total mass.",
    "Earth's seasons are caused mainly by the tilt of its rotational axis, not by its changing distance from the Sun.",
    "Earth's Moon moves away from Earth by about 3.8 centimeters per year, measured by laser ranging.",
    "The Moon rotates once for each orbit around Earth, which is why the same hemisphere generally faces us.",
    "The Moon has almost no atmosphere, so wind and rain do not erase footprints there.",
    "Earth is the only world currently known to have life.",
    "Earth's atmosphere is about 78 percent nitrogen and 21 percent oxygen by volume near sea level.",
    "One astronomical unit, the average Earth-Sun distance, is about 150 million kilometers.",
    "Light travels through a vacuum at exactly 299,792,458 meters per second.",
    "A light-year is a unit of distance: the distance light travels in one year, about 9.46 trillion kilometers.",
    "The International Space Station circles Earth roughly once every 90 minutes.",
    "The ISS travels at about 7.7 kilometers per second while in low Earth orbit.",
    "Sputnik 1, launched in 1957, was the first artificial satellite to orbit Earth.",
    "Yuri Gagarin became the first human to travel into space in 1961.",
    "The Apollo missions returned about 382 kilograms of lunar samples to Earth.",
    "Apollo 11 astronauts placed a laser-ranging retroreflector on the Moon; similar reflectors are still used for measurements.",
    "Venus is the hottest planet in the Solar System because its dense carbon-dioxide atmosphere traps heat efficiently.",
    "Mercury has the most eccentric orbit of the eight planets.",
    "Mars has two small moons, Phobos and Deimos.",
    "Olympus Mons on Mars is the largest known volcano in the Solar System.",
    "Valles Marineris is a vast canyon system on Mars that stretches for thousands of kilometers.",
    "Ganymede, a moon of Jupiter, is larger in diameter than Mercury.",
    "Io, one of Jupiter's large moons, is the most volcanically active world known.",
    "Titan, Saturn's largest moon, has lakes and seas of liquid methane and ethane on its surface.",
    "Enceladus, a moon of Saturn, ejects water-rich plumes from fractures near its south pole.",
    "Evidence from spacecraft observations suggests that Jupiter's moon Europa has a global ocean beneath its icy crust.",
    "The James Webb Space Telescope observes primarily infrared light.",
    "The Hubble Space Telescope observes in ultraviolet, visible, and near-infrared light.",
    "The asteroid belt lies between the orbits of Mars and Jupiter.",
    "Ceres, the largest object in the asteroid belt, is classified as a dwarf planet.",
    "Pluto is a dwarf planet in the Kuiper Belt beyond Neptune.",
    "Pluto's bright, heart-shaped region is called Tombaugh Regio.",
    "Halley's Comet returns to the inner Solar System about every 76 years on average.",
    "The Milky Way is a barred spiral galaxy, and the Solar System lies in one of its spiral arms.",
    "The Milky Way is roughly 100,000 light-years across, though its exact extent depends on how it is measured.",
    "The Andromeda Galaxy and the Milky Way are approaching each other and are expected to interact in several billion years.",
    "The cosmic microwave background is radiation released about 380,000 years after the Big Bang, when the early universe became transparent.",
    "Neutrinos interact so weakly with matter that enormous numbers pass through Earth and our bodies with little chance of interacting.",
    "Pulsars are rotating neutron stars whose beams of radiation can sweep past Earth like a cosmic lighthouse.",
    "A black hole's event horizon marks the boundary beyond which light cannot escape to distant observers.",
    "The Crab Nebula is the expanding remnant of a supernova observed by astronomers in 1054.",
    "The Parker Solar Probe became the first spacecraft to fly through the Sun's outer atmosphere, the corona."
];

const factText = document.getElementById("space-fact-text");
const factCount = document.getElementById("space-fact-count");
const previousButton = document.getElementById("space-fact-previous");
const nextButton = document.getElementById("space-fact-next");

if (factText && factCount && previousButton && nextButton) {
    let factOrder = [];
    let currentPosition = 0;

    function shuffleFacts(previousFactIndex = -1) {
        factOrder = Array.from({ length: spaceFacts.length }, (_, index) => index);

        for (let index = factOrder.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [factOrder[index], factOrder[swapIndex]] = [factOrder[swapIndex], factOrder[index]];
        }

        if (factOrder[0] === previousFactIndex) {
            [factOrder[0], factOrder[1]] = [factOrder[1], factOrder[0]];
        }
    }

    function renderFact(animate = true) {
        factText.textContent = spaceFacts[factOrder[currentPosition]];
        factCount.textContent = `Fact ${currentPosition + 1} of ${spaceFacts.length}`;
        previousButton.disabled = currentPosition === 0;

        if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        factText.getAnimations().forEach((animation) => animation.cancel());
        factText.animate(
            [
                { opacity: 0, transform: "translateY(6px)" },
                { opacity: 1, transform: "translateY(0)" }
            ],
            { duration: 240, easing: "ease-out" }
        );
    }

    shuffleFacts();
    renderFact(false);

    previousButton.addEventListener("click", () => {
        if (currentPosition === 0) return;
        currentPosition -= 1;
        renderFact();
    });

    nextButton.addEventListener("click", () => {
        if (currentPosition === factOrder.length - 1) {
            const previousFactIndex = factOrder[currentPosition];
            shuffleFacts(previousFactIndex);
            currentPosition = 0;
        } else {
            currentPosition += 1;
        }
        renderFact();
    });
}