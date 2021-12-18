const dasha = require("@dasha.ai/sdk");
const fs = require("fs");
const { getAccessToken, getTravelRestrictions, getFlightOffers } = require("./app/promises");

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
    
    console.log(`OK, ${args.log} is it? Let me check...`);
    let accessToken = await getAccessToken();
    let data = await getTravelRestrictions(accessToken, args.log);

    let summary = data.summary.substring(3, data.summary.length - 4); //in HTML
    let diseaseRiskLevel = data.diseaseRiskLevel;
    let entry = data.areaAccessRestriction.entry.text; //in HTML
    let exit = data.areaAccessRestriction.exit.text? data.areaAccessRestriction.exit.text : "No exit requirements."; //in HTML
    console.log(data.areaAccessRestriction);
    return `\n${summary}\n\nDisease Risk Level: ${diseaseRiskLevel}.`;
  });

  app.setExternal("get_covid_situation", (args)=> {
    //TODO: implement your external function here
    console.log(args.log);
    return "Risk level is quite high."
  });

  app.setExternal("get_available_flight", (args)=> {
    //TODO: implement your external function here
    console.log(args.log);
    getFlightOffers();
    return "None at this time."
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
