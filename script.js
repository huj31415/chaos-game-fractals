const ui = {
  panel: document.getElementById("settings"),
  collapse: document.getElementById("toggleSettings"),
  timestep: document.getElementById("timestep"),
  tOut: document.getElementById("tOut"),
  toggle: document.getElementById("toggle"),
  viewport: document.getElementById("viewport"),
  zoom: document.getElementById("zoom"),
  fps: document.getElementById("fps"),
  offset: document.getElementById("offset"),
  dark: document.getElementById("dark"),
  nSidesInput: document.getElementById("nsides"),
  rInput: document.getElementById("r"),
  calcR: document.getElementById("calcR"),
  radiusInput: document.getElementById("radius"),
  speedIn: document.getElementById("speed"),
  restrict: document.getElementById("restrict")
};

let backgroundColor = "black";
let foregroundColor = "white";


const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");

canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
ui.viewport.innerText = canvas.width + " x " + canvas.height;
let viewport = { x: canvas.width, y: canvas.height };
let center = { x: canvas.width / 2, y: canvas.height / 2 };
let panOffset = { x: 0, y: 0 };
let totalOffset = { x: 0, y: 0 };
let totalZoom = 1;
let zero = { x: (canvas.width - viewport.x) / 2, y: (canvas.height - viewport.y) / 2 };

const fpsGraph = document.getElementById("fpsGraph");
const fpsCtx = fpsGraph.getContext("2d");
// const bodyGraph = document.getElementById("bodyGraph");
// const bodyCtx = bodyGraph.getContext("2d");
fpsCtx.fillStyle = "black";
fpsCtx.fillRect(0, 0, canvas.width, canvas.height);
// bodyCtx.fillStyle = "rgba(0, 0, 0, 1)";
// bodyCtx.fillRect(0, 0, canvas.width, canvas.height);
let xCoord = 0;

let lastTime = performance.now();
let frameCount = 0;

// resize canvas
window.onresize = () => {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;

  viewport = { x: canvas.width, y: canvas.height };
  ui.viewport.innerText = canvas.width + " x " + canvas.height;

  center = { x: canvas.width / 2, y: canvas.height / 2 };
  // viewport.x = canvas.width;// / totalzoom;
  // viewport.y = canvas.height;// / totalzoom;
  zero = { x: (canvas.width - viewport.x) / 2, y: (canvas.height - viewport.y) / 2 };
  updateShape();
};
// interaction
{
  {
    ui.collapse.onclick = () => {
      ui.collapse.innerText = ui.collapse.innerText === ">" ? "<" : ">";
      if (ui.panel.classList.contains("hidden")) {
        ui.panel.classList.remove("hidden");
      } else {
        ui.panel.classList.add("hidden");
      }
    };
  }
  // mouse
  {
    canvas.onmousedown = () => {
      canvas.addEventListener("mousemove", handleMouseMove);
    };
    canvas.onmouseup = () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      panOffset = { x: 0, y: 0 };
    };
    function handleMouseMove(event) {
      event.preventDefault();
      event.stopPropagation();

      panOffset.x = event.movementX / totalZoom;
      panOffset.y = event.movementY / totalZoom;
      totalOffset.x += panOffset.x;
      totalOffset.y += panOffset.y;
      // center.x -= panOffset.x;
      // center.y -= panOffset.y;
      zero.x -= panOffset.x;
      zero.y -= panOffset.y;

      ctx.translate(panOffset.x, panOffset.y);
      // clearCanvas();
      updateShape();
      ui.offset.innerText = Math.floor(totalOffset.x) + " Y=" + Math.floor(totalOffset.y);
      setTimeout(mouseStopped, 50);
    }
    function mouseStopped() {
      panOffset.x = panOffset.y = 0;
    }

    canvas.onmousemove = (event) => { mouseX = event.clientX; mouseY = event.clientY }

    canvas.onwheel = (event) => {
      if (!event.ctrlKey) {
        let zoomfactor = Math.sign(event.deltaY) < 0 ? 1.05 : 1 / 1.05;
        ctx.transform(
          zoomfactor,
          0,
          0,
          zoomfactor,
          (-(zoomfactor - 1) * canvas.width) / 2,
          (-(zoomfactor - 1) * canvas.height) / 2
        );
        totalZoom *= zoomfactor;
        viewport.x /= zoomfactor;
        viewport.y /= zoomfactor;
        ui.viewport.innerText = Math.floor(viewport.x) + " x " + Math.floor(viewport.y);
        
        // zero.x -= panOffset.x;
        // zero.y -= panOffset.y;

        // clearCanvas();
        updateShape();
        ui.zoom.innerText = (totalZoom * 100).toFixed(2); //~~(totalZoom * 10000) / 100;
      }
    };
  }
}


