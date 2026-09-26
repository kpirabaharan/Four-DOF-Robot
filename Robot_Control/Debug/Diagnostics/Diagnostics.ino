/*
 * Project Name: SCARA Robot Controller
 * File: Diagnostics.ino
 * Description: Bench diagnostics for the steppers and limit switches. Verifies
 *              that each switch actually changes state, that each stepper moves,
 *              and which physical direction a positive step count produces.
 *
 *              This is a DEBUG sketch. Flash Motor_Control.ino back when done.
 *
 * Author: Keeshigan Pirabaharan
 * Version: 0.1
 *
 * Notes:
 * - Pin map, inverted pins and homing direction are copied from
 *   Motor_Control.ino. If you change them there, change them here.
 * - Nothing here checks soft limits: `jog` moves whatever you ask, within a
 *   per-command step budget. Keep the moves small until direction is confirmed.
 * - Every motion is abortable by sending `stop`.
 * - server.py on the Pi holds /dev/arduino open. Stop it before connecting,
 *   or the port will be busy.
 *
 * License: MIT License
 */

#include <AccelStepper.h>

// ---------------------------------------------------------------- pin map ---
#define LIMIT_SWITCH1 9
#define LIMIT_SWITCH2 10
#define LIMIT_SWITCH3 11
#define LIMIT_SWITCHZ A3

#define STEPPER1_STEP_PIN 2
#define STEPPER1_DIR_PIN 5
#define STEPPER2_STEP_PIN 3
#define STEPPER2_DIR_PIN 6
#define STEPPER3_STEP_PIN 4
#define STEPPER3_DIR_PIN 7
#define STEPPERZ_STEP_PIN 12
#define STEPPERZ_DIR_PIN 13

#define BAUD_RATE 115200

// Deliberately slow: this sketch is for watching the machine, not moving it.
#define JOG_SPEED 60
#define JOG_ACCEL 200
#define SEEK_SPEED 50

// A jog or seek will never exceed this many steps, whatever you ask for.
#define MAX_STEPS 4000

AccelStepper steppers[4] = {
  AccelStepper(1, STEPPER1_STEP_PIN, STEPPER1_DIR_PIN),
  AccelStepper(1, STEPPER2_STEP_PIN, STEPPER2_DIR_PIN),
  AccelStepper(1, STEPPER3_STEP_PIN, STEPPER3_DIR_PIN),
  AccelStepper(1, STEPPERZ_STEP_PIN, STEPPERZ_DIR_PIN),
};

const char* AXIS_NAME[4] = { "J1", "J2", "J3", "JZ" };
const int SWITCH_PIN[4] = { LIMIT_SWITCH1, LIMIT_SWITCH2, LIMIT_SWITCH3, LIMIT_SWITCHZ };

// Homing direction per axis, as Motor_Control.ino drives it:
// ROTATIONAL_HOMING_SPEED is -50, Z_HOMING_SPEED is +100.
const int HOMING_SIGN[4] = { -1, -1, -1, +1 };

enum Mode { IDLE, JOG, SEEK, SWEEP_OUT, SWEEP_BACK };

Mode mode = IDLE;
int activeAxis = 0;
long seekBudget = 0;
long seekStart = 0;
long sweepSteps = 0;
bool watching = false;
int lastSwitch[4] = { -1, -1, -1, -1 };
unsigned long lastProgress = 0;

String command = "";

// -------------------------------------------------------------- utilities ---

/*
 * The production firmware reads these pins as INPUT_PULLUP and treats HIGH as
 * "limit reached" (see home() in Motor_Control.ino: it seeks while the pin is
 * LOW and stops the moment it reads HIGH). That only makes sense for a
 * normally-CLOSED switch, so a switch reading HIGH at rest -- unpressed
 * normally-open, a broken wire, or the wrong pin -- makes homing believe the
 * axis is already home before it has moved.
 */
bool readsAsAtLimit(int axis) {
  return digitalRead(SWITCH_PIN[axis]) == HIGH;
}

void printSwitchRow(int axis) {
  bool high = readsAsAtLimit(axis);
  Serial.print("  ");
  Serial.print(AXIS_NAME[axis]);
  Serial.print(F("  pin "));
  Serial.print(SWITCH_PIN[axis] == A3 ? 17 : SWITCH_PIN[axis]);
  Serial.print(SWITCH_PIN[axis] == A3 ? F(" (A3)") : F("     "));
  Serial.print(F("  "));
  Serial.print(high ? F("HIGH") : F("LOW "));
  Serial.print(F("  "));
  Serial.print(high ? F("open   ") : F("closed "));
  Serial.print(F("  homing reads: "));
  Serial.println(high ? F("AT LIMIT  <-- stops immediately") : F("seeking"));
}

