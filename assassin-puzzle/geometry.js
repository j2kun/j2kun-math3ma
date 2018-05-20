function midpoint(a, b) {
  return new Vector((a.x + b.x) / 2, (a.y + b.y) / 2);
}

var epsilon = 0.0001;

class Vector {
  constructor(x, y, label) {
    this.x = x;
    this.y = y;
    this.label = label;
  }

  copy() {
    return new Vector(this.x, this.y);
  }

  normalized() {
    let norm = Math.sqrt(this.x * this.x + this.y * this.y);
    return new Vector(this.x / norm, this.y / norm);
  }

  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  add(vector) {
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  subtract(vector) {
    return new Vector(this.x - vector.x, this.y - vector.y);
  }

  scale(length) {
    return new Vector(this.x * length, this.y * length);
  }

  distance(vector) {
    return this.subtract(vector).norm();
  }

  toString() {
    return "[" + this.x + ", " + this.y + "]";
  }
}


/* 
 * A Ray is represented by 
 *
 *  - Vector: the emanating point (center)
 *  - Vector: the direction of the ray relative to the center 
 *  - int: the length (has to be finite for us to draw it)
 *
 * In this way, a Ray is parameterically defined as the set
 *
 *    { c + tv : t >= 0 }
 *
 * where c is the center and v is the direction.
 */
class Ray { 
  constructor(center, direction, length=1000) {
    this.center = center;
    this.length = length;

    if (direction.x == 0 && direction.y == 0) {
      throw "Can't have zero direction";
    }
    this.direction = direction.normalized();
  }
 
  // The endpoint as determined by the length. (Helper for rendering)
  endpoint() {
    return this.center.add(this.direction.scale(this.length));
  }
}


class Rectangle {
  constructor(bottomLeft, topRight) {
    this.bottomLeft = bottomLeft;
    this.topRight = topRight;
  }

  topLeft() {
    return new Vector(this.bottomLeft.x, this.topRight.y);
  }

  center() {
    return midpoint(this.bottomLeft, this.topRight);
  }

  width() {
    return this.topRight.x - this.bottomLeft.x;
  }

  height() {
    return this.topRight.y - this.bottomLeft.y;
  }

  contains(vector) {
    return (
      this.bottomLeft.x - epsilon <= vector.x && vector.x <= this.topRight.x + epsilon
      && this.bottomLeft.y - epsilon <= vector.y && vector.y <= this.topRight.y + epsilon
    );
  }

  /*
   * Given a ray, compute the first point of interesection of the ray with the 
   * rectangle's boundary. Assume the ray emanates from a point inside the rectangle,
   * and the center of the ray is not on the boundary of the rectangle.
   *
   * If bottomLeft = (x1, y1) and topRight = (x2, y2) and the ray is 
   * { (c1, c2) + t (v1, v2) : t > 0 }, then the following equations 
   * provide all possibilities.
   *
   *  - ray intersects top wall first:    c2 + t v2 = y2 and x1 <= c1 + t v1 <= x2
   *  - ray intersects bottom wall first: c2 + t v2 = y1 and x1 <= c1 + t v1 <= x2
   *  - ray intersects left wall first:   c1 + t v1 = x1 and y1 <= c2 + t v2 <= y2
   *  - ray intersects right wall first:  c1 + t v1 = x2 and y1 <= c2 + t v2 <= y2
   *
   *  With special cases for when v1, v2 are 0.
   */ 
  rayIntersection(ray) {
    let c1 = ray.center.x;
    let c2 = ray.center.y;
    let v1 = ray.direction.x;
    let v2 = ray.direction.y;
    let x1 = this.bottomLeft.x;
    let y1 = this.bottomLeft.y;
    let x2 = this.topRight.x;
    let y2 = this.topRight.y;

    // ray is vertically up or down
    if (v1 == 0) {
      return new Vector(c1, (v2 > 0 ? y2 : y1));
    }

    // ray is horizontally left or right
    if (v2 == 0) {
      return new Vector((v1 > 0 ? x2 : x1), c2);
    }

    let tTop = (y2 - c2) / v2;
    let tBottom = (y1 - c2) / v2;
    let tLeft = (x1 - c1) / v1;
    let tRight = (x2 - c1) / v1;

    // Exactly one t value should be both positive and result in a point
    // within the rectangle
    
    let tValues = [tTop, tBottom, tLeft, tRight];
    for (let i = 0; i < tValues.length; i++) {
      let t = tValues[i];
      let intersection = new Vector(c1 + t * v1, c2 + t * v2);
      if (t > 0 && this.contains(intersection)) {
        return intersection;
      }
    } 

    console.log("raycenter");
    console.log(ray.center);
    console.log("raydirection");
    console.log(ray.direction);
    console.log("raylength");
    console.log(ray.length);
    console.log("tValues");
    console.log(tValues);
    for (let i = 0; i < tValues.length; i++) {
      let t = tValues[i];
      let intersection = new Vector(c1 + t * v1, c2 + t * v2);
      console.log(intersection);
    } 
    throw "Unexpected error: ray never intersects rectangle!";
  }

