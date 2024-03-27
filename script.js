var animate; // The variable containing the canvas animation
var arrayOfCircles = []; // The array containing the asteroids
var lives = 3; // The initial number of lives
var score = 0; // The starting score
var streak = 0; // The number indicating how many asteroids have been hit without the ship being hit by an asteroid
var playerName; // The name of the player
// The position and orientation of the ship
var xTriangle = 40;
var yTriangle = 50;
var angleTriangle = 0;

var rockets = []; // The array containing the position of a rocket when it is launched
var bestScores = JSON.parse(localStorage.getItem("bestScores")); // The array containing the highest scores and the names of the players who achieved them
if (bestScores == null) bestScores = [];

// The variables that store the coordinates where the user clicked
var guessX = 0;
var guessY = 0;

var speed; // The variable that will determine the speed of the asteroids

var canvas = document.getElementById("AsteroidsProject");
var context = canvas.getContext("2d");

var image = new Image();
image.crossOrigin = null;
image.src = "https://i.imgur.com/Bo6YMbz.jpeg";

// Setting the length and width of the canvas to fit the screen
canvas.width = (91 / 100) * window.screen.width;
canvas.height = (69 / 100) * window.screen.height;
//
// Loading the background image and the start message
image.onload = function () {
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.fillStyle = "white";
  context.font = "30px Arial";
  context.fillText("Asteroids", canvas.width / 2 - 50, canvas.height / 2);
  context.fillText(
    "Citiți instrucțiunile înainte de a juca",
    canvas.width / 2 - 200,
    canvas.height / 2 + 50
  );
};

// Function that performs drawing of an asteroid
function drawCircle(x, y, radius, text, color) {
  var canvas = document.getElementById("AsteroidsProject");
  var context = canvas.getContext("2d");

  context.lineWidth = "6";
  context.strokeStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.stroke();

  context.fillStyle = "white";
  context.font = "20px Arial";
  context.fillText(text, x - 10, y);
}

// Function that performs drawing of the ship
function drawTriangle(
  centerX,
  centerY,
  sideCount,
  size,
  strokeWidth,
  strokeColor,
  fillColor,
  rotationDegrees
) {
  var radians = (rotationDegrees * Math.PI) / 180;
  context.translate(centerX, centerY);
  context.rotate(radians);
  context.beginPath();
  context.moveTo(size * Math.cos(0), size * Math.sin(0));
  for (var i = 1; i <= sideCount; i += 1) {
    context.lineTo(
      size * Math.cos((i * 2 * Math.PI) / sideCount),
      size * Math.sin((i * 2 * Math.PI) / sideCount)
    );
  }
  context.closePath();
  context.fillStyle = fillColor;
  context.strokeStyle = strokeColor;
  context.lineWidth = strokeWidth;
  context.stroke();
  context.fill();
  context.rotate(-radians);
  context.translate(-centerX, -centerY);
}

// Function that returns the coordinates of the ship's 3 vertices
function getPointsForTriangle(angle) {
  if (angle === 0) {
    var point1x = xTriangle + 30;
    var point1y = yTriangle;
    var point2x = xTriangle - 15;
    var point2y = yTriangle + 25;
    var point3x = xTriangle - 15;
    var point3y = yTriangle - 25;
  } else if (angle === 90) {
    var point1x = xTriangle;
    var point1y = yTriangle + 30;
    var point2x = xTriangle + 25;
    var point2y = yTriangle - 15;
    var point3x = xTriangle - 25;
    var point3y = yTriangle - 15;
  } else if (angle === 180) {
    var point1x = xTriangle - 30;
    var point1y = yTriangle;
    var point2x = xTriangle + 15;
    var point2y = yTriangle - 25;
    var point3x = xTriangle + 15;
    var point3y = yTriangle + 25;
  } else if (angle === 270) {
    var point1x = xTriangle;
    var point1y = yTriangle - 30;
    var point2x = xTriangle - 25;
    var point2y = yTriangle + 15;
    var point3x = xTriangle + 25;
    var point3y = yTriangle + 15;
  }
  var array = [];
  array.push(point1x, point1y, point2x, point2y, point3x, point3y);
  return array;
}

