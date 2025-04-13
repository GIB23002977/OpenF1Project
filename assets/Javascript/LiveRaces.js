// Holder for country data, global variable.
let CountryData = {}; 
// This prevenets showing the same error multiple times by holding the API URLS that has not worked.
const shownErrors = new Set();

/*
Function name: GetQueryParm
Description: This function will return the value of the parameter that is been requested through the function.
Parameters: param
Returns: parameter value or a message if it doesn't exist.

Variables:
- CurrentURL: The current URL inside of the browser.
- urlParams: Objects that is contained inside of the URL.
- error: To capture any errors that has happened inside of the function.
*/

function GetQueryParm(param) {
    try {
        const CurrentURL = new URL(window.location.href);
        const urlParams = new URLSearchParams(CurrentURL.search);
        return urlParams.get(param) || 'Null';
    } catch (error) {
        console.error(error)
    }
}  

/*
Function name: UrlHasParams
Description: This function will check the URL of the current page and then execute the appropriate function based on the parameters inside the URL.
Parameters: None
Returns: None

Variables:
- CurrentURL: The current URL inside of the browser.
- urlParams: Objects that is contained inside of the URL.
- sessionKey: Check the sessionKey exist inside of the URL parameters.
- driverNumber: Check the driverNumber exist inside of the URL parameters.
- liveSessionKey: Check if there is a live session available.
- error: To capture any errors that has happened inside of the function.
*/

