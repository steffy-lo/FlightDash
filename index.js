const dasha = require("@dasha.ai/sdk");
const fs = require("fs");
const _ = require("lodash");
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
    //TODO: implement your external function here
    
    console.log(`OK, ${args.country} is it? Let me check...`);
    let accessToken = await getAccessToken();
    let data = await getTravelRestrictions(accessToken, args.country);

    let summary = data.summary.substring(3, data.summary.length - 4); //in HTML
    let diseaseRiskLevel = data.diseaseRiskLevel;
    let entry = data.areaAccessRestriction.entry.text; //in HTML
    let exit = data.areaAccessRestriction.exit.text? data.areaAccessRestriction.exit.text : "No exit requirements."; //in HTML
    console.log(data.areaAccessRestriction);
    return `\n${summary}\n\nDisease Risk Level: ${diseaseRiskLevel}.`;
  });

  app.setExternal("get_covid_situation", async (args)=> {
    //TODO: implement your external function here
    let data = await getCovidData(args.country);
    let totalCases = data.cases;
    let todayCases = data.todayCases;
    let deaths = data.deaths;
    let todayDeaths = data.todayDeaths;
    
    return "\nTotal cases: " + totalCases + "\nToday cases: " + todayCases + "\nTotal deaths: " + deaths + "\nToday deaths: " + todayDeaths;
  });

  app.setExternal("get_available_flight", async (args)=> {
    //TODO: implement your external function here
    console.log(args);
    let returnString = "";
    let data = await getFlightOffers();
    if (!data || data.length <= 0) {
      return "Sorry, no available flights are found at this time. Please try again later."
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