// Function that checks if two asteroids collide
// http://www.jeffreythompson.org/collision-detection/circle-circle.php?fbclid=IwAR35fPMdVVWrg7nBFW72-25kLwyXlszDC8BugncXbg_2nMkGPnIs0C-_534
function checkCirclesCollision(x1, y1, x2, y2, r1, r2) {
  var distSq = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
  var radSumSq = (r1 + r2) * (r1 + r2);
  if (distSq == radSumSq) return 1;
  else if (distSq > radSumSq) return -1;
  else return 0;
}

// Function that detects collision between a line and a circle, used to detect collision between the ship and an asteroid (will be called for each side of the ship)
// http://www.jeffreythompson.org/collision-detection/line-circle.php
function lineCircleCollision(x1, y1, x2, y2, cx, cy, r) {
  var inside1 = pointCircle(x1, y1, cx, cy, r);
  var inside2 = pointCircle(x2, y2, cx, cy, r);
  if (inside1 || inside2) return true;

  var distX = x1 - x2;
  var distY = y1 - y2;
  var len = Math.sqrt(distX * distX + distY * distY);

  var dot = ((cx - x1) * (x2 - x1) + (cy - y1) * (y2 - y1)) / Math.pow(len, 2);

  var closestX = x1 + dot * (x2 - x1);
  var closestY = y1 + dot * (y2 - y1);

  var onSegment = linePoint(x1, y1, x2, y2, closestX, closestY);
  if (!onSegment) return false;

  distX = closestX - cx;
  distY = closestY - cy;
  var distance = Math.sqrt(distX * distX + distY * distY);

  if (distance <= r) {
    return true;
  }
  return false;
}

// http://www.jeffreythompson.org/collision-detection/point-circle.php
function pointCircle(px, py, cx, cy, r) {
  var distX = px - cx;
  var distY = py - cy;
  var distance = Math.sqrt(distX * distX + distY * distY);
  if (distance <= r) {
    return true;
  }
  return false;
}

// http://www.jeffreythompson.org/collision-detection/line-point.php
function linePoint(x1, y1, x2, y2, px, py) {
  var distX = px - x1;
  var distY = py - y1;
  var distance = Math.sqrt(distX * distX + distY * distY);
  var d1 = distance;

  var distX = px - x2;
  var distY = py - y2;
  var distance = Math.sqrt(distX * distX + distY * distY);
  var d2 = distance;

  var distX = x1 - x2;
  var distY = y1 - y2;
  var distance = Math.sqrt(distX * distX + distY * distY);
  var lineLen = distance;

  var buffer = 0.1;

  if (d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer) {
    return true;
  }
  return false;
}

// Function used to sort the array of scores
function compare(a, b) {
  if (a.score < b.score) {
    return -1;
  }
  if (a.score > b.score) {
    return 1;
  }
  return 0;
}

// Function that checks if a certain score can enter the top 5
function checkFirstFiveAndInsert(value) {
  if (bestScores.length < 5) {
    bestScores.push(value);
    bestScores.sort(compare);
  } else {
    bestScores.sort(compare);
    if (bestScores[0]["score"] < value.score) {
      bestScores.splice(0, 1);
      bestScores.push(value);
      bestScores.sort(compare);
    }
  }
}

