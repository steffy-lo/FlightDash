require("dotenv").config();
const axios = require("axios");
const Amadeus = require("amadeus");

const amadeus = new Amadeus({
  clientId: process.env.API_KEY,
  clientSecret: process.env.API_SECRET,
});

async function getAccessToken() {
  let formBody = `grant_type=client_credentials&client_id=${process.env.API_KEY}&client_secret=${process.env.API_SECRET}`;

  try {
    const res = await axios.post(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      formBody,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log(res.data.access_token);
    return res.data.access_token;
  } catch (error) {
    console.log(error);
  }
}

async function getTravelRestrictions(accessToken, country) {
  try {
    const res = await axios.get(
      `https://test.api.amadeus.com/v1/duty-of-care/diseases/covid19-area-report?countryCode=${country}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: `application/json`,
        },
      }
    );
    //console.log(res.data.data);
    return res.data.data;
  } catch (error) {
    console.error(error);
  }
}

async function getFlightOffers() {
  try {
    const res = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: "SYD",
      destinationLocationCode: "BKK",
      departureDate: "2022-06-01",
      adults: "2",
    });
    console.log(res.data);
  } catch (error) {
    console.error(error);
  }
}

module.exports = { getAccessToken, getTravelRestrictions, getFlightOffers };
