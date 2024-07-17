export class Vector {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // يعيد طويلة الشعاع
  getLength() {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
  }

  // التابع ضرب الشعاع بمصفوفة مربعة (3x3) وإعادة شعاع
  MultiplicationMatrix(matrix) {
    const newX = this.x * matrix[0][0] + this.y * matrix[0][1] + this.z * matrix[0][2];
    const newY = this.x * matrix[1][0] + this.y * matrix[1][1] + this.z * matrix[1][2];
    const newZ = this.x * matrix[2][0] + this.y * matrix[2][1] + this.z * matrix[2][2];
    return new Vector(newX, newY, newZ);
  }

  // التابع تدوير الشعاع حول المحور Y
  Rotation_Y(angle) {
    const radians = angle * (Math.PI / 180);
    const rotationMatrix = [
      [Math.cos(radians), 0, Math.sin(radians)],
      [0, 1, 0],
      [-Math.sin(radians), 0, Math.cos(radians)]
    ];
    return this.MultiplicationMatrix(rotationMatrix);
  }

  // التابع تدوير الشعاع حول المحور Z
  Rotation_X(angle) {
    const radians = angle * (Math.PI / 180);
    const rotationMatrix = [
      [0, 0, 1],
      [Math.cos(radians), -Math.sin(radians), 0],
      [Math.sin(radians), Math.cos(radians), 0],
    ];
    return this.MultiplicationMatrix(rotationMatrix);
  }

  // تابع للجمع
  add(vector) {
    return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z);
  }

  // تابع للطرح
  subtract(vector) {
    return new Vector(this.x - vector.x, this.y - vector.y, this.z - vector.z);
  }

  // تابع للقسمة
  divide(scalar) {
    return new Vector(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  // تابع للضرب
  multiply(scalar) {
    return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  toString() {
    return `(${this.x}, ${this.y}, ${this.z})`;
  }
}

// مثال على الاستخدام
// const vec = new Vector(1, 2, 3);

// console.log(`Original Vector: ${vec.toString()}`);
// console.log(`Length of Vector: ${vec.getLength()}`);

// const rotatedVecY = vec.Rotation_Y(90);
// console.log(`Vector after 90 degree rotation around Y-axis: ${rotatedVecY.toString()}`);

// const rotatedVecZ = vec.Rotation_Z(90);
// console.log(`Vector after 90 degree rotation around Z-axis: ${rotatedVecZ.toString()}`);