// Function used to start a new game
// If the parameter is true, then the array of asteroids is reset. Otherwise, a new game is started with the same array of asteroids.
function loadGame(newgame) {
  if (newgame === true) {
    // At the beginning of a new game, ask for the player's name
    playerName = prompt("Nume: ", "");
    if (playerName === null || playerName === "") playerName = "Player";

    // Choose the difficulty and set the speed of the asteroids according to it
    difficulty = prompt("Dificultate(1 - ușor, 2 - normal, 3 - greu): ", "");
    if (difficulty != "1" && difficulty != "2" && difficulty != "3")
      difficulty = "1";
    if (difficulty == "1") {
      speed = 10;
    } else if (difficulty == "2") {
      speed = 15;
    } else if (difficulty == "3") {
      speed = 20;
    }

    var numberOfCircles = Math.floor(Math.random() * 8) + 3; // Generate a random number of asteroids (between 3 and 10)
    arrayOfCircles = [];
    for (var i = 0; i < numberOfCircles; i++) {
      var draw = true;
      var text = Math.floor(Math.random() * 4) + 1; // Generate the number inside the asteroid (between 1 and 4)
      // Set the size and color according to the number of the asteroid
      if (text === 4) {
        var radius = 70;
        var color = "green";
      } else if (text === 3) {
        var radius = 60;
        var color = "yellow";
      } else if (text === 2) {
        var radius = 50;
        var color = "white";
      } else if (text === 1) {
        var radius = 40;
        var color = "orange";
      }

      // Generate two values for the x and y coordinates to determine the initial position of the asteroid
      var x = Math.floor(Math.random() * canvas.width) + 1;
      var y = Math.floor(Math.random() * canvas.height) + 1;
      var move = Math.floor(Math.random() * 2); // Generates either 0 or 1. If move is 0, then the circle moves vertically; if it's 1, then it moves horizontally
      // Check if the asteroid is completely inside the canvas. If not, adjust its position
      if (x + radius > canvas.width) {
        var difference = x + radius - canvas.width;
        x = x - difference;
      } else if (x - radius < 0) {
        var difference = radius - x;
        x = x + difference;
      } else if (x - radius < 200) {
        var difference = 100 - radius - x;
        x = 350;
      }
      if (y + radius > canvas.height) {
        var difference = y + radius - canvas.height;
        y = y - difference;
      } else if (y - radius < 0) {
        var difference = radius - y;
        y = y + difference;
      } else if (y - radius < 200) {
        var difference = 100 - radius - y;
        y = 350;
      }
      //

      // The array of asteroids is looped over and it's checked whether the current asteroid touches another one. If it does, it's no longer generated (the draw variable is set to false)
      if (arrayOfCircles.length > 0) {
        for (var j = 0; j < arrayOfCircles.length; j++) {
          var check = checkCirclesCollision(
            x,
            y,
            arrayOfCircles[j]["x"],
            arrayOfCircles[j]["y"],
            radius,
            arrayOfCircles[j]["radius"]
          );
          if (check !== -1) draw = false;
        }
      }

      // If the current asteroid doesn't collide with another one (draw = true), then it's added to the array of asteroids
      if (draw === true) {
        arrayOfCircles.push({
          text: text,
          x: x,
          y: y,
          radius: radius,
          bottom: false,
          move: move,
          color: color,
        });
        drawCircle(x, y, radius, text, color);
      }
    }
  }

  animateCanvas();
}

// Function that performs animation of everything contained within the canvas
function animateCanvas() {
  animate = setInterval(function () {
    // The array of asteroids is traversed, and based on their movement type, they are moved 10 pixels in the desired direction
    for (var i = 0; i < arrayOfCircles.length; i++) {
      // move = 0 for vertical movement. If bottom is false, it means they haven't reached the bottom limit
      // If they have reached the bottom limit, then bottom is set to true, and the asteroid will start to rise
      if (arrayOfCircles[i]["move"] === 0) {
        if (arrayOfCircles[i]["bottom"] === false) {
          if (
            arrayOfCircles[i]["y"] + arrayOfCircles[i]["radius"] + speed <=
            canvas.height
          )
            arrayOfCircles[i]["y"] += speed;
          else arrayOfCircles[i]["bottom"] = true;
        } else {
          if (arrayOfCircles[i]["y"] - arrayOfCircles[i]["radius"] - speed >= 0)
            arrayOfCircles[i]["y"] -= speed;
          else arrayOfCircles[i]["bottom"] = false;
        }
        // move = 1 for horizontal movement. If right is false, it means they haven't reached the right limit
        // If they have reached the right limit, then right is set to true, and the asteroid will start moving left
      } else {
        if (arrayOfCircles[i]["right"] === false) {
          if (
            arrayOfCircles[i]["x"] + arrayOfCircles[i]["radius"] + speed <=
            canvas.width
          )
            arrayOfCircles[i]["x"] += speed;
          else arrayOfCircles[i]["right"] = true;
        } else {
          if (arrayOfCircles[i]["x"] - arrayOfCircles[i]["radius"] - speed >= 0)
            arrayOfCircles[i]["x"] -= speed;
          else arrayOfCircles[i]["right"] = false;
        }
      }
    }

    // The canvas is cleared to redraw the elements with their new positions
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    showScore();
    showLives();

    // Traverse the array of asteroids and redraw each asteroid according to its new position
    for (var i = 0; i < arrayOfCircles.length; i++) {
      drawCircle(
        arrayOfCircles[i]["x"],
        arrayOfCircles[i]["y"],
        arrayOfCircles[i]["radius"],
        arrayOfCircles[i]["text"],
        arrayOfCircles[i]["color"]
      );
    }

    asteroidsCollision();

    drawTriangle(xTriangle, yTriangle, 3, 30, 2, "blue", "blue", angleTriangle);
    if (rockets.length > 0) {
      drawCircle(rockets[0], rockets[1], 25, "", "blue");
    }
    shipAsteroidCollision();
  }, 25);
}

