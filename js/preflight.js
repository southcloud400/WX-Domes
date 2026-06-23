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

function loadPreflightImages(){

    loadAviationStationCommentary();
    loadAviationEnrouteCommentary();
    loadRouteForecastSection();
    loadLowLevelSigwx();

}

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