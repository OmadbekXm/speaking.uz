require("dotenv").config();

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { toFile } = require("openai");

const app = express();

const PORT = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is missing from .env");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
});

// Only the public/ folder is served over HTTP.
// Keep index.html, style.css and script.js inside a "public" folder
// next to this file — server.js, package.json and .env stay private.
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", function (req, res) {
  res.json({
    ok: true,
    message: "CEFR Speaking AI server is running.",
  });
});

app.post(
  "/api/check-speaking",
  upload.single("audio"),
  async function (req, res) {
    let filePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Audio file was not received.",
        });
      }

      filePath = req.file.path;

      const question = req.body.question || "";

      const part = req.body.part || "";

      // multer saves the file without an extension — give it one back
      // explicitly, since the transcription API infers the audio format
      // from the filename.
      const transcription = await openai.audio.transcriptions.create({
        file: await toFile(fs.createReadStream(filePath), "speaking.webm"),
        model: "gpt-4o-transcribe",
      });

      const transcript = transcription.text || "";

      if (!transcript.trim()) {
        return res.status(400).json({
          error: "No speech was detected in the recording.",
        });
      }

      const prompt = `You are an expert English speaking examiner.
Evaluate the student's answer for Uzbekistan Multilevel CEFR speaking practice.

Part: ${part}
Question: ${question}
Student transcript: ${transcript}

Return valid JSON with exactly these fields, and nothing else — no markdown, no code fences:
{
  "cefr_level": "A2/B1/B2/C1/C2",
  "scores": {
    "fluency": 1,
    "vocabulary": 1,
    "grammar": 1,
    "pronunciation": 1
  },
  "strengths": [],
  "grammar_corrections": [],
  "better_vocabulary": [],
  "pronunciation_feedback": "",
  "improved_answer": "",
  "general_feedback": ""
}

Scores must be numbers from 1 to 10.

Important:
The answer was transcribed from audio. Do not claim that pronunciation can be accurately measured from transcript alone. Give a cautious pronunciation assessment and explain the limitation briefly.

Focus on:
- CEFR level
- fluency
- vocabulary
- grammar
- pronunciation limitations
- useful corrections
- natural vocabulary
- an improved answer
- useful exam feedback`;

      const model = process.env.AI_MODEL || "gpt-5.6-luna";

      const response = await openai.responses.create({
        model: model,
        input: prompt,
      });

      const output = response.output_text || "";

      // Some models wrap JSON in ```json fences despite instructions not to.
      // Strip that defensively before parsing.
      const cleaned = output
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "");

      let result;

      try {
        result = JSON.parse(cleaned);
      } catch (parseError) {
        console.error("AI JSON error:", output);

        return res.status(500).json({
          error: "AI returned an invalid result. Please try again.",
        });
      }

      result.transcript = transcript;

      res.json(result);
    } catch (error) {
      console.error("SERVER ERROR:", error);

      res.status(500).json({
        error: error.message || "AI checking failed.",
      });
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (deleteError) {
          console.error("Could not delete temporary audio:", deleteError);
        }
      }
    }
  },
);

app.listen(PORT, function () {
  console.log("CEFR Speaking AI running at:");

  console.log("http://localhost:" + PORT);
});