let r = 0.5;
let useCalcR = true;
let radius = 256;
let speed = 625;
let restriction = "none"; // noVtxRepeat || vtxNotAdjacent1Side || vtxNotAdjacent2Sides || vtxNot2Away || noAdjacent2InARowR0.5

// event listeners
{
  ui.nSidesInput.addEventListener("input", updateShape);

  ui.rInput.addEventListener("input", (event) => {
    if (!useCalcR) r = parseFloat(event.target.value);
    updateShape();
  });

  ui.calcR.addEventListener("input", (event) => {
    if (restriction != "noAdjacent2InARowR0.5")
      useCalcR = ui.rInput.disabled = event.target.checked;
    if (!useCalcR) r = parseFloat(ui.rInput.value)
    updateShape();
  });

  // const radius = Math.round(canvas.width * 0.4);
  ui.radiusInput.addEventListener("input", (event) => {
    radius = parseInt(event.target.value ** 2);
    updateShape();
  });

  ui.speedIn.addEventListener("input", (event) => {
    speed = parseInt(event.target.value ** 2);
  });

  ui.restrict.addEventListener("input", (event) => {
    updateShape();
    restriction = event.target.value;
    if (restriction == "noAdjacent2InARowR0.5") {
      r = 0.5;
      ui.rInput.disabled = true;
    } else {
      ui.rInput.disabled = ui.calcR.checked;
    }
  });

  ui.dark.addEventListener("input", (event) => {
    if (event.target.checked) {
      foregroundColor = "white";
      backgroundColor = "black";
      ui.panel.classList.add("right-dark");
      document.body.classList.add("dark");
    } else {
      foregroundColor = "black";
      backgroundColor = "white";
      ui.panel.classList.remove("right-dark");
      document.body.classList.remove("dark");
    }
    updateShape();
    xCoord = 0;
    fpsCtx.fillStyle = backgroundColor;
    fpsCtx.fillRect(0, 0, fpsGraph.width, fpsGraph.height);
  });
}

let points = [];
let steps = 0;

const rand = (min = 0, max = 1) => (Math.random() * (max - min) + min);


function arrMinMax(array = []) {
  let min = Infinity;
  let max = -Infinity;
  array.forEach((n) => {
    if (n > max) max = n;
    if (n < min) min = n;
  });
  return { min: min, max: max };
}
// Array.prototype.max

