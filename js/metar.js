const METAR_API_URL =
    "https://wx-domes-ai-summary.just-966.workers.dev/awc";

const ATIS_API_URL =
    "https://wx-domes-ai-summary.just-966.workers.dev/atis";

    const ATIS_SUPPORTED_AIRPORTS = new Set([
    "RJTT",
    "RJAA",
    "RJCC",
    "RJCH",
    "RJSS",
    "RJSN",
    "RJGG",
    "RJOO",
    "RJOA",
    "RJBE",
    "RJBB",
    "RJOM",
    "RJOK",
    "RJAA",
    "RJFF",
    "RJFS",
    "RJFU",
    "RJFO",
    "RJFT",
    "RJFM",
    "RJFK",
    "ROAH"
]);

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

    let currentAirport = "";
    let currentType = "";

    lines.forEach(line => {

        const match =
            line.match(
                /^(?:(METAR|TAF)\s+)?(?:(AMD|COR)\s+)?([A-Z]{4})\s+/
            );

        if(match){

            const type =
                line.includes(" TAF ") ||
                line.startsWith("TAF")
                    ? "taf"
                    : "metar";

            const airport =
                match[3];

            if(!groups[airport]){
                groups[airport] = {
                    metar: [],
                    taf: []
                };
            }

            groups[airport][type].push(line);

            currentAirport = airport;
            currentType = type;

            return;
        }

        if(
            currentAirport &&
            currentType &&
            groups[currentAirport]
        ){
            const reports =
                groups[currentAirport][currentType];

            if(reports.length > 0){
                const lastIndex =
                    reports.length - 1;

                reports[lastIndex] +=
                    "\n" + line;
            }
        }
    });

    return groups;
}

function formatMetarTafText(
    text,
    airportIds = [],
    atisByAirport = null
){

    const lines =
        text
            .split("\n")
            .map(line => line.trim())
            .filter(line => line !== "");

    const groups =
        createMetarTafGroups(lines);

    const airports =
        airportIds.length > 0
            ? airportIds
            : Object.keys(groups);

    const useAtis =
        atisByAirport !== null;

    const output =
        airports.map(airport => {

            const group =
                groups[airport] || {
                    metar: [],
                    taf: []
                };


            const primaryText =
                useAtis
                    ? escapeHtml(
                        atisByAirport[airport] ||
                        "ATIS is not available."
                    )
                    : (
                        group.metar.length > 0
                            ? group.metar
                                .slice(0, 3)
                                .map(formatMetarReport)
                                .join("\n")
                            : ""
                    );

            const tafText =
                group.taf.length > 0
                    ? escapeHtml(
                        group.taf.join("\n")
                    )
                    : createJmaAirportForecastLinks(
                        airport
                    );

            return (
                `【${airport}】\n` +
                (
                    useAtis
                        ? primaryText
                        : "-METAR-\n" + primaryText
                ) +
                "\n\n" +
                "-TAF-\n" +
                tafText
            );
        });

    return output.join(
        "\n\n--------------------\n\n"
    );
}

