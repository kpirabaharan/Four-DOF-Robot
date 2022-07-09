#define limitSwitch4 A3

const int stepPinA = 12;
const int dirPinA = 13;

vo id setup(){
  pinMode(stepPinA, OUTPUT);
  pinMode(dirPinA, OUTPUT);
}
void loop(){

  digitalWrite(dirPinA, HIGH);

  for (int x = 0; x < 200; x++){
    digitalWrite(stepPinA, HIGH);
    delayMicroseconds(500);
    digitalWrite(stepPinA, LOW);
    delayMicroseconds(500);
  }

  delay(1000);
  digitalWrite(dirPinA, LOW);

  for (int x = 0; x < 200; x++){
    digitalWrite(stepPinA, HIGH);
    delayMicroseconds(500);
    digitalWrite(stepPinA, LOW);
    delayMicroseconds(500);
  }

  delay(1000);  
}
