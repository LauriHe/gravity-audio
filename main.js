// global variables
let updateInterval; // interval for updating the dots
let refreshRate = 6; // physics refresh rate in ms
let dots = 14; // number of dots (max 21)
let showLines = false; // show trailing lines or not
let dotColor = 'index'; // index, speed or height based
let lineColor = 'index'; // index, speed or height based
let hueRange = 360; // how much the hue can vary (0-360)
let hueOffset = 0; // offset the hue by this amount (0-360)
let relativeLineLength = 5; // how long the lines are relative to the speed
let gravityIntensity = 10; // how fast the dots fall
let gravityDifference = 0.5; // how fast the motion becomes out of sync (also affects the speed)
let dropHeight = 30; // how far from the center the dots start
let settingsOpen = false; // is the settings menu open or not
let started = false; // has the animation been started or not
const audioArray = []; // array of audio elements

// DOM elements
const body = document.querySelector('body');
const mask = document.querySelector('#mask');
const centerDot = document.querySelector('#centerDot');
const buttonsHover = document.querySelector('#buttonsHover');
const hoverBar = document.querySelector('#hoverBar');
const buttonsAndSettings = document.querySelector('#buttonsAndSettings');
const buttonsContainer = document.querySelector('#buttonsContainer');
const startButton = document.querySelector('#startButton');
const startText = document.querySelector('#startButton > p');
const play = document.querySelector('#play');
const pause = document.querySelector('#pause');
const settings = document.querySelector('#settings');
const settingsButton = document.querySelector('#settingsButton');
const settingsIcon = document.querySelector('#settingsIcon');
const restartButton = document.getElementById('restartButton');
const dotsSlider = document.getElementById('dots');
const gravityIntensitySlider = document.getElementById('gravityIntensity');
const gravityDifferenceSlider = document.getElementById('gravityDifference');
const dropHeightSlider = document.getElementById('DropHeight');
const showLinesRadio = document.getElementsByName('showLines');
const lineLengthSlider = document.getElementById('lineLength');
const dotColorRadio = document.getElementsByName('dotColor');
const lineColorRadio = document.getElementsByName('lineColor');
const hueRangeSlider = document.getElementById('hueRange');
const hueOffsetSlider = document.getElementById('hueOffset');
const refreshRateInput = document.getElementById('refreshRate');
const dotsDiv = document.getElementById('dotsDiv');
const dropDiv = document.getElementById('dropDiv');
const dotsText = document.getElementById('dotsText');
const gravityIntensityText = document.getElementById('gravityIntensityText');
const gravityDifferenceText = document.getElementById('gravityDifferenceText');
const dropHeightText = document.getElementById('dropHeightText');
const lineLengthText = document.getElementById('lineLengthText');
const hueRangeText = document.getElementById('hueRangeText');
const hueOffsetText = document.getElementById('hueOffsetText');
const refreshRateText = document.getElementById('refreshRateText');

// get url of audio file based on index
const getUrl = (index) => `./sounds/vibraphone-key-${20 - index}.wav`; // the higher the index, the lower the pitch

// initialize the dots
const createDots = () => {
  centerDot.style.display = 'block'; // show the center dot when the animation starts

  let dotCount;
  dots < 21 ? (dotCount = dots) : (dotCount = 21); // cap the number of dots at 21 (there are 21 different audio files)

  // create the dots
  for (let i = 0; i < dotCount; i++) {
    const dotContainer = document.createElement('div');
    dotContainer.classList.add('dotContainer');

    const dot = document.createElement('div');
    dot.classList.add('dot');

    const line = document.createElement('div'); // create a line that will follow the dot
    line.classList.add('line');

    const audio = new Audio(getUrl(i)); // each dot gets its own audio element
    audio.id = i;
    audio.volume = 0.15;

    audioArray.push(audio); // add the audio element to the array

    // data attributes to store the dot's properties
    dot.dataset.height = dropHeight;
    dot.dataset.speed = 0;
    dot.dataset.direction = 1;
    dot.dataset.phase = 0;
    dot.dataset.hue = 0;

    // data attributes to store the line's properties
    line.dataset.length = 0;
    line.dataset.height = 0;
    line.dataset.rotation = 180;
    line.dataset.hue = 0;

    dotContainer.appendChild(dot);
    dotContainer.appendChild(line);
    body.appendChild(dotContainer);

    // rotate the dot container so that the dots are evenly spaced
    dotContainer.style.transform = `translate(50%, 50%) rotate(${i * (360 / dotCount)}deg)`;
  }
};

