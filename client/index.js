import { Web } from "sip.js";

const api = "http://localhost:8000";
const runButton = document.getElementById("runButton");
const hangupButton = document.getElementById("hangupButton");
// const translator = new Translator();

var speechRecognition = window.webkitSpeechRecognition
var recognition = new speechRecognition();
recognition.continuous = true

recognition.onstart = function() {
 console.log("Voice Recognition is On");
//  translator.voiceToText(function (transcript) {
//     console.log(transcript);
//   }, 'en-US');
}

recognition.onspeechend = function() {
 console.log("No Activity");
}

recognition.onerror = function() {
 console.log("Try Again")
}

recognition.onresult = function(event) {
  var current = event.resultIndex;
  var transcript = event.results[current][0].transcript;
  var div = document.createElement("div");
  div.style.width = "600px";
  div.style.padding = "10px";
  div.style.background = "#d3e2ff";
  div.style.color = "black";
  div.style.borderRadius = "5px";
  div.style.margin = "10px";
  div.style.fontFamily = "Arial";
  div.innerHTML = transcript;
  document.body.appendChild(div);
}


const getAccount = async () => {
  const response = await fetch(`${api}/sip`);
  const { aor, endpoint } = await response.json();
  return { aor, endpoint };
};

const createUser = async (aor, server) => {
  const user = new Web.SimpleUser(server, { aor });
  await user.connect();
  await user.register();
  return user;
};

const runCall = async (aor, name) => {
  const data = { aor, name };
  await fetch(`${api}/call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

const main = async () => {
  const { aor, endpoint } = await getAccount();
  const user = await createUser(aor, endpoint);

  const audio = new Audio();
  user.delegate = {
    onCallReceived: async () => {
      await user.answer();
      runButton.hidden = true;
      hangupButton.hidden = false;
      hangupButton.disabled = false;
      audio.srcObject = user.remoteMediaStream;
      audio.play();
      recognition.start();
    },
    onCallHangup: () => {
      audio.srcObject = null;
      runButton.hidden = false;
      runButton.disabled = false;
      hangupButton.hidden = true;
      recognition.abort();
    },
  };

  runButton.addEventListener("click", async () => {
    runButton.disabled = true;
    runCall(aor, "Peter").catch(() => {
      runButton.disabled = false;
    });
  });

  hangupButton.addEventListener("click", async () => {
    hangupButton.disabled = true;
    await user.hangup().catch(() => {
      hangupButton.disabled = false;
    });
  });
};

main();
