# Send 1,2,3 to arduino

import serial

arduino = serial.Serial(port="/dev/ttyACM0", baudrate=115200, timeout=0.1)


def send_coordinates(x, y, z):
    arduino.write(f"{x},{y},{z}\n".encode())


if __name__ == "__main__":
    send_coordinates(1, 2, 3)
    arduino.close()
