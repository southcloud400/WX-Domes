function getTimelineForImage(img){
    if(img.dataset.timeline === "maiji-flat"){
        return appState.maiji.flatTimeline;
    }

    if(img.dataset.timeline === "maiji-plane"){
        return appState.maiji.planeTimeline;
    }

    if(img.dataset.timeline === "lightning"){
        return appState.lightning.timeline;
    }

    return null;
}

function formatTimelineItemLabel(item){
    if(item.timestamp){
        return formatUtcTimestamp(item.timestamp);
    }

    return item.label || "";
}

function setModalTimelineItem(index){
    const item =
        appState.modal.timeline[index];

    if(!item){
        return;
    }

    els.modalImage.src =
        item.url;

    els.modalTime.innerText =
        formatTimelineItemLabel(item);
}

function closeModal(){
    els.imageModal.classList.remove("show");
}

function openTimelineModal(img, timeline){
    appState.modal.timeline =
        timeline;

    if(timeline.length === 0){
        els.modalControl.style.display =
            "none";
        return;
    }

    const currentIndex =
        Math.max(
            0,
            timeline.findIndex(item => item.url === img.src)
        );

    els.modalControl.style.display =
        "block";

    els.modalSlider.max =
        timeline.length - 1;

    els.modalSlider.value =
        currentIndex;

    setModalTimelineItem(currentIndex);
}

function enlargeImage(img){
    getElement("modal-satellite-overlay-container").style.display =
        "none";

    els.modalImage.style.display =
        "block";

    els.modalImage.src =
        img.src;

    const timeline =
        getTimelineForImage(img);

    if(timeline){
        openTimelineModal(img, timeline);
    }else{
        els.modalControl.style.display =
            "none";
    }

    els.imageModal.classList.add("show");
}

function openSatelliteOverlayModal(){
    getElement("modal-satellite-overlay-container").style.display =
    "none";
    

    els.modalImage.style.display =
        "none";

    els.modalControl.style.display =
        "none";

    const container =
        getElement("modal-satellite-overlay-container");

    container.replaceChildren();

    const sourceBox =
        document.querySelector(".satellite-overlay-box");

    if(!sourceBox){
        return;
    }

    const clonedBox =
        sourceBox.cloneNode(true);

    clonedBox.classList.add("modal-satellite-overlay-box");

    container.appendChild(clonedBox);

    container.style.display =
        "block";

    els.imageModal.classList.add("show");
}

function initModalEvents(){
    els.modalSlider.addEventListener("input", function(){
        setModalTimelineItem(Number(this.value));
    });

    document.querySelectorAll(".weather-image").forEach(image => {
        image.addEventListener("click", () => {
            enlargeImage(image);
        });
    });

    if(els.radarGrid){
        els.radarGrid.addEventListener("click", () => {
            openRadarPage();
        });
    }

    els.imageModal.addEventListener("click", () => {
        closeModal();
    });

    if(els.modalContent){
        els.modalContent.addEventListener("click", event => {
            event.stopPropagation();
        });
    }

    els.modalCloseButton.addEventListener("click", () => {
        closeModal();
    });
    const satelliteOverlayBox =
        document.querySelector(".satellite-overlay-box");

    if(satelliteOverlayBox){
        satelliteOverlayBox.addEventListener("click", () => {
            openSatelliteOverlayModal();
        });
    }

}