// calculate physics and update the position of the dots
const updatePosition = () => {
  const dots = document.getElementsByClassName('dot');
  const lines = document.getElementsByClassName('line');

  // for each dot
  for (let i = 0; i < dots.length; i++) {
    let direction = dots[i].dataset.direction; // Direction of the dot (1 = away from center, -1 = towards center). Changes every quarter lap.
    let phase = dots[i].dataset.phase; // Phase of the dot (0 = going down, 1 = going up). Changes every half lap.
    const gravity = i * gravityDifference + gravityIntensity; // Gravity of the dot (aka acceleration towards center). Increases with index.
    let height = dots[i].dataset.height; // Height of the dot (distance from center).
    let speed = dots[i].dataset.speed; // Speed of the dot.
    const time = refreshRate / 1000; // Time since last frame.
    let acceleration = gravity; // Acceleration of the dot (same as gravity but can be negative).

    // if the dot is "below" the center
    if (height < 0) {
      acceleration = -Math.abs(gravity); // acceleration is negative
    }

    const distance = speed * time + (1 / 2) * acceleration * Math.pow(time, 2); // distance traveled since last frame (v * t + 1/2 * a * t^2). Calculated using the mathematical formula for free fall.
    height = height - distance; // update the height of the dot
    speed = distance / time; // update the speed of the dot

    // store the updated values in the dot's data attributes
    dots[i].dataset.height = height;
    dots[i].dataset.speed = speed;

    // change the position of the dot
    dots[i].style.bottom = `${height}rem`;

    const speedPercent = Math.abs(speed) / Math.sqrt(2 * Math.abs(acceleration) * dropHeight); // speed as a percentage of the maximum speed (the speed at the bottom of the drop)
    let lineLength = speedPercent * relativeLineLength; // length of the line (percentage of the maximum speed times a multiplier that the user can change)

    // if user has chosen to show lines
    if (showLines) {
      let rotation = parseInt(lines[i].dataset.rotation); // rotation of the line (0 or 180 degrees)

      // if the dot is going up and away from the center
      if (direction == 1 && height > 0 && phase == 0) {
        rotation = 180;
        lines[i].style.transform = `translate(50%, 0) rotate(${180}deg)`;
        lines[i].dataset.rotation = rotation;
      }
      // if the dot is going down and towards the center
      else if (direction == -1 && height > 0 && phase == 0) {
        rotation = 0;
        lines[i].style.transform = `translate(50%, 0) rotate(${0}deg)`;
        lines[i].dataset.rotation = rotation;
      }
      // if the dot is going down and away from the center
      else if (direction == 1 && height < 0 && phase == 1) {
        rotation = 0;
        lines[i].style.transform = `translate(50%, 0) rotate(${0}deg)`;
        lines[i].dataset.rotation = rotation;
      }
      // if the dot is going up and towards the center
      else if (direction == -1 && height < 0 && phase == 1) {
        rotation = 180;
        lines[i].style.transform = `translate(50%, 0) rotate(${180}deg)`;
        lines[i].dataset.rotation = rotation;
      }

      // store the updated values in the line's data attributes
      lines[i].dataset.height = height;
      lines[i].style.bottom = `${height}rem`;

      // set the length of the line
      lines[i].style.height = `${lineLength}rem`;
    } else {
      lines[i].style.height = 0; // if user has chosen to hide lines
    }

    // calculate the colors of the dot and line
    const heightPercent = Math.abs(height) / dropHeight; // height as a percentage of the maximum height
    const indexPercent = i / dots.length; // the dot's index as a percentage of the total number of dots
    const indexHue = indexPercent * hueRange - hueOffset; // hue based on the dot's index
    const heightHue = heightPercent * hueRange - hueOffset; // hue dot's height
    const speedHue = (1 - speedPercent) * hueRange - hueOffset; // hue based on the dot's speed

    // hue of the dot and line
    let dotHue;
    let lineHue;

    // set the hue of the dot based on the user's choice
    switch (dotColor) {
      case 'speed':
        dotHue = speedHue;
        break;
      case 'height':
        dotHue = heightHue;
        break;
      case 'index':
        dotHue = indexHue;
        break;
      default:
        dotHue = speedHue;
        break;
    }

    // set the hue of the line based on the user's choice
    switch (lineColor) {
      case 'speed':
        lineHue = speedHue;
        break;
      case 'height':
        lineHue = heightHue;
        break;
      case 'index':
        lineHue = indexHue;
        break;
      default:
        lineHue = speedHue;
        break;
    }

    dots[i].dataset.hue = dotHue; // store the hue of the dot in the dot's data attributes
    dots[i].style.backgroundColor = `hsl(${dotHue}, 40%, 55%)`; // set the color of the dot

    // if user has chosen to show lines
    if (showLines) {
      lines[i].dataset.hue = lineHue; // store the hue of the line in the line's data attributes
      lines[i].style.backgroundColor = `hsl(${lineHue}, 40%, 55%)`; // set the color of the line
    }

    // if the dot is at the bottom of the drop
    if (direction == -1 && height <= 0 && phase == 0) {
      audioArray[i].currentTime = 0;
      audioArray[i].play(); // play the sound

      centerDot.style.backgroundColor = `hsl(${dotHue}, 40%, 55%)`; // set the color of the center dot to the color of the dot color

      // change direction and phase
      direction = 1;
      phase = 1;
    } else if (direction == -1 && height >= 0 && phase == 1) {
      audioArray[i].currentTime = 0;
      audioArray[i].play(); // play the sound

      centerDot.style.backgroundColor = `hsl(${dotHue}, 40%, 55%)`; // set the color of the center dot to the color of the dot color

      // change direction and phase
      direction = 1;
      phase = 0;
    }

    // if the dot is at the top of the drop
    if (speed.toFixed(0) == 0) {
      if (direction == 1) {
        direction = -1;
      }
    }

    // store the direction and phase in the dot's data attributes
    dots[i].dataset.direction = direction;
    dots[i].dataset.phase = phase;
  }
};

