/*
  Energy Monitoring System — Representative Room Circuit (Wokwi simulation)

  Models ONE room's worth of devices (Work Room 1: 3 lights + 2 fans) the way
  the real hardware would be wired:

    ESP32 GPIO --> Relay Module IN  --> Relay switches the device's live wire
    ESP32 ADC  <-- Current-sense tap (ACS712 in real life; a potentiometer
                   stands in for it here since Wokwi has no native ACS712 part)

  Each relay's own low-voltage side is powered by the ESP32's 5V (VIN) rail;
  its high-voltage side (COM/NO) switches the LED+resistor pair that
  represents the light or fan load. In a real installation, COM/NO would be
  wired in series with the device's live (AC mains) conductor instead of an
  LED.

  IMPORTANT — relay trigger polarity:
  Most 5V relay modules (and Wokwi's simulated one) are ACTIVE-LOW: pulling
  IN LOW energizes the coil and connects COM to NO (device ON). IN HIGH (or
  floating) leaves COM on NC (device OFF). This sketch writes LOW to turn a
  device on and HIGH to turn it off, matching that behavior — and matching
  what you'd need to do with a real SRD-05VDC-SL-C style relay board.

  SAFETY NOTE: In real hardware, relayX:COM/NO switches mains voltage
  (110/220V AC). Never touch that side while powered; use enclosed, rated
  relay modules and proper wire gauge. The ESP32 side stays at 3.3V/5V logic
  only.

  This sketch is a concept demo: it cycles devices on/off on a timer (standing
  in for the app turning devices on/off) and prints device state + estimated
  power draw to the Serial Monitor, the same shape of data the simulated
  backend (Convex) produces for the dashboard and Discord bot.
*/

const int LIGHT_PINS[3] = {22, 23, 18};
const int FAN_PINS[2] = {19, 21};
const int LIGHT_WATTS = 15;
const int FAN_WATTS = 60;
const int CURRENT_SENSE_PIN = 34; // simulated ACS712 output

// Relay modules here are active-LOW: LOW = device ON, HIGH = device OFF.
const int RELAY_ON = LOW;
const int RELAY_OFF = HIGH;

bool lightState[3] = {false, false, false};
bool fanState[2] = {false, false};

unsigned long lastToggle = 0;
const unsigned long TOGGLE_INTERVAL_MS = 4000;
int cursor = 0; // which device to flip next, cycles through all 5

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < 3; i++) {
    pinMode(LIGHT_PINS[i], OUTPUT);
    digitalWrite(LIGHT_PINS[i], RELAY_OFF); // all lights start OFF
  }
  for (int i = 0; i < 2; i++) {
    pinMode(FAN_PINS[i], OUTPUT);
    digitalWrite(FAN_PINS[i], RELAY_OFF); // all fans start OFF
  }

  Serial.println("Work Room 1 — hardware concept circuit online");
}

void loop() {
  unsigned long now = millis();

  if (now - lastToggle >= TOGGLE_INTERVAL_MS) {
    lastToggle = now;
    toggleNextDevice();
    printRoomStatus();
  }
}

void toggleNextDevice() {
  if (cursor < 3) {
    lightState[cursor] = !lightState[cursor];
    digitalWrite(LIGHT_PINS[cursor], lightState[cursor] ? RELAY_ON : RELAY_OFF);
  } else {
    int fanIndex = cursor - 3;
    fanState[fanIndex] = !fanState[fanIndex];
    digitalWrite(FAN_PINS[fanIndex], fanState[fanIndex] ? RELAY_ON : RELAY_OFF);
  }
  cursor = (cursor + 1) % 5;
}

void printRoomStatus() {
  int totalWatts = 0;
  Serial.println("---- Work Room 1 ----");

  for (int i = 0; i < 3; i++) {
    Serial.print("Light ");
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.println(lightState[i] ? "ON" : "OFF");
    if (lightState[i]) totalWatts += LIGHT_WATTS;
  }

  for (int i = 0; i < 2; i++) {
    Serial.print("Fan ");
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.println(fanState[i] ? "ON" : "OFF");
    if (fanState[i]) totalWatts += FAN_WATTS;
  }

  // Read the current-sense line (ACS712 in real hardware). This is what a
  // microcontroller would cross-check the rated wattage total against.
  int raw = analogRead(CURRENT_SENSE_PIN);
  float sensedVoltage = (raw / 4095.0) * 3.3;
  float sensedAmps = sensedVoltage; // placeholder scale factor for the demo

  Serial.print("Rated load estimate: ");
  Serial.print(totalWatts);
  Serial.println(" W");
  Serial.print("Current-sense reading: ");
  Serial.print(sensedAmps, 2);
  Serial.println(" A (simulated ACS712 tap)");
  Serial.println();
}
