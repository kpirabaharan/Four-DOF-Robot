/*
   Arduino based SCARA Robot 
   by Dejan, www.HowToMechatronics.com
   AccelStepper: http://www.airspayce.com/mikem/arduino/AccelStepper/index.html

*/
#include <AccelStepper.h>
#include <Servo.h>
#include <math.h>

#define limitSwitch1 9
#define limitSwitch2 10
#define limitSwitch3 11
#define limitSwitchZ A3

// Define the stepper motors and the pins the will use
AccelStepper stepper1(1, 2, 5); // (Type:driver, STEP, DIR)
AccelStepper stepper2(1, 3, 6);
AccelStepper stepper3(1, 4, 7);
AccelStepper stepperZ(1, 12, 13);

Servo gripperServo;  // create servo object to control a servo

double x = 10.0;
double y = 10.0;
double L1 = 228; // L1 = 228mm
double L2 = 136.5; // L2 = 136.5mm
double theta1, theta2, phi, z;

int stepper1Position, stepper2Position, stepper3Position, stepperZPosition;

// Limits and Homing
long minStepper1 = -888;
long maxStepper1 = 2626;
long homeStepper1 = 0;
long minStepper2 = -1262;
long maxStepper2 = 1262;
long homeStepper2 = 0;
long minStepper3 = -416;
long maxStepper3 = 416;
long homeStepper3 = 0;
long minStepperZ = 0;
long maxStepperZ = 6156;
long homeStepperZ = 4104;

const float theta1AngleToSteps = 9.8707865169;
const float theta2AngleToSteps = 8.4133333333;
const float phiAngleToSteps = 2.5679012346;
const float zDistanceToSteps = 41.04;

byte inputValue[5];
int k = 0;

String content = "";
int data[10];

int theta1Array[100];
int theta2Array[100];
int phiArray[100];
int zArray[100];
int gripperArray[100];
int positionsCounter = 0;

void setup() {
  Serial.begin(115200);

  pinMode(limitSwitch1, INPUT_PULLUP);
  pinMode(limitSwitch2, INPUT_PULLUP);
  pinMode(limitSwitch3, INPUT_PULLUP);
  pinMode(limitSwitchZ, INPUT_PULLUP);

  // Invert Pins
  stepper1.setPinsInverted(true, false, false);
  stepper2.setPinsInverted(true, false, false);

  // Stepper motors max speed
  stepper1.setMaxSpeed(100);
  stepper1.setAcceleration(25);
  stepper2.setMaxSpeed(100);
  stepper2.setAcceleration(25);
  stepper3.setMaxSpeed(100);
  stepper3.setAcceleration(25);
  stepperZ.setMaxSpeed(200);
  stepperZ.setAcceleration(25);

  gripperServo.attach(A0, 600, 2500);
  // initial servo value - open gripper
  data[6] = 180;
  gripperServo.write(data[6]);
  delay(1000);
  data[5] = 0;
  delay(5000);
  homing();
  delay(10000);
}

