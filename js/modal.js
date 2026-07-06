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

    if(img.dataset.timeline === "metair-cslfm"){
    return appState.metair.cslfmTimeline;
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

async function reloadMetairModalTimelineBySection(){

    const sectionSelect =
        getElement("metair-modal-section-select");

    const mainSectionSelect =
        getElement("metair-cslfm-section-select");

    const mainTypeSelect =
    getElement("metair-cslfm-type-select");

    const typeSelect =
        getElement("metair-modal-type-select");

    mainSectionSelect.value =
        sectionSelect.value;

    mainTypeSelect.value =
        typeSelect.value;

    const sectionCode =
        sectionSelect.value;

    const isPotentialTemperature =
        typeSelect.value === "2299";

    const analysisCode =
        isPotentialTemperature
            ? `WANLC2${sectionCode}`
            : `WANLC1${sectionCode}`;

    const forecastCode =
        isPotentialTemperature
            ? `22${sectionCode}`
            : `21${sectionCode}`;

    const timeline =
        await buildMetairCombinedTimeline(
            analysisCode,
            forecastCode
        );

    appState.metair.cslfmTimeline =
        timeline;

    appState.modal.timeline =
        timeline;

    const latestAnalysisIndex =
        timeline.findLastIndex(item =>
            item.type === "analysis"
        );

    const index =
        latestAnalysisIndex >= 0
            ? latestAnalysisIndex
            : timeline.length - 1;

    els.modalSlider.max =
        timeline.length - 1;

    els.modalSlider.value =
        index;

    setModalTimelineItem(index);
}

function closeModal(){

    els.imageModal.classList.remove("show");

    getElement("modal-cloudtop-index").style.display =
    "none";

    appState.modal.type =
        null;

    appState.modal.satelliteBox =
        null;
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

    getElement("metair-modal-control").style.display =
    "none";

    els.modalImage.style.display =
        "block";

    els.modalImage.src =
        img.src;

    const timeline =
        getTimelineForImage(img);

    if(timeline){
    openTimelineModal(img, timeline);

    if(img.dataset.timeline === "metair-cslfm"){
        getElement("metair-modal-control").style.display =
            "block";
    }
    }else{
        els.modalControl.style.display =
            "none";
    }

    els.imageModal.classList.add("show");
}

function setModalSatelliteItem(index){

    const item =
        appState.modal.timeline[index];

    if(!item || !appState.modal.satelliteBox){
        return;
    }

    setSatelliteOverlayTiles(
        appState.modal.satelliteBox,
        item
    );

    els.modalTime.innerText =
        formatUtcTimestamp(item.validtime);
}

function openSatelliteOverlayModal(){

    els.modalImage.style.display =
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

    appState.modal.satelliteBox =
        clonedBox;

    appState.modal.timeline =
        appState.satellite.timeline;

    appState.modal.type =
        "satellite";

    if(appState.modal.timeline.length > 0){

        els.modalControl.style.display =
            "block";

        els.modalSlider.max =
            appState.modal.timeline.length - 1;

        els.modalSlider.value =
            appState.modal.timeline.length - 1;

        setModalSatelliteItem(
            appState.modal.timeline.length - 1
        );

    }else{
        els.modalControl.style.display =
            "none";
    }

    getElement("modal-cloudtop-index").style.display =
    "block";

    container.style.display =
        "block";

    els.imageModal.classList.add("show");
}

function initModalEvents(){
   els.modalSlider.addEventListener("input", function(){

    if(appState.modal.type === "satellite"){
        setModalSatelliteItem(Number(this.value));
        return;
    }

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

    getElement("metair-modal-section-select")
    .addEventListener("change", () => {
        reloadMetairModalTimelineBySection();
    });

    getElement("metair-modal-type-select")
    .addEventListener("change", () => {
        reloadMetairModalTimelineBySection();
    });

}
