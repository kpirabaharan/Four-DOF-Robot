#include <Stepper.h>

#define limitSwitch1 9
#define limitSwitch2 10
#define limitSwitch3 11
#define limitSwitch4 A3

int limit1 = 0;
int limit2 = 0;
int limit3 = 0;
int limit4 = 0;

boolean limit1homed = false;
boolean limit2homed = false;
boolean limit3homed = false;
boolean limit4homed = false;
const int stepsPerRevolution = 200;

Stepper stepper1(stepsPerRevolution, 2, 5);
Stepper stepper2(stepsPerRevolution, 3, 6);
Stepper stepper3(stepsPerRevolution, 4, 7);
Stepper stepper4(stepsPerRevolution, 12, 13);

void setup() {

  Serial.begin(115200);
  pinMode(limitSwitch1, INPUT_PULLUP);
  stepper1.setSpeed(90);
  pinMode(limitSwitch2, INPUT_PULLUP);
  stepper2.setSpeed(90);
  pinMode(limitSwitch3, INPUT_PULLUP);
  stepper3.setSpeed(45);
  pinMode(limitSwitch4, INPUT_PULLUP);
  stepper4.setSpeed(160); 
}

void loop() {
  
  limit1 = digitalRead(limitSwitch1);
  limit2 = digitalRead(limitSwitch2);
  limit3 = digitalRead(limitSwitch3);
  limit4 = digitalRead(limitSwitch4);
  
  if(limit4homed == false)
    limit4homed = homing4(limit4homed);
    
  if(limit4homed == true && limit3homed == false)
    limit3homed = homing3(limit3homed);
  
  if(limit4homed == true && limit3homed == true && limit2homed == false)
    limit2homed = homing2(limit2homed);
  
  if(limit4homed == true && limit3homed == true && limit2homed == true && limit1homed == false)
    limit1homed = homing1(limit1homed); 
}


boolean homing1(boolean homed){
  if(limit1 == 0)
  {
    stepper1.step(1);
  }
  else if(limit1 == 1)
  {
    stepper1.setSpeed(160);
    stepper1.step(-39.5*stepsPerRevolution);
    homed = true;  
  }
  return homed;
}

boolean homing2(boolean homed){
  if(limit2 == 0)
  {
    stepper2.step(1);
  }
  else if(limit2 == 1)
  {
    stepper2.setSpeed(160);
    stepper2.step(-27.5*stepsPerRevolution);
    homed = true;  
  }
  return homed;
}

boolean homing3(boolean homed){
  if(limit3 == 0)
  {
    stepper3.step(-1);
  }
  else if(limit3 == 1)
  {
    stepper3.step(9*stepsPerRevolution);
    homed = true;  
  }
  return homed;
}

boolean homing4(boolean homed){
  if(limit4 == 0)
  {
    stepper4.step(1);
  }
  else if(limit4 == 1)
  {
    stepper4.step(-2*stepsPerRevolution);
    homed = true;  
  }
  return homed;
}