  /* 
   * Determine if a point on the wall of the rectangle is on a vertical or
   * horizontal wall. A helper for computing the angle of refraction
   */
  isOnVerticalWall(pointOnWall) {
    if (Math.abs(pointOnWall.x - this.bottomLeft.x) < epsilon 
       || Math.abs(pointOnWall.x - this.topRight.x) < epsilon) {
      return true;
    } else if (Math.abs(pointOnWall.y - this.bottomLeft.y) < epsilon
       || Math.abs(pointOnWall.y - this.topRight.y) < epsilon) {
      return false;
    } else {
      throw (
        "Invalid argument to isOnVerticalWall: point " 
        + pointOnWall + 
        " is not on the rectangle" 
        + this
      );
    }
  }

  /* Split a ray into a line segment and a shorter ray that's "bounced" off 
   * the wall of the rectangle */
  splitRay(ray) {
    let segment = [ray.center, this.rayIntersection(ray)];
    let segmentLength = segment[0].subtract(segment[1]).norm();
    let remainingLength = ray.length - segmentLength;

    if (remainingLength < 10) {
      return {
        segment: [ray.center, ray.endpoint()], 
        ray: null
      };
    }

    let vertical = this.isOnVerticalWall(segment[1]);
    let newRayDirection = null;
    
    if (vertical) {
      // reflect across the horizontal line through the ray intersection point.
      let dy = segment[1].y - segment[0].y;
      let newRayEndpoint = new Vector(segment[0].x, segment[1].y + dy);
      newRayDirection = newRayEndpoint.subtract(segment[1]);
    } else {
      // reflect across the vertical line through the ray intersection point.
      let dx = segment[1].x - segment[0].x;
      let newRayEndpoint = new Vector(segment[1].x + dx, segment[0].y);
      // console.log("newRayEndpoint: " + newRayEndpoint.x + ", " + newRayEndpoint.y);
      newRayDirection = newRayEndpoint.subtract(segment[1]);
    }

    return {
      segment: segment, 
      ray: new Ray(segment[1], newRayDirection, length=remainingLength)
    };
  }

  rayToPoints(ray) {
    let points = [ray.center];
    let remainingRay = ray;
    
    while (remainingRay) {
      let rayPieces = this.splitRay(remainingRay);
      points.push(rayPieces.segment[1]);
      remainingRay = rayPieces.ray;
    } 

    return points;
  }

  // Mirror a point across the top side of the rectangle
  mirrorTop(vector) {
    let dyToTop = this.topRight.y - vector.y;
    return new Vector(vector.x, this.topRight.y + dyToTop);
  }

  // Mirror a point across the left side of the rectangle
  mirrorLeft(vector) {
    let dxToLeft = this.bottomLeft.x - vector.x;
    return new Vector(this.bottomLeft.x + dxToLeft, vector.y);
  }

