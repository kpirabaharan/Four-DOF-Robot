# robot-web

Next.js control console for the 4-DOF SCARA arm, with a live 3D model of the
robot driven by its own telemetry.

This is a rewrite of `../robot-frontend` (Vite + React). That app still works and
is left in place; nothing here modifies it, `../Raspberry-Pi/server.py`, or the
Arduino firmware.

## Running it

```bash
npm install
cp .env.example .env.local   # then check the address below
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm test` | Kinematics golden tests (vitest) |
| `npm run lint` | ESLint |

### Pointing it at the robot

`NEXT_PUBLIC_ROBOT_API_URL` must reach the Flask server in
`../Raspberry-Pi/server.py`. It defaults to `http://ubuntu5:5000` — the Pi's
**Tailscale MagicDNS name**, not its LAN address. The LAN address
(`192.168.2.203`) is not reachable from every client even on the same subnet, so
the tailnet name is the reliable route. Whichever machine runs the browser needs
Tailscale connected.

Because `NEXT_PUBLIC_*` is inlined at build time and this address has moved more
than once, the server-settings dialog (the ⛁ button in the header) stores a
`localStorage` override so you can repoint a built bundle without rebuilding.

**Serve this over plain HTTP.** A page on HTTPS cannot call an `http://` address
on a private network — mixed content plus Chrome's Private Network Access both
block it. `localhost`, or a static export served off the Pi, is the right shape.
Don't deploy it to Vercel.

## What talks to what

```
browser ──REST──►  /api/home, /api/joint-controls, /api/cartesian-controls
        ◄─socket─  current_position, ~2 Hz
                   Flask + Socket.IO on the Pi
                          │ USB serial
                   Arduino (Motor_Control.ino)
```

There is no server-side code here: `app/` is a shell and everything below
`components/providers.tsx` is a client component. The browser talks to the Pi
directly.

## Layout

| Path | Role |
| --- | --- |
| `lib/robot.ts` | Physical constants, mirrored from `server.py` |
| `lib/kinematics.ts` | FK/IK, reachability, limit checks |
| `lib/api.ts`, `lib/socket.ts`, `lib/config.ts` | Network edge; `config.ts` is the only place the base URL lives |
| `context/robot-socket-provider.tsx` | One Socket.IO connection for the whole tree |
| `components/robot3d/` | The parametric 3D model |
| `lib/__tests__/` | Golden tests pinned to the notebooks in `../Calculations` |

## Turning the 3D view off

The **3D** toggle in the header unmounts the canvas entirely rather than hiding
it — a hidden canvas keeps its WebGL context and keeps running the render loop,
so `display: none` would cost exactly as much as showing it. With the view off,
the controls and telemetry reflow to use the full width and nothing renders. The
choice is remembered in `localStorage`.

## The 3D model

Built in code with `@react-three/fiber` — no mesh assets. The arm is a nested
transform chain (JZ → J1 → J2 → J3), so **three.js computes forward kinematics
for free**: apply the joint values and the end effector lands where the maths
says it should.

Everything inside the scene is authored in the robot's own frame — millimetres,
+Z up — and a single root rotation maps that into three.js world space, so the
code reads like `server.py`.

The viewport's container must have a **definite height**. R3F's `<Canvas>`
wrapper is `height: 100%`, so with an auto-height parent the canvas and its
ResizeObserver grow each other on every measure — it had ballooned to
807×1692, which at `dpr 2` is 5.4 megapixels of shadowed scene per frame.
Relatedly, `<Canvas>` only builds its three.js root once it measures a non-zero
size, so `RobotViewport` withholds it until the box is known good instead of
racing that measurement.

Two details worth knowing:

- **Telemetry is 2 Hz in whole degrees**, so transforms are damped toward their
  targets each frame rather than set directly, or the model stair-steps.
  The damping is plain interpolation, *not* shortest-angular-path: these joints
  have hard limits (J1 travels −90…266) and physically cannot wrap, so "the
  short way round" would animate a motion the arm can't make.
- **The model is driven by joint angles, never by `xP`/`yP`.** The server rounds
  its FK output to whole millimetres, and near full extension that rounding is
  worth several degrees of joint angle.

## Things it guards against

The server and firmware have some sharp edges. This client works around them
rather than fixing them — the fixes belong in `server.py`:

- **Unreachable Cartesian targets.** The workspace is an annulus (91.5–364.5mm),
  but the server only checks a ±364 *box*. A point like `(300, 300)` passes that
  check and then makes `math.acos` raise — HTTP 500. The UI blocks it first.
- **No joint-limit check on the Cartesian path.** `POST /api/cartesian-controls`
  converts straight to steps without validating, and the firmware's `moveTo()`
  doesn't clamp either. IK also returns J1 in `(−180, 180]` while the joint
  travels −90…266, so some bearings resolve to an out-of-range angle. The UI
  validates both joint and step limits, and shows the wrapped equivalent.
- **A serial race.** `read_position()` and the POST handler share one
  `serial.Serial` with no lock, so a POST can swallow the other's reply and
  return 500 *even though the move was accepted*. Error toasts say so.
- **Duplicate telemetry.** The server re-emits the previous frame when a serial
  read fails, so a live socket doesn't prove a live serial link.

## Hold is not an emergency stop

The Hold button re-sends the arm's current position as its target, which stops
motion without a firmware change. But with `ROTATIONAL_ACCELERATION 25` from
`ROTATIONAL_MAX_SPEED 100`, deceleration takes about 4 seconds and 200 steps —
roughly 20° of J1 — and AccelStepper will overshoot and reverse if the new
target lands inside its stopping distance. The power switch is the emergency
stop.
