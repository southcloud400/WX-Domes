let lightningTimeline = [];

async function loadLightningImage(){

    const area =
        els.lightningAreaSelect.value;

    const candidates = [];

    for(let i = 0; i <= 9; i++){

    const fileNumber =
        String(i).padStart(2, "0");

    candidates.push({
        index: i,
        label: `${i}時間後`,
        url:
            `https://www.imocwx.com/guid/gd3${fileNumber}${area}.png?${Date.now()}`
    });
}

const timeline =
    await filterExistingImages(candidates);

    lightningTimeline = timeline;

    if(lightningTimeline.length > 0){

        els.lightningImage.src =
            lightningTimeline[0].url;

        els.lightningTime.innerText =
            `発雷確率 ${lightningTimeline[0].label}`;
}

}

els.lightningAreaSelect
    .addEventListener("change", () => {
        loadLightningImage();
    });