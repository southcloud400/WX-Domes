let lightningTimeline = [];
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

async function loadAviationStationCommentary(){

    document.getElementById(
        "aviation-commentary-image"
    ).src =
        "https://www.data.jma.go.jp/airinfo/data/pict/ajpn_cmnt/qyya86-0.png"
        + "?t=" + Date.now();

}

function loadAviationEnrouteCommentary(){

    document.getElementById(
        "aviation-fir-commentary-image"
    ).src =
        "https://www.data.jma.go.jp/airinfo/data/pict/ajpn_cmnt/qyya83.png"
        + "?t=" + Date.now();

}

function loadRouteForecastSection(){

    const now =
        new Date();

    const availableTime =
        new Date(
            now.getTime() - 2.5 * 60 * 60 * 1000
        );

    const hour =
        availableTime.getUTCHours();

    const latestHour =
        Math.floor(hour / 3) * 3;

    const timeCode =
        String(latestHour).padStart(2, "0");

    const url =
        `https://www.data.jma.go.jp/airinfo/data/pict/nwp/fxjp106_${timeCode}.png`
        + "?t=" + Date.now();

    document.getElementById(
        "route-forecast-section-image"
    ).src = url;

    console.log(
        "国内航空路予想断面図 最新:",
        `fxjp106_${timeCode}.png`
    );
}

function loadLowLevelSigwx(){

    const select =
        document.getElementById("low-level-sigwx-select");

    const fileName =
        select.value;

    const areaName =
        select.options[select.selectedIndex].text;

    document.getElementById("low-level-sigwx-title").innerText =
        `下層悪天予想図（${areaName}・時系列）`;

    document.getElementById("low-level-sigwx-image").src =
        `https://www.data.jma.go.jp/airinfo/data/pict/low-level_sigwx/${fileName}.png`
        + "?t=" + Date.now();

}

async function loadLightningImage(){

    const area =
        document.getElementById("lightning-area-select").value;

    const timeline = [];

    for(let i = 0; i <= 9; i++){

        const fileNumber =
            String(i).padStart(2, "0");

        const url =
            `https://www.imocwx.com/guid/gd3${fileNumber}${area}.png?${Date.now()}`;

        const exists =
            await imageExists(url);

        if(exists){
            timeline.push({
                index: timeline.length,
                label: `${i}時間後`,
                url: url
            });
        }
    }

    lightningTimeline = timeline;

    if(lightningTimeline.length > 0){

        document.getElementById("lightning-image").src =
            lightningTimeline[0].url;

        document.getElementById("lightning-time").innerText =
            `発雷確率 ${lightningTimeline[0].label}`;
    }

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

function loadPreflightImages(){

    loadAviationStationCommentary();
    loadAviationEnrouteCommentary();
    loadRouteForecastSection();
    loadLowLevelSigwx();

}

document.getElementById("lightning-area-select")
    .addEventListener("change", () => {
        loadLightningImage();
    });

els.preflightToggle
    .addEventListener("click", () => {

        preflightMode = !preflightMode;

        els.preflightToggle.innerText =
            preflightMode
                ? "Preflight ON"
                : "Preflight OFF";

        document.body.classList.toggle("preflight-on", preflightMode);

        if(preflightMode){
            loadPreflightImages();
        }

        console.log("Preflight Mode:", preflightMode);

    });