void printSwitches() {
  Serial.println(F("switches:"));
  for (int i = 0; i < 4; i++) printSwitchRow(i);
  Serial.println(F("  (press each switch by hand and re-run, or use `watch`)"));
}

void printStatus() {
  Serial.println(F("positions:"));
  for (int i = 0; i < 4; i++) {
    Serial.print(F("  "));
    Serial.print(AXIS_NAME[i]);
    Serial.print(F("  "));
    Serial.println(steppers[i].currentPosition());
  }
  printSwitches();
}

void printHelp() {
  Serial.println(F("commands:"));
  Serial.println(F("  switches            read all four limit switches once"));
  Serial.println(F("  watch               print switch changes as they happen"));
  Serial.println(F("  unwatch             stop printing switch changes"));
  Serial.println(F("  status              stepper positions + switches"));
  Serial.println(F("  zero                call this axis position 0 (all axes)"));
  Serial.println(F("  jog <axis> <steps>  move by signed steps, no limit checks"));
  Serial.println(F("  sweep <axis> [n]    go +n then back -n, to confirm direction"));
  Serial.println(F("  seek <axis> [max]   move in the HOMING direction until the"));
  Serial.println(F("                      switch trips or the budget runs out"));
  Serial.println(F("  stop                abort whatever is moving"));
  Serial.println(F("axis is 1, 2, 3 or z. steps are capped at 4000."));
}

int parseAxis(const String& token) {
  if (token == "1") return 0;
  if (token == "2") return 1;
  if (token == "3") return 2;
  if (token == "z" || token == "Z" || token == "4") return 3;
  return -1;
}

void abortMotion(const char* why) {
  if (mode != IDLE) {
    Serial.print(F("stopped "));
    Serial.print(AXIS_NAME[activeAxis]);
    Serial.print(F(" at "));
    Serial.print(steppers[activeAxis].currentPosition());
    Serial.print(F("  ("));
    Serial.print(why);
    Serial.println(F(")"));
  }
  mode = IDLE;
}

// ------------------------------------------------------------------ setup ---

void setup() {
  Serial.begin(BAUD_RATE);

  pinMode(LIMIT_SWITCH1, INPUT_PULLUP);
  pinMode(LIMIT_SWITCH2, INPUT_PULLUP);
  pinMode(LIMIT_SWITCH3, INPUT_PULLUP);
  pinMode(LIMIT_SWITCHZ, INPUT_PULLUP);

  // Same inversion as the production firmware, so directions match what
  // Motor_Control.ino would do.
  steppers[0].setPinsInverted(true, false, false);
  steppers[1].setPinsInverted(true, false, false);

  for (int i = 0; i < 4; i++) {
    steppers[i].setMaxSpeed(JOG_SPEED);
    steppers[i].setAcceleration(JOG_ACCEL);
    steppers[i].setCurrentPosition(0);
  }

  while (!Serial) {}

  Serial.println();
  Serial.println(F("SCARA diagnostics. Type `help`."));
  printSwitches();
}

// ------------------------------------------------------------ command i/o ---

void handleCommand(String line) {
  line.trim();
  if (line.length() == 0) return;

  // Split into up to three tokens.
  String a = line, b = "", c = "";
  int sp = a.indexOf(' ');
  if (sp >= 0) { b = a.substring(sp + 1); a = a.substring(0, sp); b.trim(); }
  sp = b.indexOf(' ');
  if (sp >= 0) { c = b.substring(sp + 1); b = b.substring(0, sp); c.trim(); }

  if (a == "help") { printHelp(); return; }
  if (a == "switches") { printSwitches(); return; }
  if (a == "status") { printStatus(); return; }
  if (a == "stop") { abortMotion("requested"); return; }

  if (a == "watch") {
    watching = true;
    for (int i = 0; i < 4; i++) lastSwitch[i] = -1;  // force a first report
    Serial.println(F("watching switches; `unwatch` to stop"));
    return;
  }
  if (a == "unwatch") { watching = false; Serial.println(F("not watching")); return; }

  if (a == "zero") {
    for (int i = 0; i < 4; i++) steppers[i].setCurrentPosition(0);
    Serial.println(F("all positions set to 0"));
    return;
  }

  if (a == "jog" || a == "sweep" || a == "seek") {
    if (mode != IDLE) { Serial.println(F("busy; send `stop` first")); return; }

    int axis = parseAxis(b);
    if (axis < 0) { Serial.println(F("bad axis; use 1, 2, 3 or z")); return; }

    long n = c.length() ? c.toInt() : 0;

    if (a == "jog") {
      if (n == 0) { Serial.println(F("jog needs a signed step count")); return; }
      if (n > MAX_STEPS) n = MAX_STEPS;
      if (n < -MAX_STEPS) n = -MAX_STEPS;
      activeAxis = axis;
      steppers[axis].move(n);
      mode = JOG;
      Serial.print(F("jog "));
      Serial.print(AXIS_NAME[axis]);
      Serial.print(F(" by "));
      Serial.print(n);
      Serial.print(F(" from "));
      Serial.println(steppers[axis].currentPosition());
      return;
    }

    if (a == "sweep") {
      if (n <= 0) n = 200;
      if (n > MAX_STEPS) n = MAX_STEPS;
      activeAxis = axis;
      sweepSteps = n;
      steppers[axis].move(n);
      mode = SWEEP_OUT;
      Serial.print(F("sweep "));
      Serial.print(AXIS_NAME[axis]);
      Serial.print(F(": +"));
      Serial.print(n);
      Serial.println(F(" then back. Watch which way it goes first."));
      return;
    }

    // seek
    if (n <= 0) n = 1200;
    if (n > MAX_STEPS) n = MAX_STEPS;
    activeAxis = axis;
    seekBudget = n;
    seekStart = steppers[axis].currentPosition();
    lastProgress = millis();

    Serial.print(F("seek "));
    Serial.print(AXIS_NAME[axis]);
    Serial.print(F(" in homing direction ("));
    Serial.print(HOMING_SIGN[axis] > 0 ? F("+") : F("-"));
    Serial.print(F("), budget "));
    Serial.print(n);
    Serial.println(F(" steps"));

    if (readsAsAtLimit(axis)) {
      Serial.println(F("  !! switch ALREADY reads AT LIMIT before moving."));
      Serial.println(F("  !! this is what makes homing quit instantly and then"));
      Serial.println(F("  !! drive to its home offset in the opposite direction."));
      Serial.println(F("  !! check wiring/normally-open vs normally-closed first."));
      return;
    }

    steppers[axis].setMaxSpeed(SEEK_SPEED);
    steppers[axis].setSpeed(HOMING_SIGN[axis] * SEEK_SPEED);
    mode = SEEK;
    return;
  }

  Serial.print(F("unknown command: "));
  Serial.println(a);
}

