import serial
import time

# Initialize serial connection
arduino = serial.Serial("/dev/ttyACM0", 115200, timeout=1)  # Adjust port as necessary
time.sleep(2)  # Wait for Arduino to initialize

while True:
    # Send command to Arduino
    arduino.write(b"report_current_step\n")

    # Read response
    response = arduino.readline().decode("utf-8").strip()
    if response:
        print(f"Arduino response: {response}")

    # Wait 0.5 seconds before sending next command
    time.sleep(0.5)