// Function that traverses the array of asteroids and checks if any two asteroids touch each other. If they do, their movement direction is modified
function asteroidsCollision() {
  for (var i = 0; i < arrayOfCircles.length; i++) {
    for (var j = 0; j < arrayOfCircles.length; j++) {
      if (i !== j) {
        if (
          checkCirclesCollision(
            arrayOfCircles[i]["x"],
            arrayOfCircles[i]["y"],
            arrayOfCircles[j]["x"],
            arrayOfCircles[j]["y"],
            arrayOfCircles[i]["radius"],
            arrayOfCircles[j]["radius"]
          ) !== -1
        ) {
          if (
            arrayOfCircles[i]["move"] === 0 &&
            arrayOfCircles[j]["move"] === 0
          ) {
            arrayOfCircles[i]["move"] = 1;
            arrayOfCircles[i]["right"] = false;
            arrayOfCircles[j]["move"] = 1;
            arrayOfCircles[j]["right"] = true;
            return;
          } else if (
            arrayOfCircles[i]["move"] === 0 &&
            arrayOfCircles[j]["move"] === 1
          ) {
            arrayOfCircles[i]["move"] = 1;
            arrayOfCircles[i]["right"] = true;
            arrayOfCircles[j]["move"] = 0;
            arrayOfCircles[j]["bottom"] = true;
            return;
          } else if (
            arrayOfCircles[i]["move"] === 1 &&
            arrayOfCircles[j]["move"] === 0
          ) {
            arrayOfCircles[j]["move"] = 1;
            arrayOfCircles[j]["right"] = true;
            arrayOfCircles[i]["move"] = 0;
            arrayOfCircles[i]["bottom"] = false;
            return;
          } else {
            arrayOfCircles[i]["move"] = 0;
            arrayOfCircles[i]["bottom"] = false;
            arrayOfCircles[j]["move"] = 0;
            arrayOfCircles[j]["bottom"] = true;

            return;
          }
        }
      }
    }
  }
}

// Function that performs the movement of the ship using arrow keys
function moveShip(evt) {
  switch (evt.keyCode) {
    case 38: // The up arrow key is pressed
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (yTriangle >= 40) {
        yTriangle -= 20;
      }

      break;
    case 40: // The down arrow key is pressed
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (yTriangle <= canvas.height - 40) {
        yTriangle += 20;
      }

      break;
    case 37: // The left arrow key is pressed
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (xTriangle >= 50) {
        xTriangle -= 20;
      }
      break;
    case 39: // The right arrow key is pressed
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (xTriangle <= canvas.width - 45) {
        xTriangle += 20;
      }
      break;
  }
}
window.addEventListener("keydown", moveShip, true);

// When the right click is made, the ship is moved to the location where the click was made
document.getElementById("AsteroidsProject").addEventListener(
  "contextmenu",
  function (ev) {
    ev.preventDefault();
    var x = ev.offsetX;
    var y = ev.offsetY;
    guessX = x;
    guessY = y;
    xTriangle = guessX;
    yTriangle = guessY;

    return false;
  },
  false
);

