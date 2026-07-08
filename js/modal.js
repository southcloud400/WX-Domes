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

    if(img.dataset.timeline === "metair-flat"){
    return appState.metair.flatTimeline;
    }

    if(img.dataset.timeline === "metair-cloud-top"){
    return appState.metair.cloudTopTimeline;
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

    updateMetairModalEcho(item);

}

function updateMetairModalEcho(item){

    const echoImage =
        getElement("metair-modal-echo-image");

    const echoCheckbox =
        getElement("metair-modal-echo-checkbox");

    if(
        appState.modal.type !== "metair-cslfm" ||
        !item ||
        item.type !== "analysis" ||
        !echoCheckbox.checked
    ){
            echoImage.style.display =
            "none";

        echoImage.removeAttribute("src");

        return;
    }

    const sectionCode =
        getElement("metair-modal-section-select").value;

    echoImage.src =
        "https://www3.metair.go.jp/pict/anl/multi/cs/" +
        `WANLCE${sectionCode}_RJTD_${item.timestamp}.png?` +
        Date.now();

    echoImage.style.display =
        "block";
}

async function reloadMetairModalTimelineBySection(){

    const sectionSelect =
        getElement("metair-modal-section-select");

    const mainSectionSelect =
        getElement("metair-cslfm-section-select");

    const typeRadio =
        document.querySelector(
            'input[name="metair-modal-type"]:checked'
        );

    if(!typeRadio){
        return;
    }

    mainSectionSelect.value =
        sectionSelect.value;

    const mainTypeRadio =
        document.querySelector(
            `input[name="metair-cslfm-type"][value="${typeRadio.value}"]`
        );

    if(mainTypeRadio){
        mainTypeRadio.checked =
            true;
    }

    const sectionCode =
        sectionSelect.value;

    const isPotentialTemperature =
        typeRadio.value === "2299";

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

async function reloadMetairFlatModalTimelineByHeight(){

    const modalHeightSelect =
        getElement("metair-modal-height-select");

    const mainHeightSelect =
        getElement("metair-flat-height-select");

    const heightCode =
        modalHeightSelect.value;

    mainHeightSelect.value =
        heightCode;

    const timeline =
        await buildMetairFlatCombinedTimeline(
            heightCode
        );

    appState.metair.flatTimeline =
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

    let currentIndex =
    timeline.findIndex(item =>
        img.src.startsWith(item.url)
    );

if(currentIndex < 0){
    currentIndex =
        timeline.findLastIndex(item =>
            item.type === "analysis"
        );
}

if(currentIndex < 0){
    currentIndex =
        timeline.length - 1;
}

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

    getElement("metair-modal-section-select").style.display =
        "none";

    getElement("metair-modal-height-select").style.display =
        "none";

    document
        .querySelectorAll(".metair-modal-type-option")
        .forEach(option => {
            option.style.display = "none";
        });

    document
        .querySelectorAll(".metair-modal-echo-option")
        .forEach(option => {
            option.style.display = "none";
        });

    els.modalImage.style.display =
        "block";

    els.modalImage.src =
        img.src;

    const timeline =
        getTimelineForImage(img);

    appState.modal.type =
        img.dataset.timeline || null;

    if(timeline){
        openTimelineModal(img, timeline);

        if(img.dataset.timeline === "metair-cslfm"){
            getElement("metair-modal-control").style.display =
                "block";

            getElement("metair-modal-section-select").style.display =
                "inline-block";

            document
                .querySelectorAll(".metair-modal-type-option")
                .forEach(option => {
                    option.style.display = "inline-block";
                });

            document
                .querySelectorAll(".metair-modal-echo-option")
                .forEach(option => {
                    option.style.display = "inline-block";
                });
        }

        if(img.dataset.timeline === "metair-flat"){
            getElement("metair-modal-control").style.display =
                "block";

            const heightSelect =
                getElement("metair-modal-height-select");

            heightSelect.style.display =
                "inline-block";

            heightSelect.value =
                getElement("metair-flat-height-select").value;
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

    getElement("metair-modal-control").style.display =
    "none";

    getElement("metair-modal-section-select").style.display =
        "none";

    getElement("metair-modal-height-select").style.display =
        "none";

    document
        .querySelectorAll(".metair-modal-type-option")
        .forEach(option => {
            option.style.display = "none";
        });

    document
        .querySelectorAll(".metair-modal-echo-option")
        .forEach(option => {
            option.style.display = "none";
        });

    getElement("metair-modal-echo-image").style.display =
        "none";

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

    document
        .querySelectorAll('input[name="metair-modal-type"]')
        .forEach(radio => {
            radio.addEventListener("change", () => {
                reloadMetairModalTimelineBySection();
            });
        });

    getElement("metair-modal-echo-checkbox")
        .addEventListener("change", () => {
            setModalTimelineItem(
                Number(els.modalSlider.value)
            );
        });

    getElement("metair-modal-height-select")
    .addEventListener("change", () => {
        reloadMetairFlatModalTimelineByHeight();
    });

}
