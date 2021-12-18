const dasha = require("@dasha.ai/sdk");
const { v4: uuidv4 } = require("uuid");
const express = require("express");
const cors = require("cors");

const expressApp = express();
expressApp.use(express.json());
expressApp.use(cors());

const { getAccessToken, getTravelRestrictions, getFlightOffers, getCovidData } = require("./app/promises");

const main = async () => {
  const app = await dasha.deploy(`${__dirname}/app`);

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

  await app.start({ concurrency: 10 });

  expressApp.get("/sip", async (req, res) => {
    const domain = app.account.server.replace("app.", "sip.");
    const endpoint = `wss://${domain}/sip/connect`;

    // client sip address should:
    // 1. start with `sip:reg`
    // 2.  be unique
    // 3. use the domain as the sip server
    const aor = `sip:reg-${uuidv4()}@${domain}`;

    res.send({ aor, endpoint });
  });

  expressApp.post("/call", async (req, res) => {
    const { aor, name } = req.body;
    res.sendStatus(200);

    console.log("Start call for", req.body);
    const conv = app.createConversation({ phone: aor, name });
    conv.on("transcription", console.log);
    conv.audio.tts = "dasha";
    conv.audio.noiseVolume = 0;

    await conv.execute();
  });

  const server = expressApp.listen(8000, () => {
    console.log("Api started on port 8000.");
  });

  process.on("SIGINT", () => server.close());
  server.once("close", async () => {
    await app.stop();
    app.dispose();
  });
};

main();