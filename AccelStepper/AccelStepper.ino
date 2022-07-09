#include <AccelStepper.h>

#define limitSwitch4 A3

limit4 = 0;

AccelStepper stepper4(1, 12, 13);

void setup() {

  Serial.begin(115200);
  pinMode(limitSwitch4, INPUT_PULLUP);
}

void loop(){
  limit4 = digitalRead(limitSwitch4)
  Serial.println(limit4);
  delay(1000);
