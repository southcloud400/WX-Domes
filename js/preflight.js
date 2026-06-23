let preflightMode = false;

const PREFLIGHT_IMAGE_URLS = {
    aviationStationCommentary:
        "https://www.data.jma.go.jp/airinfo/data/pict/ajpn_cmnt/qyya86-0.png",

    aviationEnrouteCommentary:
        "https://www.data.jma.go.jp/airinfo/data/pict/ajpn_cmnt/qyya83.png",

    routeForecastSection:
        "https://www.data.jma.go.jp/airinfo/data/pict/nwp",

    lowLevelSigwx:
        "https://www.data.jma.go.jp/airinfo/data/pict/low-level_sigwx"
};

function cacheBustedUrl(url){
    return `${url}?t=${Date.now()}`;
}

function setImageSource(id, url){
    getElement(id).src =
        cacheBustedUrl(url);
}

async function loadAviationStationCommentary(){
    setImageSource(
        "aviation-commentary-image",
        PREFLIGHT_IMAGE_URLS.aviationStationCommentary
    );
}

function loadAviationEnrouteCommentary(){
    setImageSource(
        "aviation-fir-commentary-image",
        PREFLIGHT_IMAGE_URLS.aviationEnrouteCommentary
    );
}

function getLatestRouteForecastHour(){
    const availableTime =
        new Date(Date.now() - 2.5 * 60 * 60 * 1000);

    return Math.floor(availableTime.getUTCHours() / 3) * 3;
}

function loadRouteForecastSection(){
    const timeCode =
        String(getLatestRouteForecastHour()).padStart(2, "0");

    setImageSource(
        "route-forecast-section-image",
        `${PREFLIGHT_IMAGE_URLS.routeForecastSection}/fxjp106_${timeCode}.png`
    );
}

function loadLowLevelSigwx(){
    const select =
        getElement("low-level-sigwx-select");

    const fileName =
        select.value;

    const areaName =
        select.options[select.selectedIndex].text;

    getElement("low-level-sigwx-title").innerText =
        `下層悪天予想図（${areaName}・時系列）`;

    setImageSource(
        "low-level-sigwx-image",
        `${PREFLIGHT_IMAGE_URLS.lowLevelSigwx}/${fileName}.png`
    );
}

function loadPreflightImages(){
    loadAviationStationCommentary();
    loadAviationEnrouteCommentary();
    loadRouteForecastSection();
    loadLowLevelSigwx();
}

function setPreflightMode(enabled){
    preflightMode =
        enabled;

    els.preflightToggle.innerText =
        preflightMode
            ? "Preflight ON"
            : "Preflight OFF";

    document.body.classList.toggle("preflight-on", preflightMode);

    if(preflightMode){
        loadPreflightImages();
    }
}

function initPreflightEvents(){
    els.preflightToggle.addEventListener("click", () => {
        setPreflightMode(!preflightMode);
    });

    getElement("low-level-sigwx-select")
        .addEventListener("change", () => {
            loadLowLevelSigwx();
        });
}
