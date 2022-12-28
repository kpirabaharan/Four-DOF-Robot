// Final Code for 3D Printed 4 DOF Robot

#include <math.h>
#include <AccelStepper.h>

double l1 = 228;
double l2 = 136.5;

double xPos = 0;
double yPos = 0;

double theta1 = 0;
double theta2 = 0;

void setup()
{
  // put your setup code here, to run once:
}

void loop()
{
  // put your main code here, to run repeatedly:
}

// Get angles, output EE x and y positions.
void forwardKinematics(double t1, double t2)
{
  // First convert angles from deg to rad
  float t1rad = t1 * PI / 180;
  float t2rad = t2 * PI / 180;

  // Calculate x and y position of EE using t1 and t2
  xPos = L1 * sin(t1rad) + L2 * sin(t1rad + t2rad);
  yPos = L1 * cos(t1rad) + L2 * cos(t1rad + t2rad);
}

// Get EE x and y positions, output angles.
void inverseKinematics(double x, double y)
{
  double t2 = acos((sq(x) + sq(y) - sq(l1) - sq(l2)) / (2 * l1 * l2));

  if (x < 0 & y < 0)
    t2 = (-1) * t2;

  double t1 = atan(x / y) - atan((l2 * sin(t2)) / (l1 + l2 * cos(t2)));
}