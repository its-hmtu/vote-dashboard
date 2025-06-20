#include <Firebase_ESP_Client.h>
#include <WiFi.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <MFRC522Debug.h>
#include <WiFiUdp.h>
#include <NTPClient.h>

// wifi and firebase
#define WIFI_SSID "Tap Hoa Minh Tu"
#define WIFI_PASSWORD "12345689"
#define FIREBASE_PROJECT_ID "barierfid"
#define API_KEY "AIzaSyAIAl0rumgyoWEeMlYSmazyCemUedncLC8"
#define DATABASE_URL "https://barierfid-default-rtdb.asia-southeast1.firebasedatabase.app/"
#define EMAIL "tu.hoangminh15@gmail.com"
#define PASS "admin123"

// pins
#define I2C_SDA 15
#define I2C_SCL 16
#define BUZZ_PIN 4
#define RXD2 32
#define TXD2 33

MFRC522DriverPinSimple ss_pin(5);
MFRC522DriverSPI driver{ ss_pin };
MFRC522 mfrc522{ driver };
LiquidCrystal_I2C lcd(0x27, 16, 2);

// setup for timestamp
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 7 * 3600);

// setup for firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void initFirebase() {
  config.database_url = DATABASE_URL;
  config.api_key = API_KEY;
  auth.user.email = EMAIL;
  auth.user.password = PASS;
  Firebase.reconnectNetwork(true);
  fbdo.setBSSLBufferSize(4096, 1024);
  fbdo.setResponseSize(2048);
  Firebase.begin(&config, &auth);
  Firebase.setDoubleDigits(5);
  config.timeout.serverResponse = 10 * 1000;
  Serial.println("Firebase initialized");
}

void buzz(int duration = 200) {
  digitalWrite(BUZZ_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZ_PIN, LOW);
}

