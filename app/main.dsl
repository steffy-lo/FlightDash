import "commonReactions/all.dsl";

context 
{
    // declare input variables here. phone must always be declared. name is optional 
    input phone: string;

    // declare storage variables here 

    // user input
    country: string = "";
    flight_info: string = "";

    // ai output
    available_flight: string = "";
    travel_restriction: string = "";
    covid_situation: string = "";
    entry_exit_requirement: string = "";
    entry_exit_val: string = "";

}

// declare external functions here 
external function get_travel_restrictions(country: string): string;
external function get_covid_situation(country: string): string;
external function get_available_flight(flight_info: string): string;
external function get_entry_exit(country: string, entry_exit_val: string): string;

// lines 28-42 start node 
start node root 
{
    do //actions executed in this node 
    {
        #connectSafe($phone); // connecting to the phone number which is specified in index.js that it can also be in-terminal text chat
        #waitForSpeech(2000); // give the person a second to start speaking 
        #say("greeting"); // and greet them. Refer to phrasemap.json > "greeting" (line 12); note the variable $name for phrasemap use
        wait *;
    }
    transitions // specifies to which nodes the conversation goes from here 
    {
        flight_availability: goto flight_availability on #messageHasData("flight_availability");
        check_flights: goto check_flights on #messageHasData("flight_info");
        travel_restrictions: goto travel_restrictions on #messageHasData("travel_restrictions"); 
        covid19_cases: goto covid19_cases on #messageHasData("covid");
        entry_exit_requirements: goto entry_exit_requirements on #messageHasData("entry_exit_prompt");
    }
}

node entry_exit_requirements {
    do {
        set $entry_exit_val = #messageGetData("entry_exit_prompt")[0]?.value??"";
        #say("which_country");
        wait *;
    }
    transitions
    {
        check_entry_exit_requirements: goto check_entry_exit_requirements on #messageHasData("country");
    }
}

node flight_availability {
    do {
        #say("where_to");
        wait *;
    }
    transitions
    {
        check_flights: goto check_flights on #messageHasData("flight_info");
    }
}

node travel_restrictions {
    do {
        #say("which_country");
        wait *;
    }
    transitions
    {
        check_travel_restrictions: goto check_travel_restrictions on #messageHasData("country");
    }
}

node covid19_cases {
    do {
        #say("which_country");
        wait *;
    }
    transitions
    {
        check_covid: goto check_covid on #messageHasData("country");
    }
}

node check_flights {
    do {
        set $flight_info = #messageGetData("flight_info")[0]?.value??"";
        set $available_flight = external get_available_flight($flight_info);
        #say("flight_found", {available_flight: $available_flight});
        #say("more_questions");
        wait *;
    }
    transitions {
        check_flights: goto check_flights on #messageHasData("flight_info");
        flight_availability: goto flight_availability on #messageHasData("flight_availability");
        travel_restrictions: goto travel_restrictions on #messageHasData("travel_restrictions"); 
        covid19_cases: goto covid19_cases on #messageHasData("covid");
        entry_exit_requirements: goto entry_exit_requirements on #messageHasData("entry_exit_prompt");
        bye: goto bye on #messageHasIntent("no");
    }
}

node check_entry_exit_requirements {
     do {
        set $country = #messageGetData("country")[0]?.value??"";
        set $entry_exit_requirement = external get_entry_exit($country, $entry_exit_val);
        #say("explain_requirements", {entry_exit_requirement: $entry_exit_requirement, country: $country, entry_exit_val: $entry_exit_val});
        #say("more_questions");
        wait *;
    }
    transitions {
        check_flights: goto check_flights on #messageHasData("flight_info");
        flight_availability: goto flight_availability on #messageHasData("flight_availability");
        travel_restrictions: goto travel_restrictions on #messageHasData("travel_restrictions"); 
        covid19_cases: goto covid19_cases on #messageHasData("covid");
        entry_exit_requirements: goto entry_exit_requirements on #messageHasData("entry_exit_prompt");
        bye: goto bye on #messageHasIntent("no");
    }
}

node check_travel_restrictions {
    do {
        set $country = #messageGetData("country")[0]?.value??"";
        set $travel_restriction = external get_travel_restrictions($country);
        #say("explain_restriction", {travel_restriction: $travel_restriction, country: $country});
        #say("more_questions");
        wait *;
    }
    transitions {
        check_flights: goto check_flights on #messageHasData("flight_info");
        flight_availability: goto flight_availability on #messageHasData("flight_availability");
        travel_restrictions: goto travel_restrictions on #messageHasData("travel_restrictions"); 
        covid19_cases: goto covid19_cases on #messageHasData("covid");
        entry_exit_requirements: goto entry_exit_requirements on #messageHasData("entry_exit_prompt");
        bye: goto bye on #messageHasIntent("no");
    }
}

node check_covid {
    do {
        set $country = #messageGetData("country")[0]?.value??"";
        set $covid_situation = external get_covid_situation($country);
        #say("explain_covid", {covid_situation: $covid_situation, country: $country});
        #say("more_questions");
        wait *;
    }
    transitions {
        check_flights: goto check_flights on #messageHasData("flight_info");
        flight_availability: goto flight_availability on #messageHasData("flight_availability");
        travel_restrictions: goto travel_restrictions on #messageHasData("travel_restrictions"); 
        covid19_cases: goto covid19_cases on #messageHasData("covid");
        entry_exit_requirements: goto entry_exit_requirements on #messageHasData("entry_exit_prompt");
        bye: goto bye on #messageHasIntent("no");
    }
}

node yes
{
    do 
    {
        #say("yes");
        exit;
    }
}

node no
{
    do 
    {
        #say("no");
        exit;
    }
}

node bye {
    do {
        #say("have_a_nice_day");
        exit;
    }
}

digression how_are_you
{
    conditions {on #messageHasIntent("how_are_you");}
    do 
    {
        #sayText("I'm well, thank you!", repeatMode: "ignore"); 
        #repeat(); // let the app know to repeat the phrase in the node from which the digression was called, when go back to the node 
        return; // go back to the node from which we got distracted into the digression 
    }
}