function escapeHtml(text){
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function createJmaAirportForecastLinks(airport){

    const baseUrl =
        "https://www.data.jma.go.jp/airinfo/data/pict/taf";

    const part1Url =
        `${baseUrl}/QMCD98_${airport}.png`;

    const part2Url =
        `${baseUrl}/QMCJ98_${airport}.png`;

    return (
        `TAF is not available. Please refer to\n` +
        `<a href="${part1Url}" target="_blank" rel="noopener noreferrer">` +
        `飛行場時系列予報 Part 1</a>\n` +
        `<a href="${part2Url}" target="_blank" rel="noopener noreferrer">` +
        `飛行場時系列予報 Part 2</a>`
    );
}

function getMetarVisibility(metar){

    const match =
        metar.match(
            /(?:^|\s)(\d{4})(?=\s|$)/
        );

    if(!match){
        return null;
    }

    return Number(match[1]);
}

function normalizeRvrValue(prefix, value){

    const number =
        Number(value);

    if(prefix === "M"){
        return number - 1;
    }

    if(prefix === "P"){
        return Infinity;
    }

    return number;
}

function getLowestMetarRvr(metar){

    const matches =
        metar.matchAll(
            /\bR\d{2}[LCR]?\/([MP]?)(\d{4})(?:V([MP]?)(\d{4}))?[UDN]?\b/g
        );

    const values = [];

    for(const match of matches){

        values.push(
            normalizeRvrValue(
                match[1],
                match[2]
            )
        );

        if(match[4]){
            values.push(
                normalizeRvrValue(
                    match[3],
                    match[4]
                )
            );
        }
    }

    if(values.length === 0){
        return null;
    }

    return Math.min(...values);
}

function getLowestMetarCeiling(metar){

    const matches =
        metar.matchAll(
            /\b(?:BKN|OVC|VV)(\d{3})\b/g
        );

    const ceilings = [];

    for(const match of matches){
        ceilings.push(
            Number(match[1]) * 100
        );
    }

    if(ceilings.length === 0){
        return null;
    }

    return Math.min(...ceilings);
}

function isBelow(value, threshold){

    return (
        value !== null &&
        value < threshold
    );
}

function getMetarSeverity(metar){

    const visibility =
        getMetarVisibility(metar);

    const rvr =
        getLowestMetarRvr(metar);

    const ceiling =
        getLowestMetarCeiling(metar);

    if(
        isBelow(visibility, 300) ||
        isBelow(rvr, 300) ||
        isBelow(ceiling, 100)
    ){
        return "red";
    }

    if(
        isBelow(visibility, 550) ||
        isBelow(rvr, 550) ||
        isBelow(ceiling, 200)
    ){
        return "purple";
    }

    if(
        isBelow(visibility, 3200) ||
        isBelow(ceiling, 600)
    ){
        return "orange";
    }

    if(
        isBelow(visibility, 5000) ||
        isBelow(ceiling, 1000)
    ){
        return "yellow";
    }

    return "normal";
}

function formatMetarReport(metar){

    const escapedMetar =
        escapeHtml(metar);

    const severity =
        getMetarSeverity(metar);

    if(severity === "normal"){
        return escapedMetar;
    }

    return (
        `<span class="metar-severity-${severity}">` +
        escapedMetar +
        `</span>`
    );
}

async function loadAirportWeather(){

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

                const useAtis =
                    document.getElementById(
                        "atis-toggle"
                    ).checked;

                const awcPromise =
                    fetch(
                        `${METAR_API_URL}?${params.toString()}`
                    );

                const atisAirportIds =
                    airportIds.filter(id =>
                        ATIS_SUPPORTED_AIRPORTS.has(id)
                    );

                const atisPromise =
                    useAtis && atisAirportIds.length > 0
                        ? fetch(
                            `${ATIS_API_URL}?` +
                            new URLSearchParams({
                                location:
                                    atisAirportIds.join(",")
                            }).toString()
                        )
                        : null;

                const response =
                    await awcPromise;

                if(requestId !== metarRequestId){
                    return;
                }

                if(!response.ok){
                    throw new Error(
                        `HTTP ${response.status}`
                    );
                }

                const data =
                    await response.json();

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
                        .filter(value =>
                            value.trim() !== ""
                        )
                        .join("\n");

                let atisByAirport =
                    null;

                if(useAtis){

                    atisByAirport = {};

                    if(atisPromise){

                        const atisResponse =
                            await atisPromise;

                        if(!atisResponse.ok){
                            throw new Error(
                                `ATIS HTTP ${atisResponse.status}`
                            );
                        }

                        const atisData =
                            await atisResponse.json();

                        if(!atisData.ok){
                            throw new Error(
                                "ATISの取得に失敗しました"
                            );
                        }

                        atisData.atis.forEach(item => {
                            atisByAirport[item.location] =
                                item.atis || "";
                        });
                    }
                }

                if(requestId !== metarRequestId){
                    return;
                }

                els.metarText.innerHTML =
                    formatMetarTafText(
                        text,
                        airportIds,
                        atisByAirport
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
        loadAirportWeather();
    });
}