// Function that detects collision between an asteroid and the ship
function shipAsteroidCollision() {
  for (var i = 0; i < arrayOfCircles.length; i++) {
    // Coordinates for the 3 points that make up the ship are generated
    var points = getPointsForTriangle(angleTriangle);
    // Each side is checked to see if it collides with the current asteroid
    if (
      lineCircleCollision(
        points[0],
        points[1],
        points[2],
        points[3],
        arrayOfCircles[i]["x"],
        arrayOfCircles[i]["y"],
        arrayOfCircles[i]["radius"]
      ) === true
    ) {
      // If there is a collision between the ship and an asteroid, the ship is drawn in red
      drawTriangle(
        xTriangle,
        yTriangle,
        3,
        30,
        2,
        "blue",
        "red",
        angleTriangle
      );
      // The ship is moved to its initial position
      xTriangle = 40;
      yTriangle = 50;
      angleTriangle = 0;
      clearInterval(animate);
      // The asteroid that has collided with the ship is moved to the right part of the canvas
      // to avoid the situation where when the game restarts, the ship and the asteroid come into contact again
      // before the player has a chance to take any action
      arrayOfCircles[i]["x"] = 1200;
      arrayOfCircles[i]["y"] = 300;
      // The number of consecutive asteroids hit without the ship being hit is reset to 0
      streak = 0;
      // The number of lives is decreased
      lives -= 1;
      showLives();

      if (lives > 0) loadGame(false);
      else {
        // If the number of lives is equal to 0, then it's checked whether the player's score enters the top 5
        // then the end game message is displayed, followed by displaying the top 5 scores.
        // Afterwards, the player is asked if they want to start a new game
        var player = {
          playerName: playerName,
          score: score,
        };

        checkFirstFiveAndInsert(player);

        localStorage.setItem("bestScores", JSON.stringify(bestScores));
        setTimeout(function () {
          alert("Felicitări " + playerName + "! Scorul tău: " + score);
          showBestScores();
          var r = confirm("Începe alt joc?");
          if (r == true) {
            xTriangle = 40;
            yTriangle = 50;
            angleTriangle = 0;
            clearInterval(animate);
            lives = 3;
            score = 0;
            loadGame(true);
          } else {
            score = 0;
            clearInterval(animate);
            lives = 3;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            context.font = "30px Arial";
            context.fillText(
              "Asteroids",
              canvas.width / 2 - 50,
              canvas.height / 2
            );
            context.fillText(
              "Citiți instrucțiunile înainte de a juca",
              canvas.width / 2 - 200,
              canvas.height / 2 + 50
            );
          }
        }, 100);
      }
    }
    if (
      lineCircleCollision(
        points[0],
        points[1],
        points[4],
        points[5],
        arrayOfCircles[i]["x"],
        arrayOfCircles[i]["y"],
        arrayOfCircles[i]["radius"]
      ) === true
    ) {
      drawTriangle(
        xTriangle,
        yTriangle,
        3,
        30,
        2,
        "blue",
        "red",
        angleTriangle
      );
      xTriangle = 40;
      yTriangle = 50;
      angleTriangle = 0;
      clearInterval(animate);
      arrayOfCircles[i]["x"] = 1200;
      streak = 0;
      arrayOfCircles[i]["y"] = 300;
      lives -= 1;
      showLives();
      if (lives > 0) loadGame(false);
      else {
        var player = {
          playerName: playerName,
          score: score,
        };

        checkFirstFiveAndInsert(player);

        localStorage.setItem("bestScores", JSON.stringify(bestScores));
        setTimeout(function () {
          alert("Felicitări " + playerName + "! Scorul tău: " + score);
          showBestScores();
          var r = confirm("Începe alt joc?");
          if (r == true) {
            xTriangle = 40;
            yTriangle = 50;
            angleTriangle = 0;
            clearInterval(animate);
            lives = 3;
            score = 0;
            loadGame(true);
          } else {
            score = 0;
            clearInterval(animate);
            lives = 3;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            context.font = "30px Arial";
            context.fillText(
              "Asteroids",
              canvas.width / 2 - 50,
              canvas.height / 2
            );
            context.fillText(
              "Citiți instrucțiunile înainte de a juca",
              canvas.width / 2 - 200,
              canvas.height / 2 + 50
            );
          }
        }, 100);
      }
    }
    if (
      lineCircleCollision(
        points[2],
        points[3],
        points[4],
        points[5],
        arrayOfCircles[i]["x"],
        arrayOfCircles[i]["y"],
        arrayOfCircles[i]["radius"]
      ) === true
    ) {
      drawTriangle(
        xTriangle,
        yTriangle,
        3,
        30,
        2,
        "blue",
        "red",
        angleTriangle
      );
      xTriangle = 40;
      yTriangle = 50;
      angleTriangle = 0;
      clearInterval(animate);
      arrayOfCircles[i]["x"] = 1200;
      streak = 0;
      arrayOfCircles[i]["y"] = 300;
      lives -= 1;
      showLives();
      if (lives > 0) loadGame(false);
      else {
        var player = {
          playerName: playerName,
          score: score,
        };

        checkFirstFiveAndInsert(player);

        localStorage.setItem("bestScores", JSON.stringify(bestScores));
        setTimeout(function () {
          alert("Felicitări " + playerName + "! Scorul tău: " + score);
          showBestScores();
          var r = confirm("Începe alt joc?");
          if (r == true) {
            xTriangle = 40;
            yTriangle = 50;
            angleTriangle = 0;
            clearInterval(animate);
            lives = 3;
            score = 0;
            loadGame(true);
          } else {
            score = 0;
            clearInterval(animate);
            lives = 3;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            context.font = "30px Arial";
            context.fillText(
              "Asteroids",
              canvas.width / 2 - 50,
              canvas.height / 2
            );
            context.fillText(
              "Citiți instrucțiunile înainte de a juca",
              canvas.width / 2 - 200,
              canvas.height / 2 + 50
            );
          }
        }, 100);
      }
    }
  }
}