// change the appearance of the buttons and settings when the animation starts
const transformButtons = () => {
  // change the appearance of the buttons and settings
  mask.style.display = 'none';
  buttonsAndSettings.style.top = '2rem';
  buttonsAndSettings.style.transition = 'top 0.5s ease';
  buttonsAndSettings.style.transform = 'translate(50%, 0)';
  buttonsContainer.style.gap = '1rem';
  startText.style.display = 'none';
  play.style.display = 'none';
  pause.style.display = 'block';
  startButton.style.height = '3rem';
  startButton.style.fontSize = '1.5rem';
  settingsButton.style.width = '3rem';
  settingsButton.style.height = '3rem';
  settingsIcon.style.fontSize = '2rem';
  restartButton.style.display = 'block';
  dotsSlider.style.display = 'none';
  dropHeightSlider.style.display = 'none';
  dotsDiv.remove();
  dropDiv.remove();

  // reload the page when the restart button is clicked
  restartButton.addEventListener('click', () => {
    location.reload();
  });

  // after 3 seconds shift the buttons off the screen
  setTimeout(() => {
    buttonsAndSettings.style.top = '-4rem';

    // when the mouse hovers over the top portion of the screen, shift the buttons back onto the screen
    buttonsHover.addEventListener('mouseover', () => {
      buttonsAndSettings.style.top = '2rem';
    });
    buttonsAndSettings.addEventListener('mouseover', () => {
      buttonsAndSettings.style.top = '2rem';
    });
    buttonsAndSettings.addEventListener('mouseout', () => {
      buttonsAndSettings.style.top = '-4rem';
    });
    buttonsHover.addEventListener('mouseout', () => {
      buttonsAndSettings.style.top = '-4rem';
    });
    setTimeout(() => {
      hoverBar.style.display = 'block';
    }, 400);
  }, 3000);

  // close the settings menu if it's open
  if (settingsOpen) {
    settingsArray = document.querySelectorAll('#settings > div');
    settings.style.height = '0';
    settings.style.padding = '0';
    setTimeout(() => {
      settings.style.border = '0';
    }, 200);
    for (let i = 0; i < settingsArray.length; i++) {
      settingsArray[i].style.display = 'none';
    }
    settingsIcon.style.transform = `rotate(${settingsOpen ? -60 : 60}deg)`;
    settingsOpen = !settingsOpen;
  }
};

// start or stop the animation
const toggleAnimation = () => {
  // if the animation is not running
  if (!updateInterval) {
    // start the animation
    updateInterval = setInterval(() => {
      updatePosition();
    }, refreshRate);
    mask.style.display = 'none';

    // if it's the first time the animation is starting
    if (!started) {
      createDots();
      transformButtons();
      started = true;
    }
  }
  // if the animation is running
  else {
    clearInterval(updateInterval);
    updateInterval = null;
    mask.style.display = 'block';
    play.style.display = 'block';
    pause.style.display = 'none';
  }
};

