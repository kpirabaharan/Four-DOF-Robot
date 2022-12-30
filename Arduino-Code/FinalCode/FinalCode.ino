// Final Code for 3D Printed 4 DOF Robot

#include <math.h>

#include <AccelStepper.h>

#define limitSwitch1 9
#define limitSwitch2 10
#define limitSwitch3 11
#define limitSwitchZ A3

AccelStepper stepper1(1, 2, 5);
AccelStepper stepper2(1, 3, 6);
AccelStepper stepper3(1, 4, 7);
AccelStepper stepperZ(1, 12, 13);

double l1 = 228;
double l2 = 136.5;

double xPos = 0;
double yPos = 0;

double theta1 = 0;
double theta2 = 0;

long initial_homing = 1;
int move_finished = 1;
long maxDistance_Z = 4000;
long maxDistance_S1 = 100;
long maxDistance_S2 = 100;
// long TravelZ;

void setup()
{
  Serial.begin(9600);

  // Setup limit switches with pullup resistors
  pinMode(limitSwitch1, INPUT_PULLUP);
  pinMode(limitSwitch2, INPUT_PULLUP);
  pinMode(limitSwitch3, INPUT_PULLUP);
  pinMode(limitSwitchZ, INPUT_PULLUP);

  // Stepper motors max speed
  // stepper1.setMaxSpeed(100);
  // stepper1.setAcceleration(100);
  // stepper2.setMaxSpeed(100);
  // stepper2.setAcceleration(100);
  // stepper3.setMaxSpeed(100);
  // stepper3.setAcceleration(100);
  // stepperZ.setMaxSpeed(200);
  // stepperZ.setAcceleration(100);

  homing();
}

void loop()
{
  // put your main code here, to run repeatedly:
}

// Get angles, output EE x and y positions.
void forwardKinematics(double t1, double t2)
{
  // First convert angles from deg to rad
  double t1rad = t1 * PI / 180;
  double t2rad = t2 * PI / 180;

  // Calculate x and y position of EE using t1 and t2
  xPos = l1 * sin(t1rad) + l2 * sin(t1rad + t2rad);
  yPos = l1 * cos(t1rad) + l2 * cos(t1rad + t2rad);
}

// Get EE x and y positions, output angles.
void inverseKinematics(double x, double y)
{
  double t2rad = acos((sq(x) + sq(y) - sq(l1) - sq(l2)) / (2 * l1 * l2));

  if (x < 0 & y < 0)
    t2rad = (-1) * t2rad;

  double t1rad = atan(x / y) - atan((l2 * sin(t2rad)) / (l1 + l2 * cos(t2rad)));

  theta1 = t1rad * 180 / PI;
  theta2 = (-1) * t2rad * 180 / PI;
}

// Home All Stepper Motors
void homing()
{
  Serial.println("Stepper is homing...");
  // homeAxis_Z();
  // homeAxis_S1();
  homeAxis_S2();

  Serial.println("Homing Completed!");

  Serial.println(stepperZ.currentPosition());
}

// Home The Z Axis Stepper Motor
void homeAxis_Z()
{
  stepperZ.setMaxSpeed(50);
  stepperZ.setAcceleration(10);
  initial_homing = 1;

  while (!digitalRead(limitSwitchZ))
  {
    stepperZ.moveTo(initial_homing);
    initial_homing++;
    stepperZ.run();
    delay(5);
  }

  stepperZ.setCurrentPosition(maxDistance_Z);
  stepperZ.setMaxSpeed(500);
  stepperZ.setAcceleration(50);
  initial_homing = maxDistance_Z - 1;

  while (digitalRead(limitSwitchZ))
  {
    stepperZ.moveTo(initial_homing);
    stepperZ.run();
    initial_homing--;
    delay(5);
  }

  stepperZ.setCurrentPosition(maxDistance_Z);
  Serial.println("Z Homing Completed.");
}

// Home The S1 Stepper Motor
void homeAxis_S1()
{
  stepper1.setMaxSpeed(50);
  stepper1.setAcceleration(10);
  initial_homing = 1;

  while (!digitalRead(limitSwitch1))
  {
    stepper1.moveTo(initial_homing);
    initial_homing++;
    stepper1.run();
    delay(5);
  }

  stepper1.setCurrentPosition(maxDistance_S1);
  stepper1.setMaxSpeed(500);
  stepper1.setAcceleration(50);
  initial_homing = maxDistance_S1 - 1;

  while (digitalRead(limitSwitch1))
  {
    stepper1.moveTo(initial_homing);
    stepper1.run();
    initial_homing--;
    delay(5);
  }

  stepper1.setCurrentPosition(maxDistance_S1);
  Serial.println("S1 Homing Completed.");
}

// Home The S2 Stepper Motor
void homeAxis_S2()
{
  stepper2.setMaxSpeed(50);
  stepper2.setAcceleration(10);
  initial_homing = 1;

  while (!digitalRead(limitSwitch2))
  {
    stepper2.moveTo(initial_homing);
    initial_homing++;
    stepper2.run();
    delay(5);
  }

  stepper2.setCurrentPosition(maxDistance_S2);
  stepper2.setMaxSpeed(500);
  stepper2.setAcceleration(50);
  initial_homing = maxDistance_S2 - 1;

  while (digitalRead(limitSwitch2))
  {
    stepper2.moveTo(initial_homing);
    stepper2.run();
    initial_homing--;
    delay(5);
  }

  stepper2.setCurrentPosition(maxDistance_S2);
  Serial.println("S2 Homing Completed.");
}