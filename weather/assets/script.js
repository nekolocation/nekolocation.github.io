/* TODO:
- Improve fade-in of celestial bodies
- Refactor load of previously-stored location, to pop up before the default if possible
- Find other ways of scraping less-acurate location info?
- Dynamic sunset/sunrise (according to local sunrise/sunset)
- Have preview times show 12am instead of 0AM
- Allow user to toggle btwn C/F/K
- Allow use to toggle btwn 12H and 24H
*/

const debug = false;

const weatherURL = "https://api.openweathermap.org/data/2.5/forecast";
const apiKey = atob("NjgwYmVjOWY3NzcyMzI3MDdmZTU5OTBiMDg0N2MyNzk=");
let lat = 34.98722;
let lon = 135.74250;

// Clock update variables
let localeOptions = null;
let hour12 = false; // Unsupported-- Whether time is shown in 12h or 24h format
var country = "JP";
var options = {
    hour12: hour12,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
}
var timeZoneDiff = 0; // Diff in seconds between given timezone and UTC
const totalDaySeconds = 86400;
const hourInSeconds = 60 * 60;
var apiObject = null;
var tempDegrees = 'Kelvin';
// These are used to lerp colors at sunrise and sunset 
// and may be changed by the call to the WeatherAPI
var midnightColor = " #1d1733";
var sunriseColor = " #ffaf38";
var middayColor = " #8ab1eb";
var sunsetColor = " #f5527a";
var midnightColorLand = " #304b44";
var sunriseColorLand = " #5e6835";
var middayColorLand = " #78db96";
var sunsetColorLand = " #584c26";
var infoColorDay = " #3b006b";
infoColorDay = midnightColor;
var infoColorNight = " #FFFFFF";

var sunriseTime = 21600;
var sunsetTime = 64800;
var middayTime = 43200;
var daySeconds = 0;

// Custom sunrise variables for testing
var useCustomTime = false;
var customTimeStr = "00:00:00";
var customTimeInt = 0;
var useFastTime = false;
var fastTimeInt = 0;
// For togglePause() specifically
var pause = false;

// Make div objects
const locationDiv = document.getElementById('location-info');
const cityNameDiv = document.getElementById('city-name');
const dateDiv = document.getElementById('date');
const clockDiv = document.getElementById('time');
// const skyDiv = document.getElementById('sky'); // Replaced with document.body for horizon shenanigans
const geoDiv = document.getElementById('geolocate');
const landDiv = document.getElementById('land');
const horizonLandDiv = document.getElementById('horizon');

const parameters = new URLSearchParams(window.location.search);

if (parameters.has('manual')) {
    tempDegrees = 'Fahrenheit';
}

function getLocation(fetchAPI = true) {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function (pos) {
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    //   document.getElementById('latitude').innerHTML = `Lat: ${lat}`;
    //   document.getElementById('longitude').innerHTML = `Lon: ${lon}`;
      if (debug){
          console.log(`Position updated via Geolocation - Latitude: ${lat}\tLongitude: ${lon}`);
      }
      if (fetchAPI) {
        callAPI();
      }
    });
  } else {
    console.log("Geolocation is unavailable");
  }
}

