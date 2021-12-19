
# About FlightDash
At FlightDash, you will be conversing with Dash, the chatbot to ask any inquiries regarding COVID-19 travel restrictions, latest data, entry/exit requirements and risk level, or flight availability. You just need to ask, and then Dash will simply answer.

With its superior conversational AI, Dash can handle any non-scripted human questions and serve you with utmost care and efficiency.

## Video Demo
[![Watch the video](https://img.youtube.com/vi/jpFCXpaqqck/maxresdefault.jpg)](https://youtu.be/jpFCXpaqqck)

### Built With
- Dasha.AI
- Node.js
- Amadeus API

> Submitted for Dashathon at https://devpost.com/software/flightdash
> Read more about FlightDash at this [blog post](https://victoria2666.medium.com/flightdash-handle-all-your-travel-concerns-with-a-conversational-ai-7cec5745380c?sk=b6839d51d4c7961d9084515210ae74b3)

# How to start Flight Dash

1. Clone the repo and install the dependencies:

```sh
git clone https://github.com/steffy-lo/FlightDash.git
cd FlightDash
npm install
```

2. Create or log into your account using the Dasha CLI tool:

```sh
npx dasha account login
```

3. Create or log into your Amadeus account at: https://developers.amadeus.com/

4. Create a .env file with your Amadeus credentials and place it under `~/FlightDash/.env`
```sh
API_KEY=your_api_key
API_SECRET=your_api_secret
```

5. To start a text chat, run:

```sh
npm start chat
```

6. To receive a phone call from Dasha in-browser, run:

```sh
npm run prod
```
