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

const imageExistsCache = new Map();

async function imageExistsCached(url){
    if(imageExistsCache.has(url)){
        return imageExistsCache.get(url);
    }

    const exists =
        await imageExists(url);

    imageExistsCache.set(url, exists);

    return exists;
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
        formatUtcTimestamp(latest.timestamp);
}

async function loadMaijiSection(){
    const requestId =
        ++appState.maiji.flatRequestId;

    const selectedHeight =
        els.maijiHeightSelect.value;

    const imageCode =
        `WANLF${selectedHeight}`;

    const timeline =
        await buildMaijiTimeline(imageCode);

    if(requestId !== appState.maiji.flatRequestId){
        return;
    }

    appState.maiji.flatTimeline =
        timeline;

    setMaijiImageState(
        getElement("maiji-section-image"),
        appState.maiji.flatTimeline,
        "毎時大気解析（平面）が見つかりません"
    );
}

async function loadMaijiPlane(){
    const requestId =
        ++appState.maiji.planeRequestId;

    const imageCode =
        els.maijiSectionSelect.value;

    const timeline =
        await buildMaijiTimeline(imageCode);

    if(requestId !== appState.maiji.planeRequestId){
        return;
    }

    appState.maiji.planeTimeline =
        timeline;

    setMaijiImageState(
        getElement("maiji-plane-image"),
        appState.maiji.planeTimeline,
        "毎時大気解析（断面）が見つかりません"
    );
}

function initMaijiEvents(){
    els.maijiHeightSelect.addEventListener("change", () => {
        loadMaijiSection();
    });

    els.maijiSectionSelect.addEventListener("change", () => {
        loadMaijiPlane();
    });
}