async function callAPI() {
    let url = `${weatherURL}?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    fetch(url)
        .then((data) => {
        return data.json();
    })
    .then((json) => {
        if (debug) {
            console.log(`Result of API call for ${json["city"]["name"]}:`);
            console.log(json);
        }
        apiObject = json;
        cityNameDiv.innerHTML = json["city"]["name"];
        timeZoneDiff = json['city']['timezone'];
        country = json['city']['country'];

        // TODO: Currently, adjusting the sunrise and sunset will adjust the colors of the scene
        // but NOT the sun/moon movement (ie: sunset colors may start before the sun is visible, etc)
        // sunriseTime =   getDaySecondsFromUnix(json['city']['sunrise']);
        // sunsetTime =    getDaySecondsFromUnix(json['city']['sunset']);
        // middayTime = sunsetTime - sunriseTime;

        fadeIn(cityNameDiv);
        fadeIn(clockDiv);
        fadeIn(dateDiv);
        fadeIn(geoDiv);
        fadeIn(document.getElementById('horizon'), 100);
        fadeIn(document.getElementById('land'), 100);
        fadeIn(document.getElementById('sun'));
        fadeIn(document.getElementById('moon'));
        populateWeatherInfo();
    });
}

function populateWeatherInfo() {
    let weatherContainerDiv = document.getElementById('weather-container');
    weatherContainerDiv.style.visibility = 'hidden';
    for (let i = 0; i < 8; i++) {
        let index = apiObject['list'][i];
        document.getElementById(`weather-time-${i}`).innerHTML = weatherInfoTimeHelper(getDaySecondsFromUnix(index['dt']));
        document.getElementById(`weather-temp-${i}`).innerHTML = weatherTemperatureHelper(index['main']['temp']);
        document.getElementById(`weather-wind-${i}`).innerHTML = Math.round(index['wind']['speed']) + " m/s";
        let bgImg = `https://openweathermap.org/img/wn/${index['weather'][0]['icon']}.png`;
        // document.getElementById(`weather-conditions-${i}`).innerHTML = index['x'];
        document.getElementById(`weather-conditions-${i}`).src = bgImg;
        document.getElementById(`weather-conditions-${i}`).style.width = '50px';
        // document.getElementById(`weather-${i}`).style.backgroundImage = `url(${bgImg})`;
    }
    console.log('Updated weather info.');
    fadeIn(weatherContainerDiv);
}
function weatherInfoTimeHelper(seconds) {
    let time = seconds / (60*60);
    let timeMarker = "AM";
    if (time > 12) {
        timeMarker = "PM";
        time -= 12;
    }
    return time + ' ' + timeMarker;
}
function weatherTemperatureHelper(weather) {
    let symbol = 'K';
    let fixedAmt = 0;
    if (tempDegrees == 'Fahrenheit') {
        weather = (weather - 273.15) * (9/5) + 32;
        symbol = "°F";
    }
    else if (tempDegrees == 'Celsius') { 
        weather -= 273.15;
        symbol = "°C";
        fixedAmt = 1;
    }
    return weather.toFixed(fixedAmt).toString() + symbol;
}

var loopInterval = 50; // In milliseconds
function timeUpdate() {
  const sun = document.getElementById("sun");
  const moon = document.getElementById("moon");

  // establish structure of the circle
  var circleX = 400;
  var circleY = 350;
  var verticalRadius = 300;

  // Rotate clockwise for sunrise/sunset
  let angle = Math.PI * 1/2;

  let firstLoop = true;

  var sunwidth = sun.offsetWidth / 2.0;
  var moonwidth = sunwidth;

  // loop to move sun and moon around the radius of a shared circle shape
  setInterval(() => {
    let timeString;
    if (useCustomTime || useFastTime) {
        daySeconds = customTimeInt;
        timeString = getDayStringFromSeconds(daySeconds);
        customTimeInt += fastTimeInt;
        if (customTimeInt > totalDaySeconds) customTimeInt = customTimeInt % totalDaySeconds;
        if (customTimeInt < 0) customTimeInt = totalDaySeconds;
    }
    else {
        timeString = getTimeString();
        let dateString = getTimeString(true);
        if (dateDiv.innerHTML != dateString) dateDiv.innerHTML = dateString;
        daySeconds = getTimeSeconds(timeString);
    }
    if (clockDiv.innerHTML != timeString) {clockDiv.innerHTML = timeString;}
    angle = ((daySeconds / totalDaySeconds) * (Math.PI * 2)) + (Math.PI/2); 
    
    updateSceneColor(daySeconds);
    // update circle center according to window size change
    let windowWidth = window.innerWidth;
    circleX = windowWidth / 2.0;
    var horizontalRadius = windowWidth / 2.5;

    if (window.innerHeight < 350) {
        circleY = window.innerHeight;
    } else {
        circleY = 350;
    }
    
    // calculate new coordinates based on current angle
    var sunX = circleX + horizontalRadius * Math.cos(angle) - sunwidth;
    var sunY = circleY + verticalRadius * Math.sin(angle);
    var moonX = circleX + horizontalRadius * Math.cos(angle + Math.PI) - moonwidth;
    var moonY = circleY + verticalRadius * Math.sin(angle + Math.PI);

    // update sun and moon coordinates
    sun.style.left = `${sunX}px`;
    sun.style.top = `${sunY}px`;
    moon.style.left = `${moonX}px`;
    moon.style.top = `${moonY}px`;

    if (firstLoop) {
        fadeIn(document.getElementById('scene'));
        firstLoop = false;
    }
  }, loopInterval);
}

