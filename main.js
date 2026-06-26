const JMA_URLS = {
    weatherMapList:
        "https://www.jma.go.jp/bosai/weather_map/data/list.json",

    weatherMapPngBase:
        "https://www.jma.go.jp/bosai/weather_map/data/png/",

    satelliteTimes:
        "https://www.jma.go.jp/bosai/himawari/data/satimg/targetTimes_fd.json",

    satelliteTileBase:
        "https://www.jma.go.jp/bosai/himawari/data/satimg",

    radarTimes:
        "https://www.jma.go.jp/bosai/jmatile/data/nowc/targetTimes_N1.json",

    radarTileBase:
        "https://www.jma.go.jp/bosai/jmatile/data/nowc",
    
    lightningObservedBase:
        "https://www.jma.go.jp/bosai/jmatile/data/nowc",

    mapTileBase:
        "https://www.jma.go.jp/tile/gsi/pale"
};

const DEFAULT_TILE_COORDINATES = [
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

let appEventsInitialized = false;

const appState = {
    preflight: {
        enabled: false
    },

    lightning: {
        timeline: [],
        requestId: 0
    },
    
    maiji: {
        flatTimeline: [],
        planeTimeline: [],
        flatRequestId: 0,
        planeRequestId: 0
    },

    modal: {
        timeline: []
    }
};

function getElement(id){
    const element =
        document.getElementById(id);

    if(!element){
        throw new Error(`Required element not found: ${id}`);
    }

    return element;
}

const els = {

    airportList:
        getElement("airport-list"),

    metarText:
        getElement("metar-text"),

    metarUpdateButton:
        getElement("metar-update-button"),

    asasImage:
        getElement("asas-image"),

    fsasImage:
        getElement("fsas-image"),

    satelliteTime:
        getElement("satellite-time"),

    radarTime:
        getElement("radar-time"),

    radarBaseGrid:
        document.querySelector(".radar-base-grid"),

    radarGrid:
        document.querySelector(".radar-grid"),

    imageModal:
        getElement("imageModal"),

    modalContent:
        document.querySelector(".modal-content"),

    modalCloseButton:
        getElement("modal-close-btn"),

    modalImage:
        getElement("modalImage"),

    modalControl:
        getElement("maiji-modal-control"),

    modalSlider:
        getElement("maiji-modal-slider"),

    modalTime:
        getElement("maiji-modal-time"),

    maijiHeightSelect:
        getElement("maiji-height-select"),

    maijiSectionSelect:
        getElement("maiji-section-select"),

    lightningImage:
        getElement("lightning-image"),

    lightningTime:
        getElement("lightning-time"),

    lightningAreaSelect:
        getElement("lightning-area-select"),

    preflightToggle:
        getElement("preflight-toggle")

};

async function fetchJson(url){
    const response =
        await fetch(url);

    if(!response.ok){
        throw new Error(`HTTP ${response.status}: ${url}`);
    }

    return response.json();
}

function getLatestItem(items, key){
    if(!Array.isArray(items) || items.length === 0){
        return null;
    }

    return [...items].sort((a, b) => {
        const valueA =
            typeof a === "string"
                ? a
                : a[key];

        const valueB =
            typeof b === "string"
                ? b
                : b[key];

        return String(valueA).localeCompare(String(valueB));
    }).at(-1);
}

async function runStartupTask(name, task){
    try{
        await task();
    }catch(error){
        console.error(`${name} failed`, error);
    }
}

async function filterExistingImages(items){

    const results =
        await Promise.all(
            items.map(async item => {

                const exists =
                    await imageExistsCached(item.url);

                return exists
                    ? item
                    : null;
            })
        );

    return results.filter(item => item !== null);
}

async function loadWeatherMaps(){

    const data =
        await fetchJson(JMA_URLS.weatherMapList);

    const asasFile =
        getLatestItem(data.near_monochrome?.now, "basetime");

    const fsasFile =
        getLatestItem(data.asia?.ft24, "basetime");

    if(!asasFile || !fsasFile){
        throw new Error("Weather map list does not include expected images");
    }

    els.asasImage.src =
        JMA_URLS.weatherMapPngBase + asasFile;

    els.fsasImage.src =
        JMA_URLS.weatherMapPngBase + fsasFile;

}


function formatUtcTimestamp(timestamp){

    if(!timestamp || timestamp.length < 12){
        return "時刻不明";
    }

    return (
        timestamp.slice(0,4) + "/" +
        timestamp.slice(4,6) + "/" +
        timestamp.slice(6,8) + " " +
        timestamp.slice(8,10) + ":" +
        timestamp.slice(10,12) +
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

    const data =
        await fetchJson(JMA_URLS.satelliteTimes);

    const latest =
        getLatestItem(data, "validtime");

    if(!latest){
        throw new Error("Satellite target time is empty");
    }

    const baseTime =
        latest.basetime;

    const validTime =
        latest.validtime;

    els.satelliteTime.innerText =
        "Satellite: " + formatUtcTimestamp(validTime);

    document.querySelectorAll(".satellite-tile").forEach((tile) => {
        const x = tile.dataset.x;
        const y = tile.dataset.y;

        tile.src =
            `${JMA_URLS.satelliteTileBase}/${baseTime}/fd/${validTime}/SND/ETC/4/${x}/${y}.jpg`;
    });
}

async function loadRadarTime(){

    const data =
        await fetchJson(JMA_URLS.radarTimes);

    const latest =
        getLatestItem(data, "basetime");

    if(!latest){
        throw new Error("Radar target time is empty");
    }

    const latestTime =
        latest.basetime;

    els.radarTime.innerText =
        "Radar Echo: " + formatUtcTimestamp(latestTime);

    document.querySelectorAll(".radar-tile").forEach((tile) => {

        const x = tile.dataset.x;
        const y = tile.dataset.y;

        tile.src =
            `${JMA_URLS.radarTileBase}/${latestTime}/none/${latestTime}/surf/hrpns/4/${x}/${y}.png`;

    });

    if(!els.radarBaseGrid){
        return;
    }

    els.radarBaseGrid.replaceChildren();

    DEFAULT_TILE_COORDINATES.forEach(([x, y]) => {
        const img = document.createElement("img");

        img.src =
            `${JMA_URLS.mapTileBase}/4/${x}/${y}.png`;

        els.radarBaseGrid.appendChild(img);
    });

    loadObservedLightning(latestTime);
}

function lonLatToRadarPercent(lon, lat){

    const leftLon = 122.0;
    const rightLon = 150.0;
    const topLat = 48.0;
    const bottomLat = 20.0;

    const x =
        ((lon - leftLon) / (rightLon - leftLon)) * 100;

    const y =
        ((topLat - lat) / (topLat - bottomLat)) * 100;

    return { x, y };
}

async function loadObservedLightning(latestTime){

    const layer =
        getElement("lightning-observed-layer");

    layer.replaceChildren();

    const url =
        `${JMA_URLS.lightningObservedBase}/${latestTime}/none/${latestTime}/surf/liden/data.geojson?id=liden`;

    try{
        const data =
            await fetchJson(url);

        data.features.forEach(feature => {
            const coordinates =
                feature.geometry?.coordinates;

            if(!coordinates || coordinates.length < 2){
                return;
            }

            const [lon, lat] =
                coordinates;

            const position =
                lonLatToRadarPercent(lon, lat);

            const point =
                document.createElement("div");

            point.className =
                "observed-lightning-point";

            point.style.left =
                `${position.x}%`;

            point.style.top =
                `${position.y}%`;

            layer.appendChild(point);
        });

    }catch(error){
        console.error("雷GeoJSON取得失敗", error);
    }
}

function initAppEvents(){
    if(appEventsInitialized){
        return;
    }

    initMetarEvents();
    initMaijiEvents();
    initLightningEvents();
    initPreflightEvents();
    initModalEvents();

    appEventsInitialized = true;
}

async function initializeApp(){

    initAppEvents();

    await Promise.allSettled([
        runStartupTask("Lightning", loadLightningImage),
        runStartupTask("Weather maps", loadWeatherMaps),
        runStartupTask("Maiji section", loadMaijiSection),
        runStartupTask("Satellite", loadSatelliteTime),
        runStartupTask("Radar", loadRadarTime),
        runStartupTask("Maiji cross section",loadMaijiPlane),
        runStartupTask("METAR", loadMetarText)
    ]);

}
