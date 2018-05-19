import * as d3 from 'd3';
import { Vector, Ray, Rectangle, midpoint } from './geometry';

let width = 800;
let height = 600;
let svg = d3.select("body").insert("svg", ":first-child")
                           .attr("width", width)
                           .attr("height", height);

let unit = 60;
let numPoints = 40;

let originX = width / 2;
let originY = height / 2;

function fromCartesianX(x) { return originX + x; }
function fromCartesianY(y) { return originY - y; }
function toCartesianX(x) { return x - originX; }
function toCartesianY(y) { return -y + originY; }


function createRectangleSVG(rectangle) {
  let topLeft = rectangle.topLeft();
  let rectangleSVG = svg.append("rect")
       .attr("x", fromCartesianX(topLeft.x))
       .attr("y", fromCartesianY(topLeft.y))
       .attr("width", rectangle.width())
       .attr("height", rectangle.height());
  return rectangleSVG;
}

function rectangleStyle(rectangleSVG) {
  rectangleSVG.attr("stroke", "black")
    .attr("stroke-width", 4)
    .attr("fill", "none");
}

function createCircleSVG(point) {
  let circleSVG = svg.append('circle')
    .attr("cx", fromCartesianX(point.x))
    .attr("cy", fromCartesianY(point.y))
    .attr("r", 6)
    .attr("fill", point.labelToColor[point.label])
    .attr("stroke", point.labelToStrokeColor[point.label])
    .attr("stroke-width", 2);
  return circleSVG;
}

function createAssassinSVG(point) {
  let assassinPointSVG = createCircleSVG(point);
  // create a collection of lines representing the ray of the assassin's shot
}

function rayStyle(raySVG, id, color) {
  raySVG
    .attr("x1", function(d) { return fromCartesianX(assassin.x); })
    .attr("y1", function(d) { return fromCartesianY(assassin.y); })
    .attr("x2", function(d) { return fromCartesianX(d.x); })
    .attr("y2", function(d) { return fromCartesianY(d.y); })
    .attr("id", id)
    .attr("stroke", color)
    .attr("stroke-width", vectorStroke);
  return vectorSVG;
}

function setupBehavior() {
  function dragged(d, vector, arrowhead, labelName) {
    d.x += d3.event.dx;
    d.y -= d3.event.dy;
    setPosition(vector, labelName);
    setArrowheadPosition(arrowhead);
  }

  arrowhead.call(d3.drag().on("drag", function(d) {
    dragged(d, normal, arrowhead, 'normal');
    setSpanningPosition(spanning);
    setParallelPositions(d);
  }));

  setPosition(normal, 'normal');
  setArrowheadPosition(arrowhead);
  setSpanningPosition(spanning);
  setParallelPositions(normal.datum());
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

  console.log("x in [" + minX + ", " + maxX + "], y in ["
    + minY + ", " + maxY + "]");

  return new Vector(randomInt(minX, maxX), randomInt(minY, maxY));
}


// Set up the containing square
let square = new Rectangle(new Vector(-200, -200), new Vector(200, 200));
let squareSVG = createRectangleSVG(square);
rectangleStyle(squareSVG);


// Choose two random points in the square
let assassin = randomPoint(square);
assassin.label = "assassin";
let assassinSVG = createCircleSVG(assassin);

let target = randomPoint(square);
let assassinToTargetMargin = 100;
while (target.distance(assassin) < assassinToTargetMargin) {
  target = randomPoint(square);
}
target.label = "target";
let targetSVG = createCircleSVG(target);

// setupBehavior();
