from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import serial
import threading
import time


# Flask App
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

THETA1_ANGLE_TO_STEPS = 9.8707865169
THETA2_ANGLE_TO_STEPS = 8.4133333333
PHI_ANGLE_TO_STEPS = 2.5679012346
Z_DISTANCE_TO_STEPS = 41.04

# Global Variables
current_angle = {"j1": 0, "j2": 0, "j3": 0, "jz": 0}
set_angle = {"j1": 0, "j2": 0, "j3": 0, "jz": 0}

current_step = {"s1": 0, "s2": 0, "s3": 0, "sz": 0}
set_step = {"s1": 0, "s2": 0, "s3": 0, "sz": 0}

# Init Serial Connection
arduino = serial.Serial("/dev/ttyACM0", 115200, timeout=1)
time.sleep(2)


def convert_angles_to_steps(j1, j2, j3, jz):
    return (
        round(j1 * THETA1_ANGLE_TO_STEPS),
        round(j2 * THETA2_ANGLE_TO_STEPS),
        round(j3 * PHI_ANGLE_TO_STEPS),
        round(jz * Z_DISTANCE_TO_STEPS),
    )


def convert_steps_to_angles(s1, s2, s3, sz):
    return (
        round(s1 / THETA1_ANGLE_TO_STEPS),
        round(s2 / THETA2_ANGLE_TO_STEPS),
        round(s3 / PHI_ANGLE_TO_STEPS),
        round(sz / Z_DISTANCE_TO_STEPS),
    )


def read_positions():
    while True:
        arduino.write(b"report_current_step\n")

        response = arduino.readline().decode("utf-8").strip()

        if response.startswith("current_step"):
            steps = response.split(" ")[1:]
            current_step["s1"] = int(steps[0])
            current_step["s2"] = int(steps[1])
            current_step["s3"] = int(steps[2])
            current_step["sz"] = int(steps[3])

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

        socketio.emit("current_angle", current_angle)

        time.sleep(0.5)


@app.route("/api/position", methods=["GET"])
def get_joints():
    return jsonify({"j1": 0, "j2": 0, "j3": 0, "z": 0})


@app.route("/api/joint-controls", methods=["POST"])
def set_joints():
    data = request.json
    print(data)
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
    else:
        print("Set Step Failed")

    return jsonify(set_angle)


if __name__ == "__main__":
    threading.Thread(target=read_positions).start()
    socketio.run(app, host="0.0.0.0", port=5000)