// We gettin that TIME
function getTimeSeconds(timeString) {
    // Split string of "HH:MM:SS" into total seconds elapsed in day
    let numbers = timeString.split(':');

    let hours = parseFloat(numbers[0]) * 60 * 60;
    let minutes = parseFloat(numbers[1]) * 60;
    let seconds = parseFloat(numbers[2]);
    
    return hours + minutes + seconds;
}
function getTimeString(date=false) {
    const tempDateObject = new Date();
    // Use timezone var from weatherapi to calculate time in geolocated timezone via offset from UTC
    const utcTime = tempDateObject.getTime() + (tempDateObject.getTimezoneOffset() * 60000);
    const localeTimeWithOffset = new Date(utcTime + (timeZoneDiff * 1000));
    let tempOptions = options;
    // removed from options: year: 'numeric', 
    if (date) tempOptions = {month: 'long', day: 'numeric'};
    return new Intl.DateTimeFormat(`en-${country}`, tempOptions).format(localeTimeWithOffset);
}   
function getDaySecondsFromUnix(unixTime) {
    const date = new Date(unixTime * 1000);
    const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return elapsedSeconds = Math.floor((unixTime - midnight.getTime() / 1000)); 
}
function getDayStringFromSeconds(secondsInt) {
    let H = Math.floor(secondsInt / 3600);
    let M = Math.floor((secondsInt % 3600) / 60);
    let S = Math.floor(secondsInt % 60);
    return `${H.toString(10).padStart(2, '0')}:${M.toString(10).padStart(2, '0')}:${S.toString(10).padStart(2, '0')}`;
}


function fadeIn(divName, fadeTimeMS=1000) {
    // Set the div to be invis so that it fades in
    divName.style.opacity = 0;
    divName.style.visibility = 'visible';
    
    divName.offsetHeight;

    divName.style.transition = `opacity ${fadeTimeMS}ms`;
    divName.style.opacity = 1;
}

function setCustomTime(timeString="18:00:00") {
    // Validate that this is a valid time format
    let errorMessage = "Time must be in format HH:MM:SS";
    if (typeof(timeString) != "string") {
        console.log(errorMessage);
        return false;
    }
    let timeSegments = timeString.split(':');
    if (timeSegments.length != 3) {
        console.log(errorMessage);
        return false;
    }

    let H = parseInt(timeSegments[0]);
    if (isNaN(H) || H < 0 || H > 23) {
        console.log(errorMessage);
        return false;
    }
    let M = parseInt(timeSegments[1]);
    if (isNaN(M) || M < 0 || M > 59) {
        console.log(errorMessage);
        return false;
    }
    let S = parseInt(timeSegments[2]);
    if (isNaN(S) || S < 0 || S > 59) {
        console.log(errorMessage);
        return false;
    }

    // Validated!
    customTimeStr = timeSegments[0].padStart(2, '0') + ':' + timeSegments[1].padStart(2, '0') + ':' + timeSegments[2].padStart(2, '0');
    customTimeInt = getTimeSeconds(customTimeStr);
    useCustomTime = true;

    return "Success";
}
function disableCustomTime() {
    useCustomTime = false;
    fastTimeInt = 0;
}
function setFastTimeElapse(seconds=(60*2)) {
    // Makes time pass by inputted seconds per second
    if (isNaN(seconds)) return `${seconds} is not a valid number.`;
    if (customTimeInt == 0) setCustomTime(getTimeString());
    useCustomTime = true;
    fastTimeInt = seconds;
    let msg = "";
    let insanity = 3600;
    if (seconds > insanity || seconds < -insanity) msg = '... are you insane';
    return `Time increasing by ${seconds} seconds per tick` + msg; 
}
function disableFastTimeElapse() {
    useFastTime = false;
    fastTimeInt = 0;
}
// TODO: clean all this up 😭
// function togglePause() {
//     if (pause) {
//         disableCustomTime();
//     }
//     else {
//         setCustomTime(document.getElementById('time').innerText);
//         useCustomTime = true;
//     }
//     pause = !pause;
//     console.log("Paused = " + pause);
// }
function fastForward() {
    let time;
    if (fastTimeInt > 0) {
        time = fastTimeInt * 2;
    }
    else {
        time = 100;
    }
    console.log(setFastTimeElapse(time));
}