// ------------------------------------------------------------------- loop ---

void loop() {
  if (Serial.available()) {
    command = Serial.readStringUntil('\n');
    handleCommand(command);
  }

  if (watching) {
    for (int i = 0; i < 4; i++) {
      int now = digitalRead(SWITCH_PIN[i]);
      if (now != lastSwitch[i]) {
        lastSwitch[i] = now;
        Serial.print(F("switch "));
        Serial.print(AXIS_NAME[i]);
        Serial.print(F(" -> "));
        Serial.print(now == HIGH ? F("HIGH (open)") : F("LOW (closed)"));
        Serial.print(F("   homing reads: "));
        Serial.println(now == HIGH ? F("AT LIMIT") : F("seeking"));
      }
    }
  }

  switch (mode) {
    case IDLE:
      break;

    case JOG:
      if (steppers[activeAxis].distanceToGo() != 0) {
        steppers[activeAxis].run();
      } else {
        Serial.print(F("jog done, "));
        Serial.print(AXIS_NAME[activeAxis]);
        Serial.print(F(" now at "));
        Serial.println(steppers[activeAxis].currentPosition());
        mode = IDLE;
      }
      break;

    case SWEEP_OUT:
      if (steppers[activeAxis].distanceToGo() != 0) {
        steppers[activeAxis].run();
      } else {
        Serial.println(F("  ...returning"));
        steppers[activeAxis].move(-sweepSteps);
        mode = SWEEP_BACK;
      }
      break;

    case SWEEP_BACK:
      if (steppers[activeAxis].distanceToGo() != 0) {
        steppers[activeAxis].run();
      } else {
        Serial.print(F("sweep done, "));
        Serial.print(AXIS_NAME[activeAxis]);
        Serial.print(F(" back at "));
        Serial.print(steppers[activeAxis].currentPosition());
        Serial.println(F(" (should be where it started)"));
        mode = IDLE;
      }
      break;

    case SEEK: {
      long travelled = abs(steppers[activeAxis].currentPosition() - seekStart);

      if (readsAsAtLimit(activeAxis)) {
        Serial.print(F("SWITCH TRIPPED after "));
        Serial.print(travelled);
        Serial.println(F(" steps. This axis homes correctly."));
        mode = IDLE;
        break;
      }

      if (travelled >= seekBudget) {
        Serial.print(F("budget exhausted after "));
        Serial.print(travelled);
        Serial.println(F(" steps without tripping the switch."));
        Serial.println(F("  either the axis is moving away from the switch,"));
        Serial.println(F("  the switch is dead, or it needs more travel."));
        mode = IDLE;
        break;
      }

      steppers[activeAxis].runSpeed();

      if (millis() - lastProgress > 1000) {
        lastProgress = millis();
        Serial.print(F("  seeking... "));
        Serial.print(travelled);
        Serial.print(F("/"));
        Serial.print(seekBudget);
        Serial.println(F(" steps"));
      }
      break;
    }
  }
}
