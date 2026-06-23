let lightningTimeline = [];
let lightningRequestId = 0;

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
        ++lightningRequestId;

    const area =
        els.lightningAreaSelect.value;

    els.lightningTime.innerText =
        "発雷確率 取得中...";

    try{
        const timeline =
            await filterExistingImages(createLightningCandidates(area));

        if(requestId !== lightningRequestId){
            return;
        }

        lightningTimeline =
            timeline;

        if(lightningTimeline.length === 0){
            els.lightningImage.removeAttribute("src");
            els.lightningImage.alt =
                "発雷確率画像が見つかりません";
            els.lightningTime.innerText =
                "発雷確率 画像なし";
            return;
        }

        els.lightningImage.src =
            lightningTimeline[0].url;

        els.lightningImage.alt =
            lightningTimeline[0].label;

        els.lightningTime.innerText =
            `発雷確率 ${lightningTimeline[0].label}`;

    }catch(error){
        if(requestId !== lightningRequestId){
            return;
        }

        console.error("発雷確率取得失敗", error);

        lightningTimeline = [];
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