void loop() {

  if (Serial.available()) {
    content = Serial.readString(); // Read the incomding data from Processing
    // Extract the data from the string and put into separate integer variables (data[] array)
    for (int i = 0; i < 10; i++) {
      int index = content.indexOf(","); // locate the first ","
      data[i] = atol(content.substring(0, index).c_str()); //Extract the number from start to the ","
      content = content.substring(index + 1); //Remove the number from the string
    }
    /*
     data[0] - SAVE button status
     data[1] - RUN button status
     data[2] - Joint 1 angle
     data[3] - Joint 2 angle
     data[4] - Joint 3 angle
     data[5] - Z position
     data[6] - Gripper value
     data[7] - Speed value
     data[8] - Acceleration value
    */

    // If SAVE button is pressed, store the data into the appropriate arrays
    if (data[0] == 1) {
      theta1Array[positionsCounter] = data[2] * theta1AngleToSteps; //store the values in steps = angles * angleToSteps variable
      theta2Array[positionsCounter] = data[3] * theta2AngleToSteps;
      phiArray[positionsCounter] = data[4] * phiAngleToSteps;
      zArray[positionsCounter] = data[5] * zDistanceToSteps;
      gripperArray[positionsCounter] = data[6];
      positionsCounter++;
    }
    // clear data
    if (data[0] == 2) {
      // Clear the array data to 0
      memset(theta1Array, 0, sizeof(theta1Array));
      memset(theta2Array, 0, sizeof(theta2Array));
      memset(phiArray, 0, sizeof(phiArray));
      memset(zArray, 0, sizeof(zArray));
      memset(gripperArray, 0, sizeof(gripperArray));
      positionsCounter = 0;
    }
  }
  // If RUN button is pressed
  while (data[1] == 1) {
    Serial.println("Run Pressed");
    // stepper1.setSpeed(data[7]);
    // stepper2.setSpeed(data[7]);
    // stepper3.setSpeed(data[7]);
    // stepperZ.setSpeed(data[7]);
    // stepper1.setAcceleration(data[8]);
    // stepper2.setAcceleration(data[8]);
    // stepper3.setAcceleration(data[8]);
    // stepperZ.setAcceleration(data[8]);

    // execute the stored steps
    for (int i = 0; i <= positionsCounter - 1; i++) {
      if (data[1] == 0) {
        break;
      }
      stepper1.moveTo(theta1Array[i]);
      stepper2.moveTo(theta2Array[i]);
      stepper3.moveTo(phiArray[i]);
      stepperZ.moveTo(zArray[i]);
      while (stepper1.currentPosition() != theta1Array[i] || stepper2.currentPosition() != theta2Array[i] || stepper3.currentPosition() != phiArray[i] || stepperZ.currentPosition() != zArray[i]) {
        stepper1.run();
        stepper2.run();
        stepper3.run();
        stepperZ.run();
      }
      if (i == 0) {
        gripperServo.write(gripperArray[i]);
      }
      else if (gripperArray[i] != gripperArray[i - 1]) {
        gripperServo.write(gripperArray[i]);
        delay(800); // wait 0.8s for the servo to grab or drop - the servo is slow
      }

      //check for change in speed and acceleration or program stop
      if (Serial.available()) {
        content = Serial.readString(); // Read the incomding data from Processing
        // Extract the data from the string and put into separate integer variables (data[] array)
        for (int i = 0; i < 10; i++) {
          int index = content.indexOf(","); // locate the first ","
          data[i] = atol(content.substring(0, index).c_str()); //Extract the number from start to the ","
          content = content.substring(index + 1); //Remove the number from the string
        }

        if (data[1] == 0) {
          break;
        }
        // change speed and acceleration while running the program
        // stepper1.setSpeed(data[7]);
        // stepper2.setSpeed(data[7]);
        // stepper3.setSpeed(data[7]);
        // stepperZ.setSpeed(data[7]);
        // stepper1.setAcceleration(data[8]);
        // stepper2.setAcceleration(data[8]);
        // stepper3.setAcceleration(data[8]);
        // stepperZ.setAcceleration(data[8]);
      }
    }
    /*
      // execute the stored steps in reverse
      for (int i = positionsCounter - 2; i >= 0; i--) {
      if (data[1] == 0) {
        break;
      }
      stepper1.moveTo(theta1Array[i]);
      stepper2.moveTo(theta2Array[i]);
      stepper3.moveTo(phiArray[i]);
      stepperZ.moveTo(zArray[i]);
      while (stepper1.currentPosition() != theta1Array[i] || stepper2.currentPosition() != theta2Array[i] || stepper3.currentPosition() != phiArray[i] || stepperZ.currentPosition() != zArray[i]) {
        stepper1.run();
        stepper2.run();
        stepper3.run();
        stepperZ.run();
      }
      gripperServo.write(gripperArray[i]);

      if (Serial.available()) {
        content = Serial.readString(); // Read the incomding data from Processing
        // Extract the data from the string and put into separate integer variables (data[] array)
        for (int i = 0; i < 10; i++) {
          int index = content.indexOf(","); // locate the first ","
          data[i] = atol(content.substring(0, index).c_str()); //Extract the number from start to the ","
          content = content.substring(index + 1); //Remove the number from the string
        }
        if (data[1] == 0) {
          break;
        }
      }
      }
    */
  }

  // Print Values
  // Serial.print("Joint 1: ");
  // Serial.println(data[2]);
  // Serial.print("Joint 2: ");
  // Serial.println(data[3]);
  // Serial.print("Joint 3: ");
  // Serial.println(data[4]);
  // Serial.print("Joint Z: ");
  // Serial.println(data[5]);

  stepper1Position = data[2] * theta1AngleToSteps;
  stepper2Position = data[3] * theta2AngleToSteps;
  stepper3Position = data[4] * phiAngleToSteps;
  stepperZPosition = data[5] * zDistanceToSteps;

  // stepper1.setSpeed(data[7]);
  // stepper2.setSpeed(data[7]);
  // stepper3.setSpeed(data[7]);
  // stepperZ.setSpeed(data[7]);

  // stepper1.setAcceleration(data[8]);
  // stepper2.setAcceleration(data[8]);
  // stepper3.setAcceleration(data[8]);
  // stepperZ.setAcceleration(data[8]);

  stepper1.moveTo(stepper1Position);
  stepper2.moveTo(stepper2Position);
  stepper3.moveTo(stepper3Position);
  stepperZ.moveTo(stepperZPosition);

  while (stepper1.currentPosition() != stepper1Position || stepper2.currentPosition() != stepper2Position || stepper3.currentPosition() != stepper3Position || stepperZ.currentPosition() != stepperZPosition) {
    stepper1.run();
    stepper2.run();
    stepper3.run();
    stepperZ.run();
  }
  delay(100);
  gripperServo.write(data[6]);
  delay(300);
}

void serialFlush() {
  while (Serial.available() > 0) {  
    Serial.read();        
  }
}

void homing() {
  // Homing StepperZ
  stepperZ.setSpeed(100);
  while (digitalRead(limitSwitchZ) != 1) {
    stepperZ.runSpeed();
  }
  stepperZ.setCurrentPosition(maxStepperZ);
  delay(20);
  stepperZ.moveTo(homeStepperZ);
  while (stepperZ.currentPosition() != homeStepperZ) {
    stepperZ.run();
  }

  delay(1000);

  // Homing Stepper3
  stepper3.setSpeed(-50);
  while (digitalRead(limitSwitch3) != 1) {
    stepper3.runSpeed();
  }
  stepper3.setCurrentPosition(minStepper3);
  delay(20);
  stepper3.moveTo(homeStepper3);
  while (stepper3.currentPosition() != homeStepper3) {
    stepper3.run();
  }

  delay(1000);

  // Homing Stepper2
  stepper2.setSpeed(-50);
  while (digitalRead(limitSwitch2) != 1) {
    stepper2.runSpeed();
  }
  stepper2.setCurrentPosition(minStepper2);
  delay(20);
  stepper2.moveTo(homeStepper2);
  while (stepper2.currentPosition() != homeStepper2) {
    stepper2.run();
  }

  delay(1000);

  // Homing Stepper1
  stepper1.setSpeed(-50);
  while (digitalRead(limitSwitch1) != 1) {
    stepper1.runSpeed();
  }
  stepper1.setCurrentPosition(minStepper1);
  delay(20);
  stepper1.moveTo(homeStepper1);
  while (stepper1.currentPosition() != homeStepper1) {
    stepper1.run();
  }
}
