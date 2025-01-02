#define limitSwitch1 9
#define limitSwitch2 10
#define limitSwitch3 11
#define limitSwitch4 A3

int limit1 = 0;
int limit2 = 0;
int limit3 = 0;
int limit4 = 0;

void setup() {
  Serial.begin(115200);
  pinMode(limitSwitch1, INPUT_PULLUP);
  pinMode(limitSwitch2, INPUT_PULLUP);
  pinMode(limitSwitch3, INPUT_PULLUP);
  pinMode(limitSwitch4, INPUT_PULLUP);
}

void loop() {
  limit1 = digitalRead(limitSwitch1);
  limit2 = digitalRead(limitSwitch2);
  limit3 = digitalRead(limitSwitch3);
  limit4 = digitalRead(limitSwitch4);
  Serial.print("Limit 1: ");
  Serial.println(limit1);
  Serial.print("Limit 2: ");
  Serial.println(limit2);
  Serial.print("Limit 3: ");
  Serial.println(limit3);
  Serial.print("Limit 4: ");
  Serial.println(limit4);
  delay(100);
}

