let currentPart = 1;
let currentQuestion = "";

let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;
let timerInterval = null;
let timeLeft = 30;

const partNames = {
  1: "Part 1.1",
  2: "Part 1.2",
  3: "Part 2",
  4: "Part 3",
};

const topics = {
  1: [
    "What do you usually do in your free time?",
    "What kind of music do you enjoy?",
    "Do you prefer spending time with friends or family?",
    "What is your favourite subject at school?",
    "What do you usually do at weekends?",
    "Do you like reading books?",
    "What is your favourite food?",
    "Do you enjoy watching films?",
    "What kind of weather do you like?",
    "Do you like travelling?",
    "What is your favourite season?",
    "What do you usually do after school?",
    "Do you enjoy learning English?",
    "What is your favourite sport?",
    "Do you prefer mornings or evenings?",
    "What do you usually do with your friends?",
    "Do you like using social media?",
    "What is your favourite place?",
    "What are your plans for the future?",
    "Who has influenced you most?",
  ],

  2: [
    "Describe what you can see in the two pictures.",
    "What are the advantages of studying in groups?",
    "Do you prefer studying alone or with others?",
    "Compare travelling by car and by train.",
    "Compare city life and village life.",
    "Compare eating at home and eating outside.",
    "Compare online and traditional education.",
    "Compare working from home and working in an office.",
    "Compare reading books and watching films.",
    "Compare public transport and private transport.",
    "Compare shopping online and in shops.",
    "Compare living alone and living with family.",
    "Compare summer and winter activities.",
    "Compare studying in the morning and evening.",
    "Compare fast food and homemade food.",
    "Compare modern and traditional lifestyles.",
    "Compare sports indoors and outdoors.",
    "Compare large and small schools.",
    "Compare holidays abroad and at home.",
    "Compare face-to-face and online communication.",
  ],

  3: [
    "Talk about a memorable weekend you had.",
    "Talk about your favourite place to spend free time.",
    "Talk about a person who inspired you.",
    "Talk about a useful skill you have learned.",
    "Talk about a difficult decision you made.",
    "Talk about a memorable trip.",
    "Talk about a book you enjoyed.",
    "Talk about a film that influenced you.",
    "Talk about an important achievement.",
    "Talk about your favourite teacher.",
    "Talk about a hobby you enjoy.",
    "Talk about a time you helped someone.",
    "Talk about a future goal.",
    "Talk about a special day in your life.",
    "Talk about a place you would like to visit.",
    "Talk about a useful invention.",
    "Talk about a successful person you admire.",
    "Talk about a challenge you overcame.",
    "Talk about an unforgettable experience.",
    "Talk about something you learned from a mistake.",
  ],

  4: [
    "Should students be allowed to use mobile phones at school?",
    "Should children have their own smartphones?",
    "Is online education better than traditional education?",
    "Should school uniforms be compulsory?",
    "Is social media useful for young people?",
    "Should students have less homework?",
    "Is learning English important for everyone?",
    "Should public transport be free?",
    "Is technology making people less social?",
    "Should teenagers work part-time?",
    "Is studying abroad better than studying at home?",
    "Should schools teach financial education?",
    "Is city life better than village life?",
    "Should students choose their own subjects?",
    "Is artificial intelligence useful in education?",
    "Should people spend less time on social media?",
    "Is competition between students beneficial?",
    "Should exams be replaced with projects?",
    "Is reading still important in the digital age?",
    "Should young people spend more time outdoors?",
  ],
};

function getElement(id) {
  return document.getElementById(id);
}

function showScreen(id) {
  const screens = document.querySelectorAll(".screen");

  screens.forEach(function (screen) {
    screen.classList.remove("active");
  });

  const selected = getElement(id);

  if (selected) {
    selected.classList.add("active");
  }
}

function goHome() {
  clearInterval(timerInterval);
  showScreen("homeScreen");
}

function openPart(part) {
  currentPart = part;

  const title = getElement("partTitle");
  const topicsBox = getElement("topics");

  title.textContent = partNames[part] + " - Choose a topic";

  topicsBox.innerHTML = "";

  topics[part].forEach(function (topic, index) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = index + 1 + ". " + topic;

    button.addEventListener("click", function () {
      openQuestion(topic);
    });

    topicsBox.appendChild(button);
  });

  showScreen("topicsScreen");
}

function goBackToTopics() {
  clearInterval(timerInterval);
  openPart(currentPart);
}

function openQuestion(question) {
  currentQuestion = question;

  getElement("questionTitle").textContent = partNames[currentPart];

  getElement("question").textContent = question;

  getElement("result").style.display = "none";
  getElement("errorBox").style.display = "none";
  getElement("loading").style.display = "none";

  const audioPlayer = getElement("audioPlayer");

  audioPlayer.pause();
  audioPlayer.src = "";
  audioPlayer.style.display = "none";

  getElement("speakBtn").disabled = false;
  getElement("speakBtn").classList.remove("recording");
  getElement("finishBtn").disabled = true;
  getElement("checkBtn").disabled = true;

  audioBlob = null;
  audioChunks = [];

  setTimer();

  showScreen("practiceScreen");
}

