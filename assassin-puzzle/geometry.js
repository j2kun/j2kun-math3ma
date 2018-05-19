function midpoint(a, b) {
  return new Vector((a.x + b.x) / 2, (a.y + b.y) / 2);
}

class Vector {
  constructor(x, y, label, arrowheadSize=100) {
    this.x = x;
    this.y = y;
    this.label = label ? label : "target";  // labels are strings
    this.arrowheadSize = arrowheadSize;

    this.labelToColor = {
      'assassin': '#999999',
      'block': 'red',
      'target': 'green',
    };
    this.labelToStrokeColor = {
      'assassin': '#333333',
      'block': '#330000',
      'target': '#003300',
    };
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

  distance(vector) {
    return this.subtract(vector).norm();
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
      this.bottomLeftX <= vector.x && vector.x <= this.topRightX
      && this.bottomLeftY <= vector.y && vector.y <= this.topRightY
    );
  }

  /*
   * Given a ray, compute the first point of interesection of the ray with the 
   * square's boundary. Assume the ray emanates from a point inside the square,
   * and the center of the ray is not on the boundary of the square.
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
    // within the square
    
    let tValues = [tTop, tBottom, tLeft, tRight];
    for (let i = 0; i < tValues.length; i++) {
      let t = tValues[i];
      let intersection = new Vector(c1 + t * v1, c2 + t * v2);
      if (t > 0 && this.contains(intersection)) {
        return intersection;
      }
    } 

    throw "Unexpected error: ray never intersects square!";
  }
}


module.exports = {
  Vector,
  Ray,
  Rectangle,
  midpoint,
};
