/*
 * Project Name: SCARA Robot Controller
 * File: Motor_Control.ino
 * Description: This program controls the movement of a SCARA robot.
 *              It includes functionality to program multiple coordinates
 *              for iterative motion.
 * Author: Keeshigan Pirabaharan
 * Date: 2024-31-12
 * Version: 0.1
 * 
 * Dependencies:
 * - AccelStepper Library: https://www.airspayce.com/mikem/arduino/AccelStepper/ 
 * - Servo Library: https://www.arduino.cc/reference/en/libraries/servo/
 * - Math Library: https://www.arduino.cc/reference/en/language/functions/math/
 * 
 * Notes:
 * - This code is written for Arduino Uno.
 * - Ensure that stepper motors, limit switches and servo is properly configured.
 * 
 * License: MIT License
 */

// Libraries
#include <AccelStepper.h>
#include <Servo.h>
#include <math.h>

// Limit Switches
#define LIMIT_SWITCH1 9
#define LIMIT_SWITCH2 10
#define LIMIT_SWITCH3 11
#define LIMIT_SWITCHZ A3

// Define Stepper Pins
#define STEPPER1_STEP_PIN 2
#define STEPPER1_DIR_PIN 5
#define STEPPER2_STEP_PIN 3
#define STEPPER2_DIR_PIN 6
#define STEPPER3_STEP_PIN 4
#define STEPPER3_DIR_PIN 7
#define STEPPERZ_STEP_PIN 12
#define STEPPERZ_DIR_PIN 13

// Stepper Motors
AccelStepper stepper1(1, STEPPER1_STEP_PIN, STEPPER1_DIR_PIN); 
AccelStepper stepper2(1, STEPPER2_STEP_PIN, STEPPER2_DIR_PIN);
AccelStepper stepper3(1, STEPPER3_STEP_PIN, STEPPER3_DIR_PIN);
AccelStepper stepperZ(1, STEPPERZ_STEP_PIN, STEPPERZ_DIR_PIN);

// Servo Motor
#define SERVO_PIN A0
#define SERVO_MIN 600
#define SERVO_MAX 2500
Servo gripper; 

// Limits and Homing
#define MIN_STEPPER1 -888
#define MAX_STEPPER1 2626
#define HOME_STEPPER1 0
#define MIN_STEPPER2 -1262
#define MAX_STEPPER2 1262
#define HOME_STEPPER2 0
#define MIN_STEPPER3 -416
#define MAX_STEPPER3 416
#define HOME_STEPPER3 0
#define MIN_STEPPERZ 0
#define MAX_STEPPERZ 6156
#define HOME_STEPPERZ 4104

// Speeds
#define Z_HOMING_SPEED 100
#define ROTATIONAL_HOMING_SPEED -50
#define Z_MAX_SPEED 200
#define ROTATIONAL_MAX_SPEED 100
#define Z_ACCELERATION 25
#define ROTATIONAL_ACCELERATION 25

// Angle to Steps Conversion
#define THETA1_ANGLE_TO_STEPS 9.8707865169
#define THETA2_ANGLE_TO_STEPS 8.4133333333
#define PHI_ANGLE_TO_STEPS 2.5679012346
#define Z_DISTANCE_TO_STEPS 41.04

// BAUD Rate
#define BAUD_RATE 115200

String command = "";

int stepper1Position, stepper2Position, stepper3Position, stepperZPosition;

// States
bool is_homing = false;
int homing_state = 0;
bool is_moving = false;
int moving_state = 0;

void setup() {
  Serial.begin(BAUD_RATE);

  // Limit Switches
  pinMode(LIMIT_SWITCH1, INPUT_PULLUP);
  pinMode(LIMIT_SWITCH2, INPUT_PULLUP);
  pinMode(LIMIT_SWITCH3, INPUT_PULLUP);
  pinMode(LIMIT_SWITCHZ, INPUT_PULLUP);

  // Invert Stepper Motor Direction
  stepper1.setPinsInverted(true, false, false);
  stepper2.setPinsInverted(true, false, false);

  // Stepper Motor Max Speed and Acceleration
  stepper1.setMaxSpeed(ROTATIONAL_MAX_SPEED);
  stepper1.setAcceleration(ROTATIONAL_ACCELERATION);
  stepper2.setMaxSpeed(ROTATIONAL_MAX_SPEED);
  stepper2.setAcceleration(ROTATIONAL_ACCELERATION);
  stepper3.setMaxSpeed(ROTATIONAL_MAX_SPEED);
  stepper3.setAcceleration(ROTATIONAL_ACCELERATION);
  stepperZ.setMaxSpeed(Z_MAX_SPEED);
  stepperZ.setAcceleration(Z_ACCELERATION);

  // Set Current Positions as Home
  stepper1.setCurrentPosition(HOME_STEPPER1);
  stepper2.setCurrentPosition(HOME_STEPPER2);
  stepper3.setCurrentPosition(HOME_STEPPER3);
  stepperZ.setCurrentPosition(HOME_STEPPERZ);

  // Servo Motor
  gripper.attach(SERVO_PIN, SERVO_MIN, SERVO_MAX);
  gripper.write(SERVO_MAX);

  delay(1000);

  // Wait for Serial
  while (!Serial) {
  }
}

