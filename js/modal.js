function closeModal(){

    document
        .getElementById("imageModal")
        .classList.remove("show");
}

document
    .getElementById("maiji-modal-slider")
    .addEventListener("input", function(){

       const index =
            Number(this.value);

        els.modalImage.src =
            currentMaijiTimeline[index].url;

        document.getElementById("maiji-modal-time").innerText =
        currentMaijiTimeline[index].timestamp
            ? formatDisplayTime(currentMaijiTimeline[index].timestamp)
            : currentMaijiTimeline[index].label;
    });

function enlargeImage(img){

    els.modalImage.src = img.src;

    const control =
        els.modalControl;

    if(
        img.dataset.timeline === "maiji-plane" ||
        img.dataset.timeline === "maiji-flat" ||
        img.dataset.timeline === "lightning"
    ){

        let timeline;

        if(img.dataset.timeline === "maiji-flat"){
            timeline = maijiFlatTimeline;
        }else if(img.dataset.timeline === "lightning"){
            timeline = lightningTimeline;
        }else{
            timeline = maijiPlaneTimeline;
        }

        currentMaijiTimeline = timeline;

        if(timeline.length === 0){
        control.style.display = "none";
        return;
        }

        control.style.display = "block";

        const slider =
            els.modalSlider;

        slider.max =
            timeline.length - 1;
            timeline.length - 1;

    if(img.dataset.timeline === "lightning"){
        slider.value = 0;
    }else{
        slider.value = timeline.length - 1;
    }
                els.modalTime.innerText =
                timeline[0].timestamp
                    ? formatDisplayTime(timeline[0].timestamp)
                    : timeline[0].label;
                    }

        }else{

            control.style.display = "none";
        }

        document
            .getElementById("imageModal")
            .classList.add("show");
}