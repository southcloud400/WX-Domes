
let maijiPlaneTimeline = [];
let maijiFlatTimeline = [];
let currentMaijiTimeline = [];
let preflightMode = false;

const els = {

    airportList:
        document.getElementById("airport-list"),

    metarText:
        document.getElementById("metar-text"),

    modalImage:
        document.getElementById("modalImage"),

    modalControl:
        document.getElementById("maiji-modal-control"),

    modalSlider:
        document.getElementById("maiji-modal-slider"),

    modalTime:
        document.getElementById("maiji-modal-time"),
    
    maijiHeightSelect:
        document.getElementById("maiji-height-select"),

    maijiSectionSelect:
        document.getElementById("maiji-section-select")

};

async function loadWeatherMaps(){

    const response =
        await fetch(
            "https://www.jma.go.jp/bosai/weather_map/data/list.json"
        );

    const data =
        await response.json();
    
    console.log(Object.keys(data));

    const asasFile =
         data.near_monochrome.now[data.near_monochrome.now.length - 1
         ];

    const fsasFile =
        data.asia.ft24[
            data.asia.ft24.length - 1
        ];

    const baseUrl =
        "https://www.jma.go.jp/bosai/weather_map/data/png/";

    document.getElementById("asas-image").src =
        baseUrl + asasFile;

    document.getElementById("fsas-image").src =
        baseUrl + fsasFile;

}


function formatJmaTileTime(basetime){

    return (
        basetime.slice(0,4) + "/" +
        basetime.slice(4,6) + "/" +
        basetime.slice(6,8) + " " +
        basetime.slice(8,10) + ":" +
        basetime.slice(10,12) +
        " UTC"
    );
}

function openRadarPage(){
    window.open(
        "https://weather.yahoo.co.jp/weather/zoomradar/",
        "_blank"
    );
}

async function loadSatelliteTime(){

    const response =
        await fetch(
            "https://www.jma.go.jp/bosai/himawari/data/satimg/targetTimes_fd.json"
        );

    const data =
        await response.json();

    const latest =
        data[data.length - 1];

    const baseTime =
        latest.basetime;

    const validTime =
        latest.validtime;
    
    document.getElementById("satellite-time").innerText =
        "Satellite: " + formatJmaTileTime(validTime);

    document.querySelectorAll(".satellite-tile").forEach((tile) => {
        const x = tile.dataset.x;
        const y = tile.dataset.y;

        tile.src =
            `https://www.jma.go.jp/bosai/himawari/data/satimg/${baseTime}/fd/${validTime}/SND/ETC/4/${x}/${y}.jpg`;
    });
}

async function loadRadarTime(){

    const response =
        await fetch(
            "https://www.jma.go.jp/bosai/jmatile/data/nowc/targetTimes_N1.json"
        );

    const data =
        await response.json();

    const latestTime =
        data[0].basetime;

    document.getElementById("radar-time").innerText =
    "Radar Echo: " + formatJmaTileTime(latestTime);

    document.querySelectorAll(".radar-tile").forEach((tile) => {

    const x = tile.dataset.x;
    const y = tile.dataset.y;

    tile.src =
        `https://www.jma.go.jp/bosai/jmatile/data/nowc/${latestTime}/none/${latestTime}/surf/hrpns/4/${x}/${y}.png`;

    });

    const radarBaseGrid =
    document.querySelector(".radar-base-grid");

radarBaseGrid.innerHTML = "";

const baseTiles = [
    [13, 5],
    [14, 5],
    [15, 5],
    [13, 6],
    [14, 6],
    [15, 6],
    [13, 7],
    [14, 7],
    [15, 7]
];

baseTiles.forEach(([x, y]) => {
    const img = document.createElement("img");

    img.src =
        `https://www.jma.go.jp/tile/gsi/pale/4/${x}/${y}.png`;

    radarBaseGrid.appendChild(img);
});

}

loadLightningImage();
loadWeatherMaps();
loadMaijiSection();
loadSatelliteTime();
loadRadarTime();
loadMaijiTimelineTest();
loadMetarText();

document.getElementById("lightning-area-select")
    .addEventListener("change", () => {
        loadLightningImage();
    });
