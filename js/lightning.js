const LIGHTNING_BASE_URL =
    "https://www.imocwx.com/guid";

function createLightningCandidates(area){
    const cacheBuster =
        Date.now();

    return Array.from({ length: 10 }, (_, index) => {
        const fileNumber =
            String(index).padStart(2, "0");

        return {
            index,
            label: `${index}時間後`,
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
