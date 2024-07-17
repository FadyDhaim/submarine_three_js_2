import { Vector } from "./vector.js";
import { Physics } from './physics.js';


class SubmarinePhysics {
    constructor() {
        this._radius = 17.8412; // نصف قطر أكبر مقطع في الغواصة
        this._height = 5.6; // طول الغواصة
        this._netMass = 5600; // كتلة الغواصة و خزاناتها فارغة)
        this._tanksCapacity = 1000; // سعة خزانات الغواصة
        this._volumeOfWaterInTanks = 0; // حجم الماء الموجود في خزانات الغواصة (تم زيادة حجم الماء)
        this._enginePossibility = 0; // استطاعة المحرك
        this._speedOfFan = -2; // سرعة دوران المروحة

        this._distance_Horizontal_Front_Planes_Center = 2; // بعد مركز زوج الزعانف الأمامية الأفقية عن محور الغواصة
        this._distance_Horizontal_Back_Planes_Center = 3; // بعد مركز زوج الزعانف الخلفية الأفقية عن محور الغواصة
        this._distance_Vertical_Planes_Center = 4; // بعد مركز زوج الزعانف العمودية عن محور الغواصة

        this._angle_Horizontal_Front_Planes = 10; // زاوية ميلان الزعانف الأمامية الأفقية عن وضعها الأصلي
        this._angle_Horizontal_Back_Planes = 10; // زاوية ميلان الزعانف الخلفية الأفقية عن وضعها الأصلي
        this._angle_Vertical_Planes = 10; // زاوية ميلان الزعانف العمودية عن وضعها الأصلي

        this._AreaOfBackPlanes = 2; // مساحة كل زعنفة من الزعانف الخلفية الأفقية و العمودية
        this._AreaOfFrontPlanes = 2; // مساحة كل زعنفة من الزعانف الأمامية

        this._location = new Vector(0, 0, 0); // الموقع الحالي للغواصة
        this._linearVelocity = new Vector(0, 0, 0); // السرعة الخطية للغواصة
        this._linearAccelerate = new Vector(0, 0, 0); // التسارع الخطي للغواصة


        this._linearWaterVelocity = new Vector(0, 0, 0); // السرعة الخطية للتيارات المائية

        this._verticalAngle = 10; // الزاوية الرأسية
        this._verticalAngularVelocity = 1; // السرعة الزاوية الرأسية
        this._verticalAngularAccelerate = 1; // التسارع الزاوي الرأسي

        this._horizontalAngle = 10; // الزاوية الأفقية
        this._horizontalAngularVelocity = 1; // السرعة الزاوية الأفقية
        this._horizontalAngularAccelerate = 1; // التسارع الزاوي الأفقي


        this.isIncreaseWaterActive = false; // العلم لمتابعة حالة زيادة حجم الماء في الخزانات
        this.isDecreaseWaterActive = false; // العلم لمتابعة حالة تقليل حجم الماء في الخزانات
    }



    //الحركة الانسحابية مع او بدون تيارات بحيرية
    CurrentLinearAccelerate() {
        const mass = this._netMass + this._volumeOfWaterInTanks; // الكتلة الكلية
        const volume = Physics.CalculateCylinderVolume(this._radius, this._height); // حجم الغواصة

        const weightForce = Physics.CalculateWeightForce(mass);//قوة الثقل 
        const archimedesForce = Physics.CalculateArchimedesForce(volume);//قوة ارخميدس
        const engineForce = Physics.CalculateEngineForce(this._enginePossibility, this._speedOfFan);//قوة الدفع
        const resistanceForce = Physics.CalculateResistanceForce(
            new Vector(
                Physics.CalculateCylinderArea(this._radius, this._height),
                Physics.CalculateCylinderArea(this._radius, this._height),
                Math.PI * Math.pow(this._radius, 2)
            ),
            this._linearVelocity
        );//قوى المقاومة

        const strengthOfOceanCurrents = Physics.CalculateStrengthOfOceanCurrents(
            Physics.CalculateCylinderArea(this._radius, this._height),
            this._linearWaterVelocity
        );//قوى التيارات البحرية


        // جمع القوى لحساب القوة النهائية

        const totalForce = engineForce
            .add(archimedesForce)
            .add(strengthOfOceanCurrents)
            .subtract(weightForce)
            .subtract(resistanceForce);

        // حساب التسارع
        this._linearAccelerate = totalForce.divide(mass);
        return this._linearAccelerate;
    }
    //السرعة اللحظية
    NextVelocity(deltaTime) {
        const nextVelocity = this._linearVelocity.add(this._linearAccelerate.multiply(deltaTime));
        this._linearVelocity = nextVelocity;
        return nextVelocity;
    }
    //الموقع الحالي
    NextLocation(deltaTime) {
        const nextLocation = this._location.add(this._linearVelocity.multiply(deltaTime));
        this._location = nextLocation;
        return nextLocation;
    }
    // استدعاء توابع الحركة الانسحابية 
    LinearMotionInMoment(deltaTime) {
        this.CurrentLinearAccelerate();
        this.NextVelocity(deltaTime);
        this.NextLocation(deltaTime);
    }







