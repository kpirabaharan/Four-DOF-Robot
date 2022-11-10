#include <Stepper.h>

#define limitSwitch1 9
#define limitSwitch2 10
#define limitSwitch3 11
#define limitSwitch4 A3

int limit1 = 0;
int limit2 = 0;
int limit3 = 0;
int limit4 = 0;

const int stepsPerRevolution = 200;

Stepper stepper1(stepsPerRevolution, 2, 5);
Stepper stepper2(stepsPerRevolution, 3, 6);
Stepper stepper3(stepsPerRevolution, 4, 7);
Stepper stepper4(stepsPerRevolution, 12, 13);


void setup() {

  Serial.begin(115200);
  pinMode(limitSwitch1, INPUT_PULLUP);
  stepper1.setSpeed(60);
  pinMode(limitSwitch2, INPUT_PULLUP);
  stepper2.setSpeed(60);
  pinMode(limitSwitch3, INPUT_PULLUP);
  stepper3.setSpeed(60);
  pinMode(limitSwitch4, INPUT_PULLUP);
  stepper4.setSpeed(60);
}

void loop() {
  limit4 = digitalRead(limitSwitch4);
  limit1 = digitalRead(limitSwitch1);
  Serial.println(limit1);
  if(limit4 == 1){
    stepper2.step(stepsPerRevolution);
  }
}

