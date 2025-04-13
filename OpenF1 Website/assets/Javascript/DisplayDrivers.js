// Holder for country data, global variable.
let CountryData = {};

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
        return urlParams.get(param) || 'This doesn’t exist inside of the URL';
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
- sessionType: Check the sessiontype exist inside of the URL parameters.
- error: To capture any errors that has happened inside of the function.
*/

async function UrlHasParams() {
    try {

        const CurrentURL = new URL(window.location.href);
        const urlParams = new URLSearchParams(CurrentURL.search);
        const sessionKey = urlParams.get('SessionKey');
        const driverNumber = urlParams.get('DriverNumber');
        const sessionType = urlParams.get('SessionType');

        if (driverNumber && sessionKey) {
            await ShowDriverStats();
        } else if (sessionType) {
            await ShowSessions();
        } else if (sessionKey) {
            await FetchDrivers();
            if (driverNumber) {
                await FetchDrivers();
            }
        }
    } catch (error) {
        console.error(error);
    }
}

/*
Function name: GetAllSessions
Description: This function will return all the sessions for the year that is in the URL.
Parameters: None
Returns: AllSessions

Variables:
- Year: The year that is inside of the URL.
- response: The response from the API that is been fetched.
- AllSessions: The JSON data that is been fetched from the API.
- error: To capture any errors that has happened inside of the function.
*/

async function GetAllSessions() {
    try {
        const Year = await GetQueryParm('Year');
        const response = await fetch(`https://api.openf1.org/v1/sessions?year=${Year}`);
        const AllSessions = await response.json();
        return AllSessions;
    } catch (error) {
        console.error(error);
    }
}

/*
Function name: ShowSessions
Description: This function will display all of the sessions based of the session type that is inside of the URL.
Parameters: None
Returns: None

Variables:
- AllSessions: The JSON data that is been fetched from the API.
- SessionType: The session type that is inside of the URL.
- Sessions: The sessions that is been filtered based of the session type.
- sessionListContainer: The container that is going to hold all of the sessions.
- sessionCard: The card that is going to hold the session information.
- sessionName: The name of the session.
- sessionDate: The date of the session.
- sessionTime: The time of the session.
- sessionLocation: The location of the session.
- sessionCountry: The country of the session.
- ViewDriverButton: The button that is going to take the user to the driver page.
- error: To capture any errors that has happened inside of the function.
*/

async function ShowSessions() {
    try {
        await loadCountryData();
        const AllSessions = await GetAllSessions();
        const SessionType = await GetQueryParm('SessionType');
        let Sessions = [];
        if (SessionType === 'Practice') {
            Sessions = AllSessions.filter(session => session.session_type === 'Practice');
        } else if (SessionType === 'Qualifying') {
            Sessions = AllSessions.filter(session => session.session_type === 'Qualifying');
        } else if (SessionType === 'Race') {
            Sessions = AllSessions.filter(session => session.session_type === 'Race');
        }
        const sessionListContainer = document.getElementById('sessionList');
        for (const session of Sessions) {
            const sessionCard = document.createElement('div');
            sessionCard.className = 'SessionCard';
            sessionCard.onclick = () => { window.location.href = `Drivers.html?SessionKey=${session.session_key}`; };
            const sessionName = document.createElement('h1');
            sessionName.textContent = `${session.session_name} - ${session.circuit_short_name || session.circuit_name}`;
            const sessionDate = document.createElement('p');
            const date = new Date(session.date_start);
            sessionDate.textContent = `Date: ${date.toLocaleDateString()}`;
            const sessionTime = document.createElement('p');
            sessionTime.textContent = `Time: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            const sessionLocation = document.createElement('p');
            sessionLocation.textContent = `Location: ${session.location || 'Unknown'}`;
            const sessionCountry = document.createElement('p');
            sessionCountry.textContent = `Country: ${countryToName(session.country_code)}`;
            sessionCard.append(sessionName, sessionDate, sessionTime, sessionLocation, sessionCountry);
            sessionListContainer.appendChild(sessionCard);
            const ViewDriverButton = document.createElement('button');
            ViewDriverButton.textContent = 'View Drivers';
            ViewDriverButton.onclick = () => { UrlHasParams(); };
            sessionCard.appendChild(ViewDriverButton);
        }
    } catch (error) {
        console.error(error);
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
Description: This function will allow us to fetch all of the drivers inside of the API using the session key which is grabbed from the URL.
Parameters: None
Returns: None

Variables:
- sessionKey: The session key that is inside of the URL.
- response: The response from the API that is been fetched.
- drivers: The JSON data that is been fetched from the API.
- error: To capture any errors that has happened inside of the function.
*/

async function FetchDrivers() {
    try {
        await loadCountryData();
        const sessionKey = await GetQueryParm('SessionKey');
        const response = await fetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`);
        const drivers = await response.json();
        DisplayDrivers(drivers, sessionKey);
    } catch (error) {
        console.error(error);
    }
}

