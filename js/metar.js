function formatMetarTafText(text){

    const lines =
        text
            .split("\n")
            .map(line => line.trim())
            .filter(line => line !== "");

    const groups = {};

    lines.forEach(line => {

        const match = line.match(/^(?:(METAR|TAF)\s+)?([A-Z]{4})\s+/);

        if(!match){
            return;
        }

        const type = line.includes(" TAF ") || line.startsWith("TAF")
            ? "TAF"
            : "METAR";
        const airport = match[2];

        if(!groups[airport]){
            groups[airport] = {
                metar: [],
                taf: []
            };
        }

        if(type === "METAR"){
            groups[airport].metar.push(line);
        }

        if(type === "TAF"){
            groups[airport].taf.push(line);
        }
    });

    let output = "";

    Object.keys(groups).forEach(airport => {

        output += `【${airport}】\n`;

        output += "-METAR-\n";
        output += groups[airport].metar.slice(0, 3).join("\n");
        output += "\n\n";

        output += "-TAF-\n";
        output += groups[airport].taf.join("\n");
        output += "\n\n--------------------\n\n";
    });

    return output;
}

async function loadMetarText(){

    try{

        const ids =
        document
            .getElementById("airport-list")
            .value
            .toUpperCase()
            .replace(/\s+/g, "");

        const url =
            `https://aviationweather.gov/api/data/metar?ids=${ids}&format=raw&taf=true&hours=3`;

        const response =
            await fetch(url);

        if(!response.ok){
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const text =
            await response.text();

        els.metarText.innerText =
            formatMetarTafText(text);

    }catch(error){

        console.error(
            "METAR取得失敗",
            error
        );

        els.metarText.innerText =
            "METAR/TAF の取得に失敗しました";
    }
}