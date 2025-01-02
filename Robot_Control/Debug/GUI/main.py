import tkinter as tk
from tkinter import messagebox


# Function to home joints
def home():
    pass


# Function to send joint coordinates to the robot
def send():
    pass


# Main function to create the GUI
def main():
    # Main window
    root = tk.Tk()
    root.title("SCARA Robot Joint Control")

    # Joint number entry
    btn_home = tk.Button(root, text="Home", command=lambda: home())
    btn_home.grid(row=1, column=0, padx=10, pady=5)

    # Entry for each joints
    entry_joint1 = tk.Entry(root)
    entry_joint1.grid(row=2, column=0, padx=10, pady=5)
    tk.Label(root, text="Joint 1 Angle (-90° - 266°)").grid(
        row=2, column=1, padx=10, pady=5
    )

    entry_joint2 = tk.Entry(root)
    entry_joint2.grid(row=3, column=0, padx=10, pady=5)
    tk.Label(root, text="Joint 2 Angle (-150° - 150°)").grid(
        row=3, column=1, padx=10, pady=5
    )

    entry_joint3 = tk.Entry(root)
    entry_joint3.grid(row=4, column=0, padx=10, pady=5)
    tk.Label(root, text="Joint 3 Angle (-162° - 162°)").grid(
        row=4, column=1, padx=10, pady=5
    )

    entry_jointz = tk.Entry(root)
    entry_jointz.grid(row=5, column=0, padx=10, pady=5)
    tk.Label(root, text="Z Height (0mm - 150mm)").grid(row=5, column=1, padx=10, pady=5)

    # Button to send the command
    btn_send = tk.Button(root, text="Send", command=lambda: send())
    btn_send.grid(row=6, column=0, padx=10, pady=5)

    # Start the GUI loop
    root.mainloop()


