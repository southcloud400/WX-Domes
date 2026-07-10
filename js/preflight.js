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

const AI_SUMMARY_WORKER_URL =
    "https://wx-domes-ai-summary.just-966.workers.dev";


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
    
    getElement("ai-summary-button")
    .addEventListener("click", () => {
        showDummyAiSummary();
    });
    showDummyAiSummary
}

function createDummyAiSummary(){

    return `【AI Summary】

Overview

Airport Remark

Enroute Weather

■ JAPAN NORTH
■ JAPAN EAST
■ JAPAN WEST
■ JAPAN SOUTH

※AI要約は補助情報です。
最終判断は公式資料・各社の規程に従ってください。`;

}

async function showDummyAiSummary(){

    const summaryText =
        getElement("ai-summary-text");

    summaryText.innerText =
        "AI Summary 取得中...";

    try{
        const airportCodes =
            getElement("airport-list")
                .value
                .split(",")
                .map(code => code.trim().toUpperCase())
                .filter(code => code.length > 0);

        const response =
            await fetch(AI_SUMMARY_WORKER_URL,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    airports: airportCodes
                })
            });

        if(!response.ok){
            throw new Error(`HTTP ${response.status}`);
        }

        const data =
            await response.json();

        appState.aiSummary.text =
            data.summary;

        summaryText.innerText =
            appState.aiSummary.text;

    }catch(error){

        console.error("AI Summary取得失敗", error);

        summaryText.innerText =
            "AI Summary の取得に失敗しました";
    }
}

async function getPdfLastModified(url){

    const response =
        await fetch(url, {
            method: "HEAD"
        });

    if(!response.ok){
        throw new Error(
            `PDF HEAD取得失敗 HTTP ${response.status}: ${url}`
        );
    }

    const lastModified =
        response.headers.get("last-modified");

    if(!lastModified){
        throw new Error(
            `Last-Modifiedが取得できません: ${url}`
        );
    }

    return new Date(lastModified).getTime();
}

async function findLatestJmaPdfUrl(chartCode){

    const baseUrl =
        "https://www.jma.go.jp/bosai/numericmap/data/nwpmap";

    const candidates = [
        `${baseUrl}/${chartCode}_00.pdf`,
        `${baseUrl}/${chartCode}_12.pdf`
    ];

    const results =
        await Promise.all(
            candidates.map(async url => {
                return {
                    url,
                    lastModified:
                        await getPdfLastModified(url)
                };
            })
        );

    results.sort((a, b) =>
        b.lastModified - a.lastModified
    );

    return results[0].url;
}

async function loadJmaPdfToCanvas(
    chartCode,
    canvasId
){

    const canvas =
        document.getElementById(canvasId);

    if(!canvas){
        return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    try{
        const latestUrl =
            await findLatestJmaPdfUrl(chartCode);

        console.log(
            `${chartCode.toUpperCase()} latest PDF:`,
            latestUrl
        );

        const pdf =
            await pdfjsLib.getDocument(
                latestUrl
            ).promise;

        const page =
            await pdf.getPage(1);

        const viewport =
            page.getViewport({
                scale: 1.5
            });

        const context =
            canvas.getContext("2d");

        canvas.width =
            viewport.width;

        canvas.height =
            viewport.height;

        await page.render({
            canvasContext: context,
            viewport
        }).promise;

    }catch(error){
        console.error(
            `${chartCode.toUpperCase()} PDF表示失敗`,
            error
        );
    }
}

loadJmaPdfToCanvas(
    "fxfe502",
    "fxfe502-pdf-canvas"
);

loadJmaPdfToCanvas(
    "fxfe504",
    "fxfe504-pdf-canvas"
);

loadJmaPdfToCanvas(
    "fxfe5782",
    "fxfe5782-pdf-canvas"
);

loadJmaPdfToCanvas(
    "fxfe5784",
    "fxfe5784-pdf-canvas"
);

loadJmaPdfToCanvas(
    "fxjp854",
    "fxjp854-pdf-canvas"
);