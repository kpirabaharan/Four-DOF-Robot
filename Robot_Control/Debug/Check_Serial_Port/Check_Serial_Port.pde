// Description: Processing sketch to check serial communication with Arduino

import processing.serial.*;

Serial myPort; // Create object from Serial class

void setup() {
  // List all the available serial ports:
  println(Serial.list());
  
  // Change the port index to match your Arduino's serial port:
  String portName = Serial.list()[1]; // Adjust index if necessary
  myPort = new Serial(this, portName, 115200); // Set baud rate to match Arduino sketch

  println("Connected to: " + portName);
}

void draw() {
  // Check if there's any data available to read
  if (myPort.available() > 0) {
    String received = myPort.readStringUntil('\n'); // Read data until newline
    if (received != null) {
      println("Received: " + received.trim()); // Print received data
    }
  }
}
