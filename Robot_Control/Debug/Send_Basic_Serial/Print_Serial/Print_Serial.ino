void setup() {
  Serial.begin(115200);
}


void loop() {
  if (Serial.available()) {
    // Read Serial Data
    String command = Serial.readStringUntil('\n');
    Serial.println("Received: " + command);
  }
}
