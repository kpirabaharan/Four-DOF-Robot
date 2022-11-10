#include <AccelStepper.h>

void setup() {
  // put your setup code here, to run once:

}

void loop() {
  // put your main code here, to run repeatedly:

}

void forwardKinematics(t1, t2){
  // First convert angles from deg to rad
  float t1rad = t1 * PI / 180;
  float t2rad = t2 * PI / 180;

  // Calculate x and y position of EE using t1 and t2
  xPos = L1 * sin(t1rad) + L2 * sin(t1rad + t2rad);
  yPos = L1 * cos(t1rad) + L2 * cos(t1rad + t2rad);
}