  // Mirror a point across the bottom side of the rectangle
  mirrorBottom(vector) {
    let dyToBottom = this.bottomLeft.y - vector.y;
    return new Vector(vector.x, this.bottomLeft.y + dyToBottom);
  }

  // Mirror a point across the right side of the rectangle
  mirrorRight(vector) {
    let dxToRight = this.topRight.x - vector.x;
    return new Vector(this.topRight.x + dxToRight, vector.y);
  }
}


/* 
 * Compute the 16 optimal guards to prevent the assassin from hitting the
 * target.
 */
function computeOptimalGuards(square, assassin, target) {
  // First compute the target copies in the 4 mirrors
  let target1 = target.copy();
  let target2 = square.mirrorTop(target);
  let target3 = square.mirrorRight(target);
  let target4 = square.mirrorTop(square.mirrorRight(target));

  // for each mirrored target, compute the four two-square-length translates
  let mirroredTargets = [target1, target2, target3, target4];
  let horizontalShift = 2 * square.width();
  let verticalShift = 2 * square.height();
  let translateLeft = new Vector(-horizontalShift, 0);
  let translateRight = new Vector(horizontalShift, 0);
  let translateUp = new Vector(0, verticalShift);
  let translateDown = new Vector(0, -verticalShift);

  let translatedTargets = [];
  for (let i = 0; i < mirroredTargets.length; i++) {
    let target = mirroredTargets[i];
    translatedTargets.push([
      target,
      target.add(translateLeft),
      target.add(translateDown),
      target.add(translateLeft).add(translateDown),
    ]);
  }

  // compute the midpoints between the assassin and each translate
  let translatedMidpoints = [];
  for (let i = 0; i < translatedTargets.length; i++) {
    let targetList = translatedTargets[i];
    translatedMidpoints.push(targetList.map(t => midpoint(assassin, t)));
  }

  console.log("translated midpoints");
  console.log(translatedMidpoints);

  // determine which of the four possible translates the midpoint is in
  // and reverse the translation. Since midpoints can end up in completely
  // different copies of the square, we have to check each one for all cases.
  function untranslate(point) {
    if (point.x < square.bottomLeft.x && point.y > square.bottomLeft.y) {
      return point.add(translateRight);
    } else if (point.x >= square.bottomLeft.x && point.y <= square.bottomLeft.y) {
      return point.add(translateUp);
    } else if (point.x < square.bottomLeft.x && point.y <= square.bottomLeft.y) {
      return point.add(translateRight).add(translateUp);
    } else {
      return point;
    }
  }

  // undo the translations to get the midpoints back to the original 4-mirrored square.
  let untranslatedMidpoints = [];
  for (let i = 0; i < translatedMidpoints.length; i++) {
    let midpointList = translatedMidpoints[i];
    let untranslated = midpointList.map(untranslate);
    untranslatedMidpoints.push(...untranslated);
  }

  console.log("untranslated midpoints");
  console.log(untranslatedMidpoints);

  // Now undo the mirroring on each midpoint list to get the midpoints all
  // back to the original square. Each midpoint can be in a different mirror
  // from the assassin or the target, so we just check all four possibilities
  // and mirror as needed.
  function unmirror(point) {
    if (point.x > square.topRight.x && point.y > square.topRight.y) {
      return square.mirrorTop(square.mirrorRight(point));
    } else if (point.x > square.topRight.x && point.y <= square.topRight.y) {
      return square.mirrorRight(point);
    } else if (point.x <= square.topRight.x && point.y > square.topRight.y) {
      return square.mirrorTop(point);
    } else {
      return point;
    }
  }

  console.log("final output");
  console.log(untranslatedMidpoints.map(unmirror));

  return untranslatedMidpoints.map(unmirror);
}


module.exports = {
  Vector,
  Ray,
  Rectangle,
  midpoint,
  computeOptimalGuards,
};
