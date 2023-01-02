#include <AccelStepper.h>
// TODO: After a value is set it goes to that value then immediately goes to zero... WHY?

#define limitSwitch1 9
#define limitSwitch2 10
#define limitSwitch3 11
#define limitSwitchZ A3

AccelStepper stepper1(1, 2, 5);
AccelStepper stepper2(1, 3, 6);
AccelStepper stepper3(1, 4, 7);
AccelStepper stepperZ(1, 12, 13);

long initial_homing = 1;
int move_finished = 1;
long maxDistance_Z = 4000;
long TravelZ;

void setup()
{
  Serial.begin(9600);

  pinMode(limitSwitch1, INPUT_PULLUP);
  pinMode(limitSwitch2, INPUT_PULLUP);
  pinMode(limitSwitch3, INPUT_PULLUP);
  pinMode(limitSwitchZ, INPUT_PULLUP);

  // Stepper motors max speed
  stepper1.setMaxSpeed(100);
  stepper1.setAcceleration(100);
  stepper2.setMaxSpeed(100);
  stepper2.setAcceleration(100);
  stepper3.setMaxSpeed(100);
  stepper3.setAcceleration(100);
  stepperZ.setMaxSpeed(50);
  stepperZ.setAcceleration(10);

  // Serial.println("Stepper is homing...");

  // while (!digitalRead(limitSwitchZ))
  // {
  //   stepperZ.moveTo(initial_homing);
  //   stepperZ.run();
  //   initial_homing++;
  //   delay(5);
  // }

  // stepperZ.setCurrentPosition(maxDistance_Z);
  // stepperZ.setMaxSpeed(100);
  // stepperZ.setAcceleration(100);
  // initial_homing = maxDistance_Z - 1;

  // while (digitalRead(limitSwitchZ))
  // {
  //   stepperZ.moveTo(initial_homing);
  //   stepperZ.run();
  //   initial_homing--;
  //   delay(5);
  // }

  // stepperZ.setCurrentPosition(maxDistance_Z);
  // Serial.println("Homing Completed!");
  // stepperZ.setMaxSpeed(500);
  // stepperZ.setAcceleration(50);

  // Serial.print("Current Position: ");
  // Serial.println(stepperZ.currentPosition());
  // Serial.println("Enter travel distance: ");
}

void loop()
{
  if (Serial.available() > 0)
  {
    Serial.println("Check!");
  }

  // while (Serial.available() > 0 && move_finished == 1)
  // {

  //   TravelZ = Serial.parseInt();
  //   if (TravelZ < 0 || TravelZ > maxDistance_Z)
  //   {
  //     Serial.println("");
  //     Serial.println("Please enter a value greater than zero and smaller or equal to 4000.");
  //     Serial.println("");
  //   }
  //   else
  //   {
  //     Serial.print("Moving stepper to position: ");
  //     Serial.println(TravelZ);
  //     stepperZ.moveTo(TravelZ);
  //     move_finished = 0;

  //     delay(10000);
  //   }
  // }

  // if (TravelZ >=0 && TravelZ <= maxDistance_Z) {
  //   if ((stepperZ.distanceToGo() != 0)) {
  //     stepperZ.run();
  //   }

  //   if ((move_finished == 0) && (stepperZ.distanceToGo() == 0)){
  //     Serial.println("Completed!");
  //     Serial.println("");
  //     Serial.print("Current Position: ");
  //     Serial.println(stepperZ.currentPosition());
  //     Serial.println("Enter travel distance: ");
  //     move_finished = 1;
  // }
  // }
}