String getCardUID() {
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uid += (mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

int isVote;
int isCreate;
unsigned long sendDataPrevMillis = 0;
String currentSession = "";

void updateDisplay() {
  lcd.clear();
  if (isVote == 1) {
    lcd.print("VOTE");
    lcd.setCursor(0, 1);
    lcd.print("Scan card...");
  } else if (isCreate == 1) {
    lcd.print("ADD NEW");
    lcd.setCursor(0, 1);
    lcd.print("Scan card...");
  } else {
    lcd.print("STAND BY");
  }
}

void checkVotingStatus() {
  if (Firebase.ready() && millis() - sendDataPrevMillis > 1000 || sendDataPrevMillis == 0) {
    sendDataPrevMillis = millis();
    if (Firebase.RTDB.getInt(&fbdo, "mode/create")) {
      isCreate = fbdo.intData();
    }
    if (Firebase.RTDB.getInt(&fbdo, "mode/vote")) {
      isVote = fbdo.intData();
      if (Firebase.RTDB.getString(&fbdo, "config/current_session")) {
        currentSession = fbdo.stringData();
      }
    }
    updateDisplay();
  }
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
  Wire.begin(I2C_SDA, I2C_SCL);
  lcd.init();
  lcd.backlight();
  pinMode(BUZZ_PIN, OUTPUT);
  digitalWrite(BUZZ_PIN, LOW);
  mfrc522.PCD_Init();
  MFRC522Debug::PCD_DumpVersionToSerial(mfrc522, Serial);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
  timeClient.begin();
  timeClient.update();
  initFirebase();

  updateDisplay();
}

bool checkIfCandidate(String uid) {
  if (Firebase.RTDB.getBool(&fbdo, "sessions/" + currentSession + "/candidates/" + uid)) {
    return fbdo.boolData();
  }
  return false;
}

bool checkIfVoted(String uid) {
  if (Firebase.RTDB.getString(&fbdo, "votes/" + currentSession + "/" + uid)) {
    return !fbdo.stringData().isEmpty();
  }
  return false;
}

bool checkIfCardValid(String uid) {
  if (Firebase.RTDB.getString(&fbdo, "users/" + uid)) {
    return !fbdo.stringData().isEmpty();
  }
  return false;
}

String currentUID = "";
void handleVote(char selectedVote) {
  // Map the selected vote (1-4) to actual candidate UIDs
  String candidatePath = "sessions/" + currentSession + "/candidates/";
  String candidateUID = "";

  // Get the list of candidates for this session
  if (Firebase.RTDB.getJSON(&fbdo, candidatePath)) {
    FirebaseJson json = fbdo.jsonObject();

    // Get the JSON data as a string and parse it manually
    String jsonStr;
    json.toString(jsonStr, true);

    // Simple JSON parsing - looking for keys in the candidates object
    int selectedIndex = selectedVote - '1';
    int currentIndex = 0;

    int startPos = 0;
    while (currentIndex <= selectedIndex) {
      int keyStart = jsonStr.indexOf('"', startPos);
      if (keyStart == -1) break;

      int keyEnd = jsonStr.indexOf('"', keyStart + 1);
      if (keyEnd == -1) break;

      if (currentIndex == selectedIndex) {
        candidateUID = jsonStr.substring(keyStart + 1, keyEnd);
        break;
      }

      // Skip the value portion
      int valueStart = jsonStr.indexOf(':', keyEnd + 1);
      if (valueStart == -1) break;

      // Find the end of this value
      int commaPos = jsonStr.indexOf(',', valueStart + 1);
      if (commaPos == -1) {
        // Last item in object
        startPos = jsonStr.indexOf('}', valueStart + 1);
      } else {
        startPos = commaPos + 1;
      }

      currentIndex++;
    }
  }

  if (!candidateUID.isEmpty()) {
    // Record the vote with timestamp
    String votePath = "votes/" + currentSession + "/" + currentUID;

    FirebaseJson voteJson;
    voteJson.set("candidate_uid", candidateUID);
    voteJson.set("timestamp", timeClient.getEpochTime());

    if (Firebase.RTDB.setJSON(&fbdo, votePath, &voteJson)) {
      lcd.clear();
      lcd.print("Vote recorded!");
      lcd.setCursor(0, 1);
      lcd.print("Thank you!");
      buzz(200);
      delay(3000);
    } else {
      lcd.clear();
      lcd.print("Vote failed!");
      lcd.setCursor(0, 1);
      lcd.print("Try again");
      buzz(100);
      delay(100);
      buzz(100);
      delay(2000);
    }
  } else {
    lcd.clear();
    lcd.print("Invalid selection");
    lcd.setCursor(0, 1);
    lcd.print("Try again");
    buzz(300);
    delay(2000);
  }
}

bool votingInProgress = false;
unsigned long lastStatusCheck = 0;
unsigned long voteStartTimeout = 0;
char selectedVote = '\0';
bool voteConfirmed = false;

void loop() {
  timeClient.update();

  // if (!votingInProgress && millis() - lastStatusCheck > 1000 || lastStatusCheck == 0) {
  //   checkVotingStatus();
  // }
  if (!votingInProgress) {
    checkVotingStatus();
  }

  if (isCreate == 1 && mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    buzz();
    String newUID = getCardUID();

    // Send UID to Firebase
    if (Firebase.RTDB.setString(&fbdo, "new_user", newUID)) {
      lcd.clear();
      lcd.print("UID Sent");
      lcd.setCursor(0, 1);
      lcd.print(newUID.substring(0, 16));
      buzz(100);
    } else {
      lcd.clear();
      lcd.print("Send Failed!");
      buzz(300);
    }

    delay(2000);
    if (!votingInProgress) updateDisplay();
    return;
  }

  // If card is presented
  if (!votingInProgress && mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    buzz();
    currentUID = getCardUID();

    if (isVote == 1) {
      if (checkIfCardValid(currentUID)) {
        lcd.clear();
        lcd.print("CARD IS");
        lcd.setCursor(0, 1);
        lcd.print("NOT VALID");
        buzz(300);
        delay(2000);
        if (!votingInProgress) updateDisplay();
        return;
      }
      if (checkIfCandidate(currentUID)) {
        lcd.clear();
        lcd.print("CANDIDATES CAN'T");
        lcd.setCursor(0, 1);
        lcd.print("VOTE FOR SELF");
        buzz(300);
        delay(2000);
        if (!votingInProgress) updateDisplay();
        return;
      }
      if (checkIfVoted(currentUID)) {
        lcd.clear();
        lcd.print("ALREADY VOTED");
        buzz(300);
        delay(2000);
        if (!votingInProgress) updateDisplay();
        return;
      }
      lcd.clear();
      lcd.print("VOTE FOR:");
      lcd.setCursor(0, 1);
      lcd.print("1:A 2:B 3:C 4:D");
      votingInProgress = true;
      voteStartTimeout = millis();
      selectedVote = '\0';
      voteConfirmed = false;
    } else {
      if (!votingInProgress) updateDisplay();
    }
  }

  // Handle voting input
  if (votingInProgress) {
    if (millis() - voteStartTimeout > 20000) {
      lcd.clear();
      lcd.print("Timeout.");
      lcd.setCursor(0, 1);
      lcd.print("Try again.");
      buzz(300);
      delay(2000);
      votingInProgress = false;
      updateDisplay();
      return;
    }

    if (Serial2.available()) {
      char key = Serial2.read();
      if (key >= '1' && key <= '4') {
        selectedVote = key;
        lcd.clear();
        lcd.print("Vote: ");
        lcd.print(selectedVote);
        lcd.setCursor(0, 1);
        lcd.print("#:Yes *:No");
      } else if (key == '#' && selectedVote) {
        handleVote(selectedVote);
        voteConfirmed = true;
        votingInProgress = false;
        updateDisplay();
      } else if (key == '*') {
        selectedVote = '\0';
        lcd.clear();
        lcd.print("VOTE FOR:");
        lcd.setCursor(0, 1);
        lcd.print("1:A 2:B 3:C 4:D");
      }
    }
  }
}

