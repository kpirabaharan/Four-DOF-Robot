#include <Servo.h>

Servo myservo; // create servo object to control a servo


void setup()

{

  myservo.attach(A0);

  myservo.write(90);

}



void loop()

{

  myservo.write(20);

  delay(2000);

}