void loop() {
  if (Serial.available()) {
    // Read Serial Data
    command = Serial.readStringUntil('\n');

    // Parse Command
    // Home
    if (command == "home") {
      is_homing = true;
    }

    // Move ex. "move j1 j2 j3 jz" 
    if (command.startsWith("move")) {
      String data = command.substring(5);
      int values[4];
      int i = 0;
      while (data.length() > 0) {
        int index = data.indexOf(" ");
        if (index == -1) {
          values[i] = data.toInt();
          break;
        }
        values[i] = data.substring(0, index).toInt();
        data = data.substring(index + 1);
        i++;
      }

      stepper1Position = values[0];
      stepper2Position = values[1];
      stepper3Position = values[2];
      stepperZPosition = values[3];

      // Set Stepper Positions
      Serial.println("set_step success");
      setMovePosition();
    }

    // Request for current step positions
    if (command == "report_current_step") {
      reportStepperPositions("current_step", stepper1.currentPosition(), stepper2.currentPosition(), stepper3.currentPosition(), stepperZ.currentPosition());
    }
  }

  if (is_homing) {
    home();
  }

  if (is_moving) {
    move();
  }
}


void home() {
  if (homing_state == 0) { 
    stepperZ.setSpeed(Z_HOMING_SPEED);
    stepper3.setSpeed(ROTATIONAL_HOMING_SPEED);
    stepper2.setSpeed(ROTATIONAL_HOMING_SPEED);
    stepper1.setSpeed(ROTATIONAL_HOMING_SPEED);
    homing_state = 1;
  }

  if (digitalRead(LIMIT_SWITCHZ) != 1 && homing_state == 1) {
    stepperZ.runSpeed();
  }

  if (digitalRead(LIMIT_SWITCHZ) == 1 && homing_state == 1) {
    stepperZ.setCurrentPosition(MAX_STEPPERZ);
    stepperZ.moveTo(HOME_STEPPERZ);
    homing_state = 2;
  }

  if (stepperZ.currentPosition() != HOME_STEPPERZ && homing_state == 2) {
    stepperZ.run();
  }

  if (stepperZ.currentPosition() == HOME_STEPPERZ && homing_state == 2) {
    homing_state = 3;
  }

  if (digitalRead(LIMIT_SWITCH3) != 1 && homing_state == 3) {
    stepper3.runSpeed();
  }

  if (digitalRead(LIMIT_SWITCH3) == 1 && homing_state == 3) {
    stepper3.setCurrentPosition(MIN_STEPPER3);
    stepper3.moveTo(HOME_STEPPER3);
    homing_state = 4;
  }

  if (stepper3.currentPosition() != HOME_STEPPER3 && homing_state == 4) {
    stepper3.run();
  }

  if (stepper3.currentPosition() == HOME_STEPPER3 && homing_state == 4) {
    homing_state = 5;
  }

  if (digitalRead(LIMIT_SWITCH2) != 1 && homing_state == 5) {
    stepper2.runSpeed();
  }

  if (digitalRead(LIMIT_SWITCH2) == 1 && homing_state == 5) {
    stepper2.setCurrentPosition(MIN_STEPPER2);
    stepper2.moveTo(HOME_STEPPER2);
    homing_state = 6;
  }

  if (stepper2.currentPosition() != HOME_STEPPER2 && homing_state == 6) {
    stepper2.run();
  }

  if (stepper2.currentPosition() == HOME_STEPPER2 && homing_state == 6) {
    homing_state = 7;
  }

  if (digitalRead(LIMIT_SWITCH1) != 1 && homing_state == 7) {
    stepper1.runSpeed();
  }

  if (digitalRead(LIMIT_SWITCH1) == 1 && homing_state == 7) {
    stepper1.setCurrentPosition(MIN_STEPPER1);
    stepper1.moveTo(HOME_STEPPER1);
    homing_state = 8;
  }

  if (stepper1.currentPosition() != HOME_STEPPER1 && homing_state == 8) {
    stepper1.run();
  }

  if (stepper1.currentPosition() == HOME_STEPPER1 && homing_state == 8) {
    homing_state = 0;
    stepper1Position = stepper1.currentPosition();
    stepper2Position = stepper2.currentPosition();
    stepper3Position = stepper3.currentPosition();
    stepperZPosition = stepperZ.currentPosition();
    is_homing = false;
  }
}

void reportStepperPositions(String cmd, int j1, int j2, int j3, int jz) {
  char buffer[50];
  sprintf(buffer, "%s %d %d %d %d", cmd.c_str(), j1, j2, j3, jz);
  Serial.println(buffer);
}

void setMovePosition() {
  stepper1.moveTo(stepper1Position);
  stepper2.moveTo(stepper2Position);
  stepper3.moveTo(stepper3Position);
  stepperZ.moveTo(stepperZPosition);
  is_moving = true;
  moving_state = 1;
}

void move() {
  if (stepperZ.currentPosition() != stepperZPosition && moving_state == 1) {
    stepperZ.run();
  }

  if (stepperZ.currentPosition() == stepperZPosition && moving_state == 1) {
    moving_state = 2;
  }

  if (stepper1.currentPosition() != stepper1Position && moving_state == 2) {
    stepper1.run();
  }

  if (stepper2.currentPosition() != stepper2Position && moving_state == 2) {
    stepper2.run();
  }

  if (stepper3.currentPosition() != stepper3Position && moving_state == 2) {
    stepper3.run();
  }

  if (stepper1.currentPosition() == stepper1Position && stepper2.currentPosition() == stepper2Position && stepper3.currentPosition() == stepper3Position && stepperZ.currentPosition() == stepperZPosition && moving_state == 2) {
    moving_state = 0;
    is_moving = false;
  }
}
