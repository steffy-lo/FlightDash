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

3. To start a text chat, run:

```sh
npm start chat
```

4. To receive a phone call from Dasha in-browser, run:

```sh
npm run prod
```