async function UrlHasParams() {
    try {
        const currentURL = new URL(window.location.href);
        const urlParams = new URLSearchParams(currentURL.search);
        const sessionKey = urlParams.get('SessionKey');
        const driverNumber = urlParams.get('DriverNumber');

        if (sessionKey && driverNumber) {
            await ShowDriverStats();
        } else if (sessionKey) {
            await RenderLiveRaceInfo(liveRacesData);
        } else {
            const liveSessionKey = await CheckForLiveRaces();
            if (liveSessionKey !== 'None') {
                await FetchDrivers();
            } else {
                const errorMessage = document.createElement('p');
                errorMessage.className = 'FailedToLoadInformation';
                errorMessage.textContent = 'There is currently no live sessions.';
                document.body.appendChild(errorMessage);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

/*
Function name: CheckForLiveRaces
Description: This function will check if there is a live session available and return the session key.
Parameters: None
Returns: sessionKey or 'None'

Variables:
- CurrentURL: The current URL inside of the browser.
- urlParams: Objects that is contained inside of the URL.
- sessionKey: Check the sessionKey exist inside of the URL parameters.
- driverNumber: Check the driverNumber exist inside of the URL parameters.
- liveSessionKey: Check if there is a live session available.
- error: To capture any errors that has happened inside of the function.
*/

async function CheckForLiveRaces() {
    try {
        const CurrentTime = new Date();
        const CurrentDate = CurrentTime.toISOString().split('T')[0];
        const response = await fetch(`https://api.openf1.org/v1/sessions?date_start=${CurrentDate}`);
        const liveRacesData = await response.json();
        if (liveRacesData.length > 0) {
            return liveRacesData[0].session_key;
        } else {
            return 'None';
        }
    } catch (error) {
        console.error(error);
        return 'None';
    }
}

/*
Function name: loadCountryData
Description: This function will load the country data from the JSON file and store it in the global variable "CountryData".
Parameters: None
Returns: None

Variables:
- response: The response from the local json storage.
- countries: The JSON data that is been fetched from the response.
- error: To capture any errors that has happened inside of the function.
*/

async function loadCountryData() {
    try {
        const response = await fetch("assets/Json/countries.json");
        const countries = await response.json();
        countries.forEach(c => {
            CountryData[c.alpha3.toUpperCase()] = c.name;
        });
    } catch (error) {
        console.error(error);
    }
}

/*
Function name: countryToName
Description: This function will load the country data from the JSON file and store it in the global variable "CountryData".
Parameters: None
Returns: countryName/code/Unknown

Variables:
- response: The response from the local json storage.
- countries: The JSON data that is been fetched from the response.
- error: To capture any errors that has happened inside of the function.
*/

function countryToName(code) {
    try {
        if (typeof code === 'string' && code !== '') {
            const countryName = CountryData[code.toUpperCase()];
            if (countryName) {
                return countryName;
            } else {
                return code;
            }
        }
        return 'Unknown';
    } catch (error) {
        console.error(error);
        return 'Unknown';
    }
}

/*
Function name: FetchDrivers
Description: This function will first fetch the session key by requesting from the API using todays date,
and then utzling the session key we fetch all active drivers.
Parameters: None
Returns: None

Variables:
- CurrentTime: The current time inside of the browser.
- CurrentDate: The current date inside of the browser.
- response: The response from the API.
- liveRacesData: The JSON data that is been fetched from the response.
- SessionKey: The session key that is been fetched from the API.
- driversResponse: The response from the API that contains the drivers.
- drivers: The JSON data that is been fetched from the response.
- error: To capture any errors that has happened inside of the function.
*/

async function FetchDrivers() {
    try {
        await loadCountryData();
        const CurrentTime = new Date();
        const CurrentDate = CurrentTime.toISOString().split('T')[0];
        const response = await fetch(`https://api.openf1.org/v1/sessions?date_start=${CurrentDate}`);
        const liveRacesData = await response.json();

        if (!liveRacesData.length) {
            return;
        }

        const SessionKey = liveRacesData[0].session_key;
        const driversResponse = await fetch(`https://api.openf1.org/v1/drivers?session_key=${SessionKey}`);
        const drivers = await driversResponse.json();
        DisplayDrivers(drivers, SessionKey, liveRacesData);
    } catch (error) {
        console.error(error);
    }
}

/*
Function name: DisplayDrivers
Description: This function will display all the drivers that has been passed through the parameter.
Parameters: drivers, SessionKey, liveRacesData
Returns: None

Variables:
- driverListContainer: The container that will hold all the drivers.
- driverCard: The card that will hold the driver information.
- driverImage: The image that will hold the driver headshot.
- driverName: The name of the driver.
- driverTeam: The team of the driver.
- driverCountry: The country of the driver.
- country: The country name that is been fetched from the country code.
- error: To capture any errors that has happened inside of the function.
*/


async function DisplayDrivers(drivers, SessionKey, liveRacesData) {
    try {
        const driverListContainer = document.getElementById("driverList");
        driverListContainer.innerHTML = '';

        drivers.forEach(driver => {
            const driverCard = document.createElement('div');
            driverCard.className = 'DriverInfoCard';
            driverCard.style.borderColor = driver.team_colour ? `#${driver.team_colour.replace(/^#/, '')}` : '#000';
            driverCard.onclick = () => {
                window.location.href = `LiveRaces.html?DriverNumber=${driver.driver_number}&SessionKey=${SessionKey}`;
            };

            const driverImage = document.createElement('img');
            driverImage.src = driver.headshot_url || 'https://www.pngitem.com/pimgs/m/30-307416_profile-icon-png-image-free-download-searchpng-employee.png';

            const driverName = document.createElement('h1');
            driverName.textContent = driver.full_name || 'Unknown';

            const driverTeam = document.createElement('p');
            driverTeam.textContent = `Team: ${driver.team_name || 'Unknown'}`;

            const driverCountry = document.createElement('p');
            const country = countryToName(driver.country_code);
            driverCountry.textContent = `Country: ${country}`;

            driverCard.append(driverImage, driverName, driverTeam, driverCountry);
            driverListContainer.appendChild(driverCard);
        });

        RenderLiveRaceInfo(liveRacesData);

    } catch (error) {
        console.error(error);
    }
}

/*
Function name: RenderLiveRaceInfo
Description: This will allow the user that is using the website to know there is a live session and they can view the infomation about it.
Parameters: liveRacesData
Returns: None

Variables:
- Session: The session key that is been fetched from the API.
- SessionName: The session name that is been fetched from the API.
- CountryName: The country name that is been fetched from the API.
- liveRaceInfoElement: This will display the live session information to the user.
- error: To capture any errors that has happened inside of the function.
*/

async function RenderLiveRaceInfo(liveRacesData) {
    try {
        const Session = liveRacesData[0].session_key;
        const SessionName = liveRacesData[0].session_name;
        const CountryName = liveRacesData[0].country_name;
        console.log("Live session info:", Session, SessionName, CountryName);
        const liveRaceInfoElement = document.querySelector(".LiveRaceInformation");
        liveRaceInfoElement.innerHTML = `
            <p>Session: ${Session}</p>
            <p>Session Name: ${SessionName}</p>
            <p>Country: ${CountryName}</p>
        `;
        liveRaceInfoElement.style.borderWidth = '2px';
        liveRaceInfoElement.style.borderColor = '#00a2ff';
        liveRaceInfoElement.style.borderStyle = 'solid';
    } catch (error) {
        console.error(error);
    }
}

/*
Function name: ShowDriverStats
Description: This function will show all the drivers sector speed and duration for the first 8 laps and then it will constlantly update the data every 5 seconds.
Parameters: liveRacesData
Returns: None

Variables:
- DriverNumber: The driver number that is been fetched from the URL.
- SessionKey: The session key that is been fetched from the URL.
- chartContainer: The container that will hold all the charts.
- CurrentKnownData: The object that will hold all the current data that is been fetched from the API.
- shownErrors: The set that will hold all the errors that has been shown to the user.
- fetchAndRenderData: The function that will fetch the data from the API and render it to the user.
- hasNewData: A boolean that will check if there is new data that has been fetched from the API.
- newDataMap: The object that will hold all the new data that has been fetched from the API.
- lapEntry: The object that will hold the data for each lap.
- lapNumber: The lap number that is been fetched from the API.
- response: The response from the API that contains the lap data.
- lapData: The JSON data that is been fetched from the response.
- serialized: The serialized data that is been fetched from the API.
- lapTitle: The title that will hold the lap number.
- speedWrapper: The wrapper that will hold the speed chart.
- speedCanvas: The canvas that will hold the speed chart.
- durationWrapper: The wrapper that will hold the duration chart.
- durationCanvas: The canvas that will hold the duration chart.
- errorMessage: The message that will be shown to the user if there is an error.
- error: To capture any errors that has happened inside of the function.
*/

async function ShowDriverStats() {
    try {
        const DriverNumber = await GetQueryParm('DriverNumber');
        const SessionKey = await GetQueryParm('SessionKey');
        const chartContainer = document.getElementById('chartContainer');
        chartContainer.className = 'chart-container';

        const CurrentKnownData = {};
        const shownErrors = new Set();

        async function fetchAndRenderData() {
            let hasNewData = false;
            const newDataMap = {};

            for (let lapNumber = 1; lapNumber <= 8; lapNumber++) {
                try {
                    const response = await fetch(`https://api.openf1.org/v1/laps?session_key=${SessionKey}&driver_number=${DriverNumber}&lap_number=${lapNumber}`);
                    const lapData = await response.json();
                    if (!lapData || lapData.length === 0) {
                        if (!shownErrors.has(lapNumber)) {
                            const errorMessage = document.createElement('p');
                            errorMessage.className = 'error';
                            errorMessage.textContent = `No data available for lap ${lapNumber}.`;
                            chartContainer.appendChild(errorMessage);
                            shownErrors.add(lapNumber);
                        }
                        continue;
                    }

                    const serialized = JSON.stringify(lapData[0]);

                    if (CurrentKnownData[lapNumber] !== serialized) {
                        hasNewData = true;
                    }

                    newDataMap[lapNumber] = { raw: lapData[0], serialized };
                } catch (error) {
                    console.error(`Failed to fetch lap data for lap ${lapNumber}:`, error);
                    if (!shownErrors.has(lapNumber)) {
                        const errorMessage = document.createElement('p');
                        errorMessage.className = 'error';
                        errorMessage.textContent = `Error fetching data for lap ${lapNumber}.`;
                        chartContainer.appendChild(errorMessage);
                        shownErrors.add(lapNumber);
                    }
                }
            }

            if (!hasNewData) return;

            for (let lapNumber = 1; lapNumber <= 8; lapNumber++) {
                const lapEntry = newDataMap[lapNumber];
                if (!lapEntry) continue;

                CurrentKnownData[lapNumber] = lapEntry.serialized;

                const { i1_speed, i2_speed, st_speed, duration_sector_1, duration_sector_2, duration_sector_3 } = lapEntry.raw;

                const lapTitle = document.createElement('h1');
                lapTitle.textContent = `Lap ${lapNumber}`;
                lapTitle.className = 'lapTitle';
                chartContainer.appendChild(lapTitle);

                const speedWrapper = document.createElement('div');
                speedWrapper.className = 'chartCanvas';
                const speedCanvas = document.createElement('canvas');
                speedWrapper.appendChild(speedCanvas);
                chartContainer.appendChild(speedWrapper);

                new Chart(speedCanvas, {
                    type: 'bar',
                    data: {
                        labels: ['Sector 1', 'Sector 2', 'Sector 3'],
                        datasets: [{
                            label: `Lap ${lapNumber} - Speed (km/h)`,
                            data: [i1_speed, i2_speed, st_speed],
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                            borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: { display: true, text: `Lap ${lapNumber} - Sector Speeds` },
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: { display: true, text: 'Speed (km/h)' }
                            }
                        }
                    }
                });
                const durationWrapper = document.createElement('div');
                durationWrapper.className = 'chartCanvas';
                const durationCanvas = document.createElement('canvas');
                durationWrapper.appendChild(durationCanvas);
                chartContainer.appendChild(durationWrapper);

                new Chart(durationCanvas, {
                    type: 'bar',
                    data: {
                        labels: ['Sector 1', 'Sector 2', 'Sector 3'],
                        datasets: [{
                            label: `Lap ${lapNumber} - Duration (seconds)`,
                            data: [duration_sector_1, duration_sector_2, duration_sector_3],
                            backgroundColor: ['#4BC0C0', '#9966FF', '#FF9F40'],
                            borderColor: ['#4BC0C0', '#9966FF', '#FF9F40'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: { display: true, text: `Lap ${lapNumber} - Sector Durations` },
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: { display: true, text: 'Duration (s)' }
                            }
                        }
                    }
                });
            }
        }
        await fetchAndRenderData();

        setInterval(fetchAndRenderData, 5000);
    } catch (error) {
        console.error(error);
        const chartContainer = document.getElementById('chartContainer');
        const errorMessage = document.createElement('p');
        errorMessage.className = 'FailedToLoadInformation';
        errorMessage.textContent = 'Failed to load driver stats.';
        chartContainer.appendChild(errorMessage);
    }
}
