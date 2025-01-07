import tkinter as tk
from tkinter import messagebox
import serial

# Robot Arm Lengths
L1 = 228.0  # mm
L2 = 136.5  # mm

# Robot Joints and Stepper Positions
j1, j2, j3, jz = 0, 0, 0, 100
stepper_position_1, stepper_position_2, stepper_position_3, stepper_position_z = (
    0,
    0,
    0,
    4104,
)

# Cartesian Coordinates
x, y, z = 0, 0, 100

# Stepper Motor Limits
MIN_STEPPER1 = -888
MAX_STEPPER1 = 2626
HOME_STEPPER1 = 0
MIN_STEPPER2 = -1262
MAX_STEPPER2 = 1262
HOME_STEPPER2 = 0
MIN_STEPPER3 = -416
MAX_STEPPER3 = 416
HOME_STEPPER3 = 0
MIN_STEPPERZ = 0
MAX_STEPPERZ = 6156
HOME_STEPPERZ = 4104

# Angle to Steps Conversion
THETA1_ANGLE_TO_STEPS = 9.8707865169
THETA2_ANGLE_TO_STEPS = 8.4133333333
PHI_ANGLE_TO_STEPS = 2.5679012346
Z_DISTANCE_TO_STEPS = 41.04


arduino = serial.Serial("/dev/ttyACM0", 115200)


def forward_kinematics(j1, j2, j3, jz):
    x = 0
    y = 0
    z = 0
    return x, y, z


def inverse_kinematics(x, y, z):
    j1 = 0
    j2 = 0
    j3 = 0
    jz = 0
    return j1, j2, j3, jz


def convert_to_steps(j1, j2, j3, jz):
    global stepper_position_1, stepper_position_2, stepper_position_3, stepper_position_z
    stepper_position_1 = int(j1 * THETA1_ANGLE_TO_STEPS)
    stepper_position_2 = int(j2 * THETA2_ANGLE_TO_STEPS)
    stepper_position_3 = int(j3 * PHI_ANGLE_TO_STEPS)
    stepper_position_z = int(jz * Z_DISTANCE_TO_STEPS)

    return (
        stepper_position_1,
        stepper_position_2,
        stepper_position_3,
        stepper_position_z,
    )


def send_move_command():
    print(
        f"Stepper 1: {stepper_position_1}, Stepper 2: {stepper_position_2}, Stepper 3: {stepper_position_3}, Stepper Z: {stepper_position_z}"
    )

    arduino.write(
        f"move {stepper_position_1} {stepper_position_2} {stepper_position_3} {stepper_position_z}\n".encode()
    )


# Button Functions
def home():
    arduino.write("home\n".encode())


def send(var_j1, var_j2, var_j3, var_z):
    global j1, j2, j3, jz
    global stepper_position_1, stepper_position_2, stepper_position_3, stepper_position_z
    j1 = var_j1.get()
    j2 = var_j2.get()
    j3 = var_j3.get()
    jz = var_z.get()
    (
        stepper_position_1,
        stepper_position_2,
        stepper_position_3,
        stepper_position_z,
    ) = convert_to_steps(j1, j2, j3, jz)
    send_move_command()


# Keystrokes
def on_enter(event, var_j1, var_j2, var_j3, var_z):
    send(var_j1, var_j2, var_j3, var_z)


# Main function to create the GUI
def main():
    # Main window
    root = tk.Tk()
    root.title("SCARA Robot Joint Control")

    # Create an IntVar to hold value of the Entry Widgets
    var_j1 = tk.IntVar(value=j1)
    var_j2 = tk.IntVar(value=j2)
    var_j3 = tk.IntVar(value=j3)
    var_z = tk.IntVar(value=jz)

    # Joint number entry
    btn_home = tk.Button(root, text="Home", command=lambda: home())
    btn_home.grid(row=1, column=0, padx=10, pady=5)

    # Entry for each joints
    entry_j1 = tk.Entry(root, textvariable=var_j1)
    entry_j1.grid(row=2, column=0, padx=10, pady=5)
    tk.Label(root, text="Joint 1 Angle (-90° - 266°)").grid(
        row=2, column=1, padx=10, pady=5
    )

    entry_j2 = tk.Entry(root, textvariable=var_j2)
    entry_j2.grid(row=3, column=0, padx=10, pady=5)
    tk.Label(root, text="Joint 2 Angle (-150° - 150°)").grid(
        row=3, column=1, padx=10, pady=5
    )

    entry_j3 = tk.Entry(root, textvariable=var_j3)
    entry_j3.grid(row=4, column=0, padx=10, pady=5)
    tk.Label(root, text="Joint 3 Angle (-162° - 162°)").grid(
        row=4, column=1, padx=10, pady=5
    )

    entry_z = tk.Entry(root, textvariable=var_z)
    entry_z.grid(row=5, column=0, padx=10, pady=5)
    tk.Label(root, text="Z Height (0mm - 150mm)").grid(row=5, column=1, padx=10, pady=5)

    # Button to send the command
    btn_send = tk.Button(
        root, text="Send", command=lambda: send(var_j1, var_j2, var_j3, var_z)
    )
    btn_send.grid(row=6, column=0, padx=10, pady=5)

    root.bind("<Return>", lambda event: on_enter(event, var_j1, var_j2, var_j3, var_z))

    # Start the GUI loop
    root.mainloop()


if __name__ == "__main__":
    try:
        main()
    finally:
        arduino.close()
