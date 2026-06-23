let maijiPlaneTimeline = [];
let maijiFlatTimeline = [];

function formatTimestamp(date){
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    const h = String(date.getUTCHours()).padStart(2, "0");
    const min = String(date.getUTCMinutes()).padStart(2, "0");

    return `${y}${m}${d}${h}${min}00`;
}

function formatDisplayTime(timestamp){

    return (
        timestamp.slice(0,4) + "/" +
        timestamp.slice(4,6) + "/" +
        timestamp.slice(6,8) + " " +
        timestamp.slice(8,10) + ":" +
        timestamp.slice(10,12) +
        " UTC"
    );
}

async function findLatestMaijiImage(code){

    const baseUrl =
        "https://www.data.jma.go.jp/airinfo/data/pict/maiji/";

    const now = new Date();

    now.setUTCMinutes(
        Math.floor(now.getUTCMinutes() / 30) * 30,
        0,
        0
    );

    for(let i = 0; i < 96; i++){

        const targetTime =
            new Date(now.getTime() - i * 30 * 60 * 1000);

        const timestamp =
            formatTimestamp(targetTime);

        const url =
            `${baseUrl}${code}_RJTD_${timestamp}.PNG`;

        const exists =
            await imageExists(url);

        if(exists){

            return {
                code: code,
                time: targetTime,
                timestamp: timestamp,
                url: url
            };
        }
    }

    return null;
}

function imageExists(url){
    return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);

        img.src = url;
    });
}

async function loadMaijiSection(){

    const selectedHeight =
        els.maijiHeightSelect.value;

    const imageCode =
        `WANLF${selectedHeight}`;

    const latest =
        await findLatestMaijiImage(imageCode);

    if(!latest){
        console.log("毎時大気解析（平面）の最新画像が見つかりません");
        return;
    }

    const timeline = [];

for(let i = 0; i <= 6; i++){

    const targetTime =
        new Date(latest.time.getTime() - i * 60 * 60 * 1000);

    const timestamp =
        formatTimestamp(targetTime);

    const url =
        `https://www.data.jma.go.jp/airinfo/data/pict/maiji/${imageCode}_RJTD_${timestamp}.PNG`;

    const exists =
        await imageExists(url);

    if(exists){
        timeline.push({
            index: timeline.length,
            timestamp: timestamp,
            url: url
        });
    }
}

maijiFlatTimeline = timeline.reverse();

    maijiFlatTimeline = timeline.reverse();

    if(maijiFlatTimeline.length > 0){

    const latest =
        maijiFlatTimeline[
            maijiFlatTimeline.length - 1
        ];

    document.getElementById("maiji-section-image").src =
        latest.url;
    }
}

async function loadMaijiTimelineTest(){

    const selectedSection =
        els.maijiSectionSelect.value;

    const imageCode =
    els.maijiSectionSelect.value;

    console.log("選択断面 value", selectedSection);
    console.log("生成された画像コード", imageCode);

    const latest =
        await findLatestMaijiImage(imageCode);

    if(!latest){
        console.log("毎時大気解析の最新画像が見つかりません");
        return;
    }

    const candidates = [];

    for(let i = 0; i <= 6; i++){

        const targetTime =
            new Date(latest.time.getTime() - i * 60 * 60 * 1000);

        const timestamp =
            formatTimestamp(targetTime);

        candidates.push({
            index: i,
            timestamp: timestamp,
            url:
                `https://www.data.jma.go.jp/airinfo/data/pict/maiji/${imageCode}_RJTD_${timestamp}.PNG`
        });
}

maijiPlaneTimeline =
    await filterExistingImages(candidates);

maijiPlaneTimeline.reverse();

    maijiPlaneTimeline = timeline.reverse();

    console.log("断面タイムライン件数", maijiPlaneTimeline.length);
    console.log("断面タイムライン中身", maijiPlaneTimeline);

    if(maijiPlaneTimeline.length > 0){

    const latest =
        maijiPlaneTimeline[
            maijiPlaneTimeline.length - 1
        ];

    document.getElementById("maiji-plane-image").src =
        latest.url;

    document.getElementById("maiji-modal-time").innerText =
        formatDisplayTime(latest.timestamp);
    }

}

els.maijiHeightSelect
    .addEventListener("change", () => {
        loadMaijiSection();
    });

els.maijiSectionSelect
    .addEventListener("change", () => {
        loadMaijiTimelineTest();
    });