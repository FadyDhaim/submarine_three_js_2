import { BufferGeometry, Float32BufferAttribute, Points, PointsMaterial } from "three";

export class Particles extends Points{
    constructor(underWaterOnly) {
        //الف جزيئة او غبرة بالجو وكل وحدة بتتألف من تلت احداثيات اكس وواي وزد لهيك منضيف تلاتة ع كل وحدة
        const particleCount = 1000;
        //الهندسية يلي بتسمحلنا نتحكم بال vertices
        const particlesGeometry = new BufferGeometry();
        const particlesPositions = [];
        
        for (let i = 0; i < particleCount; i++) {
            particlesPositions.push((Math.random() * 2 - 1) * 5000);
            if (underWaterOnly) {
                particlesPositions.push(-Math.random() * 5000);
            } else {
                particlesPositions.push((Math.random() * 2 - 1) * 5000);
            }
            particlesPositions.push((Math.random() * 2 - 1) * 5000);
        }

        particlesGeometry.setAttribute('position', new Float32BufferAttribute(particlesPositions, 3));

        const particleMaterial = new PointsMaterial({ color: 0x888888 });
        super(particlesGeometry, particleMaterial)

    }

    animate(time) {
        //خليهن يفتلو حوالي المبدأ باعتبار انضافو للمشهد مباشرة
        this.rotation.y = time * 0.1;
    }
}
