// ==========================================
// voice.js
// ==========================================

let recognition = null;
let currentQuestion = "";
/**
 * Read text aloud
 */
function speak(text) {

    currentQuestion = text;

    // Stop any previous speech
    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;

    // Start listening after AI finishes speaking
    speech.onend = () => {

        if (sessionStorage.getItem("interview_mode") === "voice") {

            startVoiceInterview();

        }

    };

    speechSynthesis.speak(speech);
}
function speakCurrentQuestion() {

    speak(currentQuestion);

}

/**
 * Initialize speech recognition
 */
function initVoiceRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Your browser does not support Speech Recognition.");
        return;
    }

    recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {

        document.getElementById("voiceStatus").textContent =
            "🎤 Listening...";

    };

    recognition.onend = () => {

        document.getElementById("voiceStatus").textContent =
            "Stopped";

    };

    recognition.onerror = (event) => {

        console.error(event.error);

        document.getElementById("voiceStatus").textContent =
            "❌ " + event.error;

    };

  recognition.onresult = (event) => {

      let transcript = "";

      for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
      }

      document.getElementById("answerText").value = transcript;

      document.getElementById("charCount").textContent =
          transcript.length + " characters";
  };

}

/**
 * Start microphone
 */
function startVoiceInterview() {

    if (!recognition) return;

    try {

        recognition.start();

    } catch (e) {

        console.log("Recognition already running.");

    }

}
function stopVoiceInterview() {

    if (recognition) {

        recognition.stop();

    }

}