    // حساب التسارع الزاوي العمودي الحالي
    CurrentVerticalAngularAccelerate() {
        // حساب القوى على الزعانف العمودية
        const frontFinsForce = Physics.CalculateResistanceForceOnVerticalPlanes(
            this._AreaOfFrontPlanes,
            this._linearVelocity.x,
            this._angle_Horizontal_Front_Planes
        );

        const backFinsForce = Physics.CalculateResistanceForceOnVerticalPlanes(
            this._AreaOfBackPlanes,
            this._linearVelocity.x,
            this._angle_Horizontal_Back_Planes
        );

        // حساب العزوم الناتجة عن هذه القوى
        const frontTorque = frontFinsForce.y * this._distance_Horizontal_Front_Planes_Center;
        const backTorque = backFinsForce.y * this._distance_Horizontal_Back_Planes_Center;

        // العزم الصافي
        const netTorque = frontTorque + backTorque;

        // حساب عزم اللحظة للدوران حول المحور(الافقي)
        const momentOfInertiaMatrix = Physics.CalculateMomentOfInertiaOfCylinder(this._netMass, this._radius, this._height);
        const momentOfInertiaZ = momentOfInertiaMatrix[2][2];

        // حساب التسارع الزاوي
        this._verticalAngularAccelerate = netTorque / momentOfInertiaZ;

        return this._verticalAngularAccelerate;
    }
    // حساب السرعة الزاوية العمودية
    NextVerticalAngularVelocity(deltaTime) {
        // التسارع الزاوي العمودي الحالي
        const currentVerticalAngularAccelerate = this._verticalAngularAccelerate;

        // السرعة الزاوية العمودية في اللحظة الحالية
        const nextVerticalAngularVelocity = this._verticalAngularVelocity + currentVerticalAngularAccelerate * deltaTime;

        // تحديث السرعة الزاوية العمودية
        this._verticalAngularVelocity = nextVerticalAngularVelocity;

        return this._verticalAngularVelocity;
    }
    // حساب الزاوية الشاقولية
    NextVerticalAngle(deltaTime) {
        //الزاوية العمودية الحالية
        const currentVerticalAngularVelocity = this._verticalAngularVelocity;

        // الزاوية الشاقولية في اللحظة الحالية
        const nextVerticalAngle = this._verticalAngle + currentVerticalAngularVelocity * deltaTime;

        // تحديث الزاوية الشاقولية
        this._verticalAngle = nextVerticalAngle;

        return this._verticalAngle;
    }
    //حساب الحركة الدورانية الشاقولية في اللحظة الحالية 
    // استدعاء توابع الحركة الدورانية الشاقولية
    VerticalAngularMotionInMoment(deltaTime) {
        this.CurrentVerticalAngularAccelerate();
        this.NextVerticalAngularVelocity(deltaTime);
        this.NextVerticalAngle(deltaTime);
    }