/*
Function name: DisplayDrivers
Description: This will display all of the drivers that is passed through the paramters and shows them on the page.
Parameters: drivers, SessionKey
Returns: None

Variables:
- driverListContainer: The container that is going to hold all of the drivers.
-  driverCard: The card that is going to hold the driver information.
- driverImage: The image of the driver.
- driverName: The name of the driver.
- driverTeam: The team of the driver.
- driverCountry: The country of the driver.
- country: The country name of the driver.
- error: To capture any errors that has happened inside of the function.
*/

async function DisplayDrivers(drivers, SessionKey) {
    try {
        const driverListContainer = document.getElementById("driverList");
        drivers.forEach(driver => {
            const driverCard = document.createElement('div');
            driverCard.className = 'DriverInfoCard';
            driverCard.style.borderColor = driver.team_colour ? `#${driver.team_colour.replace(/^#/, '')}` : '#000';
            driverCard.onclick = () => { window.location.href = `Drivers.html?DriverNumber=${driver.driver_number}&SessionKey=${SessionKey}`; };
            const driverImage = document.createElement('img');
            driverImage.src = driver.headshot_url || 'https://www.pngitem.com/pimgs/m/30-307416_profile-icon-png-image-free-download-searchpng-employee.png';
            const driverName = document.createElement('h1');
            driverName.textContent = driver.full_name || 'Unknown';
            const driverTeam = document.createElement('p');
            driverTeam.textContent = `Team: ${driver.team_name || 'Unknown'}`;
            const driverCountry = document.createElement('p');
            const country = countryToName(driver.country_code);
            driverCountry.textContent = `Country: ${country}` || 'Unknown';
            driverCard.append(driverImage, driverName, driverTeam, driverCountry);
            driverListContainer.appendChild(driverCard);
        });
    } catch (error) {
        console.error(error);
    }
}

/*
Function name: ShowDriverStats
Description: This will shows the charts.js of the driver stats which is grabbed through the API utzilizing the session key and driver number that is inside of the URL.
Parameters: None
Returns: None

Variables:
- DriverNumber: The driver number that is inside of the URL.
- SessionKey: The session key that is inside of the URL.
- chartContainer: The container that is going to hold all of the charts.
- lapNumber: The lap number that is going to be used to fetch the data from the API.
- response: The response from the API that is been fetched.
- lapData: The JSON data that is been fetched from the API.
- lapTitle: The title of the lap.
- speedWrapper: The wrapper that is going to hold the speed chart.
- speedCanvas: The canvas that is going to hold the speed chart.
- durationWrapper: The wrapper that is going to hold the duration chart.
- durationCanvas: The canvas that is going to hold the duration chart.
- error: To capture any errors that has happened inside of the function.
*/

async function ShowDriverStats() {
    try {
        const DriverNumber = await GetQueryParm('DriverNumber');
        const SessionKey = await GetQueryParm('SessionKey');
        const chartContainer = document.getElementById('chartContainer');
        chartContainer.className = 'chart-container';
        for (let lapNumber = 1; lapNumber <= 8; lapNumber++) {
            try {
                const response = await fetch(`https://api.openf1.org/v1/laps?session_key=${SessionKey}&driver_number=${DriverNumber}&lap_number=${lapNumber}`);
                if (!response.ok) throw new Error(`API returned status ${response.status}`);
                console.log(response.status, response.statusText);
                const lapData = await response.json();
                if (!lapData || lapData.length === 0) {
                    const errorMessage = document.createElement('p');
                    errorMessage.className = 'error';
                    errorMessage.textContent = `No data available for lap ${lapNumber}.`;
                    chartContainer.appendChild(errorMessage);
                    continue;
                }

                const { i1_speed, i2_speed, st_speed, duration_sector_1, duration_sector_2, duration_sector_3 } = lapData[0];

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

            } catch (error) {
                console.error(error);
                const errorMessage = document.createElement('p');
                errorMessage.className = 'error';
                errorMessage.textContent = `Error fetching data for lap ${lapNumber}.`;
                chartContainer.appendChild(errorMessage);
            }
        }

    } catch (error) {
        console.error(error);
    }
}
