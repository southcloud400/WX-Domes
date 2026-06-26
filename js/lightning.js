const LIGHTNING_BASE_URL =
    "https://www.imocwx.com/guid";

function lonLatToRadarPercent(lon, lat){

    const zoom = 4;

    const leftTileX = 13;
    const topTileY = 5;
    const tileCountX = 3;
    const tileCountY = 3;

    const lonToTileX = lon =>
        ((lon + 180) / 360) * Math.pow(2, zoom);

    const latToTileY = lat => {
        const latRad =
            lat * Math.PI / 180;

        return (
            (1 -
                Math.log(
                    Math.tan(latRad) +
                    1 / Math.cos(latRad)
                ) / Math.PI
            ) / 2
        ) * Math.pow(2, zoom);
    };

    const tileX =
        lonToTileX(lon);

    const tileY =
        latToTileY(lat);

    const x =
        ((tileX - leftTileX) / tileCountX) * 100;

    const y =
        ((tileY - topTileY) / tileCountY) * 100;

    return { x, y };
}

function createLightningTimeLabel(index){

    const now = new Date();

    const jst =
        new Date(now.getTime() + 9 * 60 * 60 * 1000);

    jst.setMinutes(0, 0, 0);

    const baseHour =
        Math.floor(jst.getHours() / 3) * 3;

    jst.setHours(baseHour);

    const start =
        new Date(jst.getTime() + (index - 4) * 3 * 60 * 60 * 1000);

    const end =
        new Date(start.getTime() + 3 * 60 * 60 * 1000);

    const formatHour = date =>
        String(date.getHours()).padStart(2, "0");

    return `${formatHour(start)}:00-${formatHour(end)}:00 JST`;
}

    function createLightningCandidates(area){
    const cacheBuster =
        Date.now();

    return Array.from({ length: 10 }, (_, index) => {
        const fileNumber =
            String(index).padStart(2, "0");

        return {
            index,
            label: createLightningTimeLabel(index),
            url:
                `${LIGHTNING_BASE_URL}/gd3${fileNumber}${area}.png?${cacheBuster}`
        };
    });
}

async function loadLightningImage(){
    const requestId =
        ++appState.lightning.requestId;

    const area =
        els.lightningAreaSelect.value;

    els.lightningTime.innerText =
        "発雷確率 取得中...";

    try{
        const timeline =
            await filterExistingImages(createLightningCandidates(area));

        if(requestId !== appState.lightning.requestId){
            return;
        }

        appState.lightning.timeline =
            timeline;

        if(appState.lightning.timeline.length === 0){
            els.lightningImage.removeAttribute("src");
            els.lightningImage.alt =
                "発雷確率画像が見つかりません";
            els.lightningTime.innerText =
                "発雷確率 画像なし";
            return;
        }

        els.lightningImage.src =
            appState.lightning.timeline[0].url;

        els.lightningImage.alt =
            appState.lightning.timeline[0].label;

        els.lightningTime.innerText =
            `発雷確率 ${appState.lightning.timeline[0].label}`;

    }catch(error){
        if(requestId !== appState.lightning.requestId){
            return;
        }

        console.error("発雷確率取得失敗", error);

        appState.lightning.timeline = [];
        els.lightningImage.removeAttribute("src");
        els.lightningTime.innerText =
            "発雷確率 取得失敗";
    }
}

function initLightningEvents(){
    els.lightningAreaSelect.addEventListener("change", () => {
        loadLightningImage();
    });
}
