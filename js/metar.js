const METAR_API_URL =
    "https://wx-domes-ai-summary.just-966.workers.dev/awc";

let metarRequestId = 0;

function parseAirportIds(value){
    const ids =
        value
            .toUpperCase()
            .split(",")
            .map(id => id.trim())
            .filter(id => id !== "");

    const invalidIds =
        ids.filter(id => !/^[A-Z]{4}$/.test(id));

    if(ids.length === 0){
        throw new Error("Please enter the 4-letter airport code.");
    }

    if(invalidIds.length > 0){
        throw new Error(
            `空港コードを4文字で入力してください: ${invalidIds.join(", ")}`
        );
    }

    return [...new Set(ids)];
}

function createMetarTafGroups(lines){
    const groups = {};

    lines.forEach(line => {
        const match =
            line.match(/^(?:(METAR|TAF)\s+)?(?:(AMD|COR)\s+)?([A-Z]{4})\s+/);

        if(!match){
            return;
        }

        const type =
            line.includes(" TAF ") || line.startsWith("TAF")
                ? "TAF"
                : "METAR";

        const airport =
            match[3];

        if(!groups[airport]){
            groups[airport] = {
                metar: [],
                taf: []
            };
        }

        groups[airport][type.toLowerCase()].push(line);
    });

    return groups;
}

function formatMetarTafText(text, airportIds = []){

    const lines =
        text
            .split("\n")
            .map(line => line.trim())
            .filter(line => line !== "");

    if(lines.length === 0){
        return "METAR/TAF は見つかりませんでした";
    }

    const groups =
        createMetarTafGroups(lines);

    const airports =
        airportIds.length > 0
            ? airportIds
            : Object.keys(groups);

    const output =
        airports.map(airport => {
            const group =
                groups[airport] || {
                    metar: [],
                    taf: []
                };

            const metarText =
                group.metar.length > 0
                    ? group.metar.slice(0, 3).join("\n")
                    : "";

            const tafText =
                group.taf.length > 0
                    ? group.taf.join("\n")
                    : "";

            return (
                `【${airport}】\n` +
                "-METAR-\n" +
                metarText +
                "\n\n" +
                "-TAF-\n" +
                tafText
            );
        });

    return output.join("\n\n--------------------\n\n");
}

async function loadMetarText(){

    const requestId =
        ++metarRequestId;

    try{
        const airportIds =
            parseAirportIds(els.airportList.value);

        els.airportList.value =
            airportIds.join(",");

        els.metarText.innerText =
            "METAR/TAF を取得中...";

                const params =
                    new URLSearchParams({
                        ids: airportIds.join(",")
                    });

                const response =
                    await fetch(
                        `${METAR_API_URL}?${params.toString()}`
                    );

                if(requestId !== metarRequestId){
                    return;
                }

                if(!response.ok){
                    throw new Error(`HTTP ${response.status}`);
                }

                const data =
                    await response.json();

                if(requestId !== metarRequestId){
                    return;
                }

                if(!data.ok){
                    throw new Error(
                        data.error ||
                        "METAR/TAF の取得に失敗しました"
                    );
                }

                const text =
                    [
                        data.metar || "",
                        data.taf || ""
                    ]
                        .filter(value => value.trim() !== "")
                        .join("\n");

                els.metarText.innerText =
                    formatMetarTafText(
                        text,
                        airportIds
                    );

    }catch(error){

        console.error(
            "METAR取得失敗",
            error
        );

        els.metarText.innerText =
            error.message || "METAR/TAF の取得に失敗しました";
    }
}

function initMetarEvents(){
    els.metarUpdateButton.addEventListener("click", () => {
        loadMetarText();
    });
}
