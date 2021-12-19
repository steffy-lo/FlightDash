const dasha = require("@dasha.ai/sdk");
const fs = require("fs");
const _ = require("lodash");
const airports = require('airport-codes');
const { getAccessToken, getTravelRestrictions, getFlightOffers, getCovidData } = require("./app/promises");

async function main() 
{
  const app = await dasha.deploy("./app");

  app.connectionProvider = async (conv) =>
    conv.input.phone === "chat"
      ? dasha.chat.connect(await dasha.chat.createConsoleChat())
      : dasha.sip.connect(new dasha.sip.Endpoint("default"));

  app.ttsDispatcher = () => "dasha";

  app.setExternal("get_travel_restrictions", async (args)=> {
    console.log(`OK, ${args.country} is it? Let me check...`);
    const countryMappings = {
      "Singapore": "SG",
      "United States": "US",
      "Canada": "CA",
      "China": "CN",
      "India": "IN",
      "United Kingdom": "UK",
      "Indonesia": "IN",
      "Russia": "RU",
      "Japan": "JP",
      "South Korea": "KR",
      "Italy": "IT",
      "Germany": "DE",
      "Spain": "ES",
      "France": "FR",
      "Australia": "AU",
      "Vietnam": "VN",
      "Thailand": "TH"
    }

    if (!countryMappings[args.country]) {
      return "Sorry, we don't recognize that country. Please try again."
    }
    let accessToken = await getAccessToken();
    let data = await getTravelRestrictions(accessToken, countryMappings[args.country]);

    let summary = data.summary.substring(3, data.summary.length - 4); //in HTML
    let diseaseRiskLevel = data.diseaseRiskLevel;

    return `\n${summary}\n\nDisease Risk Level: ${diseaseRiskLevel}.`;
  });

  //Entry and exit restrictions
  app.setExternal("get_entry_exit", async (args)=> {
    console.log(`OK, ${args.country} is it? Let me check...`);
    const countryMappings = {
      "Singapore": "SG",
      "United States": "US",
      "Canada": "CA",
      "China": "CN",
      "India": "IN",
      "United Kingdom": "UK",
      "Indonesia": "IN",
      "Russia": "RU",
      "Japan": "JP",
      "South Korea": "KR",
      "Italy": "IT",
      "Germany": "DE",
      "Spain": "ES",
      "France": "FR",
      "Australia": "AU",
      "Vietnam": "VN",
      "Thailand": "TH"
    }

    if (!countryMappings[args.country]) {
      return "Sorry, we don't recognize that country. Please try again."
    }
    let accessToken = await getAccessToken();
    let data = await getTravelRestrictions(accessToken, countryMappings[args.country]);

    let entryText = data.areaAccessRestriction.entry.text? data.areaAccessRestriction.entry.text : "No entry requirements.";
    let exitText = data.areaAccessRestriction.exit.text? data.areaAccessRestriction.exit.text : "No exit requirements";

    let entry = entryText.replace(/<\/?p[^>]*>/g, "");
    let exit = exitText.replace(/<\/?p[^>]*>/g, "");

    let result = "";
    if (args.entry_exit_val.includes("entry")) {
      result += `\n\nThe entry requirements are: ${entry}\n\n`;
    }
    if (args.entry_exit_val.includes("exit")) {
      result += `The exit requirements are: ${exit}.`;
    }
    return result
  });

  app.setExternal("get_covid_situation", async (args)=> {
    let data = await getCovidData(args.country);
    let totalCases = data.cases;
    let todayCases = data.todayCases;
    let deaths = data.deaths;
    let todayDeaths = data.todayDeaths;
    
    return "\nTotal cases: " + totalCases + "\nToday cases: " + todayCases + "\nTotal deaths: " + deaths + "\nToday deaths: " + todayDeaths;
  });

  app.setExternal("get_available_flight", async (args)=> {
    let [origin, destination] = args.flight_info.split(" to ");
    origin = origin.charAt(0).toUpperCase() + origin.toLowerCase().slice(1);
    destination = destination.charAt(0).toUpperCase() + destination.toLowerCase().slice(1);
    const originIATAs = airports.where({ city: origin }).map(x => x.attributes.iata);
    const destinationIATAs = airports.where({ city: destination }).map(x => x.attributes.iata);
    let returnString = "";
    let data = await getFlightOffers(originIATAs, destinationIATAs);
    if (!data || data.length <= 0) {
      return "\nSorry, no available flights are found at this time. Please try again later."
    }else{
      let flightOffers = [];
      for(let i=0; i < data.length; i+=1){
        for (let j=0; j< data[i].segments.length; j++){
          let segment = data[i].segments[j];
          let isSame = false;
          for (let k=0; k< flightOffers.length; k++){
            if (flightOffers[k].departure.iataCode === segment.departure.iataCode && flightOffers[k].arrival.iataCode === segment.arrival.iataCode){
              isSame = true;
              break;
            }
          }
          if (!isSame && flightOffers.length < 4){
            flightOffers.push({departure: segment.departure, arrival: segment.arrival, duration: data[i].duration});
          }
        }
        
      }
      flightOffers = _.groupBy(flightOffers, 'duration');
      Object.keys(flightOffers).forEach((duration, i) => {
        returnString += `\n---Flight ${i+1}---\nDuration: ${duration}\nItinerary:`;
        flightOffers[duration].map((segment) => {
          returnString +=`\nDepart from ${segment.departure.iataCode} at ${segment.departure.at} - Arrive in ${segment.arrival.iataCode} at ${segment.arrival.at}`;
        });
        returnString += "\n";
      });
    }
    return returnString;
  });

  await app.start();

  const conv = app.createConversation({ phone: process.argv[2] ?? "", name: process.argv[3] ?? "" });

  if (conv.input.phone !== "chat") conv.on("transcription", console.log);

  const logFile = await fs.promises.open("./log.txt", "w");
  await logFile.appendFile("#".repeat(100) + "\n");

  conv.on("transcription", async (entry) => {
    await logFile.appendFile(`${entry.speaker}: ${entry.text}\n`);
  });

  conv.on("debugLog", async (event) => {
    if (event?.msg?.msgId === "RecognizedSpeechMessage") {
      const logEntry = event?.msg?.results[0]?.facts;
      await logFile.appendFile(JSON.stringify(logEntry, undefined, 2) + "\n");
    }
  });

  const result = await conv.execute();

  console.log(result.output);

  await app.stop();
  app.dispose();

  await logFile.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
