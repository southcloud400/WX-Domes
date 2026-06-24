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

async function loadFXFEChart(code, imageId){
    const now =
        new Date();

    const candidates =
        Array.from({ length: 72 }, (_, index) => {
            const time =
                new Date(now.getTime() - index * 60 * 60 * 1000);

            time.setUTCMinutes(0, 0, 0);

            const timestamp =
                formatTimestamp(time).slice(0, 10) + "00";

            return {
                url:
                    `https://n-kishou.com/ee/image4/lfax/${code}_${timestamp}.png?x=47&y=0`
            };
        });

    const existing =
        await filterExistingImages(candidates);

    if(existing.length === 0){
        console.warn(`${code} が見つかりませんでした`);
        return;
    }

    getElement(imageId).src =
        existing[0].url;
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
    
    loadFXFEChart("fxfe502", "fxfe502-image");
    loadFXFEChart("fxfe504", "fxfe504-image");
    loadFXFEChart("fxfe5782", "fxfe5782-image");
    loadFXFEChart("fxfe5784", "fxfe5784-image");
    loadFXFEChart("fxjp854", "fxjp854-image");
}

function setPreflightMode(enabled){
    appState.preflight.enabled =
        enabled;

    els.preflightToggle.innerText =
        appState.preflight.enabled
            ? "Preflight ON"
            : "Preflight OFF";

    document.body.classList.toggle(
        "preflight-on",
        appState.preflight.enabled
    );

    if(appState.preflight.enabled){
        loadPreflightImages();
    }
}

function initPreflightEvents(){
    els.preflightToggle.addEventListener("click", () => {
        setPreflightMode(!appState.preflight.enabled);
    });

    getElement("low-level-sigwx-select")
        .addEventListener("change", () => {
            loadLowLevelSigwx();
        });
}