// set the refresh rate of the animation
const setRefreshRate = (rateInFps) => {
  const rateInMs = 1000 / rateInFps;
  refreshRate = rateInMs;

  // if the animation is running, restart it with the new refresh rate
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = setInterval(() => {
      updatePosition();
    }, refreshRate);
  }
};

// set initial values for sliders/buttons and add event listeners
const initializeSettings = () => {
  // set initial values for sliders
  dotsText.textContent = dotsSlider.value;
  gravityIntensityText.textContent = gravityIntensitySlider.value;
  gravityDifferenceText.textContent = gravityDifferenceSlider.value;
  dropHeightText.textContent = dropHeightSlider.value;
  lineLengthText.textContent = lineLengthSlider.value;
  hueRangeText.textContent = hueRangeSlider.value;
  hueOffsetText.textContent = hueOffsetSlider.value;
  refreshRateText.textContent = refreshRateInput.value;

  // set initial values for radio buttons
  showLinesRadio[0].checked = true;
  dotColorRadio[0].checked = true;
  lineColorRadio[0].checked = true;

  // set event listeners for sliders and radio buttons
  dotsSlider.addEventListener('input', () => {
    dots = parseInt(dotsSlider.value);
    dotsText.textContent = dots;
  });
  gravityIntensitySlider.addEventListener('input', () => {
    gravityIntensity = parseFloat(gravityIntensitySlider.value);
    gravityIntensityText.textContent = gravityIntensity;
  });
  gravityDifferenceSlider.addEventListener('input', () => {
    gravityDifference = parseFloat(gravityDifferenceSlider.value);
    gravityDifferenceText.textContent = gravityDifference;
  });
  dropHeightSlider.addEventListener('input', () => {
    dropHeight = parseInt(dropHeightSlider.value);
    dropHeightText.textContent = dropHeight;
  });
  lineLengthSlider.addEventListener('input', () => {
    relativeLineLength = parseInt(lineLengthSlider.value);
    lineLengthText.textContent = relativeLineLength;
  });
  for (let i = 0; i < showLinesRadio.length; i++) {
    showLinesRadio[i].addEventListener('change', () => {
      if (showLinesRadio[i].checked) {
        showLines = showLinesRadio[i].value === 'yes';
      }
    });
  }
  for (let i = 0; i < dotColorRadio.length; i++) {
    dotColorRadio[i].addEventListener('change', () => {
      if (dotColorRadio[i].checked) {
        dotColor = dotColorRadio[i].value;
      }
    });
  }
  for (let i = 0; i < lineColorRadio.length; i++) {
    lineColorRadio[i].addEventListener('change', () => {
      if (lineColorRadio[i].checked) {
        lineColor = lineColorRadio[i].value;
      }
    });
  }
  hueRangeSlider.addEventListener('input', () => {
    hueRange = parseInt(hueRangeSlider.value);
    hueRangeText.textContent = hueRange;
  });
  hueOffsetSlider.addEventListener('input', () => {
    hueOffset = parseInt(hueOffsetSlider.value);
    hueOffsetText.textContent = hueOffset;
  });
  refreshRateInput.addEventListener('input', () => {
    setRefreshRate(parseInt(refreshRateInput.value));
    refreshRateText.textContent = refreshRateInput.value;
  });

  // event listener to open/close the settings menu
  settingsButton.addEventListener('click', () => {
    settingsArray = document.querySelectorAll('#settings > div');
    settings.style.padding = settingsOpen ? '0' : '2rem'; // set padding

    // different height before and after the animation has started
    if (!started) {
      settings.style.height = settingsOpen ? '0' : '39rem'; // set height
    } else {
      settings.style.height = settingsOpen ? '0' : '31rem'; // set height
    }

    // animate the opening/closing of the settings menu
    if (settingsOpen) {
      setTimeout(() => {
        settings.style.border = '0';
      }, 200);
      for (let i = 0; i < settingsArray.length; i++) {
        settingsArray[i].style.display = 'none';
      }
    } else {
      settings.style.border = '2px solid rgba(255, 255, 255, 0.5)';
      setTimeout(() => {
        for (let i = 0; i < settingsArray.length; i++) {
          settingsArray[i].style.display = 'flex';
        }
      }, 200);
    }

    settingsIcon.style.transform = `rotate(${settingsOpen ? -60 : 60}deg)`; // animate the settings icon
    settingsOpen = !settingsOpen;
  });
};

// set starting values and add event listeners
const initialize = () => {
  initializeSettings();
  startButton.addEventListener('click', toggleAnimation);
};

initialize();