// Function that rotates the ship when either the Z or C keys are pressed
function rotateShip(evt) {
  switch (evt.keyCode) {
    case 90: // The Z key is pressed, and the ship is rotated to the left
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (angleTriangle === 0) {
        angleTriangle = 270;
      } else {
        angleTriangle -= 90;
      }
      break;
    case 67: // The C key is pressed, and the ship is rotated to the right
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (angleTriangle === 270) {
        angleTriangle = 0;
      } else {
        angleTriangle += 90;
      }

      break;
  }
}
window.addEventListener("keydown", rotateShip, true);

// When the mouse wheel is moved upwards, the ship is rotated to the left, and when it's moved downwards, the ship is rotated to the right
window.addEventListener("wheel", (event) => {
  if (arrayOfCircles.length > 0) {
    const delta = Math.sign(event.deltaY);
    // delta = -1, rotation to the left
    if (delta === -1) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (angleTriangle === 0) {
        angleTriangle = 270;
      } else {
        angleTriangle -= 90;
      }
      // delta = 1, rotation to the right
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (angleTriangle === 270) {
        angleTriangle = 0;
      } else {
        angleTriangle += 90;
      }
    }
  } else {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.fillStyle = "white";
    context.font = "30px Arial";
    context.fillText("Asteroids", canvas.width / 2 - 50, canvas.height / 2);
    context.fillText(
      "Citiți instrucțiunile înainte de a juca",
      canvas.width / 2 - 200,
      canvas.height / 2 + 50
    );
  }
});

