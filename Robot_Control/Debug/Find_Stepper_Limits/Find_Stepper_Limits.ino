// Check min and max values for each joint / cartesian motion

#include <AccelStepper.h>
#include <Servo.h>
#include <math.h>

#define limitSwitch1 9
#define limitSwitch2 10
#define limitSwitch3 11
#define limitSwitchZ A3

AccelStepper stepper1(1, 2, 5);
AccelStepper stepper2(1, 3, 6);
AccelStepper stepper3(1, 4, 7);
AccelStepper stepperZ(1, 12, 13);

int stepperPosition1;
int stepperPosition2;
int stepperPosition3;
int stepperPositionZ;

int maxDistance1;
int maxDistance2;
int maxDistance3;
int maxDistanceZ;

void setup() {
  Serial.begin(115200);

  pinMode(limitSwitch1, INPUT_PULLUP);
  pinMode(limitSwitch2, INPUT_PULLUP);
  pinMode(limitSwitch3, INPUT_PULLUP);
  pinMode(limitSwitchZ, INPUT_PULLUP);

  // Invert Pins for Correct Direction
  stepper1.setPinsInverted(true, false, false);
  stepper2.setPinsInverted(true, false, false);

  // Stepper Motors Max Speed
  stepper1.setMaxSpeed(50);
  stepper1.setAcceleration(500);
  stepper2.setMaxSpeed(50);
  stepper2.setAcceleration(500);
  stepper3.setMaxSpeed(50);
  stepper3.setAcceleration(500);
  stepperZ.setMaxSpeed(100);
  stepperZ.setAcceleration(500);

  getLimits();
}

void loop() {
  // put your main code here, to run repeatedly:

}

void getLimits() {
  delay(10000);
  // homeZ();
  // homeStepper3();
  // homeStepper2();
  homeStepper1();
}

void homeZ() {
  stepperZ.setCurrentPosition(0);
  stepperZ.setSpeed(50);

  while (!digitalRead(limitSwitchZ)) {
    stepperZ.runSpeed();
  }

  maxDistanceZ = stepperZ.currentPosition();
  Serial.print("Max Z Distance: ");
  Serial.println(maxDistanceZ);

  // Optional
  stepperZ.setCurrentPosition(maxDistanceZ);

  stepperPositionZ = 3000;
  stepperZ.moveTo(stepperPositionZ);

  while (stepperZ.currentPosition() != stepperPositionZ) {
    stepperZ.run();
  }

  Serial.print("Safe Position Reached: ");
  Serial.println(stepperZ.currentPosition());
}

void homeStepper3() {
  stepper3.setCurrentPosition(0);
  stepper3.setSpeed(-50);

  while (!digitalRead(limitSwitch3)) {
    stepper3.runSpeed();
  }

  maxDistance3 = stepper3.currentPosition() / 2;
  Serial.print("Max Joint 3 Distance: ");
  Serial.println(maxDistance3);

  delay(20);

  // Optional
  stepper3.setCurrentPosition(maxDistance3);

  stepperPosition3 = 0;
  stepper3.moveTo(stepperPosition3);

  while (stepper3.currentPosition() != stepperPosition3) {
    stepper3.run();
  }

  Serial.print("Safe Position Reached: ");
  Serial.println(stepper3.currentPosition());
}

void homeStepper2() {
  stepper2.setCurrentPosition(0);
  stepper2.setSpeed(-50);

  while (!digitalRead(limitSwitch2)) {
    stepper2.runSpeed();
  }

  maxDistance2 = stepper2.currentPosition() / 2;
  Serial.print("Max Joint 2 Distance: ");
  Serial.println(maxDistance2);

  delay(20);

  // Optional
  stepper2.setCurrentPosition(maxDistance2);

  stepperPosition2 = 0;
  stepper2.moveTo(stepperPosition2);

  while (stepper2.currentPosition() != stepperPosition2) {
    stepper2.run();
  }

  Serial.print("Safe Position Reached: ");
  Serial.println(stepper2.currentPosition());
}

void homeStepper1() {
  stepper1.setCurrentPosition(0);
  stepper1.setSpeed(-50);

  while (!digitalRead(limitSwitch1)) {
    stepper1.runSpeed();
  }

  maxDistance1 = stepper1.currentPosition() / 2;
  Serial.print("Max Joint 1 Distance: ");
  Serial.println(maxDistance1);

  delay(20);

  // Optional
  stepper1.setCurrentPosition(maxDistance1);

  stepperPosition1 = 0;
  stepper1.moveTo(stepperPosition1);

  while (stepper1.currentPosition() != stepperPosition1) {
    stepper1.run();
  }

  Serial.print("Safe Position Reached: ");
  Serial.println(stepper1.currentPosition());
}