// Changing color depending on time of day (with helpers):
async function updateSceneColor(daytimeSeconds) {

    let skyColor;
    let landColor;
    let infoColor; 

    // Colors correspond to time of day; LERP half an hour before and after sunrise/set
    // TODO: lerp sun and moon colors! 
    // TODO: 4 time of day icons for favicon/map marker?
    if (daytimeSeconds < sunriseTime) {
        // Midnight to sunrise
        infoColor = infoColorNight;
        let lerpTimeStart = (sunriseTime - hourInSeconds/2);
        // make sure the ratio only corresponds to the time frame with LERPing
        let pct = ((daytimeSeconds - lerpTimeStart) / (sunriseTime - lerpTimeStart));
        if (daytimeSeconds > lerpTimeStart) {
            skyColor = await colorLERP(midnightColor, sunriseColor, pct);
            landColor = await colorLERP(midnightColorLand, sunriseColorLand, pct);
        }
        else {
            skyColor = midnightColor;
            landColor = midnightColorLand;
        } 
    }
    else if (daytimeSeconds < middayTime) {
        // Sunrise to midday
        infoColor = infoColorDay;
        let lerpTimeEnd = (sunriseTime + hourInSeconds/2);
        let pct = ((daytimeSeconds - sunriseTime) / (lerpTimeEnd - sunriseTime));
        if (daytimeSeconds < lerpTimeEnd) {
            skyColor = await colorLERP(sunriseColor, middayColor, pct);
            landColor = await colorLERP(sunriseColorLand, middayColorLand, pct);
        }
        else {
            skyColor = middayColor;
            landColor = middayColorLand;
        }
    }
    else if (daytimeSeconds < sunsetTime) {
        // Midday to sunset
        infoColor = infoColorDay;
        let lerpTimeStart = (sunsetTime - hourInSeconds/2);
        let pct = ((daytimeSeconds - lerpTimeStart) / (sunsetTime - lerpTimeStart));
        if (daytimeSeconds > lerpTimeStart) {
            skyColor = await colorLERP(middayColor, sunsetColor, pct);
            landColor = await colorLERP(middayColorLand, sunsetColorLand, pct);
        }
        else {
            skyColor = middayColor;
            landColor = middayColorLand;
        }
    }
    else {
        // Sunset to midnight
        infoColor = infoColorNight;
        let lerpTimeEnd = (sunsetTime + hourInSeconds/2);
        let pct = ((daytimeSeconds - sunsetTime) / (lerpTimeEnd - sunsetTime));
        if (daytimeSeconds < lerpTimeEnd) {
            skyColor = await colorLERP(sunsetColor, midnightColor, pct);
            landColor = await colorLERP(sunsetColorLand, midnightColorLand, pct);
        }
        else {
            skyColor = midnightColor;
            landColor = midnightColorLand;
        } 
    }
    
    // Only change div style if it differs
    if (locationDiv.style.color != infoColor) {
        locationDiv.style.color = infoColor;
        locationDiv.style.webkitTextFillColor = infoColor;
        locationDiv.style.webkitTextStrokeColor = skyColor;
        // TODO: refactor these updates to work with prev checks!
        // TODO: dynamically create image for favicon depending on time of day?  
        // Night time update
        if((daytimeSeconds < totalDaySeconds/4) || (daytimeSeconds > (totalDaySeconds * 3/4))) {
            geoDiv.style.backgroundImage = "url('./assets/img/marker_night.png')";
            document.getElementById('location-info').style.webkitTextStrokeWidth = '1px';
            cityNameDiv.style.webkitTextStrokeWidth = '2px';
            document.getElementById('favicon').href = "assets/img/cloud-icon-night.png";
        }
        // Daytime update
        else {
            geoDiv.style.backgroundImage = "url('./assets/img/marker_day.png')";
            document.getElementById('location-info').style.webkitTextStrokeWidth = '0px';
            cityNameDiv.style.webkitTextStrokeWidth = '0px';
            document.getElementById('favicon').href = "assets/img/cloud-icon.png";
        }
    }
    // Check sky color and update scene colors if changed
    var rootVariables = getComputedStyle(document.documentElement);
    let rootSkyColor = rootVariables.getPropertyValue('--sky-color').trim();
    if (rootSkyColor != skyColor) {
        let rootStyles = document.documentElement.style;
        rootStyles.setProperty('--sky-color', skyColor);
        rootStyles.setProperty('--land-color', landColor);
    }
}
async function colorLERP(colorA, colorB, pct = 0.50) {
    const rgbA = hexToRgb(colorA);
    const rgbB = hexToRgb(colorB);
  
    const r = Math.round(rgbA.r + (rgbB.r - rgbA.r) * pct);
    const g = Math.round(rgbA.g + (rgbB.g - rgbA.g) * pct);
    const b = Math.round(rgbA.b + (rgbB.b - rgbA.b) * pct);
  
    return rgbToHex(r, g, b);
}
// This incredibly snarky webpage helped me think through the hex/rgb conversions https://gristle.tripod.com/hexconv.html
function hexToRgb(hex) {
    // TODO: Refactor using trim()
    if (hex[0] != '#') hex = hex.split('#')[1];
    else hex = hex.slice(1);

    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        throw new Error(`Invalid hex color format for ${hex}`);
    }

    return { r, g, b };
}

