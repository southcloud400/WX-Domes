let lightningTimeline = [];

async function loadLightningImage(){

    const area =
        document.getElementById("lightning-area-select").value;

    const timeline = [];

    for(let i = 0; i <= 9; i++){

        const fileNumber =
            String(i).padStart(2, "0");

        const url =
            `https://www.imocwx.com/guid/gd3${fileNumber}${area}.png?${Date.now()}`;

        const exists =
            await imageExists(url);

        if(exists){
            timeline.push({
                index: timeline.length,
                label: `${i}時間後`,
                url: url
            });
        }
    }

    lightningTimeline = timeline;

    if(lightningTimeline.length > 0){

        document.getElementById("lightning-image").src =
            lightningTimeline[0].url;

        document.getElementById("lightning-time").innerText =
            `発雷確率 ${lightningTimeline[0].label}`;
    }

}