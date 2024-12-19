class Circle extends PIXI.Graphics {
    constructor(radius = 20, color = 0xff0000, x = 0, y = 0) {
      super();
      this.radius = radius;
      this.circle(0, 0, radius);
      this.x = x;
      this.y = y;
      this.fill(color);
  
      // other variables
      this.dx = Math.random() * 10 - 5;
      this.dy = Math.random() * 10 - 5;
    }
  
    move() {
      this.x += this.dx;
      this.y += this.dy;
    }
  
    reflectX() {
      this.dx *= -1;
    }
  
    reflectY() {
      this.dy *= -1;
    }
  }