    //حساب التسارع الزاوي الأفقي الحالي
    CurrentHorizontalAngularAccelerate() {
        // حساب القوى على الزعانف الأفقية
        const frontFinsForce = Physics.CalculateResistanceForceOnHorizontalPlanes(
            this._AreaOfFrontPlanes,
            this._linearVelocity.x,
            this._angle_Horizontal_Front_Planes
        );

        const backFinsForce = Physics.CalculateResistanceForceOnHorizontalPlanes(
            this._AreaOfBackPlanes,
            this._linearVelocity.x,
            this._angle_Horizontal_Back_Planes
        );

        // حساب العزوم الناتجة عن هذه القوى
        const frontTorque = frontFinsForce.y * this._distance_Horizontal_Front_Planes_Center;
        const backTorque = backFinsForce.y * this._distance_Horizontal_Back_Planes_Center;

        // العزم الصافي
        const netTorque = frontTorque + backTorque;

        // حساب عزم اللحظة للدوران حول المحور(العامودي)
        const momentOfInertiaMatrix = Physics.CalculateMomentOfInertiaOfCylinder(this._netMass, this._radius, this._height);
        const momentOfInertiaY = momentOfInertiaMatrix[1][1];

        // حساب التسارع الزاوي
        this._horizontalAngularAccelerate = netTorque / momentOfInertiaY;

        return this._horizontalAngularAccelerate;
    }
    // حساب السرعة الزاوية الأفقية التالية
    NextHorizontalAngularVelocity(deltaTime) {
        // التسارع الزاوي الأفقي الحالي
        const currentHorizontalAngularAccelerate = this._horizontalAngularAccelerate;

        // السرعة الزاوية الأفقية الحالية
        const nextHorizontalAngularVelocity = this._horizontalAngularVelocity + currentHorizontalAngularAccelerate * deltaTime;

        // تحديث السرعة الزاوية الأفقية
        this._horizontalAngularVelocity = nextHorizontalAngularVelocity;

        return this._horizontalAngularVelocity;
    }
    //حساب الزاوية الأفقية الحالية
    NextHorizontalAngle(deltaTime) {
        // السرعة الزاوية الأفقية الحالية
        const currentHorizontalAngularVelocity = this._horizontalAngularVelocity;

        // الزاوية الأفقية الحالية
        const nextHorizontalAngle = this._horizontalAngle + currentHorizontalAngularVelocity * deltaTime;

        // تحديث الزاوية الأفقية
        this._horizontalAngle = nextHorizontalAngle;

        return this._horizontalAngle;
    }
    // دالة لتنفيذ الحركة الدورانية الأفقية في اللحظة الحالية
    // استدعاء التوابع السابقة للحركة الدورانية الأفقية
    HorizontalAngularMotionInMoment(deltaTime) {
        this.CurrentHorizontalAngularAccelerate();
        this.NextHorizontalAngularVelocity(deltaTime);
        this.NextHorizontalAngle(deltaTime);
    }





    powerOn() {
        this._enginePossibility = 20
    }
    powerOff() {
        this._enginePossibility = 0.0
    }



    increaseWaterVolume(volume = 10) {
        this._linearVelocity = new Vector(0, -0.1, 0);
        if (this._volumeOfWaterInTanks < this._tanksCapacity) {
            this.isIncreaseWaterActive = true;
            this.isDecreaseWaterActive = false;
            this._volumeOfWaterInTanks += volume;
            if (this._volumeOfWaterInTanks > this._tanksCapacity) {
                this._volumeOfWaterInTanks = this._tanksCapacity;
            }
        }
        else {
            this.isIncreaseWaterActive = false;
        }
        this.printWaterVolume();
    }

    decreaseWaterVolume(volume = 1) {
        this._linearVelocity = new Vector(0, 0.1, 0);
        if (this._volumeOfWaterInTanks > 0) {
            this.isIncreaseWaterActive = false;
            this.isDecreaseWaterActive = true;
            this._volumeOfWaterInTanks -= volume;
            if (this._volumeOfWaterInTanks < 0) {
                this._volumeOfWaterInTanks = 0;
            }
        }
        else {
            this.isDecreaseWaterActive = false;
        }
        this.printWaterVolume('water volume:' + this._volumeOfWaterInTanks);
    }


    printWaterVolume() {
        console.log(this._volumeOfWaterInTanks);
    }
}
export default SubmarinePhysics