// Function that performs the launch of a rocket
function shoot() {
  // If the number of asteroids is greater than 0, execute the function
  if (arrayOfCircles.length > 0) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Only one rocket can be launched, so the rocket array must be empty for a new rocket to be launched
    if (rockets.length === 0) {
      // angletriangle = 0 means that the ship is oriented to the right
      if (angleTriangle === 0) {
        var points = getPointsForTriangle(angleTriangle);
        rockets = [];
        // points[0], points[1] are the coordinates of the triangle's vertex, indicating the direction in which the rocket should go
        rockets.push(points[0], points[1]);
        var execute = setInterval(function () {
          var check = true;
          for (var i = 0; i < arrayOfCircles.length; i++) {
            // If the rocket collides with an asteroid
            if (
              checkCirclesCollision(
                arrayOfCircles[i]["x"],
                arrayOfCircles[i]["y"],
                rockets[0],
                rockets[1],
                arrayOfCircles[i]["radius"],
                25
              ) !== -1
            ) {
              if (rockets.length > 0) {
                // Function that handles the collision event between the rocket and an asteroid
                asteroidHit(arrayOfCircles, i);
                // Remove the rocket from the array, as it has hit its target
                rockets.length = 0;
                clearInterval(execute);
                check = false;
              }
            }
          }
          // If the rocket hasn't hit any asteroid
          if (check === true) {
            // Move the rocket 100 pixels to the right
            rockets[0] += 100;
            // If the rocket goes out of the canvas, remove it from the rocket array
            if (rockets[0] >= canvas.width) {
              rockets.length = 0;
              clearInterval(execute);
            }
          }
        }, 50);

        // angletriangle = 180 means that the ship is oriented to the left
      } else if (angleTriangle === 180) {
        var points = getPointsForTriangle(angleTriangle);
        rockets = [];
        rockets.push(points[0], points[1]);
        var execute = setInterval(function () {
          var check = true;
          for (var i = 0; i < arrayOfCircles.length; i++) {
            if (
              checkCirclesCollision(
                arrayOfCircles[i]["x"],
                arrayOfCircles[i]["y"],
                rockets[0],
                rockets[1],
                arrayOfCircles[i]["radius"],
                25
              ) !== -1
            ) {
              if (rockets.length > 0) {
                asteroidHit(arrayOfCircles, i);
                rockets.length = 0;
                clearInterval(execute);
                check = false;
              }
            }
          }
          if (check === true) {
            rockets[0] -= 100;
            if (rockets[0] <= 0) {
              rockets.length = 0;
              clearInterval(execute);
            }
          }
        }, 25);

        // angletriangle = 270 means that the ship is oriented upwards
      } else if (angleTriangle === 270) {
        var points = getPointsForTriangle(angleTriangle);
        rockets = [];
        rockets.push(points[0], points[1]);
        var execute = setInterval(function () {
          var check = true;
          for (var i = 0; i < arrayOfCircles.length; i++) {
            if (
              checkCirclesCollision(
                arrayOfCircles[i]["x"],
                arrayOfCircles[i]["y"],
                rockets[0],
                rockets[1],
                arrayOfCircles[i]["radius"],
                25
              ) !== -1
            ) {
              if (rockets.length > 0) {
                asteroidHit(arrayOfCircles, i);
                rockets.length = 0;
                clearInterval(execute);
                check = false;
              }
            }
          }
          if (check === true) {
            rockets[1] -= 100;
            if (rockets[1] <= 0) {
              rockets.length = 0;
              clearInterval(execute);
            }
          }
        }, 25);

        // angletriangle = 270 means that the ship is oriented downwards
      } else if (angleTriangle === 90) {
        var points = getPointsForTriangle(angleTriangle);
        rockets = [];
        rockets.push(points[0], points[1]);
        var execute = setInterval(function () {
          var check = true;
          for (var i = 0; i < arrayOfCircles.length; i++) {
            if (
              checkCirclesCollision(
                arrayOfCircles[i]["x"],
                arrayOfCircles[i]["y"],
                rockets[0],
                rockets[1],
                arrayOfCircles[i]["radius"],
                25
              ) !== -1
            ) {
              if (rockets.length > 0) {
                asteroidHit(arrayOfCircles, i);
                rockets.length = 0;
                clearInterval(execute);
                check = false;
              }
            }
          }
          if (check === true) {
            rockets[1] += 100;
            if (rockets[1] >= canvas.height) {
              rockets.length = 0;
              clearInterval(execute);
            }
          }
        }, 25);
      }
    }
  }
}

// Function that performs the launch of a rocket when the X key is pressed
function shootRocket(evt) {
  switch (evt.keyCode) {
    case 88:
      shoot();
  }
}
window.addEventListener("keydown", shootRocket, true);

// The shoot function is attached to the canvas object for the click event
canvas.addEventListener("click", shoot, true);