function rgbToHex(r, g, b) {
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    r = r.toString(16).padStart(2, '0');
    g = g.toString(16).padStart(2, '0');
    b = b.toString(16).padStart(2, '0');

    return `#${r}${g}${b}`.toUpperCase();
}


callAPI();
getLocation();
timeUpdate();


// Custom shortcuts shit
// TODO: save/load increment count & shortcut info from localstorage
let shortcutIncrementCount = 0; // Global counter to give unique IDs



/*
    The following functions create a div that looks like this:
    
    <a href={shortURL} class="shortcut-item" id={shortcutIncrementCount}>
        <div class="shortcut-favicon">
            <img src="https://favicone.com/gmail.com" alt={shortName + " favicon"}/>
        </div>
        <div class="shortcut-name">
            {shortName}
        </div>
    </a>

    I originally wrote it kinda spaghetti and had an llm format it more sensibly
*/
function addShortcut(shortName, shortURL, faviconNum = 0) {
    // Create anchor element
    const shortcutLink = document.createElement("a");
    shortcutLink.href = shortURL;
    shortcutLink.className = "shortcut-item";
    shortcutLink.id = `shortcut-${shortcutIncrementCount++}`; // TODO: save to local storage too

    // Create favicon container
    const faviconDiv = document.createElement("div");
    faviconDiv.className = "shortcut-favicon";

    const faviconImg = document.createElement("img");
    if (faviconNum == 0) {
        faviconImg.src = `https://favicone.com/${new URL(shortURL).hostname}`;
    }
    // TODO: else, find one from list of custom site icons 
    faviconImg.alt = `${shortName} favicon`;

    faviconDiv.appendChild(faviconImg);

    // Create name container
    const nameDiv = document.createElement("div");
    nameDiv.className = "shortcut-name";
    nameDiv.textContent = shortName;

    // Append children to anchor
    shortcutLink.appendChild(faviconDiv);
    shortcutLink.appendChild(nameDiv);

    // Append anchor to shortcuts container
    const container = document.getElementById("shortcuts-container");
    if (container) {
        container.appendChild(shortcutLink);
    } else {
        console.warn("No element with id 'shortcuts-container' found.");
    }
}



console.log(
    `Available functions:\n
    • fastForward() - increase the time-lapse
    • setCustomTime("HH:MM:SS") - uses 24H
    • disableCustomTime() - use real time info`
);
