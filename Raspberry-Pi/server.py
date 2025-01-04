from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import serial
import threading
import time
import math


# Flask App
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Conversion Constants
J1_ANGLE_TO_STEPS = 9.8707865169
J2_ANGLE_TO_STEPS = 8.4133333333
J3_ANGLE_TO_STEPS = 2.5679012346
JZ_DISTANCE_TO_STEPS = 41.04

# Robot Dimensions
L1 = 228.0
L2 = 136.5

# Stepper Limits
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

# Joint Limits
MIN_J1 = -90
MAX_J1 = 266
HOME_J1 = 0
MIN_J2 = -150
MAX_J2 = 150
HOME_J2 = 0
MIN_J3 = -162
MAX_J3 = 162
HOME_J3 = 0
MIN_JZ = 0
MAX_JZ = 150
HOME_JZ = 100

# Global Variables
current_angle = {"j1": 0, "j2": 0, "j3": 0, "jz": 0}
current_step = {"s1": 0, "s2": 0, "s3": 0, "sz": 0}
current_planar = {"xP": 0, "yP": 0, "zP": 100}

set_angle = {"j1": 0, "j2": 0, "j3": 0, "jz": 100}
set_step = {"s1": 0, "s2": 0, "s3": 0, "sz": 4104}
set_planar = {"xP": 0, "yP": 0, "zP": 100}

# Init Serial Connection
arduino = serial.Serial("/dev/ttyACM0", 115200, timeout=1)
time.sleep(2)


def forward_kinematics(j1, j2, jz):
    r1 = j1 * math.pi / 180
    r2 = j2 * math.pi / 180
    xP = round(L1 * math.cos(r1) + L2 * math.cos(r1 + r2))
    yP = round(L1 * math.sin(r1) + L2 * math.sin(r1 + r2))
    zP = jz
    return xP, yP, zP


def convert_angles_to_steps(j1, j2, j3, jz):
    return (
        round(j1 * J1_ANGLE_TO_STEPS),
        round(j2 * J2_ANGLE_TO_STEPS),
        round(j3 * J3_ANGLE_TO_STEPS),
        round(jz * JZ_DISTANCE_TO_STEPS),
    )


def convert_steps_to_angles(s1, s2, s3, sz):
    return (
        round(s1 / J1_ANGLE_TO_STEPS),
        round(s2 / J2_ANGLE_TO_STEPS),
        round(s3 / J3_ANGLE_TO_STEPS),
        round(sz / JZ_DISTANCE_TO_STEPS),
    )


def read_position():
    while True:
        arduino.write(b"report_current_step\n")

        response = arduino.readline().decode("utf-8").strip()

        if response.startswith("current_step"):
            steps = response.split(" ")[1:]
            current_step["s1"] = int(steps[0])
            current_step["s2"] = int(steps[1])
            current_step["s3"] = int(steps[2])
            current_step["sz"] = int(steps[3])

            # Convert Steps to Angles
            (
                current_angle["j1"],
                current_angle["j2"],
                current_angle["j3"],
                current_angle["jz"],
            ) = convert_steps_to_angles(
                current_step["s1"],
                current_step["s2"],
                current_step["s3"],
                current_step["sz"],
            )

            # Calculate Planar Position
            current_planar["xP"], current_planar["yP"], current_planar["zP"] = (
                forward_kinematics(
                    current_angle["j1"], current_angle["j2"], current_angle["jz"]
                )
            )

            position = {
                "j1": current_angle["j1"],
                "j2": current_angle["j2"],
                "j3": current_angle["j3"],
                "jz": current_angle["jz"],
                "s1": current_step["s1"],
                "s2": current_step["s2"],
                "s3": current_step["s3"],
                "sz": current_step["sz"],
                "xP": current_planar["xP"],
                "yP": current_planar["yP"],
                "zP": current_planar["zP"],}

        socketio.emit("current_position", position)

        time.sleep(0.5)


@app.route("/api/home", methods=["POST"])
def home():
    arduino.write(b"home\n")
    return jsonify({"message": "Homing"}), 200


@app.route("/api/joint-controls", methods=["GET"])
def get_joints():
    return (
        jsonify(
            {
                "j1": set_angle["j1"],
                "j2": set_angle["j2"],
                "j3": set_angle["j3"],
                "jz": set_angle["jz"],
            }
        ),
        200,
    )


@app.route("/api/joint-controls", methods=["POST"])
def set_joints():
    try:
        data = request.json

        if "j1" not in data or "j2" not in data or "j3" not in data or "jz" not in data:
            return jsonify({"error": "Invalid Request"}), 400

        if data["j1"] < MIN_J1 or data["j1"] > MAX_J1:
            return jsonify({"error": "Invalid J1 value"}), 400

        if data["j2"] < MIN_J2 or data["j2"] > MAX_J2:
            return jsonify({"error": "Invalid J2 value"}), 400

        if data["j3"] < MIN_J3 or data["j3"] > MAX_J3:
            return jsonify({"error": "Invalid J3 value"}), 400

        if data["jz"] < MIN_JZ or data["jz"] > MAX_JZ:
            return jsonify({"error": "Invalid JZ value"}), 400

        set_angle["j1"] = data["j1"]
        set_angle["j2"] = data["j2"]
        set_angle["j3"] = data["j3"]
        set_angle["jz"] = data["jz"]

        set_step["s1"], set_step["s2"], set_step["s3"], set_step["sz"] = (
            convert_angles_to_steps(
                set_angle["j1"], set_angle["j2"], set_angle["j3"], set_angle["jz"]
            )
        )

        # Send Move Command
        arduino.write(
            f"move {set_step['s1']} {set_step['s2']} {set_step['s3']} {set_step['sz']}\n".encode()
        )

        response = arduino.readline().decode("utf-8").strip()

        if response == "set_step success":
            print("Set Step Success")
            return jsonify(set_angle), 200
        else:
            print("Set Step Failed")
            return jsonify({"error": "Set Step Failed"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    threading.Thread(target=read_position).start()
    socketio.run(app, host="0.0.0.0", port=5000)
