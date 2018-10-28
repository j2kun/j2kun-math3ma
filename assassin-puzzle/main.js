import * as d3 from 'd3';
import { Vector, Ray, Rectangle, midpoint, computeOptimalGuards } from './geometry';

let width = 800;
let height = 600;
let svg = d3.select(".puzzle_demo")
  .insert("svg", ":first-child")
  .attr("width", width)
  .attr("height", height);

let unit = 60;
let numPoints = 40;

let originX = width / 2;
let originY = height / 2;

let pointRadius = 3;

function fromCartesianX(x) { return originX + x; }
function fromCartesianY(y) { return originY - y; }
function toCartesianX(x) { return x - originX; }
function toCartesianY(y) { return -y + originY; }

let labelToColor = {
  'assassin': '#999999',
  'guard': 'red',
  'target': '#77FF77',
};
let labelToStrokeColor = {
  'assassin': '#333333',
  'guard': '#330000',
  'target': '#003300',
};

let lineFunction = d3.line()
  .x(function(d) { return fromCartesianX(d.x); })
  .y(function(d) { return fromCartesianY(d.y); });


function createRectangleSVG(rectangle) {
  let topLeft = rectangle.topLeft();
  let rectangleSVG = svg.append("rect")
       .attr("x", fromCartesianX(topLeft.x))
       .attr("y", fromCartesianY(topLeft.y))
       .attr("width", rectangle.width())
       .attr("height", rectangle.height())
       .attr("stroke", "black")
       .attr("stroke-width", 4)
       .attr("fill", "none");
  return rectangleSVG;
}

function createCircleSVG(point) {
  let circleSVG = svg.datum(point).append('circle')
    .attr("cx", fromCartesianX(point.x))
    .attr("cy", fromCartesianY(point.y))
    .attr("r", pointRadius)
    .attr("fill", labelToColor[point.label])
    .attr("stroke", labelToStrokeColor[point.label])
    .attr("stroke-width", 2);
  return circleSVG;
}

function createPolylineSVG(points) {
  var lineGraph = svg.append("path")
    .attr("d", lineFunction(points))
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("fill", "none");

  return lineGraph;
}

function createAssassinSVG(point, square, ray, stoppingPoints) {
  let assassinSVG = createCircleSVG(point);
  let rayLinesSVG = createPolylineSVG(square.rayToPoints(ray, stoppingPoints));

  return {
    assassinSVG: assassinSVG,
    rayLinesSVG: rayLinesSVG,
  };
}

function updateGuardsSVG(guards) {
  let circleContainers = svg.selectAll(".guard").data(guards);

  circleContainers.enter().append('circle')
      .merge(circleContainers)
      .attr("cx", function (d) { return fromCartesianX(d.x); })
      .attr("cy", function (d) { return fromCartesianY(d.y); })
      .attr("r", pointRadius)
      .attr("fill", function (d) { return labelToColor[d.label]; })
      .attr("stroke", function (d) { return labelToStrokeColor[d.label]; })
      .attr("stroke-width", 2)
      .attr("class", "guard");

  circleContainers.exit().remove();
  return circleContainers;
}


function setupBehavior(baseObjects, assassinSVGs, guardsSVGs, targetSVG) {
  let { assassin, square, target, guards, ray } = baseObjects;
  let { assassinSVG, rayLinesSVG } = assassinSVGs;

  // On mouse move, reset and redraw ray
  svg.on('mousemove', function() {
    let coords = d3.mouse(this);
    let x = coords[0];
    let y = coords[1];

    if (x != 0 && y != 0) {
      let mouseVector = new Vector(toCartesianX(x), toCartesianY(y));
      ray.setDirection(mouseVector.subtract(ray.center));
      rayLinesSVG.attr("d",
        lineFunction(square.rayToPoints(ray, svg.selectAll(".guard").data().concat([targetSVG.datum()]))));
    }
  });

  // Set up drag handler for guard
  function drag_guard(d, point){
    d.x += d3.event.dx;
    d.y -= d3.event.dy;
    point.attr("cx", fromCartesianX(d.x))
         .attr("cy", fromCartesianY(d.y));
  }

  // Set up new guards after target drag
  function setup_new_guards(){
    let newGuards = computeOptimalGuards(square, assassinSVG.datum(), targetSVG.datum());
    let newGuardCount = 0
    newGuards.forEach(guard => { guard.label = "guard"; guard.name = ++newGuardCount; });
    guardsSVGs = updateGuardsSVG(newGuards);
    for (let i = 1; i <= newGuardCount; i++) {
      let guardsSVG = guardsSVGs.filter(function(d) { return d.name == i})
      guardsSVG.style("cursor", "pointer")
      guardsSVG.call(d3.drag().on("drag", function(d) {
        drag_guard(d, guardsSVG);
      }));  
    }
  }

  // Set up drag handlers for target
  function drag_target(d, point) {
    d.x += d3.event.dx;
    d.y -= d3.event.dy;
    point.attr("cx", fromCartesianX(d.x))
         .attr("cy", fromCartesianY(d.y));
    
    setup_new_guards()   
  }

  targetSVG.call(d3.drag().on("drag", function(d) {
    drag_target(d, targetSVG);
  }));
}


function randomInt(min, max) {
  return Math.floor(Math.random() * ((max - min) + 1)) + min;
}

// Choose a random point not too close to the square's edge
function randomPoint(square) {
  let margin = 50;
  let shrunkenSquare = new Rectangle(
    square.bottomLeft.add(new Vector(margin, margin)),
    square.topRight.subtract(new Vector(margin, margin)));

  let minX = shrunkenSquare.bottomLeft.x;
  let minY = shrunkenSquare.bottomLeft.y;
  let maxX = shrunkenSquare.topRight.x;
  let maxY = shrunkenSquare.topRight.y;

  return new Vector(randomInt(minX, maxX), randomInt(minY, maxY));
}

// Set up the geometric objects
let square = new Rectangle(new Vector(-200, -200), new Vector(200, 200));
let assassin = randomPoint(square);
let target = randomPoint(square);
let ray = new Ray(assassin, new Vector(10, 12));
// Make sure the target isn't too close to the assassin

let assassinToTargetMargin = 100;
while (target.distance(assassin) < assassinToTargetMargin) {
  target = randomPoint(square);
}

// Now set up guards
let guardCount = 0
let guards = computeOptimalGuards(square, assassin, target);

assassin.label = "assassin";
target.label = "target";
guards.forEach(guard => { guard.label = "guard"; guard.name = ++guardCount;});

let squareSVG = createRectangleSVG(square);
let targetSVG = createCircleSVG(target).style("cursor", "pointer");
let guardsSVGs = updateGuardsSVG(guards);
let assassinSVG = createAssassinSVG(assassin, square, ray, guards.concat([target]));

let baseObjects = {
  assassin: assassin,
  target: target,
  square: square,
  guards: guards,
  ray: ray,
};

// Set up interactivity
setupBehavior(baseObjects, assassinSVG, guardsSVGs, targetSVG);
