let maijiPlaneTimeline = [];
let maijiFlatTimeline = [];
let maijiFlatRequestId = 0;
let maijiPlaneRequestId = 0;

const MAIJI_BASE_URL =
    "https://www.data.jma.go.jp/airinfo/data/pict/maiji";

function formatTimestamp(date){
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    const h = String(date.getUTCHours()).padStart(2, "0");
    const min = String(date.getUTCMinutes()).padStart(2, "0");

    return `${y}${m}${d}${h}${min}00`;
}

function formatDisplayTime(timestamp){
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

function imageExists(url, timeoutMs = 8000){
    return new Promise((resolve) => {
        const img = new Image();
        const timeoutId =
            window.setTimeout(() => resolve(false), timeoutMs);

        img.onload = () => {
            window.clearTimeout(timeoutId);
            resolve(true);
        };

        img.onerror = () => {
            window.clearTimeout(timeoutId);
            resolve(false);
        };

        img.src = url;
    });
}

function buildMaijiImageUrl(code, timestamp){
    return `${MAIJI_BASE_URL}/${code}_RJTD_${timestamp}.PNG`;
}

function createMaijiCandidate(code, time){
    const timestamp =
        formatTimestamp(time);

    return {
        code,
        time,
        timestamp,
        url: buildMaijiImageUrl(code, timestamp)
    };
}

async function findFirstExistingImage(candidates, batchSize = 8){
    for(let index = 0; index < candidates.length; index += batchSize){
        const batch =
            candidates.slice(index, index + batchSize);

        const results =
            await Promise.all(
                batch.map(async candidate => {
                    const exists =
                        await imageExists(candidate.url);

                    return exists
                        ? candidate
                        : null;
                })
            );

        const found =
            results.find(candidate => candidate !== null);

        if(found){
            return found;
        }
    }

    return null;
}

async function findLatestMaijiImage(code){
    const now =
        new Date();

    now.setUTCMinutes(
        Math.floor(now.getUTCMinutes() / 30) * 30,
        0,
        0
    );

    const candidates =
        Array.from({ length: 96 }, (_, index) => {
            const targetTime =
                new Date(now.getTime() - index * 30 * 60 * 1000);

            return createMaijiCandidate(code, targetTime);
        });

    return findFirstExistingImage(candidates);
}

async function buildMaijiTimeline(imageCode){
    const latest =
        await findLatestMaijiImage(imageCode);

    if(!latest){
        return [];
    }

    const candidates =
        Array.from({ length: 7 }, (_, index) => {
            const hoursBack =
                6 - index;

            const targetTime =
                new Date(latest.time.getTime() - hoursBack * 60 * 60 * 1000);

            return createMaijiCandidate(imageCode, targetTime);
        });

    return filterExistingImages(candidates);
}

function setMaijiImageState(image, timeline, emptyMessage){
    if(timeline.length === 0){
        image.removeAttribute("src");
        image.alt = emptyMessage;
        return;
    }

    const latest =
        timeline[timeline.length - 1];

    image.src =
        latest.url;

    image.alt =
        formatDisplayTime(latest.timestamp);
}

async function loadMaijiSection(){
    const requestId =
        ++maijiFlatRequestId;

    const selectedHeight =
        els.maijiHeightSelect.value;

    const imageCode =
        `WANLF${selectedHeight}`;

    const timeline =
        await buildMaijiTimeline(imageCode);

    if(requestId !== maijiFlatRequestId){
        return;
    }

    maijiFlatTimeline =
        timeline;

    setMaijiImageState(
        getElement("maiji-section-image"),
        maijiFlatTimeline,
        "毎時大気解析（平面）が見つかりません"
    );
}

async function loadMaijiTimelineTest(){
    const requestId =
        ++maijiPlaneRequestId;

    const imageCode =
        els.maijiSectionSelect.value;

    const timeline =
        await buildMaijiTimeline(imageCode);

    if(requestId !== maijiPlaneRequestId){
        return;
    }

    maijiPlaneTimeline =
        timeline;

    setMaijiImageState(
        getElement("maiji-plane-image"),
        maijiPlaneTimeline,
        "毎時大気解析（断面）が見つかりません"
    );
}

function initMaijiEvents(){
    els.maijiHeightSelect.addEventListener("change", () => {
        loadMaijiSection();
    });

    els.maijiSectionSelect.addEventListener("change", () => {
        loadMaijiTimelineTest();
    });
}