function getTime() {
  if (currentPart === 1) {
    return 30;
  }

  if (currentPart === 2) {
    return 40;
  }

  if (currentPart === 3) {
    return 120;
  }

  return 90;
}

function setTimer() {
  clearInterval(timerInterval);

  timeLeft = getTime();

  updateTimer();
}

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  getElement("timer").textContent =
    String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");

  const timerEl = getElement("timer");

  if (timeLeft <= 10) {
    timerEl.classList.add("warning");
  } else {
    timerEl.classList.remove("warning");
  }
}

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(function () {
    timeLeft--;

    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishRecording();
    }
  }, 1000);
}

async function startRecording() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError("Your browser does not support microphone recording.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    audioChunks = [];

    let recorderOptions = {};

    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported("audio/webm")
    ) {
      recorderOptions.mimeType = "audio/webm";
    }

    mediaRecorder = new MediaRecorder(stream, recorderOptions);

    mediaRecorder.addEventListener("dataavailable", function (event) {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    });

    mediaRecorder.addEventListener("stop", function () {
      const type = mediaRecorder.mimeType || "audio/webm";

      audioBlob = new Blob(audioChunks, {
        type: type,
      });

      const audioUrl = URL.createObjectURL(audioBlob);

      const player = getElement("audioPlayer");

      player.src = audioUrl;
      player.style.display = "block";

      getElement("checkBtn").disabled = false;

      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    });

    mediaRecorder.start();

    getElement("speakBtn").disabled = true;
    getElement("speakBtn").classList.add("recording");
    getElement("finishBtn").disabled = false;

    startTimer();
  } catch (error) {
    console.error(error);

    showError(
      "Microphone permission was denied or the microphone could not be accessed.",
    );
  }
}

function finishRecording() {
  clearInterval(timerInterval);

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }

  getElement("speakBtn").classList.remove("recording");
  getElement("finishBtn").disabled = true;
}

async function checkAnswer() {
  if (!audioBlob) {
    showError("Please record your answer first.");
    return;
  }

  const loading = getElement("loading");
  const result = getElement("result");

  loading.style.display = "block";
  result.style.display = "none";

  getElement("errorBox").style.display = "none";

  const formData = new FormData();

  formData.append("audio", audioBlob, "speaking.webm");

  formData.append("question", currentQuestion);

  formData.append("part", partNames[currentPart]);

  try {
    const response = await fetch("/api/check-speaking", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI checking failed.");
    }

    showResult(data);
  } catch (error) {
    console.error(error);

    showError(error.message || "Something went wrong.");
  } finally {
    loading.style.display = "none";
  }
}

function showError(message) {
  const errorBox = getElement("errorBox");

  errorBox.textContent = message;
  errorBox.style.display = "block";
}

function showResult(data) {
  const result = getElement("result");

  const scores = data.scores || {};

  const strengths = Array.isArray(data.strengths) ? data.strengths : [];

  const grammar = Array.isArray(data.grammar_corrections)
    ? data.grammar_corrections
    : [];

  const vocabulary = Array.isArray(data.better_vocabulary)
    ? data.better_vocabulary
    : [];

  result.innerHTML = `
    <h2>AI Speaking Result</h2>

    <h3>CEFR Level</h3>

    <p>
      <strong>
        ${escapeHTML(data.cefr_level ?? "N/A")}
      </strong>
    </p>

    <div class="scoreGrid">

      <div class="score">
        Fluency
        <strong>
          ${escapeHTML(scores.fluency ?? "N/A")}/10
        </strong>
      </div>

      <div class="score">
        Vocabulary
        <strong>
          ${escapeHTML(scores.vocabulary ?? "N/A")}/10
        </strong>
      </div>

      <div class="score">
        Grammar
        <strong>
          ${escapeHTML(scores.grammar ?? "N/A")}/10
        </strong>
      </div>

      <div class="score">
        Pronunciation
        <strong>
          ${escapeHTML(scores.pronunciation ?? "N/A")}/10
        </strong>
      </div>

    </div>

    <h3>Transcript</h3>

    <p>
      ${escapeHTML(data.transcript ?? "No transcript")}
    </p>

    <h3>Strengths</h3>

    <ul>
      ${strengths
        .map(function (item) {
          return "<li>" + escapeHTML(item) + "</li>";
        })
        .join("")}
    </ul>

    <h3>Grammar Corrections</h3>

    <ul>
      ${grammar
        .map(function (item) {
          return "<li>" + escapeHTML(item) + "</li>";
        })
        .join("")}
    </ul>

    <h3>Better Vocabulary</h3>

    <ul>
      ${vocabulary
        .map(function (item) {
          return "<li>" + escapeHTML(item) + "</li>";
        })
        .join("")}
    </ul>

    <h3>Pronunciation Feedback</h3>

    <p>
      ${escapeHTML(data.pronunciation_feedback ?? "No pronunciation feedback.")}
    </p>

    <h3>Improved Answer</h3>

    <p>
      ${escapeHTML(data.improved_answer ?? "No improved answer.")}
    </p>

    <h3>General Feedback</h3>

    <p>
      ${escapeHTML(data.general_feedback ?? "No general feedback.")}
    </p>
  `;

  result.style.display = "block";
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