// Function that handles the collision event between the rocket and an asteroid
function asteroidHit(array, index) {
  // The number of consecutive asteroids hit is incremented by 1
  streak += 1;
  // If 5 consecutive asteroids have been hit and the number of lives is less than 3, then the number of lives is incremented by 1
  // and the number of consecutive asteroids hit is reset to 0
  if (streak === 5) {
    streak = 0;
    if (lives < 3) lives += 1;
  }
  // The score is incremented based on the chosen difficulty
  if (difficulty == "1") {
    score += 1;
  } else if (difficulty == "2") {
    score += 2;
  } else if (difficulty == "3") {
    score += 3;
  }

  // The number inside the asteroid is decreased by 1. If the number is 0 then the asteroid is considered destroyed
  // If the number is greater than 0 then the asteroid is decreased in size and its color is changed
  var number = parseInt(array[index]["text"]);
  if (number > 1) {
    number -= 1;
    array[index]["text"] = number;
    if (number === 3) {
      array[index]["radius"] = 60;
      array[index]["color"] = "yellow";
    } else if (number === 2) {
      array[index]["radius"] = 50;
      array[index]["color"] = "white";
    } else if (number === 1) {
      array[index]["radius"] = 40;
      array[index]["color"] = "orange";
    }
  } else {
    array.splice(index, 1);
  }

  // If there are no more asteroids, it means the game is over, and the end game messages are displayed
  if (array.length === 0) {
    showScore();

    var player = {
      playerName: playerName,
      score: score,
    };

    checkFirstFiveAndInsert(player);

    localStorage.setItem("bestScores", JSON.stringify(bestScores));
    setTimeout(function () {
      alert("Felicitări " + playerName + "! Scorul tău: " + score);
      showBestScores();
      var r = confirm("Începe alt joc?");
      if (r == true) {
        xTriangle = 40;
        yTriangle = 50;
        angleTriangle = 0;
        clearInterval(animate);
        lives = 3;
        score = 0;
        loadGame(true);
      } else {
        lives = 3;
        score = 0;
        clearInterval(animate);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        context.fillStyle = "white";
        context.font = "30px Arial";
        context.fillText("Asteroids", canvas.width / 2 - 50, canvas.height / 2);
        context.fillText(
          "Citiți instrucțiunile înainte de a juca",
          canvas.width / 2 - 200,
          canvas.height / 2 + 50
        );
      }
    }, 100);
  }
}

var button = document.getElementById("showBestScores");

function showBestScores() {
  var bestResults = "Cele mai bune scoruri:";
  if (JSON.parse(localStorage.getItem("bestScores")) != null) {
    var arrayResults = JSON.parse(localStorage.getItem("bestScores"))
      .sort(compare)
      .reverse();
    for (var i = 0; i < arrayResults.length; i++) {
      bestResults +=
        "\n" +
        arrayResults[i]["playerName"] +
        ": " +
        arrayResults[i]["score"] +
        "";
    }
    alert(bestResults);
  } else {
    alert(
      "Nu există scoruri de afișat. Nu s-a finalizat un joc în acest browser."
    );
  }
}

// Display the top scores when the button is pressed
button.addEventListener("click", showBestScores);

var button = document.getElementById("instructions");
//Function that will display the instructions when the button is pressed
function showInstructions() {
  var height = (58 / 100) * window.screen.height;
  $(".modal-body").css("height", height + "px");
  $("#instructionsModal").modal("show");
}
button.addEventListener("click", showInstructions);

// When the instruction window is closed, if there is no game started, display the start message
$("#instructionsModal").on("hidden.bs.modal", function () {
  if (arrayOfCircles.length == 0) stopGame();
});

// Function that displays the number of lives
function showLives() {
  context.fillStyle = "white";
  context.font = "30px Arial";
  context.fillText("Vieți: " + lives, canvas.width - 150, 80);
}

// Function that displays the player's score
function showScore() {
  context.fillStyle = "white";
  context.font = "30px Arial";
  context.fillText("Scor: " + score, canvas.width - 150, 50);
}

// When the button is pressed, a new game is started
var button = document.getElementById("startNewGame");
button.addEventListener("click", function () {
  xTriangle = 40;
  yTriangle = 50;
  angleTriangle = 0;
  clearInterval(animate);
  lives = 3;
  score = 0;
  loadGame(true);
});

// Function that will stop a game when the button is pressed
var button = document.getElementById("stopGame");
function stopGame() {
  lives = 3;
  score = 0;
  clearInterval(animate);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.fillStyle = "white";
  context.font = "30px Arial";
  context.fillText("Asteroids", canvas.width / 2 - 50, canvas.height / 2);
  context.fillText(
    "Citiți instrucțiunile înainte de a juca",
    canvas.width / 2 - 200,
    canvas.height / 2 + 50
  );
}
button.addEventListener("click", stopGame);