function updateShape() {
  steps = 0;
  points = [];
  vtxInd = 0;

  // clearCanvas();

  ctx.fillStyle = backgroundColor;
  // let x = center.x - viewport.x / 2 - totalOffset.x;
  // let y = center.y - viewport.y / 2 - totalOffset.y;
  // ctx.fillRect(x, y, viewport.x / totalZoom, viewport.y / totalZoom);
  // ctx.strokeRect(x, y, viewport.x / totalZoom, viewport.y / totalZoom);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  let sides = parseInt(ui.nSidesInput.value);
  let angle = 2 * Math.PI / sides;

  if (useCalcR && restriction != "noAdjacent2InARowR0.5") {
    let A = 0;
    for (let i = 1; i <= Math.floor(sides / 4); i++)
      A += Math.cos(i * angle);

    r = (1 + 2 * A) / (2 + 2 * A);
  } else if (restriction == "noAdjacent2InARowR0.5") {
    r = 0.5;
  }
  ctx.strokeStyle = foregroundColor;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    let point = [radius * Math.sin(angle * i), radius * Math.cos(angle * i)];
    points.push(point);
    ctx.lineTo(center.x - point[0], center.y + point[1]);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawPoint(x = 0, y = 0, r = 5, drawColor = foregroundColor) {
  ctx.beginPath();
  ctx.arc(x, y, r / totalZoom, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = drawColor;
  ctx.fill();
}

let dx, dy;
let point = [];
let vtxInd;
let vtxIndPrev;
let vtxInd2Prev;

function update() {
  if (steps == 0) {
    vtxInd = vtxIndPrev = vtxInd2Prev = null;
    point = [center.x, center.y]; // replace with random point gen
  }
  for (let i = 0; i < speed; i++) {
    vtxInd2Prev = vtxIndPrev;
    vtxIndPrev = vtxInd;
    vtxInd = Math.floor(rand(0, points.length));
    while (
      (restriction == "noVtxRepeat" && vtxInd == vtxIndPrev) ||
      (restriction == "vtxNotAdjacent1Side" && (vtxInd == (vtxIndPrev + 1) % points.length)) ||
      (restriction == "vtxNotAdjacent2Sides" &&
        (vtxInd == (vtxIndPrev + 1) % points.length || (vtxInd + 1) % points.length == vtxIndPrev)) ||
      (restriction == "vtxNot2Away" &&
        (vtxInd == (vtxIndPrev + 2) % points.length || (vtxInd + 2) % points.length == vtxIndPrev)) ||
      (restriction == "noAdjacent2InARowR0.5" && (vtxIndPrev == vtxInd2Prev) &&
        (vtxInd == (vtxIndPrev + 1) % points.length || (vtxInd + 1) % points.length == vtxIndPrev))
    )
      vtxInd = Math.floor(rand(0, points.length));
    dx = points[vtxInd][0] - point[0];
    dy = points[vtxInd][1] - point[1];
    point[0] += (dx + center.x) * r;
    point[1] += (dy + center.y) * r;
    // if (
    //   point[0] >= 0 && point[0] <= canvas.width &&
    //   point[1] >= 0 && point[1] <= canvas.height
    // )
    drawPoint(point[0], point[1], .5);
    steps++;
  }
  updateGraphs(100);
  window.requestAnimationFrame(update);
}

updateShape();

update();


function updateGraphs(interval) {
  // get fps
  frameCount++;
  const currentTime = performance.now();
  const elapsedTime = currentTime - lastTime;

  // only update in specific intervals
  if (elapsedTime >= interval) {
    // Update 10 times per second
    const fps = frameCount / (elapsedTime / 1000);
    ui.fps.innerText = ~~(fps * 100) / 100;

    // draw fps graph
    xCoord += 2;
    fpsCtx.beginPath();
    fpsCtx.strokeStyle = fps >= 15 ? (fps >= 30 ? backgroundColor == "black" ? "lightgreen" : "green" : "orange") : "red"; //"white";
    fpsCtx.lineWidth = 1;
    fpsCtx.moveTo(xCoord % fpsGraph.width, fpsGraph.height);
    fpsCtx.lineTo(xCoord % fpsGraph.width, fpsGraph.height - fps);
    // fpsCtx.closePath();
    fpsCtx.stroke();
    fpsCtx.fillStyle = backgroundColor == "black" ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.02)";
    fpsCtx.fillRect(0, 0, (xCoord % fpsGraph.width) - 2, fpsGraph.height);
    fpsCtx.fillRect((xCoord % fpsGraph.width) + 2, 0, fpsGraph.width, fpsGraph.height);

    frameCount = 0;
    lastTime = currentTime;

    // draw bodycount graph
    // bodyCtx.beginPath();
    // bodyCtx.strokeStyle =
    //   activeBodies >= 500 ? "red" : activeBodies >= 200 ? "orange" : "lightgreen";
    // bodyCtx.lineWidth = 1;
    // bodyCtx.moveTo(xCoord % bodyGraph.width, bodyGraph.height);
    // bodyCtx.lineTo(xCoord % bodyGraph.width, bodyGraph.height - activeBodies / 8);
    // // bodyCtx.closePath();
    // bodyCtx.stroke();
    // bodyCtx.fillStyle = "rgba(0, 0, 0, 0.02)";
    // bodyCtx.fillRect(0, 0, (xCoord % bodyGraph.width) - 2, bodyGraph.height);
    // bodyCtx.fillRect((xCoord % bodyGraph.width) + 2, 0, bodyGraph.width, bodyGraph.height);
  }
}
